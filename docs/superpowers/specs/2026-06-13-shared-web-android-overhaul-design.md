# Shared Web + Android Overhaul Design

**Date:** 2026-06-13

**Goal**

Overhaul the `frontend/` app so OthelloCloud remains a single shared Expo codebase with one backend and one feature set, while delivering a first-class web experience and a polished native-feeling Android experience at the same time.

## Product Direction

The product will continue to use:

- one shared backend (PocketBase)
- one shared feature set across platforms
- one shared Expo / React Native client codebase

The overhaul will not create a separate Android-only client or a separate web-only frontend. Instead, it will introduce a platform-aware presentation layer so both surfaces can feel intentional without drifting in capability or backend behavior.

## Scope

### In Scope

- establish a shared cross-platform app shell for web and Android
- improve navigation, headers, spacing, and action placement across the app
- reduce web-only framing assumptions in shared screen components
- lightly refit every major screen into the new shell in phase 1
- create cleaner boundaries for oversized screens, especially calendar and expenses
- preserve the shared backend contract and existing feature parity
- keep current tests working and add focused coverage where logic is extracted

### Out of Scope

- splitting the app into separate platform repositories
- changing the backend architecture
- inventing new major features unrelated to the overhaul
- broad unrelated refactors outside the screens and shared UI layers touched by this work

## Current-State Observations

The current app already has the correct strategic base for a shared web + Android product:

- Expo and React Native are already in place in `frontend/`
- business logic is mostly centralized in `frontend/src/lib/`
- the app already serves multiple major product areas from one codebase

The main issues are structural and UX-oriented:

- `frontend/components/app-screen.tsx` behaves like a web-oriented page wrapper that all screens inherit
- several screens are too large and mix layout, state, domain logic, and dialogs in one file
- responsive behavior tends to scale a web layout down, instead of giving Android a mobile-first experience
- shared interaction patterns are not formalized, which makes screens inconsistent

The largest risk areas today are:

- `frontend/src/screens/ExpensesScreen.tsx`
- `frontend/src/screens/CalendarScreen.tsx`

These screens are functional, but they are too broad to safely evolve quickly without stronger component boundaries.

## Desired Experience

### Shared Product Principles

- same account, same households, same data, same core features on web and Android
- no platform should become a second-class client
- behavior and domain rules stay shared unless a platform difference is clearly required
- presentation can adapt by platform without changing product meaning

### Android Experience

Android should feel mobile-first and native-leaning:

- tighter vertical rhythm
- clearer touch targets and action hierarchy
- screen structures that favor focused flows over wide dashboards
- platform-aware action placement such as sticky footer actions or FAB-style entry points where appropriate
- dialog and picker behavior that feels less like a desktop web modal stack

### Web Experience

Web should feel intentional rather than like a stretched mobile layout:

- better use of width for overview cards and split layouts
- stronger information density where desktop space helps
- cleaner page framing and section hierarchy
- preserved feature parity with Android even where layout differs

## Architecture Direction

### 1. Shared App Shell

Replace the current one-size-fits-all screen framing approach with a platform-aware shell layer.

This shell should be responsible for:

- safe area handling
- shared page title and header behavior
- content width and spacing rules
- primary and secondary action placement
- platform-specific framing rules for web and Android

The shell should support at least two presentation modes:

- mobile-first screen scaffold for Android
- desktop-aware page scaffold for web

This is an adaptation layer, not a business-logic layer.

### 2. Layout Primitives

Create a small set of reusable layout primitives so screens stop defining ad hoc spacing and structural behavior.

Examples include:

- page stack
- section group
- split panel row
- action bar
- empty/loading/error state containers
- card/list wrappers with consistent padding rules

These should be intentionally minimal. The goal is consistency and easier migration, not a large design-system rewrite.

### 3. Screen Decomposition

Oversized screens should be broken into focused parts:

- screen container
- data-loading and orchestration layer
- feature sections/panels
- reusable dialogs/forms/pickers

Priority screens for deeper decomposition:

- `frontend/src/screens/ExpensesScreen.tsx`
- `frontend/src/screens/CalendarScreen.tsx`

