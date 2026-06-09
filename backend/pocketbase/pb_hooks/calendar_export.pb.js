/// <reference path="../pb_data/types.d.ts" />

function calendarExportFilename(name) {
  return String(name || "wg-calendar")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "wg-calendar"
}

routerAdd("GET", "/api/households/{householdId}/calendar-export", (e) => {
  var helpers = require(__hooks + "/calendar_export.js")
  var household
  try {
    household = e.app.findRecordById("households", e.request.pathValue("householdId"))
  } catch (_) {
    throw new NotFoundError("Household not found.")
  }

  if (!helpers.isHouseholdAdmin(e.app, household.id, e.auth.id)) {
    throw new ForbiddenError("Only household admins can manage calendar export.")
  }

  var token = helpers.ensureToken(e.app, household)
  return e.json(200, {
    householdId: household.id,
    feedPath: "/api/calendar-export/" + token,
  })
}, $apis.requireAuth("users"))

routerAdd("POST", "/api/households/{householdId}/calendar-export/rotate", (e) => {
  var helpers = require(__hooks + "/calendar_export.js")
  var household
  try {
    household = e.app.findRecordById("households", e.request.pathValue("householdId"))
  } catch (_) {
    throw new NotFoundError("Household not found.")
  }

  if (!helpers.isHouseholdAdmin(e.app, household.id, e.auth.id)) {
    throw new ForbiddenError("Only household admins can manage calendar export.")
  }

  var token = helpers.createExportToken()
  household.set("calendarExportToken", token)
  e.app.save(household)

  return e.json(200, {
    householdId: household.id,
    feedPath: "/api/calendar-export/" + token,
  })
}, $apis.requireAuth("users"))

routerAdd("GET", "/api/calendar-export/{token}", (e) => {
  var helpers = require(__hooks + "/calendar_export.js")
  var token = String(e.request.pathValue("token") || "").trim()
  if (!token) {
    throw new BadRequestError("Missing calendar export token.")
  }

  var household
  try {
    household = e.app.findFirstRecordByFilter(
      "households",
      "calendarExportToken = {:token}",
      { token: token }
    )
  } catch (_) {
    throw new NotFoundError("Calendar export not found.")
  }

  var events
  try {
    events = e.app.findRecordsByFilter(
      "calendar_events",
      "household = {:household} && (source = '' || source = 'manual')",
      "start",
      0,
      0,
      { household: household.id }
    )
  } catch (_) {
    // Fallback for deployments whose schema or filter parser lags behind the hook code.
    events = e.app.findRecordsByFilter(
      "calendar_events",
      "household = {:household}",
      "start",
      0,
      0,
      { household: household.id }
    )
  }

  try {
    var payload = helpers.buildCalendarExport({
      calendarName: household.getString("name"),
      productId: "-//OthelloCloud//WG Calendar//EN",
      calendarUrl: "",
      events: events.filter(helpers.isManualEvent).map(function (record) {
        return {
          id: record.id,
          title: record.getString("title"),
          start: record.getString("start"),
          end: record.getString("end"),
          location: record.getString("location"),
          description: record.getString("description"),
          allDay: record.getBool("allDay"),
          created: record.getString("created"),
          updated: record.getString("updated"),
        }
      }),
    })

    e.response.header().set("Content-Type", "text/calendar; charset=utf-8")
    e.response.header().set(
      "Content-Disposition",
      'inline; filename="' + calendarExportFilename(household.getString("name")) + '.ics"'
    )
    e.response.header().set("Cache-Control", "no-store")
    return e.string(200, payload)
  } catch (error) {
    console.log("calendar export failed:", error)
    throw new BadRequestError(
      "Calendar export failed: " + String(error && error.message ? error.message : error)
    )
  }
})

onRecordCreateRequest((e) => {
  var helpers = require(__hooks + "/calendar_export.js")
  if (!e.record.getString("calendarExportToken")) {
    e.record.set("calendarExportToken", helpers.createExportToken())
  }
  return e.next()
}, "households")
