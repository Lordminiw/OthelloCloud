/// <reference path="../pb_data/types.d.ts" />

var CALENDAR_SUBSCRIPTION_MAX_ICS_BYTES = 2 * 1024 * 1024

function calendarSubscriptionIsHouseholdMember(app, householdId, userId) {
  if (!householdId) return false
  try {
    app.findFirstRecordByFilter(
      "household_members",
      "household = {:household} && user = {:user}",
      { household: householdId, user: userId }
    )
    return true
  } catch (_) {
    return false
  }
}

function calendarSubscriptionValidateUrl(rawUrl) {
  var value = String(rawUrl || "").trim()
  var match = /^https:\/\/([^\/?#]+)(?:[\/?#]|$)/i.exec(value)
  if (!match) {
    throw new BadRequestError("The iCal URL must use HTTPS.")
  }

  var authority = match[1].replace(/^[^@]*@/, "")
  var hostname = authority.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase()
  if (!hostname || (hostname.indexOf(".") < 0 && hostname.indexOf(":") < 0) ||
      hostname === "localhost" || hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") || hostname.endsWith(".lan") ||
      hostname.endsWith(".home") || hostname.endsWith(".internal")) {
    throw new BadRequestError("The iCal URL points to a blocked host.")
  }

  var ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (ipv4) {
    var a = Number(ipv4[1])
    var b = Number(ipv4[2])
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127) || a >= 224) {
      throw new BadRequestError("The iCal URL points to a blocked network.")
    }
  }

  if (hostname === "::1" || hostname === "::" || /^f[cd]/i.test(hostname) ||
      /^fe[89ab]/i.test(hostname)) {
    throw new BadRequestError("The iCal URL points to a blocked network.")
  }

  return value
}

function calendarSubscriptionValidateUploadName(name) {
  var value = String(name || "").trim()
  if (!value || !value.toLowerCase().endsWith(".ics")) {
    throw new BadRequestError("Please upload a .ics calendar file.")
  }
  return value
}

function calendarSubscriptionRequireMember(app, householdId, userId) {
  var value = String(householdId || "").trim()
  if (!value) {
    throw new BadRequestError("Please choose a household for the calendar import.")
  }
  if (!calendarSubscriptionIsHouseholdMember(app, value, userId)) {
    throw new ForbiddenError("You can only import calendars into your households.")
  }
  return value
}

function calendarSubscriptionNormalizeUploadSourceKey(rawName, fallbackName) {
  var source = String(rawName || "").trim() || String(fallbackName || "").trim()
  var normalized = source
    .toLowerCase()
    .replace(/\.ics$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (!normalized) {
    throw new BadRequestError("Please provide a name or filename for the calendar import.")
  }
  return normalized.slice(0, 120)
}

function calendarSubscriptionReadUploadedText(file) {
  if (!file) {
    throw new BadRequestError("Please choose a .ics file to import.")
  }
  if (Number(file.size || 0) <= 0) {
    throw new BadRequestError("The uploaded .ics file is empty.")
  }
  if (Number(file.size || 0) > CALENDAR_SUBSCRIPTION_MAX_ICS_BYTES) {
    throw new BadRequestError("The uploaded .ics file is larger than 2 MB.")
  }

  var reader = file.reader.open()
  var text = ""

  try {
    text = toString(reader, CALENDAR_SUBSCRIPTION_MAX_ICS_BYTES + 1)
  } catch (_) {
    throw new BadRequestError("The uploaded .ics file could not be read as text.")
  } finally {
    reader.close()
  }

  if (!text.trim()) {
    throw new BadRequestError("The uploaded .ics file is empty.")
  }
  return text
}

function calendarSubscriptionUnfold(raw) {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "")
}

