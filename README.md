# OthelloCloud Client

This branch is a thin Expo client for the OthelloCloud frontend.

## What it does

- Web: embeds the frontend URL in an iframe when the target is on a different origin
- Native APK: embeds the frontend in an in-app WebView

## Configure the target

Set the frontend URL before starting the app:

```bash
EXPO_PUBLIC_APP_URL=https://your-frontend.example
```

If the app is hosted on the same origin as the target URL, the web build will show a notice instead of embedding itself.

## Run locally

```bash
cd frontend
npm install
npm run web
```

Or:

```bash
npm run start
```

## Notes

- The web favicon uses `frontend/assets/images/OthelloCloud.png`
- The app title is `OthelloCloud`
- This branch intentionally does not include the old Docker, PocketBase, or deployment stack