Likely lighter migration targets:

- `HomeScreen`
- `ShoppingListScreen`
- `PollsScreen`
- `ProfileScreen`
- `HouseholdSetupScreen`
- `LoginScreen`

### 4. Shared Domain Logic Preservation

Existing shared business logic in `frontend/src/lib/` should remain the source of truth where possible.

The overhaul should avoid moving domain rules into UI components. If new UI extraction creates repeated screen-state logic, that logic should go into focused hooks or small controller modules rather than back into large screen files.

### 5. Navigation Strategy

Navigation remains shared, but presentation becomes more platform-aware.

Expected direction:

- preserve tab-based navigation for core product areas
- improve tab styling and spacing for Android
- improve hidden/settings entry behavior so global account actions feel deliberate
- normalize top-of-screen actions and contextual actions inside the shell

The intent is to improve clarity, not to replace the app with entirely different navigation models per platform.

## Rollout Plan

### Phase 1: Foundation + Full-App Pass

Deliver a coherent app-wide refresh by:

- creating the new app shell and layout primitives
- updating navigation presentation to match the new shell
- migrating every major screen into the new structure
- making light but real UX improvements on every screen

This phase optimizes for consistency across the whole product.

### Phase 2: Complex Screen Deepening

Once the app-wide shell is in place, do a deeper second pass on the most complex screens:

- expenses
- calendar

This phase focuses on:

- extracting dialogs and form flows
- improving screen readability
- reducing local complexity
- making future feature additions safer

### Phase 3: Refinement and Regression Hardening

Follow with:

- platform polish fixes
- test coverage improvements where new boundaries were introduced
- manual QA notes for web and Android regressions

## Quality Bar

The overhaul is successful when:

- web and Android still use the same backend and feature set
- major screens no longer depend on a web-shaped wrapper for their structure
- the app feels intentional on both platforms
- Android interactions feel mobile-first without creating product drift
- web layouts make better use of desktop space
- the most complex screens are easier to reason about and safer to modify

## Testing Strategy

Testing should stay practical and aligned with the current stack.

Required verification:

- existing Jest tests continue to pass
- new focused tests are added when logic is extracted into hooks/helpers
- manual verification on Expo web
- manual verification on Android via Expo

Manual checks should cover:

- login and household entry
- tab navigation
- home screen actions
- shopping flows
- expenses flows
- calendar flows
- polls and settings/profile paths

## Risks

### Risk: Cosmetic-only rewrite

If the work focuses only on visuals, large screens will remain slow and risky to change.

Mitigation:

- require structural decomposition as part of the overhaul, especially for expenses and calendar

### Risk: Platform drift

If platform-specific conditionals spread too freely, web and Android will slowly diverge in behavior.

Mitigation:

- keep backend contracts and feature logic shared
- localize platform differences inside shell/components, not domain logic

### Risk: Overbuilding a design system

A large UI abstraction effort would slow delivery and create unnecessary maintenance.

Mitigation:

- keep primitives few, small, and directly tied to actual screen migration needs

### Risk: Regression during whole-app pass

Touching every screen increases the chance of behavioral regressions.

Mitigation:

- keep the first pass behavior-preserving
- add targeted tests for extracted logic
- verify all major flows on both web and Android

## Subagent Workstreams

The implementation plan should be written so work can be dispatched along bounded tracks:

- foundation: app shell, shared layout primitives, platform-aware wrappers
- navigation: tabs, headers, global actions, settings entry
- screen migration: home, shopping, polls, profile, login, household setup
- complex screens: expenses and calendar
- verification: tests, regression checks, QA notes

These tracks should avoid unnecessary file overlap so subagents can work with minimal coordination overhead.

## Implementation Intent

This overhaul is not a rewrite. It is a controlled restructuring of the shared frontend so the same product can ship well on the web and on Android.

The key decision is to invest first in shared UI foundations and then migrate screens onto them, rather than styling each screen independently. That approach best supports the stated goal: one backend, one feature set, one shared app, two polished surfaces.
