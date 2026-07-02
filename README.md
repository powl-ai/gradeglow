# GradeGlow

GradeGlow ist eine Next.js/TypeScript/Tailwind-Web-App für Studienfortschritt, Notenschnitt, ECTS, Prüfungen und Lernplanung.

## Aktueller Funktionsstand

- Firebase Authentication
  - E-Mail/Passwort
  - Google Login
  - GitHub Login
  - Apple Login als deaktivierter „bald verfügbar“-Button
- Firestore Cloud-Sync pro Account
- Module als einzelne Firestore-Dokumente unter `users/{userId}/modules/{moduleId}`
- Profil/Settings unter `users/{userId}/gradeglow/settings`
- Prüfungsplaner unter `users/{userId}/exams/{examId}`
- lokaler Fallback über `localStorage`
- PWA mit Manifest, Service Worker, Offline-Fallback, Install-Button und App-Icons
- Dashboard mit kompakter Navigation, Semester-Gruppierung, Diagrammen, Zielnotenrechner und Backup Export/Import
- Einzelleistungen direkt auf der Modulkarte sichtbar; Bearbeitung weiterhin ausklappbar
- StuPo-Import, Versuchsübersicht, Semesterplanung und Plan-Auslastung als ausklappbare Bereiche
- lokaler KI-Lernplan-Generator für Prüfungsvorbereitung
- Monats-/Wochenkalender im Prüfungen-Reiter mit Prüfungstagen, Countdowns und Lernblock-Empfehlungen
- Vercel Analytics und Speed Insights eingebaut

## Entwicklung starten

```bash
npm install
npm run dev
```

Danach öffnest du:

```txt
http://localhost:3000
```

## Environment Variables

Lege im Projekt-Hauptordner eine `.env.local` an:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Für Vercel werden dieselben Werte in den Project Settings unter **Environment Variables** eingetragen.

## Firebase Setup

1. Firebase Projekt öffnen
2. Authentication aktivieren
3. Sign-in methods aktivieren:
   - Email/Password
   - Google
   - GitHub
   - Apple
4. Firestore Database erstellen
5. `firestore.rules` aus diesem Projekt in Firebase veröffentlichen

## PWA Setup

Die PWA-Dateien liegen hier:

```txt
public/sw.js
public/offline.html
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-512.png
public/icons/apple-touch-icon.png
src/app/manifest.ts
src/components/PwaInstallCard.tsx
src/components/PwaRegister.tsx
```

Der Install-Button erscheint im Dashboard. Auf iPhone/iPad wird weiterhin die Safari-Installation über Teilen → „Zum Home-Bildschirm“ genutzt.

## Vercel Analytics & Speed Insights

Analytics und Speed Insights sind im Root Layout eingebaut. Nach dem Deploy in Vercel im Projekt unter **Analytics** und **Speed Insights** aktivieren.

## Empfohlene Custom Domain

```txt
gradeglow.app
```

Die Domain kann in Vercel zusätzlich zur bestehenden `gradeglow-beryl.vercel.app` Domain hinzugefügt werden. Danach Firebase Authorized Domains und OAuth Redirects ergänzen. Details stehen in `DEPLOYMENT.md`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

Oder alles zusammen:

```bash
npm run check
```


## App-Bereiche / Routes

GradeGlow ist jetzt in eigene App-Bereiche aufgeteilt. Der Startbildschirm bleibt der Überblick unter `/`. Die weiteren Bereiche sind:

- `/modules` – Module, Zielnotenrechner und Einzelleistungen
- `/planning` – StuPo-Assistent, Semesterplanung und Versuchsübersicht
- `/exams` – Prüfungsplaner, Monats-/Wochenkalender und lokaler Lernplan
- `/insights` – Diagramme und Glow Check
- `/backup` – JSON-Backup, Import und CSV-Export
- `/settings` – Profil und Studiengang

Die Navigation ist über das Menü links oben und zusätzlich über die horizontale Bereichsleiste erreichbar.


### Mobile/PWA Layout Fix

Dieses Update enthält zusätzliche Mobile-Sicherungen gegen horizontales Überlaufen in der installierten iOS-PWA. Wichtige Änderungen: Safe-Area-Abstand für die Statusleiste, `overflow-x-hidden`, umbrechende Buttons/Texte und kompaktere Header auf kleinen Screens. Nach dem Deployment die installierte PWA einmal komplett schließen und neu öffnen, damit der Service Worker und die neue CSS-Version greifen.


### Prüfungskalender

Der Bereich `/exams` enthält jetzt zusätzlich einen Monats-/Wochenkalender. Prüfungstage werden als rote Termine angezeigt, automatisch vorgeschlagene Lernblöcke als violette Einträge. Die Ansicht zeigt außerdem die nächste Prüfung, heutige Lernblöcke und die Lernbelastung der aktuellen Woche.


## Update: Prüfungsplanung v2

- Kalender nutzt deutsche Datumsanzeige (TT.MM.JJJJ) und 24h-Uhrzeit.
- Automatischer Lernplan verteilt Blöcke mit maximal 5 Stunden Lernzeit pro Tag.
- Prüfungsseite ist nicht mehr doppelt eingeklappt, sondern zeigt Kalender und Details direkter.
- Mobile/PWA-Kalenderzellen sind kompakter und gegen horizontalen Overflow abgesichert.
- Service Worker Cache-Version: `gradeglow-v13`.

