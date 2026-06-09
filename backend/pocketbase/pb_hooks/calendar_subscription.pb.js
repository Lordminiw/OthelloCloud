/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/calendar-imports/upload", (e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  var householdId = helpers.requireMember(
    e.app,
    e.request.formValue("householdId"),
    e.auth.id
  )
  var uploadedFiles = e.findUploadedFiles("file").filter(function (file) {
    return !!file
  })
  if (uploadedFiles.length === 0) {
    throw new BadRequestError("Please choose a .ics file to import.")
  }

  var file = uploadedFiles[0]
  helpers.validateUploadName(file.originalName || file.name)
  if (Number(file.size || 0) > helpers.MAX_ICS_BYTES) {
    throw new BadRequestError("The uploaded .ics file is larger than 2 MB.")
  }

  var uploadSourceKey = helpers.normalizeUploadSourceKey(
    e.request.formValue("name"),
    file.originalName || file.name
  )
  var parsed = helpers.parse(helpers.readUploadedText(file)).map(function (item) {
    var namespaced = {}
    Object.keys(item).forEach(function (key) {
      namespaced[key] = item[key]
    })
    namespaced.uid = uploadSourceKey + "::" + item.uid
    return namespaced
  })
  var counts = { created: 0, updated: 0, removed: 0 }

  e.app.runInTransaction((txApp) => {
    counts = helpers.importParsedEvents(txApp, {
      events: parsed,
      householdId: householdId,
      subscriptionId: "",
      source: "upload",
      uploadSourceKey: uploadSourceKey,
    })
  })

  return e.json(200, counts)
}, $apis.requireAuth("users"))

routerAdd("POST", "/api/calendar-subscriptions/{subscriptionId}/sync", (e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  var subscription
  try {
    subscription = e.app.findRecordById(
      "calendar_subscriptions",
      e.request.pathValue("subscriptionId")
    )
  } catch (_) {
    throw new NotFoundError("No external calendar is configured.")
  }
  if (subscription.getString("owner") !== e.auth.id) {
    throw new ForbiddenError("Only the calendar owner can synchronize it.")
  }
  if (!subscription.getBool("enabled")) {
    throw new BadRequestError("The external calendar is disabled.")
  }

  var parsed
  try {
    var response = $http.send({
      url: helpers.validateUrl(subscription.getString("url")),
      method: "GET",
      timeout: 12,
      headers: { "Accept": "text/calendar, text/plain;q=0.9" },
    })
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error("The calendar server returned HTTP " + response.statusCode + ".")
    }
    if (response.body.length > helpers.MAX_ICS_BYTES) {
      throw new Error("The iCal response is larger than 2 MB.")
    }
    parsed = helpers.parse(toString(response.body))
  } catch (error) {
    subscription.set("lastSyncStatus", "error")
    subscription.set("lastSyncMessage", helpers.safeMessage(error))
    e.app.save(subscription)
    throw new BadRequestError("External calendar synchronization failed.", {
      message: subscription.getString("lastSyncMessage"),
    })
  }

  var counts = { created: 0, updated: 0, removed: 0 }
  e.app.runInTransaction((txApp) => {
    counts = helpers.importParsedEvents(txApp, {
      events: parsed,
      householdId: "",
      subscriptionId: subscription.id,
      source: "ical",
    })

    var txSubscription = txApp.findRecordById("calendar_subscriptions", subscription.id)
    txSubscription.set("lastSyncedAt", new DateTime())
    txSubscription.set("lastSyncStatus", "success")
    txSubscription.set("lastSyncMessage", "Created " + counts.created + ", updated " + counts.updated + ", removed " + counts.removed + ".")
    txApp.save(txSubscription)
  })

  return e.json(200, counts)
}, $apis.requireAuth("users"))

onRecordCreateRequest((e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  var householdId = e.record.getString("household")
  if (e.record.getBool("sharedWithHousehold") &&
      !helpers.isHouseholdMember(e.app, householdId, e.auth.id)) {
    throw new ForbiddenError("You can only share calendars with your households.")
  }
  e.record.set("owner", e.auth.id)
  if (!e.record.getBool("sharedWithHousehold")) e.record.set("household", "")
  e.record.set("url", helpers.validateUrl(e.record.getString("url")))
  if (!e.record.getString("name").trim()) e.record.set("name", "External calendar")
  return e.next()
}, "calendar_subscriptions")

onRecordUpdateRequest((e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  if (e.record.original().getString("owner") !== e.auth.id) {
    throw new ForbiddenError("Only the calendar owner can configure it.")
  }
  var householdId = e.record.getString("household")
  if (e.record.getBool("sharedWithHousehold") &&
      !helpers.isHouseholdMember(e.app, householdId, e.auth.id)) {
    throw new ForbiddenError("You can only share calendars with your households.")
  }
  e.record.set("owner", e.auth.id)
  if (!e.record.getBool("sharedWithHousehold")) e.record.set("household", "")
  e.record.set("url", helpers.validateUrl(e.record.getString("url")))
  return e.next()
}, "calendar_subscriptions")

onRecordDeleteRequest((e) => {
  if (e.record.getString("owner") !== e.auth.id) {
    throw new ForbiddenError("Only the calendar owner can remove it.")
  }
  return e.next()
}, "calendar_subscriptions")

onRecordEnrich((e) => {
  var auth = e.requestInfo && e.requestInfo.auth
  if (auth && e.record.getString("owner") === auth.id) {
    e.record.unhide("url")
  } else {
    e.record.hide("url")
  }
  return e.next()
}, "calendar_subscriptions")

onRecordCreateRequest((e) => {
  e.record.set("source", "manual")
  e.record.set("externalUid", "")
  e.record.set("subscription", "")
  e.record.set("allDay", false)
  return e.next()
}, "calendar_events")

onRecordUpdateRequest((e) => {
  var source = e.record.original().getString("source")
  if (source === "ical" || source === "upload") {
    throw new ForbiddenError("Imported calendar events can only be changed by synchronization.")
  }
  return e.next()
}, "calendar_events")

onRecordDeleteRequest((e) => {
  var source = e.record.getString("source")
  if (source === "ical" || source === "upload") {
    throw new ForbiddenError("Imported calendar events can only be removed by synchronization.")
  }
  return e.next()
}, "calendar_events")
