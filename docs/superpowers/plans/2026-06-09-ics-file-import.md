# ICS File Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-time `.ics` file upload import while keeping the existing URL-based external calendar subscription and sync flow working.

**Architecture:** Reuse the existing ICS parser and event upsert logic by extracting shared backend helpers from the current subscription sync route. Add a new authenticated upload endpoint for one-time file imports and a frontend mode switch that separates URL subscriptions from `.ics` uploads.

**Tech Stack:** PocketBase JSVM hooks, PocketBase REST routes, React Native/Expo web frontend, PocketBase JS SDK, existing calendar events collections.

---

## File Map

- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.js`
  Responsibility: shared ICS parsing, validation, event normalization, and shared import/upsert helpers.
- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.pb.js`
  Responsibility: existing URL subscription sync route plus new upload import route.
- Modify: `frontend/src/lib/calendar-subscriptions.ts`
  Responsibility: client helpers for upload import and shared result types.
- Modify: `frontend/src/screens/ProfileScreen.tsx`
  Responsibility: UI toggle between URL subscription mode and `.ics` upload mode.
- Create or modify: `docs/superpowers/specs/2026-06-09-ics-file-import-design.md`
  Responsibility: source design reference if behavior needs small clarifications during implementation.

## Task 1: Extract Shared Backend Import Helpers

**Files:**
- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.js`
- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.pb.js`

- [ ] **Step 1: Write the failing test plan notes directly in code comments or temporary assertions**

Use this target behavior for the shared helper API:

```js
const result = helpers.importParsedEvents(txApp, {
  events: parsed,
  ownerId: subscription.getString("owner"),
  householdId: subscription.getString("household"),
  sharedWithHousehold: subscription.getBool("sharedWithHousehold"),
  subscriptionId: subscription.id,
  mode: "subscription",
})
```

Expected behavior:
- URL imports still set `subscription`
- imported events still set `source = "ical"`
- counts object remains `{ created, updated, removed }`

- [ ] **Step 2: Run the current export/import smoke path mentally against the existing implementation to verify the shared helper does not exist yet**

Run: no command yet
Expected: there is no shared import helper; current sync logic is duplicated inside `calendar_subscription.pb.js`

- [ ] **Step 3: Write minimal shared backend helpers**

Extract and add helpers like:

```js
function calendarSubscriptionEventRecordData(item, options) {
  return {
    household: options.householdId || "",
    title: item.title,
    start: item.start,
    end: item.end || "",
    location: item.location,
    description: item.description,
    source: "ical",
    externalUid: item.uid,
    subscription: options.subscriptionId || "",
    allDay: item.allDay,
  }
}

function calendarSubscriptionImportParsedEvents(txApp, options) {
  var counts = { created: 0, updated: 0, removed: 0 }
  var collection = txApp.findCollectionByNameOrId("calendar_events")
  var current = options.subscriptionId
    ? txApp.findRecordsByFilter(
        "calendar_events",
        "subscription = {:subscription}",
        "",
        0,
        0,
        { subscription: options.subscriptionId }
      )
    : []

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
  }

  return counts
}
```

- [ ] **Step 4: Update the existing subscription sync route to use the shared helper**

Replace the inlined transaction body in `calendar_subscription.pb.js` with:

```js
var counts = { created: 0, updated: 0, removed: 0 }
e.app.runInTransaction((txApp) => {
  counts = helpers.importParsedEvents(txApp, {
    events: parsed,
    householdId: "",
    subscriptionId: subscription.id,
  })

  var txSubscription = txApp.findRecordById("calendar_subscriptions", subscription.id)
  txSubscription.set("lastSyncedAt", new DateTime())
  txSubscription.set("lastSyncStatus", "success")
  txSubscription.set(
    "lastSyncMessage",
    "Created " + counts.created + ", updated " + counts.updated + ", removed " + counts.removed + "."
  )
  txApp.save(txSubscription)
})
```

- [ ] **Step 5: Run a quick static verification**

Run: `rg -n "importParsedEvents|eventRecordData|lastSyncMessage" backend/pocketbase/pb_hooks -S`
Expected: helper exists once, sync route calls it once, success message remains intact

- [ ] **Step 6: Commit**

```bash
git add backend/pocketbase/pb_hooks/calendar_subscription.js backend/pocketbase/pb_hooks/calendar_subscription.pb.js
git commit -m "refactor: share calendar import event upsert logic"
```

## Task 2: Add One-Time ICS Upload Route

**Files:**
- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.js`
- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.pb.js`

- [ ] **Step 1: Write the failing route behavior**

