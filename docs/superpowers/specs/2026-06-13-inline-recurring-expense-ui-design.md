# Inline Recurring Expense UI Design

Date: 2026-06-13
Status: Approved for planning

## Goal

Adjust the recurring-expense creation experience so it lives inside the existing "New expense" form instead of using a separate recurring-expense creation panel.

The user expectation is:

- creating a normal expense should still use the existing expense form
- creating a recurring expense should start from the same form
- enabling recurrence should feel like an optional mode, not a different workflow

This spec intentionally changes the frontend interaction model only. The backend recurring-expense data model, scheduler behavior, generated-expense badges, and recurring-rules list remain in scope only where needed to support the revised UI.

## User Experience

### Expense Creation Form

The existing "New expense" card remains the only creation surface for expenses.

Inside that form, add a single inline control labeled "Recurring expense". A checkbox is the preferred interaction because it communicates that recurrence is an optional attribute of the current expense setup rather than a separate object the user must navigate to.

Default behavior:

- the checkbox starts unchecked
- the form initially behaves exactly like a normal one-off expense form
- no recurring-only fields are visible until the checkbox is enabled

When the checkbox is enabled:

- the form reveals the recurring-only inputs inline beneath the shared expense fields
- the recurring-only inputs are:
  - start date
  - interval count
  - interval unit
- the submit button label changes from "Add expense" to "Add recurring expense"

When the checkbox is disabled again:

- the recurring-only inputs are hidden
- recurring-only validation no longer applies
- the main submit button returns to the normal expense label

### Shared Fields

The following existing form fields continue to be shared across both one-off and recurring modes:

- description
- amount
- note
- paid by
- split between
- split mode
- split shares

This keeps the creation flow conceptually simple: users always start by defining the expense itself, and only then decide whether it should repeat.

### Submission Behavior

Normal mode:

- submitting creates a one-off expense exactly as it does today

Recurring mode:

- submitting creates a recurring-expense rule
- it does not also create an immediate one-off expense as part of the same action

This distinction should remain explicit in the UX. Turning on the recurring checkbox means "save this as a repeating setup", not "create both a rule and today's expense".

### Form Reset

After a successful save in either mode:

- shared fields reset to their normal empty/default values
- the recurring checkbox resets to unchecked
- recurring-only fields reset to their defaults

Resetting back to non-recurring mode is intentional so a user can safely add a normal expense next without accidentally leaving the form in recurring mode.

## Screen Layout

### Remove Separate Creation Panel

The standalone recurring-expense creation card should be removed from the expenses screen.

The separate recurring-rules list should remain. It still provides useful visibility into saved recurring rules, and it does not conflict with the new inline creation approach.

### Keep Existing Recurring Read Surfaces

The following existing recurring-related read surfaces remain:

- recurring rules list
- recurring-generated badge on generated expenses
- generated-expense detail text linking an expense back to its recurring rule

These surfaces are still useful after the UI change because they help users understand what has already been scheduled or generated.

## Technical Design

### Expenses Screen State

The expense-creation path in `frontend/src/screens/ExpensesScreen.tsx` should become the single source of truth for both one-off and recurring creation.

Add a boolean state flag for whether the current form is in recurring mode.

The recurring-only inputs should be rendered conditionally based on that flag, while shared fields continue to use the existing expense form state where possible.

The current separate recurring-creation state should be removed or collapsed into the main form path where it would otherwise duplicate data that already exists in the regular expense form.

### Submission Flow

The submit handler for the existing expense form should branch by mode:

- if recurring mode is off, call the existing one-off expense creation path
- if recurring mode is on, validate recurring fields and call the recurring-expense creation path

The existing helper layer in `frontend/src/lib/recurring-expenses.ts` should continue to own recurring validation and payload normalization. The screen should reuse those helpers instead of introducing a second validation implementation.

### Localization

`frontend/i18n/messages.ts` should be updated with copy for the inline recurring checkbox and any wording changes caused by collapsing the two creation surfaces into one.

The wording should make it obvious that recurrence is an option on the current expense form, not a separate destination.

## Error Handling

Validation rules should remain mode-aware:

- one-off mode should only validate the normal expense requirements
- recurring mode should additionally validate start date, interval count, and interval unit

If recurring mode is enabled and validation fails, the first relevant recurring validation error should be surfaced using the same alert-driven pattern already used elsewhere on the screen.

Load failures for the recurring-rules list remain independent from one-off expense loading and should continue using the existing dedicated failure state and retry affordance.

## Testing Scope

Frontend tests should cover:

- normal one-off expense creation still works when recurring mode is off
- enabling the recurring checkbox reveals the recurring-only fields
- submitting in recurring mode calls recurring-expense creation from the shared form
- successful recurring submission resets the checkbox back to unchecked
- the old separate recurring creation panel is no longer rendered

Existing recurring list and generated-expense rendering coverage should remain valid, with adjustments only where selectors or structure change.

## Out of Scope

This spec does not add:

- edit or pause controls for recurring rules
- "create recurring rule and immediate expense" combined behavior
- a second dedicated recurring setup flow
- backend recurrence logic changes beyond what is already required by the current feature

## Implementation Notes

- Preserve the recurring-rules list beneath the creation area.
- Favor minimal state duplication in the screen component.
- Prefer the existing shared visual language of the expense form over introducing new panels, sections, or navigation patterns.
