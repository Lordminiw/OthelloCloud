# Home Dashboard Design

## Goal

Add a new post-login `Home` tab that becomes the default landing page for users after login. The page should give a general overview of household activity without replacing the deeper task-specific tabs.

## Product Direction

The dashboard should be:

- Activity-first rather than statistics-first
- Focused on a shared household overview
- Supported by one personal reminder area
- Anchored by quick actions in the hero area

This is intentionally a landing page, not a full management console. It should help users orient themselves immediately after login and then hand them off to the existing tabs for detailed work.

## User Experience

After a user logs in and has at least one household, they should land on the new `Home` tab first instead of dropping directly into one of the current feature tabs.

The screen should communicate three things quickly:

1. Where the user is
2. What has been happening in the household
3. What the user can do next

The visual direction should feel more alive than the existing tab screens. The page should prioritize recent and upcoming activity so the app feels active even before the user navigates deeper.

## Layout

### 1. Hero Header

The top section should include:

- A greeting or welcome line
- The active household name
- Three primary quick actions:
  - `Add expense`
  - `Create poll`
  - `Add event`

The hero should feel more prominent than a normal section header and establish the dashboard as the default landing experience.

### 2. Activity Feed

The main content area should be a household activity feed. This is the primary content block on the page and should visually dominate the layout.

The feed should combine preview-level household activity from the existing modules, such as:

- Recent expenses
- Upcoming calendar events
- Open or newly created polls
- Optional shopping list activity if useful signals already exist

Items should be brief and scannable. The goal is awareness, not full record management.

### 3. Support Cards

Alongside the feed on larger screens, and stacked beneath it on smaller screens, the dashboard should show lightweight summary/support cards:

- `Upcoming events`
- `Open polls`
- `Your reminder`

These cards support the activity feed rather than competing with it. They should stay compact and preview-sized.

### 4. Empty State Behavior

If the household has little or no recent activity, the feed should not collapse or disappear. Instead, it should show a stable empty state with supportive prompts and shortcuts to the quick actions.

Example behaviors:

- "No recent activity yet"
- Encourage the user to add an event, create a poll, or record an expense
- Keep the support cards visible with soft empty states where possible

## Data Composition

The `Home` tab should aggregate lightweight previews from the existing data sources instead of introducing a new source of truth.

Expected data sources:

- Expenses data for recent household expense activity
- Calendar data for upcoming household events
- Polls data for currently open or recently created polls
- Optional shopping list data only if a meaningful recent-activity signal already exists in the current codebase

The dashboard should also compute one personal reminder. This should come from the clearest pending action available, for example:

- A poll the current user has not answered
- A shared expense the user still needs to settle
- Another obvious user-specific action if already supported by the data

## Interaction Model

The dashboard is a preview layer, not a destination for full workflows.

Each section should hand off cleanly to an existing detailed tab:

- Feed expense items should direct the user to `Expenses`
- Feed event items should direct the user to `Calendar`
- Feed poll items should direct the user to `Polls`
- Reminder actions should navigate to the most relevant destination

This keeps the dashboard lightweight and avoids duplicating module-specific editing behavior.

## Responsive Behavior

The screen should work well on both desktop web and mobile layouts.

- Desktop: activity feed as the dominant column with support cards beside it
- Mobile: hero first, then feed, then stacked support cards

The layout should avoid dense "command center" behavior. The page should feel active, not crowded.

## Loading and Failure Behavior

The dashboard should tolerate partial data failures.

- If one source fails, the rest of the dashboard should still render
- Affected cards or feed segments should show a simple unavailable or retry state
- Loading behavior should avoid blocking the whole screen longer than necessary

The page should feel resilient even when one module's data is temporarily unavailable.

## Technical Structure

Implementation should introduce a dedicated `HomeScreen` rather than pushing summary logic into `MainTabs`.

Recommended structure:

- A new `HomeScreen` component for the dashboard UI
- A small loader/composition layer that gathers preview data from existing lib functions
- Focused helpers for formatting feed entries and reminder state

This keeps the dashboard isolated and makes it easier to evolve later without tangling the existing feature screens.

## Navigation Changes

The main tab navigator should add a new `home` tab as the first tab.

Expected behavior:

- `home` becomes the first visible tab
- `home` becomes the default post-login landing route
- Existing deep-link/tab resolution should continue to work for the older tabs

## Testing Expectations

Implementation should verify:

- Logged-in users land on `Home` by default
- The tab bar includes the new `Home` tab in the first position
- Activity and support cards render with live data
- Empty states render cleanly when data is missing
- Partial failures do not blank the full screen
- Quick actions route into the correct existing workflows
- The page remains usable on both desktop-width and mobile-width layouts

## Out of Scope

The first version should not:

- Replace any existing detailed screen
- Become a full analytics dashboard
- Introduce heavy new backend endpoints unless the current frontend data access makes them necessary
- Add complex personalization beyond one clear personal reminder

## Recommended Implementation Bias

When implementation begins, prefer a bold but readable dashboard that feels more energetic than the current screens while still matching the app's existing Paper-based UI patterns. The page should feel like the natural home of the app after login, not just another utility tab.
