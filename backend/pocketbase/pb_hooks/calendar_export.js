function calendarExportPad(value) {
  return String(value).padStart(2, "0")
}

function calendarExportFormatUtc(value) {
  var date = new Date(value)
  return (
    date.getUTCFullYear() +
    calendarExportPad(date.getUTCMonth() + 1) +
    calendarExportPad(date.getUTCDate()) +
    "T" +
    calendarExportPad(date.getUTCHours()) +
    calendarExportPad(date.getUTCMinutes()) +
    calendarExportPad(date.getUTCSeconds()) +
    "Z"
  )
}

function calendarExportFormatDate(value) {
  var date = new Date(value)
  return (
    date.getUTCFullYear() +
    calendarExportPad(date.getUTCMonth() + 1) +
    calendarExportPad(date.getUTCDate())
  )
}

function calendarExportEscape(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
}

function calendarExportFoldLine(line) {
  var value = String(line || "")
  var output = ""
  while (value.length > 75) {
    output += value.slice(0, 75) + "\r\n "
    value = value.slice(75)
  }
  return output + value
}

function calendarExportDescription(raw) {
  var text = String(raw || "").trim()
  if (!text) return ""

  try {
    var parsed = JSON.parse(text)
    if (typeof parsed.notes === "string" && parsed.notes.trim()) {
      return parsed.notes.trim()
    }
    return ""
  } catch (_) {
    return text
  }
}

function calendarExportAllDayEnd(value) {
  var date = new Date(value)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString()
}

function calendarExportUid(eventId) {
  return String(eventId || "").trim() + "@othellocloud"
}

function calendarExportLine(name, value) {
  if (value === null || value === undefined || value === "") return ""
  return calendarExportFoldLine(name + ":" + calendarExportEscape(value))
}

function calendarExportRandomTokenFallback() {
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
  var token = ""
  for (var i = 0; i < 48; i += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return token
}

function calendarExportIsHouseholdAdmin(app, householdId, userId) {
  if (!householdId || !userId) return false
  try {
    var membership = app.findFirstRecordByFilter(
      "household_members",
      "household = {:household} && user = {:user}",
      { household: householdId, user: userId }
    )
    return membership.getString("role") === "admin"
  } catch (_) {
    return false
  }
}

function calendarExportEnsureToken(app, household) {
  var token = household.getString("calendarExportToken")
  if (token) return token

  token = createExportToken()
  household.set("calendarExportToken", token)
  app.save(household)
  return token
}

function createExportToken() {
  try {
    return require("crypto").randomBytes(36).toString("base64url")
  } catch (_) {}

  if (typeof $security !== "undefined" && $security && $security.randomString) {
    return $security.randomString(48)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "")
  }

  return calendarExportRandomTokenFallback()
}

function buildCalendarExport(input) {
  var calendarName = input && input.calendarName ? input.calendarName : "WG Calendar"
  var productId = input && input.productId ? input.productId : "-//OthelloCloud//WG Calendar//EN"
  var calendarUrl = input && input.calendarUrl ? input.calendarUrl : ""
  var events = (input && input.events) || []
  var lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    calendarExportFoldLine("PRODID:" + productId),
    calendarExportFoldLine("X-WR-CALNAME:" + calendarExportEscape(calendarName)),
  ]

  if (calendarUrl) {
    lines.push(calendarExportFoldLine("URL:" + calendarExportEscape(calendarUrl)))
  }

  events.forEach(function (event) {
    var updated = event.updated || event.created || event.start
    var description = calendarExportDescription(event.description)
    lines.push("BEGIN:VEVENT")
    lines.push(calendarExportFoldLine("UID:" + calendarExportUid(event.id)))
    lines.push("DTSTAMP:" + calendarExportFormatUtc(updated))
    lines.push(calendarExportLine("SUMMARY", event.title))

    if (event.allDay) {
      lines.push("DTSTART;VALUE=DATE:" + calendarExportFormatDate(event.start))
      if (event.end) {
        lines.push("DTEND;VALUE=DATE:" + calendarExportFormatDate(calendarExportAllDayEnd(event.end)))
      }
    } else {
      lines.push("DTSTART:" + calendarExportFormatUtc(event.start))
      if (event.end) {
        lines.push("DTEND:" + calendarExportFormatUtc(event.end))
      }
    }

    var locationLine = calendarExportLine("LOCATION", event.location)
    if (locationLine) lines.push(locationLine)

    var descriptionLine = calendarExportLine("DESCRIPTION", description)
    if (descriptionLine) lines.push(descriptionLine)

    lines.push("END:VEVENT")
  })

  lines.push("END:VCALENDAR")
  return lines.join("\r\n") + "\r\n"
}

module.exports = {
  createExportToken: createExportToken,
  buildCalendarExport: buildCalendarExport,
  isHouseholdAdmin: calendarExportIsHouseholdAdmin,
  ensureToken: calendarExportEnsureToken,
}
