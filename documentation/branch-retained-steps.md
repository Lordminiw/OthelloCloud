# Branch Retained Steps

This document captures the changes that still exist in the current client-focused branch after the cleanup passes.

## Scope

The branch was reduced from a full WG app into a thin OthelloCloud client wrapper. The items below are the changes that were kept and are still present in the branch after the removals.

## Kept Changes

1. Replaced the old multi-screen WG app entrypoint with a thin client shell in `frontend/App.tsx`.
2. Embedded the target frontend inside the native app using `react-native-webview`.
3. Kept the web build as a lightweight iframe-based wrapper for the frontend URL.
4. Added a guard so the web shell does not try to embed itself when the target URL shares the same origin.
5. Added `react-native-webview` to the frontend dependency set so the APK can render the frontend in-app.
6. Kept the app branding updates, including the `OthelloCloud` favicon in `frontend/app.json`.
7. Updated the root `README.md` and `frontend/README.md` so they describe the repo as a thin client wrapper instead of a WG backend app.

## Removed Changes That Do Not Remain

The following parts were removed from the branch during cleanup and are not part of the retained client shell:

- Docker and deployment compose files
- Cloudflare tunnel and public deployment config
- the old PocketBase/WG feature screens
- the old component tree that powered the multi-feature app
- the old PocketBase data-layer helper modules

## Current Behavior

- Web build: embeds the configured frontend URL in an iframe
- Native APK: shows the frontend inside the app using a WebView
- Target frontend URL: controlled by `EXPO_PUBLIC_APP_URL`

## Notes

The retained branch is intentionally minimal. It exists to launch or embed the OthelloCloud frontend, not to host the old WG application stack.
