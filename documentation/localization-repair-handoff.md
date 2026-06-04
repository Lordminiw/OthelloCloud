# Localization Repair Handoff

## Goal

Finish English/German localization on the `dev` branch, especially:

- `frontend/src/screens/CalendarScreen.tsx`
- `frontend/src/screens/ExpensesScreen.tsx`

The language selector and shared localization foundation already exist. The immediate priority is restoring a compiling frontend before completing any remaining translations.

## Current State

The localization foundation is already present:

- `frontend/context/language-context.tsx`
- `frontend/components/language-selector.tsx`
- `frontend/constants/navigation.ts`
- `frontend/i18n/messages.ts`
- `frontend/components/app-screen.tsx`
- `frontend/App.tsx`

The selected language is intended to persist locally and update the visible UI immediately.

`ExpensesScreen.tsx` is mostly localized and has English/German labels, headings, dialogs, buttons, and validation alerts.

`CalendarScreen.tsx` is currently in a partially edited and syntactically broken state. Do not treat its current implementation as a good localization example.

## Important Safety Notes

- Do not reset or revert the whole branch. There are many localization changes in other files that should remain.
- Do not use broad PowerShell string replacements on source files. Earlier broad replacements introduced malformed nested strings.
- Use small `apply_patch` edits and run TypeScript checks frequently.
- Do not edit Docker or deployment files as part of this repair.

## Known Calendar Problems

The frontend currently fails TypeScript parsing because `CalendarScreen.tsx` contains malformed localization expressions and template strings.

Examples of patterns that must be removed:

```tsx
isGerman ? "{isGerman ? "Text" : "Text"}" : "Text"
```

```tsx
label="{isGerman ? "Titel" : "Title"}"
```

```tsx
`{isGerman ? "gleicher Tag" : "same day"} (...)`
```

Correct forms:

```tsx
isGerman ? "Text" : "Text"
```

```tsx
label={isGerman ? "Titel" : "Title"}
```

```tsx
`${isGerman ? "gleicher Tag" : "same day"} (...)`
```

Some mojibake may also remain, such as:

- `fÃ¼r`
- `zurÃ¼cksetzen`
- `auswÃ¤hlen`
- `SchlieÃŸen`
- `â€“`
- `â– `

Replace these with the intended Unicode text or an ASCII equivalent where appropriate.

## Recommended Repair Strategy

### 1. Inspect Before Editing

Run:

```powershell
git status --short
rg -n '"\{isGerman|formatDateKeyGerman|Ã|Bitte \{isGerman' frontend/src/screens/CalendarScreen.tsx
```

Read the Calendar sections around:

- event creation and editing validation
- participation response summary
- selected-event and upcoming-event descriptions
- agenda cards
- create/edit dialogs
- end-date picker dialogs
- color configuration dialog

### 2. Restore Calendar Syntax

Repair malformed expressions in small groups.

Start with the earliest TypeScript error and rerun typecheck after each group:

```powershell
cd frontend
npx tsc --noEmit
```

The first reported syntax error is usually the most useful because later errors may be cascading parser failures.

Expected areas requiring repair:

- validation alerts around `addEvent` and `saveEditedEvent`
- response-summary labels
- response-status labels
- upcoming-event description template
- agenda title/subtitle
- create/edit dialog labels
- same-day/end-date text
- color configuration dialog

### 3. Finish Locale-Aware Calendar Dates

The intended formatter is:

```ts
function formatDateKey(dateKey: string, locale: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
```

Use:

```ts
const locale = isGerman ? "de-DE" : "en-US";
```

All former `formatDateKeyGerman(...)` calls should become `formatDateKey(..., locale)`.

### 4. Verify Expenses

`ExpensesScreen.tsx` should remain compiling and should use `isGerman` for:

- screen and browser titles
- form labels
- buttons
- empty states
- dialogs
- validation alerts

Search for untranslated German-only strings:

```powershell
rg -n 'Bitte |Ausgabe|Ausgaben|Betrag|Beschreibung|Bezahlt|Zahlung|Ausgleich|Löschen|Bearbeiten|Abbrechen|Speichern' frontend/src/screens/ExpensesScreen.tsx
```

German text is acceptable only when it is inside an `isGerman ? ... : ...` expression.

### 5. Final Verification

Run:

```powershell
cd frontend
npx tsc --noEmit
```

Then manually verify both languages:

1. Select English.
2. Open Calendar and confirm all headings, dialogs, empty states, buttons, validation messages, and dates are English.
3. Open Expenses and confirm all headings, dialogs, empty states, buttons, and validation messages are English.
4. Select German and confirm both screens switch immediately.
5. Reload and confirm the selected language persists.

## Current Verification Result

At the time this handoff was written:

```powershell
npx tsc --noEmit
```

fails with multiple parser errors in `frontend/src/screens/CalendarScreen.tsx`.

Do not consider the task complete until the typecheck passes.

## Completion Criteria

- `npx tsc --noEmit` passes.
- Calendar is fully usable in English and German.
- Expenses is fully usable in English and German.
- Calendar dates follow the selected locale.
- Language selection persists after reload.
- No unrelated branch changes are reverted.