function calendarSubscriptionUnescape(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

function calendarSubscriptionSafeMessage(error) {
  return String(error && error.message ? error.message : error)
    .replace(/https:\/\/\S+/gi, "[URL]")
    .slice(0, 500)
}

function calendarSubscriptionDate(value, params, isEnd) {
  var text = String(value || "").trim()
  var allDay = params.VALUE === "DATE" || /^\d{8}$/.test(text)
  if (allDay) {
    var y = Number(text.slice(0, 4))
    var m = Number(text.slice(4, 6))
    var d = Number(text.slice(6, 8))
    if (isEnd) {
      var previous = new Date(Date.UTC(y, m - 1, d - 1))
      y = previous.getUTCFullYear()
      m = previous.getUTCMonth() + 1
      d = previous.getUTCDate()
    }
    var dateText = y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0") + " 00:00:00"
    return { value: new DateTime(dateText, "Europe/Berlin"), allDay: true }
  }

  var normalized = text
  if (/^\d{8}T\d{6}Z$/.test(text)) {
    normalized = text.slice(0, 4) + "-" + text.slice(4, 6) + "-" + text.slice(6, 8) +
      " " + text.slice(9, 11) + ":" + text.slice(11, 13) + ":" + text.slice(13, 15) + "Z"
    return { value: new DateTime(normalized), allDay: false }
  }
  if (/^\d{8}T\d{6}$/.test(text)) {
    normalized = text.slice(0, 4) + "-" + text.slice(4, 6) + "-" + text.slice(6, 8) +
      " " + text.slice(9, 11) + ":" + text.slice(11, 13) + ":" + text.slice(13, 15)
    return { value: new DateTime(normalized, params.TZID || "Europe/Berlin"), allDay: false }
  }
  throw new BadRequestError("The iCal feed contains an unsupported event date.")
}

function calendarSubscriptionParse(raw) {
  var text = calendarSubscriptionUnfold(raw)
  if (text.indexOf("BEGIN:VCALENDAR") < 0 || text.indexOf("END:VCALENDAR") < 0) {
    throw new BadRequestError("The response is not a valid iCal calendar.")
  }

  var blocks = text.match(/BEGIN:VEVENT\n[\s\S]*?\nEND:VEVENT/g) || []
  var events = []
  var seen = {}

  blocks.forEach(function (block) {
    var fields = {}
    block.split("\n").slice(1, -1).forEach(function (line) {
      var colon = line.indexOf(":")
      if (colon < 0) return
      var left = line.slice(0, colon).split(";")
      var name = left.shift().toUpperCase()
      var params = {}
      left.forEach(function (part) {
        var eq = part.indexOf("=")
        if (eq > 0) params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, "")
      })
      if (!fields[name]) fields[name] = { value: line.slice(colon + 1), params: params }
    })

    if (!fields.UID || !fields.DTSTART || !fields.SUMMARY) return
    var uid = calendarSubscriptionUnescape(fields.UID.value).trim()
    if (fields["RECURRENCE-ID"]) {
      uid += "::" + calendarSubscriptionUnescape(fields["RECURRENCE-ID"].value).trim()
    }
    if (!uid || seen[uid]) return
    seen[uid] = true

    var start = calendarSubscriptionDate(fields.DTSTART.value, fields.DTSTART.params, false)
    var end = fields.DTEND
      ? calendarSubscriptionDate(fields.DTEND.value, fields.DTEND.params, true)
      : null
    events.push({
      uid: uid,
      title: calendarSubscriptionUnescape(fields.SUMMARY.value).trim(),
      start: start.value,
      end: end ? end.value : null,
      allDay: start.allDay,
      location: fields.LOCATION ? calendarSubscriptionUnescape(fields.LOCATION.value) : "",
      description: fields.DESCRIPTION ? calendarSubscriptionUnescape(fields.DESCRIPTION.value) : "",
    })
  })

  if (blocks.length > 0 && events.length === 0) {
    throw new BadRequestError("The iCal feed does not contain importable events.")
  }
  return events
}

function calendarSubscriptionEventRecordData(item, options) {
  return {
    household: options.householdId || "",
    title: item.title,
    start: item.start,
    end: item.end || "",
    location: item.location,
    description: item.description,
    source: options.source || "ical",
    externalUid: item.uid,
    subscription: options.subscriptionId || "",
    allDay: item.allDay,
  }
}

function calendarSubscriptionImportParsedEvents(txApp, options) {
  // Shared import contract: preserve subscription imports as source="ical" with created/updated/removed counts.
  var counts = { created: 0, updated: 0, removed: 0 }
  var collection = txApp.findCollectionByNameOrId("calendar_events")
  var current = []
  var uploadPrefix = options.uploadSourceKey ? options.uploadSourceKey + "::" : ""

  if (options.subscriptionId) {
    current = txApp.findRecordsByFilter(
        "calendar_events",
        "subscription = {:subscription}",
        "",
        0,
        0,
        { subscription: options.subscriptionId }
      )
  } else if (options.source === "upload" && options.householdId) {
    current = txApp.findRecordsByFilter(
      "calendar_events",
      "source = {:source} && household = {:household}",
      "",
      0,
      0,
      { source: "upload", household: options.householdId }
    )
  }
  var byUid = {}

  current.forEach(function (record) {
    byUid[record.getString("externalUid")] = record
  })

  options.events.forEach(function (item) {
    var record = byUid[item.uid]
    if (record) {
      counts.updated += 1
      delete byUid[item.uid]
    } else {
      counts.created += 1
      record = new Record(collection)
    }

    var data = calendarSubscriptionEventRecordData(item, options)
    Object.keys(data).forEach(function (key) {
      record.set(key, data[key])
    })
    txApp.save(record)
  })

  if (options.subscriptionId) {
    Object.keys(byUid).forEach(function (uid) {
      txApp.delete(byUid[uid])
      counts.removed += 1
    })
  } else if (options.source === "upload" && uploadPrefix) {
    Object.keys(byUid).forEach(function (uid) {
      if (uid.indexOf(uploadPrefix) !== 0) return
      txApp.delete(byUid[uid])
      counts.removed += 1
    })
  }

  return counts
}

module.exports = {
  MAX_ICS_BYTES: CALENDAR_SUBSCRIPTION_MAX_ICS_BYTES,
  eventRecordData: calendarSubscriptionEventRecordData,
  importParsedEvents: calendarSubscriptionImportParsedEvents,
  isHouseholdMember: calendarSubscriptionIsHouseholdMember,
  normalizeUploadSourceKey: calendarSubscriptionNormalizeUploadSourceKey,
  readUploadedText: calendarSubscriptionReadUploadedText,
  requireMember: calendarSubscriptionRequireMember,
  validateUrl: calendarSubscriptionValidateUrl,
  validateUploadName: calendarSubscriptionValidateUploadName,
  parse: calendarSubscriptionParse,
  safeMessage: calendarSubscriptionSafeMessage,
}
