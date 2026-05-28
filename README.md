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
- Der Frontend-Build nutzt als PocketBase-Basis die Origin `/`, und der Browser spricht dann gegen `/api`, das im Nginx-Container an PocketBase weitergeleitet wird.
- Wenn du bestehende lokale Daten mitnehmen willst, kopiere `backend/pocketbase/pb_data` auf den Pi.

## Oeffentliche Domain mit Cloudflare Tunnel

Wenn du die App von aussen erreichbar machen willst, ist Cloudflare Tunnel der deutlich einfachere Weg bei DS-Lite:

1. Domain zu Cloudflare umziehen

   - Lege deine Domain in Cloudflare als Zone an.
   - Aendere die Nameserver bei Porkbun auf die von Cloudflare zugewiesenen Nameserver.
   - Cloudflare dokumentiert, dass fuer die Nutzung der DNS- und Tunnel-Funktionen die Domain als Cloudflare-Zone aktiv sein muss.

2. Tunnel in Cloudflare anlegen

   - Gehe in Cloudflare Zero Trust zu `Networks > Tunnels`.
   - Erstelle einen neuen Tunnel.
   - Waehl `Cloudflared`.
   - Kopiere den Tunnel-Token aus der Cloudflare-Konfiguration.

3. Public-Konfig anlegen

   - Leite den Hostname `othello-cloud.de` in Cloudflare auf `http://localhost:80`.
   - Optional kannst du `www.othello-cloud.de` ebenfalls auf denselben Service zeigen lassen.

4. Stack starten

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d
   ```

5. Portfreigaben

   - Keine FRITZ!Box-Portfreigaben fuer den oeffentlichen Zugriff noetig.
   - `cloudflared` baut nur ausgehende Verbindungen zu Cloudflare auf.
   - Deine lokalen Ports `8081` und `8090` bleiben weiterhin fuer LAN- oder Debug-Zugriff nutzbar.

6. Erreichbarkeit testen

   - `https://othello-cloud.de`

Wichtig:

- Der Tunnel laeuft outbound-only, also ohne eingehende Ports auf deinem Anschluss.
- Caddy laeuft intern nur als Reverse Proxy zwischen `frontend` und `pocketbase`.
- Cloudflare Tunnel zeigt auf `http://localhost:80`, also auf den Caddy-Port auf dem Pi.
- Die eigentliche TLS-Beendigung passiert bei Cloudflare.

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