Target API:

```text
POST /api/calendar-imports/upload
Content-Type: multipart/form-data
Fields:
- file
- householdId
```

Expected JSON response:

```json
{ "created": 2, "updated": 0, "removed": 0 }
```

Expected failures:
- missing file
- wrong extension or empty body
- malformed ICS
- unauthorized household

- [ ] **Step 2: Verify the route does not exist yet**

Run: `rg -n "/api/calendar-imports/upload" backend/pocketbase/pb_hooks -S`
Expected: no matches

- [ ] **Step 3: Add upload validation helpers**

Add helper functions in `calendar_subscription.js`:

```js
function calendarSubscriptionValidateUploadName(name) {
  var filename = String(name || "").trim().toLowerCase()
  if (!filename.endsWith(".ics")) {
    throw new BadRequestError("Please upload a .ics calendar file.")
  }
  return filename
}

function calendarSubscriptionRequireMember(app, householdId, userId) {
  if (!calendarSubscriptionIsHouseholdMember(app, householdId, userId)) {
    throw new ForbiddenError("You can only import calendars into your households.")
  }
}
```

Export them from `module.exports`.

- [ ] **Step 4: Add the upload route with minimal parsing and import**

Add a new route in `calendar_subscription.pb.js` similar to:

```js
routerAdd("POST", "/api/calendar-imports/upload", (e) => {
  var helpers = require(__hooks + "/calendar_subscription.js")
  var householdId = String(e.requestInfo().body.householdId || e.request.formValue("householdId") || "").trim()
  helpers.requireMember(e.app, householdId, e.auth.id)

  var file = e.request.formFile("file")
  if (!file) {
    throw new BadRequestError("Please choose a .ics file to import.")
  }

  helpers.validateUploadName(file.filename)
  var content = toString(file)
  if (!content.trim()) {
    throw new BadRequestError("The uploaded .ics file is empty.")
  }

  var parsed = helpers.parse(content)
  var counts = { created: 0, updated: 0, removed: 0 }

  e.app.runInTransaction((txApp) => {
    counts = helpers.importParsedEvents(txApp, {
      events: parsed,
      householdId: householdId,
      subscriptionId: "",
    })
  })

  return e.json(200, counts)
}, $apis.requireAuth("users"))
```

Note: use the PocketBase request/form helpers that match the runtime API available in this repo. Keep the first implementation minimal and adjust only if the actual form accessor names differ.

- [ ] **Step 5: Make sure file imports never remove older imported events**

Keep `removed = 0` for upload imports by only deleting unmatched old records when `subscriptionId` is present. This behavior is already part of Task 1’s helper shape.

- [ ] **Step 6: Run a route presence check**

Run: `rg -n "/api/calendar-imports/upload|validateUploadName|requireMember" backend/pocketbase/pb_hooks -S`
Expected: one route, one upload filename validator, one household membership helper

- [ ] **Step 7: Commit**

```bash
git add backend/pocketbase/pb_hooks/calendar_subscription.js backend/pocketbase/pb_hooks/calendar_subscription.pb.js
git commit -m "feat: add one-time ics file import route"
```

## Task 3: Add Frontend Client Support For File Upload Imports

**Files:**
- Modify: `frontend/src/lib/calendar-subscriptions.ts`

- [ ] **Step 1: Write the failing client API design**

Target helper:

```ts
export async function importCalendarFile(input: {
  householdId: string;
  file: File;
}): Promise<CalendarSyncResult>
```

- [ ] **Step 2: Verify the helper does not exist yet**

Run: `rg -n "importCalendarFile" frontend/src/lib/calendar-subscriptions.ts -S`
Expected: no matches

- [ ] **Step 3: Add the minimal upload helper**

Add:

```ts
export async function importCalendarFile(input: {
  householdId: string;
  file: File;
}) {
  const form = new FormData();
  form.append("householdId", input.householdId);
  form.append("file", input.file);

  return await pb.send<CalendarSyncResult>("/api/calendar-imports/upload", {
    method: "POST",
    body: form,
  });
}
```

- [ ] **Step 4: Run a quick static check**

Run: `rg -n "FormData|/api/calendar-imports/upload|importCalendarFile" frontend/src/lib/calendar-subscriptions.ts -S`
Expected: helper defined once, route path correct once

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/calendar-subscriptions.ts
git commit -m "feat: add calendar file upload client"
```

## Task 4: Add File Import Mode To Profile Screen

**Files:**
- Modify: `frontend/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Write the failing UI behavior**

Target behavior:
- user can switch between URL mode and file mode
- file mode hides URL input
- file mode shows file picker and import button
- successful import shows result alert

