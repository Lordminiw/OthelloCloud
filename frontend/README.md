# OthelloCloud Frontend

This is the Expo frontend for OthelloCloud.

## Start locally

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm run start
   ```

3. Open the web build if needed

   ```bash
   npm run web
   ```

## Navigation

The app uses React Navigation for in-app navigation. Main screens live in `src/screens/`.

## Android app

The Expo project is configured as the Android app `de.othellocloud.app`.

1. Set the backend URL in `.env`:

   ```bash
   EXPO_PUBLIC_POCKETBASE_URL=https://othello-cloud.de/api
   ```

2. Test on a connected Android device or emulator:

   ```bash
   npm run android
   ```

3. Build an installable APK for direct sharing:

   ```bash
   npm run android:apk
   ```

4. Build a Play Store-ready Android App Bundle:

   ```bash
   npm run android:aab
   ```

The native app persists the PocketBase auth token with AsyncStorage, so users stay logged in between app launches.
The EAS build scripts skip the optional local fingerprint upload because it can fail on Windows before the build is submitted.
