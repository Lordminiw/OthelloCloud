# iCal Calendar Import Implementation Plan

## Summary

Add user-owned iCal subscriptions to the calendar. A user can configure
multiple iCal URLs and manually check for updates from the profile screen.
Imports are private by default and can optionally be shared with every member
of one of the user's households.

The integration supports arbitrary compatible iCal feeds and custom names. An
admin obtains the household's subscription URL from their calendar provider
and pastes it into OthelloCloud. The default display name is
`External calendar`.

## Backend And Data Model

Create a `calendar_subscriptions` PocketBase collection with:

- `owner`: required relation to `users`
- `household`: optional relation used when sharing with a household
- `sharedWithHousehold`: boolean
- `name`: required display name, defaulting to `External calendar`
- `url`: required iCal subscription URL
- `enabled`: boolean
- `lastSyncedAt`: optional date
- `lastSyncStatus`: optional `success` or `error` value
- `lastSyncMessage`: optional text containing a safe status or error summary

Owners may create multiple subscriptions and are the only users who can update,
enable, disable, synchronize, or view their configured URLs. When sharing is
enabled, all members of the selected household may read its public status and
events.

Extend `calendar_events` with:

- `source`: `manual` or `ical`, with existing records treated as `manual`
- `externalUid`: optional iCal event UID
- `subscription`: optional relation to `calendar_subscriptions`
- `allDay`: boolean

Add a unique index covering `subscription` and `externalUid` so repeated
imports update existing records instead of creating duplicates. Imported
events are managed only by synchronization and cannot be edited or deleted
through the normal calendar UI.

## Server-Side Synchronization

Add a PocketBase JavaScript hook exposing:

```text
POST /api/calendar-subscriptions/:subscriptionId/sync
```

The endpoint must:

1. Require the authenticated subscription owner.
2. Load the enabled subscription.
3. Download the iCal feed server-side.
4. Parse `VEVENT` records, including all-day events, end dates, locations,
   descriptions, time zones, and stable UIDs.
5. Upsert imported `calendar_events` using the subscription and UID.
6. Delete imported events from that subscription that are no longer present in
   the downloaded feed.
7. Update the subscription's sync timestamp, status, and safe status message.
8. Return counts for created, updated, and removed events.

Fetching must happen on the PocketBase server because arbitrary iCal URLs may
not allow browser requests through CORS. Add the `pb_hooks` directory to the
PocketBase Docker image or Compose mounts so the endpoint is available in local
and deployed environments.

Apply these URL-fetching protections:

- Accept only `https://` URLs.
- Reject localhost, loopback, link-local, private-network, and internal service
  addresses to prevent SSRF.
- Apply a short request timeout and response-size limit.
- Reject redirects to blocked destinations.
- Reject malformed or non-iCal responses without changing existing events.

After manual synchronization is stable, register a daily PocketBase cron job
that refreshes every enabled subscription. A failed automatic sync must leave
the last successfully imported events intact and record the error status.

## Frontend Integration

Add a calendar-subscription client module that can:

- Load the current household's subscription status.
- Save the admin-managed name, URL, and enabled state.
- Trigger the server-side synchronization endpoint.

Add an **External calendar** card to the profile screen.

For calendar owners, the card provides:

- An enable or disable switch
- A calendar name field
- An iCal URL field
- A **Check for updates** button
- The last successful sync time and latest sync result
- An option to share the calendar with all members of a selected household

Update the calendar screen so imported events:

- Appear for every household member alongside manual events.
- Correctly display all-day collection dates.
- Use a distinct external-calendar color and source label.
- Do not show edit or delete controls.
- Continue to participate in month, agenda, and upcoming-event views.
- Appear as independent selectable sources in the top-right multi-select menu,
  alongside selectable household calendars.

Add all new user-facing strings to the existing English and German localization
catalog.

## Error Handling

- Saving an invalid URL shows a clear validation error and preserves the
  previous valid subscription.
- A failed sync shows a useful admin-facing message while keeping previously
  imported events.
- Disabling a subscription hides its imported events without deleting manual
  events. Re-enabling and syncing restores current imported events.
- Changing the URL performs synchronization against the replacement feed and
  removes events belonging only to the previous feed after a successful sync.

## Test Plan

Verify these scenarios:

- An admin adds a valid iCal URL and all household members see the
  imported events.
- A regular member cannot view the URL, change settings, or trigger a sync.
- Repeated synchronization does not create duplicate events.
- Changed and removed upstream events are updated and removed locally.
- All-day events appear on the correct local calendar date.
- Invalid URLs, malformed iCal files, timeouts, and blocked private URLs return
  useful errors without deleting existing events.
- Disabling the subscription hides imported events and leaves manual events
  unchanged.
- Imported events cannot be edited or deleted through the calendar UI.
- Manual events continue to create, update, delete, and display normally.
- The frontend passes `npm run lint` and `npx tsc --noEmit`.

## Rollout

Ship manual admin-triggered synchronization first. Confirm production imports,
permissions, event dates, and update behavior before enabling the daily
automatic synchronization job.
