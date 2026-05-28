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

## Docker auf dem Raspberry Pi

Wenn auf deinem Raspberry Pi Docker bereits installiert ist, kannst du den kompletten Stack direkt starten:

```bash
docker compose up --build -d
```

Danach erreichst du die App im Browser unter:

- `http://gprodder-docker:8081`
- oder alternativ über die IP des Raspberry Pi

PocketBase läuft im selben Compose-Setup unter:

- `http://gprodder-docker:8090/_/`

Wichtig:
- Das Frontend wird als statische Web-App gebaut und per Nginx ausgeliefert.
- PocketBase wird im Container auf `0.0.0.0:8090` gestartet.
- Die Migrations werden als Read-only-Volume aus `backend/pocketbase/pb_migrations` eingebunden.
- Der Browser spricht intern gegen `/api`, das im Nginx-Container an PocketBase weitergeleitet wird.
- Wenn du bestehende lokale Daten mitnehmen willst, kopiere `backend/pocketbase/pb_data` auf den Pi.

## Oeffentliche Domain mit Porkbun und FRITZ!Box

Wenn du die App von aussen erreichbar machen willst, kannst du den zusatzlichen Public-Stack nutzen:

1. Porkbun API vorbereiten

   - Erzeuge in Porkbun einen `API Key` und `Secret Key`.
   - Aktiviere fuer deine Domain unter `API Access` die API-Nutzung.
   - Trage die Werte spaeter in `deploy/public/.env` als `PORKBUN_API_KEY` und `PORKBUN_API_SECRET_KEY` ein.

2. Public-Konfig anlegen

   - Kopiere `deploy/public/.env.example` nach `deploy/public/.env` und trage deine Domain ein.
   - Kopiere `deploy/public/ddns-updater/data/config.json.example` nach `deploy/public/ddns-updater/data/config.json`.
   - Ersetze die Platzhalter durch deine echten Porkbun API-Daten.
   - Als Ziel-IP brauchst du die globale IPv6 deines Pi, bei dir ist das die `2001:...`-Adresse aus `ip -6 addr`.
   - Die `fd...`-Adresse ist nur intern, `fe80...` ist nur Link-Local und nicht fuer das Internet.
   - Caddy nutzt die Porkbun-API fuer die DNS-01-Zertifikatsausstellung.

3. Public-Stack starten

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.public.yml up -d
   ```

4. FRITZ!Box Portfreigaben setzen

   - Leite extern mindestens `443` auf den Raspberry Pi weiter.
   - `80` ist fuer Zertifikate via DNS-01 nicht mehr noetig, kann aber fuer HTTP-Weiterleitungen offen bleiben.
   - `8090` bleibt intern und wird nicht nach aussen freigegeben.

5. Erreichbarkeit testen

   - `https://deinedomain.tld`
   - `https://www.deinedomain.tld` falls du `www` mitkonfiguriert hast

Wichtig:

- Caddy holt automatisch ein TLS-Zertifikat.
- Caddy holt das Zertifikat per DNS-01 ueber Porkbun, daher ist kein eingehender HTTP-01- oder TLS-ALPN-Check mehr noetig.
- `ddns-updater` aktualisiert deine Porkbun-DNS-Eintraege automatisch bei IP-Wechsel.
- Die lokalen Ports `8081` und `8090` bleiben weiterhin fuer LAN- oder Debug-Zugriff nutzbar.

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
