# Recurring Expenses Design

## Goal

Add recurring household expenses that create normal expense records
automatically on a schedule, including custom intervals such as every 2 weeks
or every 3 months.

## Scope

This feature should let a household member define a recurring expense rule from
the Expenses screen, have the backend generate matching expense records
automatically, and keep generated expenses working with the existing balances
and settlements flow.

This version includes:

- automatic creation of due expenses without a manual approval step
- custom interval scheduling using a unit plus count model
- pause, resume, edit, and delete actions for recurring rules
- generated expenses appearing in the existing expenses views and calculations

This version does not include:

- reminder-only recurring items
- per-occurrence approval workflows
- editing past generated expenses through recurring rule updates
- advanced calendar-style rules such as "third Monday of the month"

## Current Context

The current expense flow stores posted expenses directly in the `expenses`
collection and renders them from `frontend/src/lib/expenses.ts` and
`frontend/src/screens/ExpensesScreen.tsx`.

Existing balance and payment suggestion logic already works by reading the
posted `expenses` collection. That means the safest way to add automation is to
generate ordinary expense records rather than teach downstream calculations
about a second expense shape.

The backend already uses PocketBase JavaScript hook files and custom routes in
`backend/pocketbase/pb_hooks`. PocketBase also supports cron registration,
which gives the app a server-side place to generate recurring expenses
independently of whether the frontend is open.

## Recommended Approach

Add a dedicated `recurring_expenses` collection that stores schedule rules plus
expense template fields. A backend cron job should process due rules and create
normal records in `expenses`.

This is preferred over placing recurrence metadata directly on `expenses`
because templates and posted records have different lifecycles. Users need to
edit future occurrences without mutating historical expenses, and the system
needs a place to track scheduler state such as `nextRunAt` and `lastError`
without polluting ordinary expense rows.

## Data Model

### New collection: `recurring_expenses`

Each recurring rule stores:

- `household`
- `description`
- `amount`
- `paidBy`
- `splitBetween`
- `splitMode`
- `splitShares`
- `notes`
- `startDate`
- `intervalUnit` with allowed values `day`, `week`, `month`, `year`
- `intervalCount` as a positive integer
- `nextRunAt`
- `lastRunAt`
- `active`
- `createdBy`
- `lastError`
- `lastGeneratedExpense`
- standard created and updated timestamps

The expense-like fields intentionally mirror the current `expenses` schema so
generated expenses can be created through the same shape already used by the
frontend.

### Existing collection change: `expenses`

Add optional metadata fields:

- `recurringExpense`
- `scheduledFor`

This links a generated expense back to the source recurring rule. Manual
expenses leave these fields empty. `scheduledFor` stores the intended scheduled
occurrence timestamp for generated expenses and gives the backend a stable key
for duplicate prevention.

## Scheduling Behavior

Register a PocketBase cron job in `backend/pocketbase/pb_hooks` that runs on a
short interval such as every 10 to 15 minutes.

On each run, the processor should:

1. Load active recurring rules whose `nextRunAt` is less than or equal to the
   current time.
2. For each due rule, generate one or more normal `expenses` records until the
   rule is caught up or a safety cap is reached.
3. Set each created expense's `recurringExpense` field to the source rule id.
4. Update the rule's `lastRunAt`, `nextRunAt`, `lastGeneratedExpense`, and
   `lastError`.

### Schedule advancement

The next scheduled time should be calculated from the previous scheduled time,
not from the current time. This keeps rules aligned to their intended cadence.

Examples:

- a rule scheduled every 2 weeks stays on a 14-day rhythm even if processing
  runs late
- a rule scheduled every 3 months keeps stepping in 3-month increments from the
  original cadence

### Catch-up behavior

If the scheduler was delayed or the app was offline, the processor should
create missed occurrences in chronological order. To avoid runaway generation
from a broken rule, each cron pass should enforce a bounded catch-up limit, for
example 12 generated occurrences per rule per run.

### Duplicate prevention

Recurring generation must run inside a transaction. Before creating a due
expense, the processor should check whether an expense already exists for the
same recurring rule and scheduled occurrence. If one exists, it should skip
creation and continue advancing the rule safely.

To support this, every generated expense should store the scheduled occurrence
time in `scheduledFor`. The generator should treat the pair
`(recurringExpense, scheduledFor)` as unique when deciding whether an
occurrence has already been created.

## UI Behavior

Extend `frontend/src/screens/ExpensesScreen.tsx` with a recurring-expenses
section that complements the existing manual expense form.

### Create form

The recurring-expense form should reuse the current expense fields:

- description
- amount
- notes
- paid by
- split members
- split mode
- split shares

It should add schedule controls for:

- start date
- interval count
- interval unit

### Recurring list

The screen should show a list of saved recurring rules with:

- description
- amount
- payer
- split summary
- next run date
- active or paused status
- last error if present

Actions should include:

- `Edit`
- `Pause` or `Resume`
- `Delete`

### Generated expense visibility

Generated expenses should appear in the same recent-expenses list and household
balance calculations as manual expenses. The UI should show a lightweight badge
or note so users can tell when an expense came from a recurring rule.

## Editing and Lifecycle Rules

Editing a recurring rule changes future generation only. It does not rewrite
historical `expenses` records that were already generated.

Pausing a rule sets `active = false` and prevents new expense creation.

Resuming a rule reactivates scheduling and recalculates `nextRunAt` based on
the stored cadence and current time. The resume logic should avoid generating a
large backlog unless that is explicitly desired by the rule processor's normal
catch-up behavior.

Deleting a recurring rule stops future generation but keeps previously created
expenses intact, because those are posted financial records.

## Validation Rules

Both frontend and backend should validate:

- description is not empty
- amount is a positive number
- `paidBy` is present
- at least one user is included in `splitBetween`
- `splitMode` is one of `equal`, `amount`, `percent`
- `splitShares` is valid for the selected split mode
- `intervalCount` is an integer greater than or equal to 1
- `intervalUnit` is one of `day`, `week`, `month`, `year`
- `startDate` is present

The backend should also reject recurring rules if the payer or split members no
longer belong to the household at creation or update time.

## Error Handling

When recurring generation fails for a rule, the system should:

- leave the rule active unless the data is invalid in a permanent way
- save a useful `lastError` message on the rule
- avoid partial duplicate creation by using a transaction
- retry on a later cron pass after the underlying issue is fixed

The recurring-expense UI should surface `lastError` so the user can understand
why a rule is not generating as expected.

## Testing Strategy

### Backend

Add tests for:

- recurrence math for every N days, weeks, months, and years
- schedule advancement based on previous scheduled time instead of wall clock
- duplicate prevention for the same rule and occurrence
- catch-up generation after missed cron windows
- pause and resume behavior
- validation failures for invalid household members or malformed schedules

### Frontend

Add tests for:

- recurring form validation
- create and edit request payloads
- pause and resume actions
- rendering of generated-expense indicators

### Manual verification

Confirm that:

- a due recurring rule creates a normal `expenses` record
- the new expense appears in recent expenses
- generated expenses affect balances and payment suggestions the same way manual
  expenses do
- pausing stops future creation
- editing a rule changes future generated expenses only

## Implementation Notes

This design intentionally minimizes disruption to the existing expenses domain:

- balances continue reading `expenses`
- settlements remain unchanged
- manual expense creation remains unchanged
- recurrence state lives in a dedicated collection

That separation should keep the implementation easier to reason about and lower
the risk of regressions in the current expenses workflow.
