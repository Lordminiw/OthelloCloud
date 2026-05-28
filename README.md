# OthelloCloud

OthelloCloud ist eine WG-App fuer gemeinsame Organisation im Alltag. Der aktuelle Fokus liegt auf Einkaufsliste, Ausgaben, Kalender und Konto-/WG-Verwaltung.

## Was die App kann

- gemeinsame Einkaufsliste
- gemeinsame Ausgaben mit Split-Logik
- gemeinsamer Kalender fuer Termine
- Login, Registrierung und WG-Beitritt per Invite-Code
- mehrere WGs pro Account

## Projektstruktur

- `frontend/` - Expo App mit der eigentlichen Benutzeroberflaeche

## Tech Stack

- Expo / React Native
- React Navigation
- React Native Paper
- PocketBase als Backend

## Lokal starten

1. Abhaengigkeiten installieren

   ```bash
   cd frontend
   npm install
   ```

2. Umgebung setzen

   Lege in `frontend/.env` die Backend-URL an:

   ```bash
   EXPO_PUBLIC_POCKETBASE_URL=https://dein-pocketbase-server.example
   ```

3. App starten

   ```bash
   npm run start
   ```

   Fuer Web:

   ```bash
   npm run web
   ```

## Android-App bauen

Das Frontend ist als Expo-App fuer Android vorbereitet. Die Android-App heisst `OthelloCloud`, nutzt die Package-ID `de.othellocloud.app` und speichert die PocketBase-Anmeldung dauerhaft auf dem Geraet.

1. Backend-URL in `frontend/.env` setzen:

   ```bash
   EXPO_PUBLIC_POCKETBASE_URL=https://example.com/api
   ```

2. Auf Android testen:

   ```bash
   cd frontend
   npm run android
   ```

3. Installierbare APK bauen:

   ```bash
   npm run android:apk
   ```

4. Play-Store-Bundle bauen:

   ```bash
   npm run android:aab
   ```

Die Build-Skripte ueberspringen den optionalen lokalen EAS-Fingerprint-Schritt, weil dieser auf Windows vor dem eigentlichen Build abbrechen kann.

## Wichtige Datenmodelle

Die App arbeitet aktuell mit diesen PocketBase-Collections:

- `users`
- `households`
- `household_members`
- `shopping_items`
- `expenses`
- `settlements`
- `calendar_events`

## Roadmap

1. Mitgliederverwaltung
2. Einkaufsliste verbessern
3. Ausgaben-Ansicht erweitern
4. Kalender-Verbesserungen

## Lizenzen und Drittanbieter

### Verwendete Kern-Abhaengigkeiten

Die folgenden direkten Dependencies sind im Frontend aktiv und stammen aus externen Projekten. Die meisten davon sind MIT-lizenziert; fuer die exakte Upstream-Lizenz sollte im Zweifel die jeweilige Paketdokumentation oder ein automatischer License-Scan verwendet werden.

- `expo` - MIT
- `expo-constants` - MIT
- `expo-font` - MIT
- `expo-haptics` - MIT
- `expo-image` - MIT
- `expo-linking` - MIT
- `expo-splash-screen` - MIT
- `expo-status-bar` - MIT
- `expo-symbols` - MIT
- `expo-system-ui` - MIT
- `expo-web-browser` - MIT
- `@expo/vector-icons` - MIT
- `@react-navigation/native` - MIT
- `@react-navigation/bottom-tabs` - MIT
- `@react-navigation/elements` - MIT
- `react` - MIT
- `react-dom` - MIT
- `react-native` - MIT
- `react-native-web` - MIT
- `react-native-gesture-handler` - MIT
- `react-native-screens` - MIT
- `react-native-safe-area-context` - MIT
- `react-native-reanimated` - MIT
- `react-native-worklets` - MIT
- `react-native-paper` - MIT
- `react-native-calendars` - MIT
- `pocketbase` - MIT
- `@types/react` - MIT
- `eslint` - MIT
- `eslint-config-expo` - MIT
- `typescript` - Apache-2.0
- `node` - MIT

## AI Usage

Dieses Projekt wurde mit Unterstuetzung von KI-Tools entwickelt, unter anderem fuer:

- Formulierung und Ueberarbeitung von Dokumentation
- Refactoring und Strukturierung von React-/TypeScript-Code
- Ideenfindung fuer Features und UX-Verbesserungen

Alle Aenderungen sollten vor dem Merge immer menschlich geprueft werden. KI wurde als Assistenz verwendet, nicht als alleinige fachliche Quelle.

## Status

Die App ist funktional als MVP, aber noch nicht vollstaendig ausgebaut. Die naechsten sichtbaren Verbesserungen liegen vor allem bei Mitgliederverwaltung, Einladungen, Ausgaben-Auswertung und Benachrichtigungen.
