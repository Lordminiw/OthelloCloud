# ICS File Import Design

## Goal

Add support for importing external calendar data from both:

- a syncable calendar URL
- a one-time uploaded `.ics` file

The existing URL subscription flow should keep working as it does now. Uploaded
`.ics` files should be imported once and not become an auto-syncing source.

## Current State

- URL-based imports are handled through `calendar_subscriptions`.
- The backend fetches the remote URL, parses the ICS text, and upserts
  `calendar_events` with `source = "ical"`.
- The frontend profile screen exposes one external calendar form that assumes
  the source is always a URL.

## Chosen Approach

Keep the current URL subscription path unchanged and add a separate upload-based
import path for `.ics` files.

This keeps the working syncable subscription behavior intact and matches the
desired product behavior:

- URL source: save and re-sync later
- uploaded file: import once, re-upload if needed

## Backend Design

### URL imports

No change to the existing calendar subscription sync endpoint behavior beyond
small shared helper reuse where useful.

### File imports

Add a new authenticated endpoint:

- `POST /api/calendar-imports/upload`

Expected request shape:

- multipart form upload
- `.ics` file field
- `householdId`
- `sharedWithHousehold` or equivalent ownership fields already used by the
  external calendar flow
- optional display name if the UI needs it for feedback

Behavior:

1. Validate that the user may import into the target household.
2. Validate the uploaded file exists and has `.ics` filename or ICS-like
   content.
3. Read the uploaded file as text.
4. Parse it with the existing ICS parser used by URL subscriptions.
5. Upsert imported events into `calendar_events`.
6. Return a result payload with counts such as `created`, `updated`, and
   `removed` where applicable.

### Event ownership and sync semantics

Uploaded-file imports are one-time only.

- They should create read-only imported calendar events, same as URL imports.
- They should not create a long-lived syncable `calendar_subscriptions` record.
- Re-uploading a file should be treated as another manual import action.

### Import identity

To avoid fragile duplicate behavior, uploaded imports need a stable strategy for
matching ICS events during that single import operation.

Recommended behavior:

- if an ICS event contains a UID, use it
- if an event has no UID, generate a deterministic fallback key from title,
  start, end, and location for that import run

This keeps repeated uploads from creating obvious duplicates when the file is
uploaded again, while staying compatible with existing ICS parsing behavior.

If the current schema makes that difficult, add only the smallest metadata
needed to distinguish file-imported events from subscription-imported events.

## Frontend Design

Update the external calendar card in `ProfileScreen.tsx` to support two import
modes:

- `Calendar URL`
- `Upload .ics file`

### URL mode

Keep the current experience:

- calendar name
- calendar URL
- enabled toggle
- optional household sharing
- save
- sync

### File mode

Add:

- file picker for `.ics`
- same household/share target selection
- import button
- result feedback showing imported counts

The UI should clearly communicate that uploaded files are imported once and do
not auto-refresh.

## Shared Parsing and Import Logic

Refactor the backend import pipeline so URL sync and file upload reuse the same
core logic where possible:

- parse ICS text
- normalize events
- upsert events
- compute result counts

This keeps behavior consistent between remote URLs and uploaded files and
reduces future drift.

## Error Handling

Reject with actionable messages for:

- missing file
- non-ICS upload
- malformed ICS content
- unauthorized household target
- oversized file

The frontend should surface the backend message directly where practical.

## Testing

### Backend

Add tests for:

- valid `.ics` upload imports events
- invalid upload type is rejected
- malformed ICS content is rejected
- imported events are created as `source = "ical"`
- repeated upload does not explode on duplicate UIDs
- household permission checks

### Frontend

Add targeted tests or verification steps for:

- switching between URL mode and file mode
- picking a file and submitting import
- displaying success and error results

## Out of Scope

- automatic re-sync for uploaded files
- provider-specific calendar integrations
- major redesign of the external calendar data model

## Success Criteria

- users can keep using URL-based ICS subscriptions as before
- users can upload a local `.ics` file and import its events successfully
- imported file events appear in the calendar as read-only imported events
- uploaded `.ics` files do not create an auto-syncing subscription
