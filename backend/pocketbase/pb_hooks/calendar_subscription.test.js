const test = require("node:test")
const assert = require("node:assert/strict")

const {
  importParsedEvents,
  normalizeUploadSourceKey,
} = require("./calendar_subscription.js")

class FakeRecord {
  constructor(collection) {
    this.collection = collection
    this.values = {}
  }

  set(key, value) {
    this.values[key] = value
  }

  getString(key) {
    return String(this.values[key] || "")
  }
}

global.Record = FakeRecord

test("normalizeUploadSourceKey prefers a clean stable slug", () => {
  assert.equal(normalizeUploadSourceKey("My Family Calendar.ics", ""), "my-family-calendar")
  assert.equal(normalizeUploadSourceKey("", "Kitchen Plan.ics"), "kitchen-plan")
})

test("importParsedEvents only prunes stale upload events for the same upload source key", () => {
  const deleted = []
  const saved = []
  const existing = [
    {
      id: "same-1",
      getString(field) {
        return field === "externalUid" ? "shared-feed::keep-me" : ""
      },
      set() {},
    },
    {
      id: "same-2",
      getString(field) {
        return field === "externalUid" ? "shared-feed::remove-me" : ""
      },
      set() {},
    },
    {
      id: "other-1",
      getString(field) {
        return field === "externalUid" ? "other-feed::leave-alone" : ""
      },
      set() {},
    },
  ]
  const txApp = {
    findCollectionByNameOrId() {
      return { name: "calendar_events" }
    },
    findRecordsByFilter() {
      return existing
    },
    save(record) {
      saved.push(record)
    },
    delete(record) {
      deleted.push(record.id)
    },
  }

  const counts = importParsedEvents(txApp, {
    events: [
      {
        uid: "shared-feed::keep-me",
        title: "Team dinner",
        start: "2026-06-10T18:00:00.000Z",
        end: "2026-06-10T20:00:00.000Z",
        allDay: false,
        location: "",
        description: "",
      },
    ],
    householdId: "household-1",
    source: "upload",
    uploadSourceKey: "shared-feed",
  })

  assert.deepEqual(counts, { created: 0, updated: 1, removed: 1 })
  assert.equal(saved.length, 1)
  assert.deepEqual(deleted, ["same-2"])
})
