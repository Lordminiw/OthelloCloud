# Localization Plan for OthelloCloud Client

## Goal
Add lightweight localization to the client shell so users can switch between English and German from a compact selector in the top-right app header.

## What We Are Keeping
- English and German as the first supported languages.
- A single shared language state for the whole client.
- Local persistence so the selected language survives reloads and app restarts.
- A small selector in the app header so users can change language from any main screen.

## Implementation Steps
1. Add a shared localization module with translation strings for English and German.
2. Add a language context/provider that exposes the active language, a setter, and a translation helper.
3. Persist the chosen language locally on web and native.
4. Render a compact language selector in the top-right header area of the app.
5. Replace hardcoded visible strings in the main client screens with localized text.
6. Keep the routing and tab keys stable so language changes do not break navigation.
7. Localize browser/tab titles so they stay readable in both languages.
8. Localize the calendar locale formatting so dates and times match the selected language.
9. Run a typecheck and verify the app still builds cleanly after the migration.

## Files That Matter
- `frontend/context/language-context.tsx`
- `frontend/components/language-selector.tsx`
- `frontend/components/app-screen.tsx`
- `frontend/constants/navigation.ts`
- `frontend/i18n/messages.ts`
- `frontend/App.tsx`
- `frontend/src/screens/LoginScreen.tsx`
- `frontend/src/screens/HouseholdSetupScreen.tsx`
- `frontend/src/screens/MainTabs.tsx`
- `frontend/src/screens/ShoppingListScreen.tsx`
- `frontend/src/screens/ExpensesScreen.tsx`
- `frontend/src/screens/CalendarScreen.tsx`
- `frontend/src/screens/PollsScreen.tsx`
- `frontend/src/screens/ProfileScreen.tsx`

## Current Status
- Localization plumbing is in place.
- The header language selector is implemented.
- The active language is persisted locally.
- The main navigation tabs use stable keys.
- Several key screens are already translated.
- Remaining visible strings can be localized incrementally without changing the backend.

## Notes For Future Work
- If more languages are needed later, extend the translation map and selector list.
- Keep new visible strings behind translation keys or explicit locale branches.
- Prefer small, incremental screen migrations over a single large rewrite.
