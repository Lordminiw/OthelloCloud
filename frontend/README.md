# OthelloCloud Client

This package is a thin Expo wrapper around the OthelloCloud frontend URL.

## Run

```bash
npm install
npm run web
```

Set the target frontend with:

```bash
EXPO_PUBLIC_APP_URL=https://your-frontend.example
```

The web build embeds the target URL in an iframe, and the native APK uses an in-app WebView.
