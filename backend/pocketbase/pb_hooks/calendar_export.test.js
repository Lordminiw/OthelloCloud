const test = require("node:test")
const assert = require("node:assert/strict")

const {
  createExportToken,
  buildCalendarExport,
} = require("./calendar_export.js")

test("createExportToken returns a long URL-safe token", () => {
  const token = createExportToken()

  assert.match(token, /^[A-Za-z0-9_-]{40,}$/)
})

test("buildCalendarExport serializes manual WG events to ICS", () => {
  const text = buildCalendarExport({
    calendarName: "Test WG",
    productId: "-//OthelloCloud//WG Calendar//EN",
    calendarUrl: "https://example.com/api/calendar-export/token.ics",
    events: [
      {
        id: "event-time",
        title: "Plenum",
        start: "2026-06-05T17:00:00.000Z",
        end: "2026-06-05T18:00:00.000Z",
        location: "Kitchen",
        description: "Budget review",
        allDay: false,
      },
      {
        id: "event-day",
        title: "Moving Day",
        start: "2026-06-10 00:00:00.000Z",
        end: "2026-06-12 00:00:00.000Z",
        location: "",
        description: "",
        allDay: true,
      },
    ],
  })

  assert.match(text, /BEGIN:VCALENDAR/)
  assert.match(text, /X-WR-CALNAME:Test WG/)
  assert.match(text, /URL:https:\/\/example.com\/api\/calendar-export\/token\.ics/)
  assert.match(text, /UID:event-time@othellocloud/)
  assert.match(text, /SUMMARY:Plenum/)
  assert.match(text, /DTSTART:20260605T170000Z/)
  assert.match(text, /DTEND:20260605T180000Z/)
  assert.match(text, /LOCATION:Kitchen/)
  assert.match(text, /DESCRIPTION:Budget review/)
  assert.match(text, /UID:event-day@othellocloud/)
  assert.match(text, /DTSTART;VALUE=DATE:20260610/)
  assert.match(text, /DTEND;VALUE=DATE:20260613/)
})