## Update: Onboarding, Lernblöcke und Datenlöschung

- Neue Accounts sehen jetzt zuerst einen Onboarding-Wizard mit Name, Hochschule, Studiengang, Abschluss, Semester, Ziel-ECTS und Startweg.
- Im Prüfungsplaner können Lernblöcke jetzt manuell ergänzt, verschoben, abgehakt, ausgeblendet und mit Notizen versehen werden.
- Pro Prüfung kann eingestellt werden, wie viele Tage vor der Prüfung der Lernplan starten soll.
- Automatisch generierte Lernblöcke beachten weiterhin ein Tageslimit von maximal 5 Stunden.
- In den Einstellungen gibt es jetzt einen Bereich „Daten & Account“ zum Löschen von App-Daten oder des Accounts.


## Beta Launch Ready

Aktueller Stand: `beta-2026-06-26-launch`. Details stehen in `BETA_LAUNCH_READY_UPDATE.md`.

## Update: Social Polish + Branding Readiness

Aktueller Stand: `beta-2026-07-02-social-branding-readiness`. Details stehen in `BETA_SOCIAL_BRANDING_READINESS_UPDATE.md`.

- Study Circle v2 wurde im Bereich „Codes & Einladungen“ klarer gegliedert.
- Circle erstellen, Circle-Code beitreten und Freundescode hinzufügen sind kompakter zusammengeführt.
- `/info` enthält jetzt eine Firebase-Auth-Mail-Branding-Checkliste für das `project-...-Team`-Problem.
- Capacitor/App-Store-Vorbereitung ist in `CAPACITOR_APP_STORE_READINESS.md` dokumentiert, aber noch nicht aktiv ausgerollt.

## Update: Onboarding & Account-Löschung Fix

Aktueller Stand: `beta-2026-07-02-onboarding-delete-fix`. Details stehen in `BETA_ONBOARDING_DELETE_FIX.md`.

- Onboarding Step 1 kann durch Enter/Return nicht mehr automatisch weitergeschaltet oder abgeschlossen werden.
- Step 2 startet ohne automatisch bestätigte Feature-Basisauswahl.
- Setup-Abschluss ist erst nach bewusster Feature-Auswahl möglich.
- Account-Löschung führt vor dem Löschen eine Firebase-Re-Authentifizierung aus.
- E-Mail/Passwort-Accounts bekommen ein Passwortfeld, Google-Accounts öffnen automatisch die Google-Bestätigung.


## Aktueller Patch

- Version: `beta-2026-07-02-pwa-readiness`
- Schwerpunkt: PWA-/Mobile-Readiness, Install-Hinweise, Service-Worker-Update-Hinweis und erweiterte Beta-Checkliste.


### Beta Test Control Center

- `/admin` enthält jetzt eine bessere Beta-Test-Zentrale.
- Feedback kann nach Typ, Status und Suche gefiltert werden.
- Admins können Status, Priorität und interne Notizen direkt in der App pflegen.
- `critical` wurde als Feedback-Priorität ergänzt.
- Diagnostics zeigt zusätzliche Kennzahlen und gruppierte Client Errors.



## Beta Launch Readiness

Neu in `beta-2026-07-02-launch-readiness`:

- `/launch` als Beta Launch Center
- Launch Score nach Produktkern, Daten/Vertrauen, Beta-Betrieb, Mobile/PWA und Store-Vorbereitung
- automatische Checks aus App-Daten
- manuelle lokal gespeicherte Launch-Checks
- kopierbarer Launch Report
- PWA-App-Shell und Manifest Shortcut für `/launch`

Siehe `BETA_LAUNCH_READINESS_UPDATE.md`.

## Beta Update 2026-07-02 – Premium/Social/Mobile

Siehe `BETA_PREMIUM_SOCIAL_MOBILE_UPDATE.md`.

- `/premium` vorbereitet Free/Beta/Plus-Grenzen ohne aktive Zahlungen.
- Study Circle Profile haben Beta-Badges und ein öffentliches Profilmodal.
- Admin Feedback kann erledigte/archivierte Meldungen wieder anzeigen.
- Mobile/PWA CSS wurde kompakter gemacht.


### Letzter Patch: Mobile Social Notifications

- App-Version: `beta-2026-07-02-mobile-social-notifications`
- Mobile/PWA-Schrift, Felder, Buttons und Karten kompakter gemacht.
- Study-Circle-Leaderboard-Einträge öffnen jetzt Profile mit Badges.
- In-App-Toast ergänzt, wenn dich jemand als Freund hinzufügt.
- Keine Firestore Rules oder Functions geändert.


## Native App / Capacitor Prep

GradeGlow ist weiterhin Vercel/PWA-first. Für eine spätere native iOS-/Android-App ist jetzt eine vorsichtige Capacitor-Vorbereitung enthalten:

- `capacitor.config.ts`
- `/native` Native App Readiness Center
- `CAPACITOR_NATIVE_PREP.md`

Es wurden bewusst keine nativen Plattformordner, keine Capacitor-Abhängigkeiten, keine Ads und keine Zahlungen aktiviert.