- [ ] **Step 2: Verify the current screen only supports URL mode**

Run: `rg -n "externalCalendarUrl|handleSaveCalendarSubscription|handleSyncCalendarSubscription|calendarUrl" frontend/src/screens/ProfileScreen.tsx -S`
Expected: only URL-based controls and handlers exist

- [ ] **Step 3: Add local state for import mode and selected file**

Add minimal state near the existing calendar state:

```ts
const [calendarImportMode, setCalendarImportMode] = useState<"url" | "file">("url");
const [calendarImportFile, setCalendarImportFile] = useState<File | null>(null);
```

- [ ] **Step 4: Add the one-time import handler**

Add a handler like:

```ts
async function handleImportCalendarFile() {
  if (!calendarImportFile) {
    alert("Please choose a .ics file.");
    return;
  }

  setCalendarBusy(true);
  try {
    const result = await importCalendarFile({
      householdId: calendarHouseholdId,
      file: calendarImportFile,
    });
    alert(t("profile.externalCalendarSyncComplete", result));
    setCalendarImportFile(null);
  } catch (error: any) {
    alert(`${t("profile.externalCalendarSyncFailed")}: ${error?.response?.message ?? error?.message ?? "Unknown"}`);
  } finally {
    setCalendarBusy(false);
  }
}
```

- [ ] **Step 5: Add the mode switch and conditional UI**

In the external calendar card:

```tsx
<SegmentedButtons
  value={calendarImportMode}
  onValueChange={(value) => setCalendarImportMode(value as "url" | "file")}
  buttons={[
    { value: "url", label: "Calendar URL" },
    { value: "file", label: "Upload .ics" },
  ]}
/>
```

Render:
- existing URL form when `calendarImportMode === "url"`
- file picker + import button when `calendarImportMode === "file"`

For the web-first minimal version, a file input can be rendered with:

```tsx
{Platform.OS === "web" ? (
  <input
    type="file"
    accept=".ics,text/calendar"
    onChange={(event) => {
      const file = event.currentTarget.files?.[0] ?? null;
      setCalendarImportFile(file);
    }}
  />
) : null}
```

Keep the first pass focused on web support if native upload plumbing is not already present in the repo.

- [ ] **Step 6: Add lightweight user messaging**

Add a small helper text near the file picker:

```tsx
<Text variant="bodySmall">
  Uploaded .ics files are imported once. Re-upload the file if the source changes.
</Text>
```

- [ ] **Step 7: Run a static verification pass**

Run: `npx tsc --noEmit`
Expected: no TypeScript errors in the modified frontend files

- [ ] **Step 8: Commit**

```bash
git add frontend/src/screens/ProfileScreen.tsx frontend/src/lib/calendar-subscriptions.ts
git commit -m "feat: add ics upload mode to external calendar"
```

## Task 5: End-to-End Verification

**Files:**
- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.js`
- Modify: `backend/pocketbase/pb_hooks/calendar_subscription.pb.js`
- Modify: `frontend/src/lib/calendar-subscriptions.ts`
- Modify: `frontend/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Rebuild PocketBase after backend changes**

Run:

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up --build -d pocketbase
```

Expected: PocketBase container rebuilds successfully

- [ ] **Step 2: Run the frontend typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Verify one-time ICS upload manually**

Manual verification checklist:
- open the profile external calendar section
- switch to `Upload .ics`
- choose a valid `.ics` file
- import it
- confirm success feedback appears
- confirm imported events appear in the calendar

- [ ] **Step 4: Verify URL sync still works**

Manual verification checklist:
- switch back to `Calendar URL`
- save an HTTPS ICS URL
- run sync
- confirm imported events still update

- [ ] **Step 5: Final commit**

```bash
git add backend/pocketbase/pb_hooks/calendar_subscription.js backend/pocketbase/pb_hooks/calendar_subscription.pb.js frontend/src/lib/calendar-subscriptions.ts frontend/src/screens/ProfileScreen.tsx docs/superpowers/specs/2026-06-09-ics-file-import-design.md docs/superpowers/plans/2026-06-09-ics-file-import.md
git commit -m "feat: support one-time ics file imports"
```

## Self-Review

- Spec coverage: this plan covers URL sync preservation, one-time file upload import, shared helper reuse, frontend mode separation, and verification.
- Placeholder scan: all tasks include concrete file paths, commands, and code targets.
- Type consistency: plan consistently uses `CalendarSyncResult`, `importCalendarFile`, `importParsedEvents`, and `calendarImportMode`.
