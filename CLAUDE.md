# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

OthelloCloud is a shared-flat (WG) household app with a shopping list, expenses with split logic, a calendar, polls, and multi-household membership via invite codes. It has an Expo / React Native frontend (web is the main target) and a PocketBase backend.

The `app` branch is a different codebase: a thin WebView/iframe wrapper. Don't merge between `app` and `main`.

Branch roles (`documentation/development.md`): `main` is the stable, deployed Docker version. Feature work happens on `dev` or `codex/*` branches and is merged into `main` when ready.

## Commands

Frontend, from `frontend/`:

```bash
npm install
npm run web                                  # Expo web dev server
npm run lint
npx tsc --noEmit                             # required before merging to main
npm test                                     # jest (jest-expo preset)
npx jest src/lib/recurring-expenses.test.ts  # single file
npx jest -t "name of test"                   # single test by name
```

The frontend needs `EXPO_PUBLIC_POCKETBASE_URL` in `frontend/.env`, for example `http://localhost:8090`. `src/lib/pocketbase.ts` throws at import time if it is missing.

The backend hook tests are plain Node tests with no PocketBase runtime:

```bash
node --test backend/pocketbase/pb_hooks/*.test.js   # all hook tests
node --test backend/pocketbase/pb_hooks/recurring_expense.test.js
```

Docker / deploy, from the repo root:

```bash
docker compose up --build -d                                                  # LAN: frontend :8081, PocketBase :8090
docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d   # public, via Caddy :80 + Cloudflare Tunnel
./update-othello-cloud.sh                                                     # production redeploy (requires clean main)
```

## Architecture

### Frontend (`frontend/`)

- **Entry**: `App.tsx` nests the providers `ThemeProvider` → `LanguageProvider` → `HouseholdProvider` → `SessionActionsProvider` and gates the UI on auth state: `LoginScreen`, then `HouseholdSetupScreen` (if the user has no household), then `MainTabs`.
  - Deep links: `?tab=`, a path segment, `?poll=` or `?invite=CODE` choose the initial tab and prefill an invite code. Parsing is done by `resolveTabKey` in `constants/navigation.ts`, which also accepts German aliases (e.g. `einkauf`, `kalender`).
- **Screens**: `src/screens/*Screen.tsx`. `MainTabs` renders one tab per feature and passes `householdId={activeHousehold.id}` into each screen.
- **Data layer**: `src/lib/*.ts` has one module per domain (expenses, calendar, polls, household, members, recurring-expenses, calendar-subscriptions/export, home-dashboard). These modules call the shared `pb` client from `src/lib/pocketbase.ts` directly. There is no separate state library: screens call these functions and keep the results in local state.
  - Use `buildPocketBaseUrl()` for custom endpoints. It resolves relative paths against `window.location.origin` on web, because in Docker the PocketBase URL is `/`.
- **Contexts** (`context/`): `household-context` loads the user's memberships and households and stores the active household ID in `localStorage` (`active-household-id`). `language-context` and `theme-context` persist to `localStorage` on web and AsyncStorage on native.
- **i18n**: `i18n/messages.ts` has a typed `TranslationTree` for `en` and `de`. All UI text goes through `t("dot.path", args)`, so new strings must be added for both languages.
- **UI**: React Native Paper (MD3) themes and React Navigation themes are both defined in `App.tsx`.
- **Tests**: `jest.setup.ts` mocks `./src/lib/pocketbase` globally, with an authed `user-1` and a `collection: jest.fn()`. Tests stub `pb.collection(...)` per case. Screen tests live in `src/screens/__tests__/` and component tests in `components/__tests__/`.

### Backend (`backend/pocketbase/`)

- PocketBase 0.38 runs in Docker (`Dockerfile`). `pb_migrations/` and `pb_hooks/` are mounted read-only and `pb_data/` holds the runtime data.
- **Hooks follow a split pattern.** `X.pb.js` registers the PocketBase JSVM handlers (`routerAdd`, `cronAdd`, `onRecord*Request`). The pure logic lives in `X.js`, which the handler loads inside its own body with `require(__hooks + "/X.js")`, since JSVM handlers don't share top-level scope. `X.test.js` tests `X.js` with `node:test` and fake records. Keep `X.js` free of PocketBase globals so it stays testable in Node.
  - `recurring_expense` runs a per-minute cron that materializes due expenses (with a catch-up limit) and validates templates and members on create/update.
  - `calendar_subscription` handles ICS URL subscriptions and file upload import (`/api/calendar-imports/upload`, `/api/calendar-subscriptions/{id}/sync`).
  - `calendar_export` provides token-based ICS feeds (`/api/calendar-export/{token}`, plus token rotation).
- **Migrations are gitignored by default.** `.gitignore` ignores `pb_migrations/*` and re-includes specific files. A new migration must also get a `!backend/pocketbase/pb_migrations/<file>` line in `.gitignore`, or it won't be committed.
- Collections: `users`, `households`, `household_members`, `shopping_items`, `expenses`, `settlements`, `calendar_events`, `polls`, recurring expenses, and calendar subscriptions/export.

### Deployment

- `frontend/Dockerfile` runs `expo export --platform web` with `EXPO_PUBLIC_POCKETBASE_URL=/` and serves the result with nginx. nginx proxies `/api/` to `pocketbase:8090` and has an SPA fallback.
- The public setup adds Caddy on `:80` (`/api/*` → PocketBase, everything else → frontend), exposed through Cloudflare Tunnel at `othello-cloud.de`. TLS terminates at Cloudflare. The host is a Raspberry Pi.

## Workflow conventions

- Features get a spec at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and a plan at `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` before implementation.
- The user-facing README and docs are in German. Code and identifiers are in English.
