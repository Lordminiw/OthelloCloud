/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/households/{householdId}/calendar-subscription/sync", (e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  var householdId = e.request.pathValue("householdId")
  if (!helpers.isAdmin(e.app, householdId, e.auth.id)) {
    throw new ForbiddenError("Only household admins can synchronize external calendars.")
  }

  var subscription
  try {
    subscription = e.app.findFirstRecordByFilter(
      "calendar_subscriptions",
      "household = {:household}",
      { household: householdId }
    )
  } catch (_) {
    throw new NotFoundError("No external calendar is configured.")
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
    if (response.body.length > 2 * 1024 * 1024) {
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
    var current = txApp.findRecordsByFilter(
      "calendar_events", "subscription = {:subscription}", "", 0, 0,
      { subscription: subscription.id }
    )
    var byUid = {}
    current.forEach(function (record) { byUid[record.getString("externalUid")] = record })
    var collection = txApp.findCollectionByNameOrId("calendar_events")

    parsed.forEach(function (item) {
      var record = byUid[item.uid]
      if (record) {
        counts.updated += 1
        delete byUid[item.uid]
      } else {
        counts.created += 1
        record = new Record(collection)
      }
      record.set("household", householdId)
      record.set("title", item.title)
      record.set("start", item.start)
      record.set("end", item.end || "")
      record.set("location", item.location)
      record.set("description", item.description)
      record.set("source", "ical")
      record.set("externalUid", item.uid)
      record.set("subscription", subscription.id)
      record.set("allDay", item.allDay)
      txApp.save(record)
    })

    Object.keys(byUid).forEach(function (uid) {
      txApp.delete(byUid[uid])
      counts.removed += 1
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
  if (!helpers.isAdmin(e.app, e.record.getString("household"), e.auth.id)) {
    throw new ForbiddenError("Only household admins can configure external calendars.")
  }
  e.record.set("url", helpers.validateUrl(e.record.getString("url")))
  if (!e.record.getString("name").trim()) e.record.set("name", "External calendar")
  return e.next()
}, "calendar_subscriptions")

onRecordUpdateRequest((e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  if (!helpers.isAdmin(e.app, e.record.getString("household"), e.auth.id)) {
    throw new ForbiddenError("Only household admins can configure external calendars.")
  }
  e.record.set("url", helpers.validateUrl(e.record.getString("url")))
  return e.next()
}, "calendar_subscriptions")

onRecordDeleteRequest((e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  if (!helpers.isAdmin(e.app, e.record.getString("household"), e.auth.id)) {
    throw new ForbiddenError("Only household admins can remove external calendars.")
  }
  return e.next()
}, "calendar_subscriptions")

onRecordEnrich((e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  var auth = e.requestInfo && e.requestInfo.auth
  if (auth && helpers.isAdmin(e.app, e.record.getString("household"), auth.id)) {
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
  if (e.record.original().getString("source") === "ical") {
    throw new ForbiddenError("Imported calendar events can only be changed by synchronization.")
  }
  return e.next()
}, "calendar_events")

onRecordDeleteRequest((e) => {
  if (e.record.getString("source") === "ical") {
    throw new ForbiddenError("Imported calendar events can only be removed by synchronization.")
  }
  return e.next()
}, "calendar_events")
