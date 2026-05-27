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
- `backend/pocketbase/` - mitgelieferte PocketBase-Installation und deren Lizenzhinweis

## Tech Stack

- Expo / React Native
- Expo Router
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

### Projektlizenz

Fuer dieses Repository ist aktuell keine top-level `LICENSE`-Datei hinterlegt. Wenn du das Projekt oeffentlich oder mit Dritten teilen willst, solltest du dafuer noch eine klare Repo-Lizenz festlegen.

### Mitgelieferte Lizenzhinweise

- `backend/pocketbase/LICENSE.md` - MIT License fuer die mitgelieferte PocketBase-Komponente

### Verwendete Kern-Abhaengigkeiten

Die folgenden direkten Dependencies sind im Frontend aktiv und stammen aus externen Projekten. Die meisten davon sind MIT-lizenziert; fuer die exakte Upstream-Lizenz sollte im Zweifel die jeweilige Paketdokumentation oder ein automatischer License-Scan verwendet werden.

- `expo` - MIT
- `expo-constants` - MIT
- `expo-font` - MIT
- `expo-haptics` - MIT
- `expo-image` - MIT
- `expo-linking` - MIT
- `expo-router` - MIT
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

### Hinweis zu Transitiv-Abhaengigkeiten

Abhaengigkeiten der zweiten Ebene bringen ihre eigenen Lizenztexte mit. Wenn du spaeter eine vollstaendige, maschinenlesbare Lizenzliste brauchst, ist ein automatischer Lizenz-Scan im `frontend/`-Ordner der sauberste Weg.

## AI Usage

Dieses Projekt wurde mit Unterstuetzung von KI-Tools entwickelt, unter anderem fuer:

- Formulierung und Ueberarbeitung von Dokumentation
- Refactoring und Strukturierung von React-/TypeScript-Code
- Ideenfindung fuer Features und UX-Verbesserungen

Alle Aenderungen sollten vor dem Merge immer menschlich geprueft werden. KI wurde als Assistenz verwendet, nicht als alleinige fachliche Quelle.

## Status

Die App ist funktional als MVP, aber noch nicht vollstaendig ausgebaut. Die naechsten sichtbaren Verbesserungen liegen vor allem bei Mitgliederverwaltung, Einladungen, Ausgaben-Auswertung und Benachrichtigungen.
