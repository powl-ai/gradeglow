# GradeGlow – ui fix and mascot implant · v60

Diese Ausgabe läuft als Homescreen-PWA mit Next.js, React, TypeScript und Tailwind. Capacitor ist nur vorbereitet; der aktuelle Build enthält keinen aktiven nativen Wrapper. Es wurden keine Dependencies ergänzt.

Dies ist die einzige Dokumentationsdatei im ZIP. Die bisherigen 75 Markdown-/Textdokumente sind unten vollständig mit ihrem ursprünglichen Dateipfad zusammengeführt. Die aktuelle Anleitung steht zuerst; frühere Patch-Anweisungen und Codebeispiele im Archiv können überholt sein.

## Starten und prüfen

```sh
npm install
npm run dev
```

Die bisherigen Firebase-/Deployment-Einstellungen bleiben erhalten. Die Environment-Variablen und Einrichtungsschritte stehen im [ursprünglichen README](#archiv-readme) und im [Auth-Setup](#archiv-auth-setup).

```sh
node --test tests/*.test.mjs
npm run check
```

## Änderungen dieser Ausgabe

| Dateipfad | Änderung |
| --- | --- |
| `src/app/globals.css` | 127 überholte Header-/Dock-Regelblöcke entfernt, einschließlich Blur-Blocker, schwebender Nav, deren Pseudoelemente und alter Statusbar-Abdeckung. Andere Seitenstile bleiben erhalten. |
| `src/app/mobile-ui.css` | Header-Inhalt 12px unterhalb des Safe-Area-Abstands; feste App-Fläche mit Flex-Layout, 56px Nav plus genau einmal Safe-Area unten. Nav ohne zweite Linie, Schatten oder inaktive Pillen. |
| `src/components/Mascot.tsx` | Sofortiges Laden kleiner transparenter 384px-WebPs mit hoher Priorität; quadratische Bildfläche reserviert. |
| `public/mascots/*.webp` | Fünf tatsächlich verwendete Posen: zusammen rund 201 KB statt 4,1 MB. Die PNG-Originale bleiben für spätere Verwendung erhalten. |
| `public/sw.js` | Cache v60; kleine Posen vorab separat cachen, beim Tabwechsel aus dem Cache laden. Ein fehlgeschlagener Seiten-Precache blockiert den Bildcache nicht. |
| `src/components/PwaRegister.tsx` | Service Worker auch registrieren, wenn das Load-Ereignis bereits vorbei ist. |
| `src/lib/homeScreenIcons.ts` | Zusätzliche Auswahl „Anglerfisch dunkel“. Die bisherigen Icons bleiben wählbar. |
| `src/app/install/[style]/manifest.webmanifest/route.ts` | Dunkler Splash-/Theme-Hintergrund für diese Variante; reguläre 192-/512px-Icons. |
| `public/icons/home-anglerfish-dark-{180,192,512}.png` | Deckende quadratische PNGs ohne eingebrannte runde Ecken oder schwarze Außenecken. |
| `README.md` | Alle bisherigen Dokumentationstexte in diese Datei zusammengeführt. |

Die weiße Home-Bar ist ein Systemelement von iOS. Die App positioniert ihre Tabs über deren Safe-Area, kann den Systemindikator selbst aber nicht verschieben. Der Header enthält keinen CSS-Blur mehr. Die genaue Ursache der im Screenshot sichtbaren Unschärfe ist ohne Prüfung der laufenden iPhone-Version nicht bestätigt; die neuen Abstände und die Entfernung der alten Overlays müssen am Gerät geprüft werden.

## Dunkles Icon hinzufügen

Nach Deployment: Einstellungen → Icon auf deinem Homescreen → „Anglerfisch dunkel“ → „Mit diesem Icon hinzufügen“. Den Link bei Bedarf in Safari öffnen, dann Teilen → Zum Home-Bildschirm. Direkter Pfad: `/install/anglerfish-dark`.

Das ist eine explizite Icon-Auswahl, kein automatischer Wechsel des installierten Icons beim Umschalten des iPhone-Dark-Modes. Erst prüfen, dass die neue Verknüpfung das richtige Konto und die gespeicherten Daten öffnet; Website-Daten nicht löschen.

### Bestehende Installation und iOS-Abstände

Die Seiten enthalten `viewport-fit=cover` und `apple-mobile-web-app-status-bar-style=black-translucent`. Bei einer zuvor ohne diese Metadaten installierten PWA kann iOS alte Viewport-Einstellungen behalten. Eine neue Homescreen-Verknüpfung nach dem Deployment ist deshalb ein sinnvoller Vergleichstest; die vorhandene Installation und Daten zunächst behalten.

Offizielle Hintergrundquellen, keine Diagnose deines konkreten Geräts:
- [Apple: Konfiguration von Web-Apps](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [WebKit-Bericht 316008: beim Installieren gesetzte Statusbar-Metadaten](https://bugs.webkit.org/show_bug.cgi?id=316008)

## iPhone-Testcheckliste

- [ ] Nach Deployment die PWA schließen und öffnen; Service Worker v60 laden. Safari und Homescreen-PWA vergleichen.
- [ ] Header auf Home/Fokus/Kalender/Profil scharf, etwas weiter unten, SVGs mittig in 44×44-Tapflächen; beim Scrollen und nach Hintergrund/Rückkehr prüfen.
- [ ] Tabs ganz unten: 56px plus Home-Bar-Safe-Area, kein zusätzlicher leerer Block und keine zweite Linie. Home/Profil nicht abgeschnitten, nur aktiver Tab mit Pille.
- [ ] Light/Dark/System sowie kleines Display und Querformat testen. Menü/Einstellungen bleiben erreichbar.
- [ ] Erster Home-/Fokus-Aufruf bei langsamer Verbindung: Maskottchen lädt sofort an, ohne Größenverschiebung. Danach zwischen Tabs wechseln; die Posen kommen aus dem Cache.
- [ ] Nach einmaligem vollständigem Laden Flugmodus aktivieren: auf bereits verfügbare Screens wechseln und Maskottchen prüfen.
- [ ] Dunkles Icon in Safari neu zum Homescreen hinzufügen; Ecken ohne schwarzen Rahmen, Fish gut erkennbar. Konto/Daten prüfen, bestehende Installation zunächst behalten.
- [ ] Falls alte Installation weiter falsche Abstände zeigt, neu hinzugefügte Verknüpfung vergleichen. Bei weiterhin unscharfem Header iOS-Version und Screenshot notieren.
- [ ] Timer starten, >10s andere App/Sperrbildschirm, zurückkehren: Abwesenheit bleibt von der Lernzeit ausgeschlossen; keine Änderung der bisherigen Timer-Logik.
- [ ] ZIP enthält genau eine README und keine separaten alten Patch-Textdateien; Quellcode steht weiterhin unter den Originalpfaden.

## Archiv der bisherigen Dokumentation

Die folgenden Texte sind historische Originalstände. Ihre Aussagen zu alten Cache-Versionen, UI und Erweiterungen gelten nicht automatisch für die aktuelle Ausgabe. Insbesondere Anweisungen zum Installieren weiterer nativer Dependencies gehören zur früheren Vorbereitung.


---

<a id="archiv-readme"></a>

## Originaldatei: `README.md`

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


## Monetization Connect Prep

Siehe `BETA_MONETIZATION_CONNECT_UPDATE.md`. Monetarisierung ist vorbereitet, aber Checkout/Ads sind standardmäßig deaktiviert.

## Monetization + Legal Connect

Aktueller Stand: `beta-2026-07-04-monetization-legal-connect`. Details stehen in `BETA_MONETIZATION_LEGAL_CONNECT_UPDATE.md`.

- Checkout-Provider-Abstraktion für Stripe, Lemon Squeezy, Paddle und spätere native Stores vorbereitet.
- `/checkout/success` und `/checkout/cancel` als sichere Rückseiten für externe Payment-Provider ergänzt.
- `/legal` als Legal Hub mit Impressum, Datenschutz, Nutzungsbedingungen, Widerruf, Account-Löschung und Ads-Hinweisen angelegt.
- `/info` führt jetzt ebenfalls zum Legal Hub.
- `/monetization` zeigt Provider-Vergleich, Checkout-Flow, Success/Cancel-Rückwege, Entitlement-Flow und Legal-Status.
- `/admin` hat einen Preset `Payment manuell geprüft` und eine kopierbare Entitlement-JSON-Vorschau.
- Checkout, Ads und Sponsor Slots bleiben standardmäßig aus.
- Firestore Rules und Functions wurden nicht geändert.

---

<a id="archiv-admin-presets-update"></a>

## Originaldatei: `ADMIN_PRESETS_UPDATE.md`

# Admin Presets Update

Dieses Update verbessert die Beta-/Admin-Verwaltung:

- Quick-Presets für `1 Jahr Beta Premium`, `Lifetime Freundesbonus`, `Admin / Founder` und `Free / Entfernen`.
- Bei `premium` wird das Ablaufdatum automatisch auf ein Jahr ab heute gesetzt.
- Bei `lifetime`, `admin` und `free` wird `premiumUntil` automatisch leer gespeichert.
- Das Datumsfeld wird für nicht ablaufende Pläne deaktiviert.
- Die Cloud-Functions-`tsconfig.json` enthält jetzt `rootDir: "src"`, damit der Functions-Build nicht mehr wegen TS5011 abbricht.

Deploy:

```bash
npm install
cd functions
npm install
npm run build
cd ..
firebase deploy --only firestore:rules,functions
git add .
git commit -m "Add admin entitlement presets"
git push origin HEAD
```

---

<a id="archiv-asset-preparation"></a>

## Originaldatei: `ASSET_PREPARATION.md`

# Anglerfisch-Assets – Aufbereitung

Ausführung: built-in Imagegen für Bildbearbeitung; mechanische PNG-/ICO-Größenkonvertierung mit der vorhandenen Next.js-Abhängigkeit sharp. Keine neuen Projekt-Dependencies.

| Originaldatei | Verwendung | Projektdatei |
| --- | --- | --- |
| C62EAF0E-C3A2-44C9-A243-E9059418C963.jpeg | Happy | public/mascots/anglerfish-happy.png |
| 3DCAC050-4622-4428-BC4C-42D345D51BFE.jpeg | Proud | public/mascots/anglerfish-proud.png |
| 5CAE6061-7E13-42D9-AAE5-9D7F239EE8B8.jpeg | Focused / neutral | public/mascots/anglerfish-focused.png |
| 58BA0304-B05C-4D30-A12B-B91CCCB36B96.jpeg | Sleepy | public/mascots/anglerfish-sleepy.png |
| 1FDD8308-4E44-402A-B47B-61E3AA4F5565.jpeg | Panic | public/mascots/anglerfish-panic.png |
| 7811818B-141B-47E9-87CD-20984CED8EB8.jpeg | Celebrate | public/mascots/anglerfish-celebrate.png |
| CDCE505E-E022-41F5-B46D-6967EE6B7A90.jpeg | App-Icon | public/icons/apple-touch-icon.png, icon-192.png, icon-512.png, maskable-512.png; public/favicon.ico |

## Cutout-Prompt

Für jede Pose wurde der folgende Prompt mit dem passenden Pose-Namen verwendet:

> Use case: background-extraction. Edit target: the attached original GradeGlow anglerfish [pose] pose. Remove ONLY the white background and export with real transparent alpha. Preserve the EXACT existing fish unchanged: same silhouette, body, face, eye expression, pose, mouth, tooth count and placement, texture, fins, purple/blue colors and warm glowing yellow lure. Keep every existing decorative bubble, star, motion line, droplet, confetti or Z symbol unchanged; preserve the soft colored rim glow with translucent alpha, no white halo or white rectangle. Remove the white negative space inside the lure's arch too. Do not add, remove, redesign, repaint or reinterpret the character or its teeth. Output a square transparent PNG with the same full original composition and comfortable padding. This is a cutout of the original, not a new illustration.

## Icon-Prompt

> Use case: precise-object-edit. Edit target: the attached GradeGlow anglerfish app-icon image. Change ONLY its outer background framing: remove the black pixels outside the rounded square and extend the existing cyan-blue-lavender-pink gradient smoothly to ALL four corners of a FULL square canvas. The output must be a full-bleed, opaque square PNG app icon, without baked-in round corners, without borders, without black exterior, no transparency. Preserve the exact fish, same sly friendly half-lidded eye expression, same teeth and their count, smile, lighting, fins, lure, sparkles, all colors and position. No lettering. Do not redraw or invent a new character. Preserve the original image interior; only outpaint the missing corners.

## Maskable-Prompt

> Use case: precise-object-edit. Edit target: the attached full square GradeGlow anglerfish app icon. Create the maskable counterpart. Keep the exact same character, face, sly friendly expression, teeth and tooth count, lure, fins, sparkles, rendering and palette. Change ONLY scale/layout: reduce and center the fish AND its lure so their entire silhouette fits well INSIDE the central safe circle of diameter 76% of the square (center at 50%,50%). Add generous gradient-only padding around it; the fish should occupy roughly 55% to 60% of the canvas width and height. Extend the same cyan-blue-lavender-pink gradient seamlessly to the full canvas with no transparency, no rounded corners, no inset square, no frame, no border. No text. This is the same app icon with extra safe padding for arbitrary Android launcher masks. Avoid redesigning or repainting the fish.

---

<a id="archiv-auth-setup"></a>

## Originaldatei: `AUTH_SETUP.md`

# GradeGlow Auth Setup

## Google Login auf Vercel prüfen

Google Cloud Console → Projekt `GradeGlow` → Google Auth Platform → Clients → Web-Client öffnen.

Authorized JavaScript origins:

```text
https://gradeglow-beryl.vercel.app
```

Authorized redirect URIs:

```text
https://gradeglow-beryl.vercel.app/__/auth/handler
https://gradeglow.firebaseapp.com/__/auth/handler
```

Firebase Console → Authentication → Settings → Authorized domains:

```text
gradeglow-beryl.vercel.app
```

In Vercel muss stehen:

```text
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradeglow-beryl.vercel.app
```

Wenn du diese Variable änderst, danach in Vercel redeployen.

## GitHub Login aktivieren

1. GitHub → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: `https://gradeglow-beryl.vercel.app`.
3. Authorization callback URL aus Firebase übernehmen.
4. Client ID und Client Secret in Firebase Authentication → Sign-in method → GitHub eintragen.
5. GitHub Provider in Firebase aktivieren.

## Apple Login aktivieren

Apple Login ist etwas aufwendiger und braucht normalerweise einen Apple Developer Account.

1. Firebase Authentication → Sign-in method → Apple aktivieren.
2. Apple Developer Portal → Identifier/Service ID für Web Login anlegen.
3. Redirect/Return URL aus Firebase übernehmen.
4. Team ID, Key ID, Service ID und Private Key in Firebase eintragen.
5. Danach erneut auf Vercel testen, besonders auf iPhone/Safari.

## Warum der Rewrite wichtig ist

`next.config.ts` leitet `/__/auth/:path*` an Firebase weiter. Zusammen mit
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradeglow-beryl.vercel.app` kann Firebase Auth den Redirect-Flow über deine Vercel-Domain abwickeln.

## Warum der Service Worker wichtig ist

`public/sw.js` darf `/__/auth/` nicht cachen oder abfangen. Sonst können Google/Apple/GitHub Redirects in der PWA oder auf Mobile hängen bleiben.

## Firebase Bestätigungs-E-Mail auf GradeGlow umstellen

Wenn in Verifizierungs-E-Mails `project-...-Team` steht, kommt das nicht aus dem Next.js-Code. Stelle in der Firebase Console Folgendes ein:

1. Firebase Console öffnen.
2. Authentication → Settings/Sign-in method bzw. Templates öffnen.
3. Public-facing project name / öffentliche App-Bezeichnung auf `GradeGlow` setzen.
4. Support-E-Mail auf `gradeglow.support@icloud.com` setzen.
5. Unter Templates die E-Mail-Adresse-Bestätigung prüfen und bei Bedarf Betreff/Text anpassen.
6. Optional später: eigene Auth-Mail-Domain konfigurieren, damit Auth-Mails stärker nach GradeGlow aussehen.

Das muss einmalig in Firebase geändert werden; ein normaler Vercel-Deploy reicht dafür nicht.

---

<a id="archiv-beta-admin-setup"></a>

## Originaldatei: `BETA_ADMIN_SETUP.md`

# GradeGlow Beta/Admin Setup

## Neu in diesem Paket

- Feedback-/Bug-/Feature-Seite unter `/feedback`
- Beta-Aufklärungskarte im Dashboard und in den Einstellungen
- Datenexport, Löschanfrage, App-Daten-Löschung und Account-Löschung in den Einstellungen
- Admin-Beta-Verwaltung unter `/admin`
- Firestore Rules für Feedback, Entitlements und Admin-Rechte

## Feedback

Feedback wird in Firestore gespeichert unter:

```txt
feedback/{feedbackId}
```

Wichtige Felder:

```txt
ownerUid
ownerEmail
ownerName
type: bug | feedback | feature_request | delete_request | beta_note
status: open | reviewing | planned | done | closed
priority: low | normal | high
subject
message
page
createdAtIso
adminNote
```

## Ersten Admin anlegen

Damit du `/admin` nutzen kannst, musst du dich selbst einmalig manuell in Firebase Console als Admin freischalten:

1. Firebase Console öffnen
2. Authentication → Users
3. Deine UID kopieren
4. Firestore Database → Collection `entitlements`
5. Dokument mit deiner UID als Dokument-ID erstellen
6. Felder setzen:

| Feld | Typ | Wert |
|---|---|---|
| `plan` | string | `admin` |
| `premiumSource` | string | `founder` |
| `premiumStatus` | string | `active` |
| `premiumUntil` | string | leer lassen oder z. B. `2030-12-31` |
| `note` | string | `Founder/Admin` |
| `betaTester` | boolean | `true` |

Danach neu laden und `/admin` öffnen.

## Beta-Premium für User vergeben

In `/admin` brauchst du nur die Firebase Auth UID des Users.

Empfohlene Werte für 1 Jahr Beta-Premium:

```txt
plan: premium
premiumUntil: 2027-06-24
premiumSource: beta_test
premiumStatus: active
note: 1 Jahr Beta-Test Premium
betaTester: true
```

## Firestore Rules deployen

Nach dem Einbauen unbedingt Rules deployen:

```bash
firebase deploy --only firestore:rules
```

## Wichtig zu Datenschutz/Löschung

Die Einstellungen löschen jetzt zusätzlich:

```txt
users/{uid}/modules
users/{uid}/exams
users/{uid}/schedule
users/{uid}/friends
users/{uid}/notificationTokens
users/{uid}/notificationSettings
users/{uid}/notifications
feedback mit ownerUid == uid
studyFriendCodes mit uid == uid
publicStudyProfiles/{uid}
studyActivityEvents/{uid}
```

Entitlements werden nicht automatisch durch den User gelöscht, weil sie Premium-/Admin-Zugriffe steuern. Bei echter Produktivnutzung solltest du Entitlement-Aufbewahrung und Löschung nochmal final prüfen.

## Git Commit

```bash
git add .
git commit -m "Add beta feedback data controls and admin management"
git push origin HEAD
```

---

<a id="archiv-beta-calendar-hotbar-timer-fach-update"></a>

## Originaldatei: `BETA_CALENDAR_HOTBAR_TIMER_FACH_UPDATE.md`

# GradeGlow Calendar / Hotbar / Timer-Fach Patch

## Änderungen
- Timer-Lernzeiten können im Nachhinein einem anderen Fach bzw. einer anderen Prüfung zugeordnet werden.
- Wenn eine Timer-Lernzeit verschoben wird, wird der Titel bei `Timer-Lernzeit · ...` automatisch an das neue Fach angepasst.
- Mobile Hotbar ist jetzt icon-only, ohne großen Hintergrundblock, mit einheitlichen Icon-Größen und gleicher Umrandung für alle Tabs.
- Extra Bottom-Space ergänzt, damit Content nicht unter die Hotbar läuft.
- Plan/Kalender wurde auf Mobile kompakter gemacht.
- Kalender-Raster stärker in Richtung Apple-Kalender: dunkler Monatsblock, kleine Event-Pills, weniger riesige Karten.
- Wochenfokus und Agenda bleiben als übersichtlichere Alternative zum alten dichten Lernkalender.
- Mobile Eingabefelder im Prüfungsdetail wurden verdichtet, damit nach Prüfungsänderungen nicht alles riesig wirkt.

## Version
- App-Version: `beta-2026-07-18-calendar-hotbar-timer-fach`
- Service Worker: `gradeglow-v50`

---

<a id="archiv-beta-capacitor-prep-update"></a>

## Originaldatei: `BETA_CAPACITOR_PREP_UPDATE.md`

# GradeGlow Beta Update: Capacitor / Native App Prep

Version: `beta-2026-07-02-capacitor-prep`

## Was geändert wurde

- Neue Route `/native` für Native App Readiness.
- Neue native Checkliste mit Score.
- Kopierbarer Native App Readiness Report.
- `capacitor.config.ts` vorbereitet.
- App-ID vorbereitet: `app.gradeglow.mobile`.
- App-Name vorbereitet: `GradeGlow`.
- Store Center um Native-/Capacitor-Checks ergänzt.
- Launch Center um Native-App-Kategorie und Auto-Check erweitert.
- Navigation auf Desktop/Beta um Native Prep ergänzt.
- PWA Manifest Shortcut für Native Prep ergänzt.
- Service Worker Cache auf `gradeglow-v35` erhöht.
- App-Version aktualisiert.

## Bewusst nicht gemacht

- Keine `ios/`- oder `android/`-Ordner erzeugt.
- Keine Capacitor npm-Abhängigkeiten installiert.
- Keine neuen Dependencies.
- Keine Firebase Functions deployed.
- Keine Firestore Rules geändert.
- Keine Ads aktiv.
- Keine echten Payments oder In-App-Purchases aktiv.

## Testen

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Danach prüfen:

- `/native`
- `/store`
- `/launch`
- Mobile/PWA Shell
- `/timer`
- `/premium`

## Git

```bash
git status
git add .
git commit -m "prepare capacitor native app readiness"
git push origin HEAD
```

## Firebase

Kein Firebase Deploy nötig.

Functions weiterhin nicht deployen, solange Blaze nicht aktiviert ist.

---

<a id="archiv-beta-diagnostics-update"></a>

## Originaldatei: `BETA_DIAGNOSTICS_UPDATE.md`

# GradeGlow Beta Diagnostics Update

## Neu

- `/diagnostics` als eigene Beta-Diagnose-Seite
- App-Version sichtbar: `beta-2026-06-24.3-diagnostics`
- Manuelle Bug-Reports mit Seite, Browser, Viewport, User-ID und App-Version
- Button-/Link-Audit für leere oder auffällige klickbare Elemente
- Automatisches Client-Error-Logging für Browserfehler und unbehandelte Promise-Fehler
- React Error Boundary mit Fallback-Seite und Fehlerlogging
- Admin-Diagnostics-Inbox auf `/admin`
- Admin kann Diagnosemeldungen auf `open`, `reviewing`, `fixed`, `ignored`, `closed` setzen
- Firestore Rules für Collection `diagnostics`

## Neue Firestore Collection

```txt
diagnostics/{reportId}
```

Nutzer können eigene Diagnosemeldungen erstellen und lesen. Admins können alle Diagnosemeldungen lesen, aktualisieren und löschen.

## Deploy

Für dieses Update brauchst du keine Cloud Functions, wenn du nur die Diagnose- und Admin-Funktionen verwenden willst.

```bash
npm install
npm run typecheck
npm run lint
firebase deploy --only firestore:rules
git status
git add .
git commit -m "Add beta diagnostics and bug tracking"
git push origin HEAD
```

`npm run build` wurde lokal bis zur erfolgreichen Compilation und TypeScript-Phase ausgeführt. In der Sandbox blieb Next bei `Collecting page data` hängen; `typecheck` und `lint` sind vollständig durchgelaufen.

---

<a id="archiv-beta-fakelive-premium-pwa-polish-update"></a>

## Originaldatei: `BETA_FAKELIVE_PREMIUM_PWA_POLISH_UPDATE.md`

# GradeGlow Update: Fake-Live Premium + PWA Safe-Area Polish

Version: `beta-2026-07-04-fakelive-premium-pwa-polish`
Service Worker: `gradeglow-v38`

## Was geändert wurde

### Fake-Live Premium
- Neue Komponente `PremiumPreviewCheckoutCard`.
- `/premium` zeigt jetzt konkrete Plus-Pakete mit Fake-Live-Checkout-Preview.
- `/monetization` zeigt denselben Preview-Flow zusätzlich zum Provider-/ENV-Setup.
- `UpgradeCard` nutzt im Preview-Modus nicht mehr nur „Checkout verbinden“, sondern führt in einen klar markierten Preview-Rückweg.
- Preview-Links öffnen `/checkout/success?preview=1&cycle=...`.
- Die Success-/Cancel-Seiten unterscheiden jetzt zwischen echtem Provider-Rückweg und Fake-Live-Preview.
- Preview setzt keine Rechte, nimmt kein Geld und verändert keine Firestore-Daten.
- Konkrete Preislabels vorbereitet:
  - Monatlich: `3,99 € / Monat`
  - Jährlich: `29,99 € / Jahr`
  - Early Supporter: `49 € Early Supporter`

### Mobile/PWA Polish
- PWA-Statusbar-Problem entschärft: `appleWebApp.statusBarStyle` steht jetzt auf `default` statt `black-translucent`.
- Finaler Safe-Area-Override am Ende von `globals.css`, damit ältere mobile Shell-Regeln nicht mehr gewinnen.
- Mobile/PWA bekommt oben einen Mindestabstand, auch wenn `env(safe-area-inset-top)` auf manchen Geräten zu klein/0 ist.
- Header wird in installierter PWA wieder angezeigt und nicht mehr komplett ausgeblendet.
- Mobile Bottom-Bar bleibt safe-area-aware.
- Mobile Home bekommt eine kleine Plus-Preview-Teaser-Card im Free-Plan.

## Nicht geändert
- Keine Firebase Functions deployed.
- Keine Firestore Rules geändert.
- Keine echten Zahlungen aktiviert.
- Keine echten Ads aktiviert.
- Kein automatischer Entitlement-Webhook.

## Testcommands

```bash
npm install
npm run lint
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 CI=1 npm run build
```

## Deploy

Für normale Codeupdates reicht:

```bash
git status
git add .
git commit -m "polish fake-live premium and pwa safe area"
git push origin HEAD
```

Firestore Deploy ist nicht nötig, weil `firestore.rules` nicht geändert wurde.

```bash
# Nur falls du später Rules änderst:
firebase deploy --only firestore:rules
```

Functions weiterhin nicht deployen, solange Blaze nicht aktiv ist.

```bash
# NICHT ausführen, solange Blaze nicht aktiv ist:
firebase deploy --only functions
```

---

<a id="archiv-beta-feature-preferences-update"></a>

## Originaldatei: `BETA_FEATURE_PREFERENCES_UPDATE.md`

# GradeGlow Beta Feature Preferences Update

- Quick-Rail verschlankt: Profil, Feedback und Backup sind nicht mehr als Hauptreiter sichtbar.
- Diagnose ist nur noch für Beta/Admin-Nutzer in der Hauptnavigation sichtbar.
- Profil bleibt über die Headerkarte und den Footer erreichbar.
- Feedback ist im Footer integriert.
- Backup ist im Profil verlinkt und bleibt zusätzlich direkt per `/backup` erreichbar.
- Neue Feature-Auswahl im Onboarding und in den Einstellungen: Insights, Study Circle, Stundenplan, StuPo & Planung, GlowPoints.
- Prüfung/Lernsession-Detailinputs sind kontrastreicher, besonders in dunklen Themes.
- Landing/Register-Beispielname auf „Max Mustermann“ geändert.

---

<a id="archiv-beta-feedback-patch-1"></a>

## Originaldatei: `BETA_FEEDBACK_PATCH_1.md`

# GradeGlow Beta Feedback Patch 1

Fokus dieses Pakets: erstes echtes Tester-Feedback aus der Mini-Beta glätten, ohne neue riskante Datenmodelle oder Firebase Functions einzuführen.

## Enthalten

- Mobile Landing/Auth neu priorisiert: Login/Registrierung steht auf Mobile zuerst, Beta-Kurzstart ist direkt sichtbar.
- Die Landing-Featurekachel sagt nicht mehr prominent nur „PWA installierbar“, damit Tester nicht denken, sie müssten zuerst installieren.
- Floating Beta Actions sind jetzt eingeklappt und nerven nicht dauerhaft unten rechts.
- Feedback-Seite: „Feedback geben“ springt auf der Feedback-Seite direkt zum Formular.
- Eigene Feedbackmeldungen laden indexfrei über `ownerUid` und werden im Client sortiert. Dadurch braucht die Nutzeransicht keinen Firestore Composite Index mehr.
- Feedbackliste zeigt eine verständliche Fehlermeldung statt still „Noch keine Meldungen“ zu behaupten.
- Quick-Rail/Side-Scroll wurde enger begrenzt, damit sie weniger über den mobilen Viewport hinausragt.
- Darkmode-Kontraste für Study Circle/Friends, Privacy-Toggles und Leaderboard verbessert.
- App-Version: `beta-2026-06-30-feedback-1`.

## Nicht enthalten

- Dynamische echte PWA-App-Icons pro Nutzer. Das ist möglich als In-App-Cosmetic/Preview; das tatsächlich installierte Homescreen-Icon wird aber vom Browser/Manifest gecacht und braucht meist Neuinstallation bzw. statische Manifest-Assets. Das sollte als separater Premium-Cosmetics-Schritt geplant werden.
- Firebase Functions Deploy. Spark/free bleibt kompatibel.
- Firestore Rules Änderungen. Nicht nötig.

## Testfokus

1. Mobile Startseite öffnen: Login/Registrierung und Beta-Einleitung müssen sofort verständlich sein.
2. Feedback absenden und danach als normaler Nutzer unter „Deine letzten Meldungen“ sehen.
3. Admin Feedback Inbox prüfen.
4. Friends/Study Circle im dunklen violetten Theme prüfen.
5. Quick-Rail auf Mobile horizontal scrollen und Seite wechseln.

---

<a id="archiv-beta-feedback-patch-2"></a>

## Originaldatei: `BETA_FEEDBACK_PATCH_2.md`

# GradeGlow Beta Feedback Patch 2

Fokus: Mobile Einstieg, Quick-Rail-Polish und dunkle Study-Circle-Kontraste.

## Änderungen

- Mobile Login/Landing zeigt jetzt direkt Logo + Slogan + Login-Form in einem kompakten Einstieg.
- Login-Karte wurde auf Mobile verdichtet: kleinere Abstände, kürzere Beta-Erklärung, kompaktere Inputs.
- Quick-Rail liegt jetzt in einer abgerundeten, begrenzten Scroll-Schale statt über den Viewport zu laufen.
- Admin/Profil-Ende in der Quick-Rail bekommt zusätzlichen rechten Abstand.
- Privacy-Control-Karten im Study Circle haben eigene Kontrastklassen und bleiben auch im Dark/Violett-Theme lesbar.
- App-Version aktualisiert auf `beta-2026-06-30-feedback-2`.

## Hinweise

- Keine Firestore Rules geändert.
- Keine Functions nötig.
- Responsive Verhalten läuft über CSS/Tailwind Breakpoints, nicht über getrennte Apps.

---

<a id="archiv-beta-feedback-patch-3"></a>

## Originaldatei: `BETA_FEEDBACK_PATCH_3.md`

# GradeGlow Beta Feedback Patch 3

## Fokus
- Glow Shop übersichtlicher machen
- Gekaufte/Premium-freie Kosmetik aus dem Shop in einen eigenen Reiter verschieben
- Stundenplan-Karten ruhiger machen
- Kalenderfarben deutlicher unterscheiden

## Änderungen
- Glow Shop hat jetzt zwei Reiter:
  - `Shop`: nur noch nicht freigeschaltete Items
  - `Meine Kosmetik`: alle gekauften bzw. für Premium/Admin verfügbaren Items
- `Meine Kosmetik` ist nach Wirkung gruppiert:
  - Themes
  - Akzente
  - Profilumrandung
  - Profilbanner
- Premium/Admin sieht aktuelle Shop-Looks als freigeschaltet unter `Meine Kosmetik`; der Shop wirkt dadurch nicht mehr künstlich voll.
- Stundenplan-Termine zeigen nicht mehr dauerhaft Bearbeiten/Ausblenden/Löschen.
- Klick auf einen Termin öffnet direkt die Bearbeitung.
- Das Drei-Punkte-Menü am Termin zeigt nur bei Bedarf Ausblenden/Löschen.
- Stundenplan-Farben wurden stärker differenziert:
  - Violett bleibt violett
  - Rosa wurde zu Pink/Fuchsia
  - Rose wurde zu Koralle/Rot
- App-Version: `beta-2026-06-30-feedback-3`

## Nicht geändert
- Firestore Rules wurden nicht geändert.
- Functions wurden nicht deploymentpflichtig gemacht.
- Payment/Stripe/Blaze wurden nicht aktiviert.

---

<a id="archiv-beta-feedback-patch-4"></a>

## Originaldatei: `BETA_FEEDBACK_PATCH_4.md`

# GradeGlow Beta Feedback Patch 4

## Fokus
- Kalender-/Lernplan-Lesbarkeit im Dark Mode verbessern
- automatische Lernplanung über Mo–Fr, Mo–Sa oder Mo–So steuerbar machen
- Wochenansicht größer und übersichtlicher machen
- Lernplan-Verteilung glätten, damit nicht ein Tag voll und der nächste leer wird
- Ready-Check-Panel kompakter und ohne harte zweifarbige Ecke darstellen
- Classic-App-Icon im Dark Mode lesbar halten

## Wichtig
`src/app/info/page.tsx` ist bewusst nicht enthalten und wird nicht überschrieben.

## Kein Firebase/Functions Deploy nötig
- keine Firestore Rules geändert
- keine Functions geändert

---

<a id="archiv-beta-feedback-patch-4-1"></a>

## Originaldatei: `BETA_FEEDBACK_PATCH_4_1.md`

# GradeGlow Beta Feedback Patch 4.1

Fix für die falsch platzierte Wochen-Auswahl:

- Die Auswahl `Mo–Fr / Mo–Sa / Mo–So` wurde aus dem Prüfungskalender/Lernplan entfernt.
- Die Auswahl sitzt jetzt im Stundenplan-Bereich als `Uni-Woche`.
- Der Stundenplan zeigt je nach Auswahl 5, 6 oder 7 Spalten.
- Das Terminformular bietet nur die gewählten Stundenplan-Tage an.
- Der Lernplan bleibt davon unabhängig und nutzt intern weiterhin seine eigene Lernverteilung.
- `src/app/info/page.tsx` ist weiterhin nicht im Paket enthalten.

---

<a id="archiv-beta-icon-cosmetics-update"></a>

## Originaldatei: `BETA_ICON_COSMETICS_UPDATE.md`

# GradeGlow Beta – Icon Cosmetics Update

Dieses Paket baut auf `GradeGlow-2-beta-feedback-patch-3` auf.

## Enthalten

- Neuer Kosmetik-Typ `appIcon`
- Neue Premium/Admin-App-Icon-Looks:
  - Lavender App Icon
  - Matcha App Icon
  - Ocean App Icon
  - Mocha App Icon
  - Rose App Icon
- Neues Profilfeld `activeAppIconId`
- Migration/Fallback für alte Profile ohne `activeAppIconId`
- App-Icon-Kosmetik erscheint im Glow Shop und unter „Meine Kosmetik“ als eigener Bereich
- Ausgewähltes App-Icon färbt das In-App-Logo in Dashboard, Profil, Admin, Feedback und Diagnostics
- Preview im Glow Shop zeigt App-Icon-Look direkt an

## Hinweis zum echten PWA-Homescreen-Icon

Das echte installierte iOS/Browser-Homescreen-Icon wird von Safari/Browsern stark gecacht. Dieses Update verändert deshalb zunächst das In-App-Logo und legt die Datenstruktur für spätere PWA-Icon-Assets/Manifest-Varianten an. Für einen echten Homescreen-Icon-Wechsel wird später wahrscheinlich Neuinstallation oder ein gezielter Manifest/Icon-Asset-Schritt nötig.

## Nicht geändert

- Keine Firebase Functions
- Keine Firestore Rules
- `src/app/info/page.tsx` bleibt absichtlich aus dem ZIP ausgeschlossen, damit lokale manuelle Änderungen nicht überschrieben werden.

---

<a id="archiv-beta-internal-gates-feature-controls-update"></a>

## Originaldatei: `BETA_INTERNAL_GATES_FEATURE_CONTROLS_UPDATE.md`

# GradeGlow Internal Gates + Feature Controls Update

Version: `beta-2026-07-04-internal-gates-feature-controls`

## Ziel

Dieses Paket korrigiert zwei Punkte aus dem Feedback:

1. Normale Nutzer dürfen nicht auf Monetarisierung und Launch Center zugreifen.
2. Wer im Onboarding „Minimal starten“ wählt, muss später leicht wieder weitere Bereiche aktivieren können.

## Änderungen

- Neue interne Schutz-Komponente `InternalToolGate`.
- `/monetization` ist jetzt admin-only.
- `/launch` ist jetzt admin-only.
- Normale Nutzer, Free-, Plus- und Beta-Accounts bekommen statt interner Inhalte eine klare Kein-Zugriff-Seite.
- Launch- und Monetization-Links wurden aus öffentlichen Plus-/Legal-/Checkout-Flows entfernt.
- Dashboard-Navigation zeigt Launch und Monetarisierung nur noch für Admins.
- Feature-Gates wurden angepasst: Launch Center und Monetarisierung sind nicht mehr Beta/Admin, sondern nur Admin.
- Profilseite bekommt unter `#features` eine klarere Feature-Verwaltung:
  - Empfohlen
  - Alles aktivieren
  - Minimal
  - einzelne Bereiche ein-/ausschalten
- Dashboard zeigt auf der Startseite einen Hinweis, wenn optionale Bereiche ausgeblendet sind.
- Mobile/Profile-Links führen direkter zu `Profil → Sichtbare Bereiche`.
- Service Worker Cache-Version auf `gradeglow-v39` erhöht.
- `/launch` und `/monetization` werden nicht mehr im öffentlichen App-Shell-Cache vorgeladen.

## Wichtig

- Firestore Rules wurden nicht geändert.
- Firebase Functions wurden nicht angefasst.
- Es wurden keine echten Payments und keine echten Ads aktiviert.
- Laptop-PWA/volle Website-Navigation wurde bewusst nicht verändert.

## Tests

```bash
npm run lint
npm run typecheck
npm run build
```

Hinweis: In der Sandbox kompiliert `next build` erfolgreich, läuft danach aber in der Next-TypeScript-Phase länger als das Tool-Zeitfenster. `npm run lint` und `npm run typecheck` laufen erfolgreich.

---

<a id="archiv-beta-launch-readiness-update"></a>

## Originaldatei: `BETA_LAUNCH_READINESS_UPDATE.md`

# GradeGlow Beta Launch Readiness Update

Version: `beta-2026-07-02-launch-readiness`

## Ziel

Dieser Patch bringt GradeGlow einen großen Schritt näher an eine echte, kontrollierbare externe Beta. Statt direkt weitere Lernfeatures zu stapeln, gibt es jetzt ein eigenes Launch Center, das zeigt, welche Produkt-, Datenschutz-, Mobile-, Beta- und Store-Vorbereitungen noch offen sind.

## Neu

### `/launch` Beta Launch Center

Neue interne Seite für Beta/Admin-Accounts mit:

- Launch Score in Prozent
- Status nach Kategorien:
  - Produktkern
  - Daten & Vertrauen
  - Beta-Betrieb
  - Mobile/PWA
  - App-Store-Vorbereitung
- automatische Checks aus echten App-Daten:
  - Profil/Onboarding geladen
  - Feature-Auswahl gesetzt
  - Module vorhanden
  - Prüfungen vorhanden
  - Lernplan-Sessions vorhanden
  - Study Circle vorbereitet
  - Cloud-Sync ohne sichtbare Fehler
  - Diagnostics/Admin erreichbar
  - PWA-Basis vorhanden
- manuelle Launch-Checks mit lokaler Speicherung pro Account:
  - Firebase Auth-Mail-Branding prüfen
  - echte Account-Löschung prüfen
  - Datenschutz-/Info-Platzhalter ersetzen
  - komplettes Beta-Test-Skript durchlaufen
  - Feedback-Triage testen
  - iOS/Android/Desktop PWA-Installation testen
  - Store-Positionierung, Screenshots und Pricing vorbereiten
- sortierte Blocker-Liste nach Priorität
- kopierbarer Launch Report für neue Chats, Beta-Notizen oder Release-Planung

### Navigation & PWA

- neuer Beta-Navigationspunkt: `Launch`
- Service Worker Cache auf `gradeglow-v25` erhöht
- `/launch` wird in der PWA-App-Shell vorbereitet
- Manifest Shortcut für `Beta Launch Center` ergänzt

## Nicht geändert

- `firestore.rules`
- Firebase Functions
- Firebase Deploy-Konfiguration
- keine neuen npm-Abhängigkeiten
- keine Capacitor-Abhängigkeiten

## Testplan

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Manuell testen:

1. Als Beta/Admin anmelden.
2. Dashboard öffnen und prüfen, ob `Launch` in der Navigation sichtbar ist.
3. `/launch` öffnen.
4. Score und Kategorien prüfen.
5. Manuelle Checks toggeln.
6. Seite neu laden und prüfen, ob manuelle Checks lokal erhalten bleiben.
7. `Report kopieren` testen.
8. Manifest/PWA nach Deploy prüfen, ob Shortcut und Service-Worker-Update sauber aktualisieren.

## Git

```bash
git status
git add .
git commit -m "add beta launch readiness center"
git push origin HEAD
```

## Firebase Deploy

Nicht nötig, weil Firestore Rules nicht geändert wurden.

```bash
# Kein Firebase Deploy nötig.
```

Functions weiterhin nicht deployen, solange Blaze nicht aktiviert ist.

---

<a id="archiv-beta-launch-ready-update"></a>

## Originaldatei: `BETA_LAUNCH_READY_UPDATE.md`

# GradeGlow Beta Launch Ready Update

Build label: `beta-2026-06-26-launch`

## Fokus

Dieses Paket stabilisiert den aktuellen Beta-Stand und macht GradeGlow bereit für eine Mini-Beta mit 2-3 Testpersonen. Es enthält keine Firebase Functions und braucht keinen Blaze-Plan.

## Eingebaut

- Beta-Launch-Ready-Panel im Dashboard mit Checkliste für Profil, Module, Prüfungen und Study Circle.
- Floating Beta-Actions in der App: schnelle Links zu Feedback, Diagnostics und Admin.
- Klarerer Ladehinweis, wenn Module, Prüfungen oder Stundenplan noch mit Firestore abgeglichen werden.
- Prüfungsdaten nutzen lokales Backup sofort als geladenen Zwischenstand, während Firestore im Hintergrund prüft.
- Quick-Rail versucht die aktive Seite zuverlässiger sichtbar zu halten, auch bei Backup/weiter rechts liegenden Tabs.
- Admin-Seite bekommt Launch-Kennzahlen:
  - Beta-Tester
  - Premium/Admin aktiv
  - offene Rückmeldungen
  - High-Priority-Feedback
- Admin-Seite bekommt einen Launch-Readiness-Bereich für den Mini-Beta-Test.
- Diagnostics-Seite bekommt Schnellvorlagen für typische Beta-Bugs:
  - Daten wirken weg
  - Button kaputt
  - Theme/Lesbarkeit
  - Study Circle
- App-Version auf `beta-2026-06-26-launch` gesetzt.

## Nicht geändert

- Keine Functions-Änderung.
- Keine Firestore-Rules-Änderung.
- Kein Stripe/Paywall/Blaze-Feature.

## Empfohlener Beta-Test

1. Account erstellen oder einloggen.
2. Profil speichern.
3. Modul eintragen.
4. Prüfung eintragen.
5. Lerneinheit manuell hinzufügen und abhaken.
6. Theme + Akzentfarbe wechseln.
7. Study Circle Sharing aktivieren.
8. Freund per Code hinzufügen.
9. Bug/Feedback senden.
10. Seite neu laden und prüfen, ob alles bleibt.

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

## Commit

```bash
git status
git add .
git commit -m "Prepare beta launch package"
git push origin HEAD
```

## Deploy

```bash
# Nur nötig, wenn Rules lokal geändert wurden. In diesem Paket wurden sie nicht geändert.
firebase deploy --only firestore:rules
```

Functions weiterhin nicht deployen, solange Firebase Spark/free aktiv ist.

---

<a id="archiv-beta-mobile-app-simplify-update"></a>

## Originaldatei: `BETA_MOBILE_APP_SIMPLIFY_UPDATE.md`

# GradeGlow Beta Update: Mobile App Simplify

Version: `beta-2026-07-02-mobile-app-simplify`

## Ziel

Mobile/PWA soll nicht mehr wie eine zusammengedrückte Desktop-Webseite wirken. Die Startseite wird auf Mobile stärker reduziert, sekundäre Boxen werden standardmäßig eingeklappt und die untere Tabbar wird zur primären Navigation.

## Änderungen

- Mobile Appbar ist jetzt fixed und mit mehr Statusbar-Abstand versehen.
- Obere Quick-Rail/Schnellnavigation wird unter `lg` hart ausgeblendet.
- Bottom Tabbar sitzt wirklich unten am Screen und reserviert Safe-Area-Platz.
- App-Content bekommt mehr unteren Abstand, damit nichts hinter der Tabbar verschwindet.
- Ready-Check ist auf Mobile standardmäßig eingeklappt.
- Free/Premium-Limits sind auf Mobile standardmäßig eingeklappt.
- Glow Rewards sind auf Mobile standardmäßig eingeklappt.
- PWA Install/Update ist auf Mobile standardmäßig eingeklappt.
- Plan und Timer sind in der unteren Tabbar getrennt:
  - `/exams` = Plan
  - `/timer` = Timer/Fokusansicht auf Basis des Planers
- Neue Route: `/timer`
- Service Worker Cache: `gradeglow-v30`

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine neuen npm-Abhängigkeiten.

## Test

- Mobile Safari/PWA öffnen.
- Prüfen, dass oben keine Scroll-Rail mehr sichtbar ist.
- Prüfen, dass die Uhrzeit/Statusbar nicht überdeckt wird.
- Prüfen, dass unten die Tabbar nichts mehr verdeckt.
- Home: Ready-Check, Limits, Glow und PWA sollen eingeklappt sein.
- Plan und Timer in der Bottom Tabbar getrennt testen.

---

<a id="archiv-beta-mobile-core-experience-update"></a>

## Originaldatei: `BETA_MOBILE_CORE_EXPERIENCE_UPDATE.md`

# GradeGlow Beta Update: Mobile Core Experience

Version: `beta-2026-07-02-mobile-core-experience`

## Ziel

Die mobile App soll weniger wie ein verkleinertes Web-Dashboard wirken und stärker wie eine täglich nutzbare App. Der Fokus liegt auf Home, Plan, Timer und PWA-Shell.

## Änderungen

- Mobile Home fokussiert stärker auf den heutigen Tag.
- Neue kompakte Schnellaktionen auf Mobile:
  - Timer
  - Plan
  - Circle
  - Profil
- Beta-Ready-Check ist nicht mehr der erste sichtbare Block, sondern ein sekundärer einklappbarer Bereich.
- Plan-Seite behandelt Timer nicht mehr als eigenen Plan-Baustein.
- Plan-KPIs und Kalender-Elemente sind auf Mobile kompakter.
- Installierte PWA blendet die interne Mobile-Appbar aus, damit sie nicht mit Statusbar/Dynamic Island kollidiert.
- Bottom-Hotbar wurde im Standalone-PWA-Modus tiefer und kompakter gesetzt.
- Service Worker Cache: `gradeglow-v34`.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine echten Ads oder Zahlungen aktiviert.
- Keine neuen Dependencies.

---

<a id="archiv-beta-mobile-density-fix-update"></a>

## Originaldatei: `BETA_MOBILE_DENSITY_FIX_UPDATE.md`

# GradeGlow Beta Update – Mobile Density Fix

Version: `beta-2026-07-02-mobile-density-fix`

## Ziel

Die mobile/PWA-Ansicht war trotz vorheriger Patches weiterhin zu groß und wirkte wie eine gezoomte Desktop-Ansicht. Dieser Patch setzt eine deutlich aggressivere Mobile-Dichte, damit mehr Inhalt auf einen iPhone-Screen passt.

## Änderungen

- Eigener Mobile-Density-Layer am Ende von `globals.css`.
- Mobile-Root-Fontsize reduziert.
- Große Tailwind-Typografie (`text-6xl` bis `text-xl`) auf Mobile stark begrenzt.
- Arbiträre große Textgrößen wie `text-[3rem]` und `text-[2rem]` werden auf Mobile abgefangen.
- Karten-Padding, Margins, Gaps und Rundungen deutlich reduziert.
- Inputs, Selects, Textareas und Planner-Felder kompakter gemacht.
- Buttons, Filter-Pills und Soft-Buttons kompakter gemacht.
- Avatar/Icon-Größen auf Mobile verkleinert.
- Mobile Quick-Navigation an den unteren Bildschirmrand verdichtet.
- Service Worker Cache-Version auf `gradeglow-v28` erhöht.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions geändert oder deployed.
- Keine neuen npm-Abhängigkeiten.
- Keine Payment/Capacitor-Abhängigkeiten.

## Testfokus

- iPhone Safari normaler Webmodus.
- iPhone PWA vom Homescreen.
- Dashboard/Übersicht.
- Premium/Plan-Limits.
- Insights.
- Study Circle/Freunde.
- Admin Feedback.
- Input-Fokus: prüfen, ob die Ansicht nicht unangenehm springt.

---

<a id="archiv-beta-mobile-feature-save-fix-update"></a>

## Originaldatei: `BETA_MOBILE_FEATURE_SAVE_FIX_UPDATE.md`

# GradeGlow Beta Mobile Feature Save Fix

## Fokus

Dieses Patch-Paket behebt das Problem, dass in der mobilen PWA nach der Auswahl von „Minimal“ optionale Bereiche wie Study Circle, Insights oder Stundenplan nicht zuverlässig wieder im mobilen Menü auftauchten.

## Änderungen

- Sichtbare Bereiche im Profil werden jetzt direkt gespeichert, sobald Nutzer einen Bereich aktivieren/deaktivieren oder ein Preset wählen.
- Die Feature-Auswahl behandelt eine leere Liste jetzt korrekt als echten Minimal-Modus und setzt sie nicht mehr automatisch auf alle Features zurück.
- Das mobile Menü enthält jetzt immer einen direkten Einstieg zu `Profil → Sichtbare Bereiche`.
- Im mobilen Menü wird angezeigt, wie viele optionale Bereiche aktiv sind.
- Feature-Preset-Texte wurden angepasst: Nutzer müssen nach Änderungen in diesem Block nicht zusätzlich den großen Profil-Speichern-Button suchen.
- App-Version erhöht auf `beta-2026-07-04-mobile-feature-save-fix`.
- Service Worker Cache erhöht auf `gradeglow-v41`.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed oder vorbereitet.
- Keine echten Payments/Ads aktiviert.
- Laptop-PWA wurde bewusst nicht weiter auf App-Modus umgebaut.

## Tests

```bash
npm run lint
npm run typecheck
```

Beide Tests laufen erfolgreich.

`NEXT_TELEMETRY_DISABLED=1 CI=1 npm run build` kompiliert erfolgreich, läuft in der Sandbox aber erneut in der Next-TypeScript-Phase länger als das Tool-Zeitfenster.

---

<a id="archiv-beta-mobile-pwa-ui-refresh-fix-update"></a>

## Originaldatei: `BETA_MOBILE_PWA_UI_REFRESH_FIX_UPDATE.md`

# GradeGlow Mobile/PWA UI Refresh Fix

## Fix
- `src/lib/appVersion.ts` exportiert wieder `GRADEGLOW_SUPPORT_EMAIL`.
- Build-Fehler auf Legal-/Info-/Premium-/Native-/Launch-Seiten behoben.
- App-Version auf `beta-2026-07-08-mobile-pwa-ui-refresh-fix` aktualisiert.
- Service Worker auf `gradeglow-v43` erhöht.

## Ursache
Beim Mobile/PWA UI Refresh wurde `appVersion.ts` überschrieben und enthielt danach nur noch `GRADEGLOW_APP_VERSION`. Mehrere Komponenten importieren aber zusätzlich `GRADEGLOW_SUPPORT_EMAIL`.

---

<a id="archiv-beta-mobile-pwa-ui-refresh-update"></a>

## Originaldatei: `BETA_MOBILE_PWA_UI_REFRESH_UPDATE.md`

# GradeGlow Mobile/PWA UI Refresh

## Fokus
- Mobile/PWA UI stärker in Richtung native App-Feeling überarbeitet
- Bottom-Bar frischer und schwebender, mit zentraler Timer-Aktion
- Header klarer, kompakter und ruhiger
- Mobile Home strukturierter wie eine moderne Activity-/Social-App
- Menü auf Mobile als Bottom-Sheet statt riesiger Web-Drawer

## Änderungen
- Mobile Header mit zentriertem Titel, Feedback-Quick-Action und Profil-Chip
- Mobile Home mit deutlicherem Hero-Card-Look
- neue Schnellzugriff-Sektion in 2-spaltiger App-Kartenstruktur
- Fortschritts-Feed-Card ergänzt
- Mobile Menü-Sheet näher an nativer Sheet-Interaktion
- Floating Tabbar überarbeitet, Timer-Taste hervorgehoben
- PWA Safe-Area Abstände an die neue Tabbar angepasst

## Hinweis
- Inspiriert von klaren Social-/Fitness-App-Mustern (z. B. frische Floating-Bar, feedartige Karten, fokussierte Schnellaktionen), ohne fremde Marken-Assets zu kopieren.

---

<a id="archiv-beta-mobile-shell-timer-fix-update"></a>

## Originaldatei: `BETA_MOBILE_SHELL_TIMER_FIX_UPDATE.md`

# Beta Mobile Shell + Timer Fix

Version: `beta-2026-07-02-mobile-shell-timer-fix`

## Änderungen

- Mobile Header liegt nicht mehr als fixed Overlay über dem Content, sondern sitzt in der App-Shell und bleibt kompakter.
- Mobile/PWA Content startet nicht mehr mit künstlich großem Top-Abstand.
- Bottom Hotbar sitzt tiefer und braucht weniger Höhe.
- Standalone-PWA bekommt eigenen Bottom-/Safe-Area-Feinschliff.
- `/timer` ist jetzt eine echte Timer-Seite statt erneut die volle Plan-/Kalenderansicht zu rendern.
- Timer-Seite enthält nur:
  - Fach/Prüfungsauswahl
  - Modus
  - Dauer-Presets
  - Start
  - Speichern/Verwerfen
- Gespeicherte Timer werden als erledigte Lernzeit beim gewählten Fach abgelegt.
- Plan/Kalender bleiben im Plan-Tab.
- Service Worker Cache: `gradeglow-v31`.

## Nicht geändert

- Firestore Rules
- Firebase Functions
- Firebase Deploy-Konfiguration
- Keine neuen npm-Abhängigkeiten

## Testcheck

- Mobile Safari: Header verdeckt die Uhrzeit nicht.
- PWA: Header/Hotbar sitzen in der Safe-Area.
- Home: Content verschwindet nicht hinter der Hotbar.
- Timer-Tab: zeigt nur Timer, keinen Kalender.
- Timer starten, speichern, danach im Plan als erledigte Lernzeit prüfen.

---

<a id="archiv-beta-mobile-social-notifications-update"></a>

## Originaldatei: `BETA_MOBILE_SOCIAL_NOTIFICATIONS_UPDATE.md`

# GradeGlow Beta Update – Mobile Social Notifications

Version: `beta-2026-07-02-mobile-social-notifications`

## Schwerpunkt

Dieser Patch macht die mobile/PWA-Ansicht deutlich kompakter und verbessert den Social Flow im Study Circle.

## Änderungen

- Mobile/PWA Density Pass:
  - globale mobile Rem-Skalierung reduziert
  - Karten-Paddings auf kleinen Screens verkleinert
  - Eingabefelder, Selects und Textareas kompakter
  - Buttons und Avatare kompakter
  - große Überschriften auf iPhone/PWA weiter reduziert
  - Safe-Area und In-App-Toasts mobile-freundlicher

- Study Circle Profile:
  - Leaderboard-Einträge sind jetzt anklickbar
  - Profilmodal ist damit nicht nur in der Mitgliederliste, sondern auch im Ranking erreichbar
  - Beta-Badges werden im Leaderboard und Profilmodal sichtbarer angezeigt
  - Profilmodal erlaubt weiterhin Freund hinzufügen / Freund entfernen

- Freund hinzugefügt Benachrichtigung:
  - Wenn dich jemand über den Freundescode hinzufügt, erscheint in der App ein Toast: `... hat dich hinzugefügt`
  - Die Erkennung läuft über die gegenseitige Friend-Doc-Anlage und braucht keine Firebase Functions
  - Hintergrund-Push für diese spezielle Meldung bleibt ohne Functions/Blaze bewusst nicht aktiv

- Firestore:
  - keine Rules geändert
  - Friend-Dokumente bekommen zusätzliche Snapshot-Metadaten (`addedAtIso`, `addedByUid`, `addedByDisplayNameSnapshot`)

- Service Worker:
  - Cache-Version auf `gradeglow-v27`

## Testplan

1. Mobile/PWA auf iPhone öffnen.
2. Dashboard, Insights, Freunde, Admin, Launch prüfen.
3. Prüfen, ob Schrift und Felder weniger übergroß wirken.
4. Mit Account A den Code von Account B hinzufügen.
5. Bei Account B muss ein In-App-Toast erscheinen: `A hat dich hinzugefügt`.
6. Im Circle Leaderboard auf ein Profil tippen.
7. Profilmodal prüfen: Badge, Studiengang, Wochenzeit, Freund hinzufügen/entfernen.

## Deploy

- Normales Vercel/Git Deployment reicht.
- Kein Firebase Deploy nötig.
- Firebase Functions weiterhin nicht deployen, solange Blaze nicht aktiv ist.

---

<a id="archiv-beta-monetization-connect-update"></a>

## Originaldatei: `BETA_MONETIZATION_CONNECT_UPDATE.md`

# GradeGlow Beta Update: Monetization Connect Prep

Version: `beta-2026-07-02-monetization-connect`

## Ziel

Dieser Patch bereitet Monetarisierung so vor, dass später nur noch Payment-/Ad-Provider verbunden werden müssen. Es werden keine echten Zahlungen, keine Firebase Functions und keine Firestore Rules aktiviert.

## Neu

- Neue Seite `/monetization`
  - Monetization Readiness Score
  - Checkout-Link-Status
  - Plus-/Sponsor-/Ad-Strategie
  - ENV-Checkliste für Vercel
  - kopierbarer Monetization Report
- Neue zentrale Datei `src/lib/monetization.ts`
  - Billing Provider
  - Checkout-Links
  - Enable-Flags
  - Sponsor-/Ad-Slots
  - Readiness Checks
- Neue Komponenten
  - `UpgradeCard`
  - `MonetizationSlotCard`
  - `AdSenseScript`
  - `MonetizationHubPage`
- `/premium` erweitert
  - Link zu `/monetization`
  - Checkout-Preview-Karten
  - UpgradeCard mit Payment-Status
- `PremiumGate` und `PlanUsagePanel` nutzen jetzt UpgradeCard
- Launch Center erweitert
  - Kategorie Monetarisierung
  - Checks für Monetization Center und Checkout-Schutz
- PWA/Manifest/Service Worker erweitert
  - `/monetization` als App Shell Route
  - Shortcut für Monetarisierung
  - Cache `gradeglow-v36`

## ENV Variablen

```env
NEXT_PUBLIC_GRADEGLOW_MONETIZATION_MODE=preview
NEXT_PUBLIC_GRADEGLOW_BILLING_PROVIDER=none
NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT=false
NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_PRICE=2-4 EUR / Monat geplant
NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_URL=
NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_PRICE=Jahrespreis geplant
NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_URL=
NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_PRICE=Early-Supporter geplant
NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_URL=
NEXT_PUBLIC_GRADEGLOW_ENABLE_SPONSOR_SLOTS=false
NEXT_PUBLIC_GRADEGLOW_ENABLE_ADSENSE=false
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=
```

## Wichtig

- Checkout bleibt aus, solange `NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT` nicht `true` ist.
- Sponsor Slots bleiben aus, solange `NEXT_PUBLIC_GRADEGLOW_ENABLE_SPONSOR_SLOTS` nicht `true` ist.
- AdSense-Script lädt nur, wenn `NEXT_PUBLIC_GRADEGLOW_ENABLE_ADSENSE=true` und eine Publisher-ID gesetzt ist.
- Keine Ads im Timer/Fokus.
- Vor echten Zahlungen: Impressum, Datenschutz, AGB/Widerruf und Support-Prozess finalisieren.
- Für native iOS/Android-Premiumfunktionen später Store-/IAP-Regeln prüfen.

## Nicht geändert

- keine Firestore Rules
- keine Firebase Functions
- keine echten Payments
- keine echten Ads aktiv
- keine neuen npm Dependencies

---

<a id="archiv-beta-monetization-legal-connect-update"></a>

## Originaldatei: `BETA_MONETIZATION_LEGAL_CONNECT_UPDATE.md`

# GradeGlow Monetization + Legal Connect Update

Version: `beta-2026-07-04-monetization-legal-connect`
Service Worker: `gradeglow-v37`

## Ziel
Option A + C kombiniert: Monetarisierung technisch anschlussfertiger machen und gleichzeitig die rechtliche Seitenstruktur vorbereiten, ohne echte Zahlungen, echte Ads oder Firebase Functions zu aktivieren.

## Neu

### Checkout/Provider-Vorbereitung
- Neue Datei `src/lib/checkout.ts`
- Provider-Abstraktion für:
  - `none`
  - `stripe`
  - `lemonsqueezy`
  - `paddle`
  - `app_store`
  - `play_store`
- Checkout-Flow-Schritte dokumentiert
- Entitlement-Flow dokumentiert:
  - externer Checkout
  - Rückleitung
  - Kaufprüfung
  - manuelle Plus-Freischaltung in `/admin`
  - späterer Webhook erst mit Functions/Blaze
- Checkout öffnet nur live, wenn:
  - Provider nicht `none`
  - mindestens ein Checkout-Link gesetzt ist
  - `NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT=true`

### Neue Checkout-Rückseiten
- `/checkout/success`
- `/checkout/cancel`
- Beide Seiten setzen keine Entitlements automatisch.
- Beide Seiten sind als spätere Redirect URLs für Stripe/Lemon Squeezy/Paddle vorbereitet.

### Legal Hub
- Neue Datei `src/lib/legal.ts`
- Neue Komponente `LegalCenterPage`
- Neue Routen:
  - `/legal`
  - `/legal/impressum`
  - `/legal/privacy`
  - `/legal/terms`
  - `/legal/refund`
  - `/legal/delete-account`
  - `/legal/ads`
- `/info` zeigt jetzt ebenfalls den Legal Hub.
- Alte zentrale Links wurden von `/info` auf `/legal` umgestellt.
- Inhalte sind bewusst Platzhalter und keine Rechtsberatung.

### Monetization Center erweitert
- Provider-Vergleich eingebaut
- Checkout-Links zeigen Preview/Live-Zustand
- Success/Cancel-Seiten direkt testbar
- Manuelle Entitlement-Freischaltung erklärt
- Legal Hub direkt verlinkt
- Readiness berücksichtigt Provider-Auswahl und Legal-Struktur

### Admin verbessert
- Neuer Preset: `Payment manuell geprüft`
- Setzt:
  - `plan = premium`
  - `premiumSource = payment_manual`
  - `premiumStatus = active`
  - Ablaufdatum +1 Jahr
- Entitlement Preview als JSON sichtbar
- JSON kann kopiert werden
- Weiterhin keine Functions und keine Webhooks nötig

### ENV Beispiele erweitert
- `.env.example`
- `.env.local.example`
- Monetarisierungs-ENV-Variablen ergänzt:
  - Mode
  - Provider
  - Checkout Enable Flag
  - Preise
  - Checkout URLs
  - Sponsor Slots
  - AdSense

## Wichtig
- Keine Firebase Functions deployed.
- Keine Firestore Rules geändert.
- Keine echten Payments aktiv.
- Keine echten Ads aktiv.
- Checkout bleibt Preview, solange `NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT=false` oder Provider `none` ist.

## Test
```bash
npm run lint
npm run typecheck
npm run build
```

Hinweis: Im Bearbeitungs-Sandbox konnte `npm run build` nicht final laufen, weil das hochgeladene `node_modules` nur das macOS Next/SWC-Paket enthielt und die Linux-SWC-Binary ohne Netzwerk nicht nachgeladen werden konnte. `lint` und `typecheck` liefen erfolgreich. Auf Vercel bzw. nach sauberem `npm install` sollte Next die passende SWC-Binary installieren.

## Deployment
Normales Codeupdate:
```bash
git add .
git commit -m "prepare monetization provider flow and legal hub"
git push origin HEAD
```

Firestore Rules nur deployen, falls du sie später separat änderst:
```bash
firebase deploy --only firestore:rules
```

Functions weiterhin nicht deployen, solange Blaze nicht aktiv ist:
```bash
# NICHT ausführen:
firebase deploy --only functions
```

---

<a id="archiv-beta-native-mobile-shell-update"></a>

## Originaldatei: `BETA_NATIVE_MOBILE_SHELL_UPDATE.md`

# GradeGlow Beta Native Mobile Shell Update

Version: `beta-2026-07-02-native-mobile-shell`

## Ziel

Mobile/PWA soll nicht mehr wie eine verkleinerte Desktop-Webseite wirken, sondern eine eigene App-Shell bekommen.

## Änderungen

- Desktop-Hero auf Mobile ausgeblendet.
- Neuer kompakter Mobile-App-Header mit Menü, Seitentitel und Profilzugriff.
- Desktop-Quick-Rail auf Mobile ausgeblendet.
- Neue native Bottom-Tabbar für Home, Plan, Timer, Circle und Profil.
- Overview auf Mobile mit eigener Today-first Ansicht statt vier großer Desktop-KPI-Karten.
- Kompakte mobile Statistikliste für Schnitt, ECTS, offene Sessions und erledigte Sessions.
- Mobile Safe-Area und Bottom-Padding an PWA-Tabbar angepasst.
- Footer auf Mobile entfernt, weil Profil/Mehr-Menü diese Links bündelt.
- Service Worker Cache auf `gradeglow-v29` erhöht.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions geändert oder deployed.
- Keine neuen npm-Abhängigkeiten.
- Desktop-Layout bleibt im Kern erhalten.

## Testfokus

1. iPhone Safari normal öffnen.
2. PWA vom Homescreen öffnen.
3. Home prüfen: kompakter Header, Today Card, Statistikliste.
4. Bottom-Tabs prüfen: Home, Plan, Timer, Circle, Profil.
5. Desktop prüfen: Hero und Quick-Rail müssen weiterhin sichtbar sein.

---

<a id="archiv-beta-onboarding-delete-fix"></a>

## Originaldatei: `BETA_ONBOARDING_DELETE_FIX.md`

# GradeGlow Beta Update – Onboarding & Account-Löschung Fix

Version: `beta-2026-07-02-onboarding-delete-fix`

## Was geändert wurde

### Onboarding

- Step 1 kann durch Enter/Return nicht mehr automatisch weitergeschaltet oder abgeschlossen werden.
- Die Feature-Auswahl in Step 2 startet jetzt ohne automatisch aktivierte Basisauswahl.
- `Setup abschließen` funktioniert erst, wenn bewusst eine Auswahl gesetzt wurde:
  - Empfohlen
  - Alles aktivieren
  - Minimal starten
  - oder einzelne Bereiche manuell auswählen
- Step 2 zeigt sichtbar an, ob bereits eine Auswahl gesetzt wurde.

### Account-Löschung

- Firebase-Account-Löschung nutzt jetzt eine direkte Re-Authentifizierung vor dem Löschen.
- Bei E-Mail/Passwort-Accounts erscheint ein Passwortfeld für die Sicherheitsbestätigung.
- Bei Google-Accounts öffnet GradeGlow automatisch ein Google-Bestätigungsfenster.
- Erst danach werden App-Daten, öffentliche Study-Circle-Daten und der Firebase Auth Account gelöscht.
- Zusätzliche Cloud-Daten werden beim Löschen berücksichtigt:
  - Study-Circle-Mitgliedschaften
  - eigene Study Circles
  - Circle-Codes
  - Diagnostics
  - User-Root-Dokument, sofern die Rules es erlauben

## Wichtig

- Firebase Functions wurden nicht angefasst und nicht deployed.
- Firestore Rules wurden nicht geändert.
- Firebase Deploy ist für diesen Patch nicht nötig.

## Testfälle

### Onboarding

1. Neuen Account erstellen.
2. Step 1 ausfüllen.
3. Enter/Return in einem Feld drücken.
4. Erwartung: Setup wird nicht abgeschlossen.
5. Weiter klicken.
6. Erwartung: Step 2 zeigt `Noch keine Auswahl` und keine optionalen Feature-Karten sind automatisch aktiv.
7. Ohne Auswahl `Setup abschließen` klicken.
8. Erwartung: Fehlermeldung erscheint.
9. Empfohlen / Alles aktivieren / Minimal starten / manuelle Auswahl testen.
10. Danach Setup abschließen.

### Account löschen

1. Einstellungen öffnen.
2. `LÖSCHEN` eintippen.
3. Bei E-Mail/Passwort: Passwort eintragen.
4. Bei Google: Google-Fenster bestätigen.
5. `Account löschen` klicken.
6. Erwartung: Daten werden gelöscht und Firebase Auth Account wird entfernt.

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

## Git

```bash
git status
git add .
git commit -m "fix onboarding selection and account deletion reauth"
git push origin HEAD
```

## Firebase

```bash
# Nicht nötig, weil firestore.rules nicht geändert wurden.
```

---

<a id="archiv-beta-onboarding-growth-update"></a>

## Originaldatei: `BETA_ONBOARDING_GROWTH_UPDATE.md`

# GradeGlow Beta Onboarding & Growth Patch

## Fokus
- Neue Nutzer landen zuerst im Registrieren-/Kostenlos-starten-Flow statt im Login.
- Landing erklärt den Beta-Start kompakter: Account, Profil, Modul + Prüfung, Lernsession.
- Daily Glow zeigt den Reward klarer: 10 Basispunkte plus Streak-Bonus.
- Study Circle enthält erste gamifizierte Wochenmissionen ohne Notenvergleich.
- `src/app/info/page.tsx` wurde aus der Nutzerdatei übernommen und ist wieder Bestandteil des Pakets.

## Keine Änderungen
- Keine Firestore Rules geändert.
- Keine Firebase Functions benötigt.
- Kein App-Store-/Capacitor-Umbau in diesem Patch.

---

<a id="archiv-beta-onboarding-ui-fix"></a>

## Originaldatei: `BETA_ONBOARDING_UI_FIX.md`

# Beta Onboarding UI Fix

- Onboarding-Step 1 kann per Enter nicht mehr versehentlich das komplette Setup abschließen.
- Feature-Auswahl startet im Onboarding nicht mehr automatisch mit allen optionalen Bereichen aktiv, sondern mit einer empfohlenen Auswahl.
- Neue Schnelloptionen: Empfohlen, Alles aktivieren, Minimal starten.
- Feature-Karten und Notification-Karten bleiben im Standard-/System-Darkmode lesbar.
- App-Version: beta-2026-07-02-onboarding-ui-fix.

## Firebase E-Mail-Absender/Teamname
Der Text `project-...-Team` in Firebase-Verifizierungs-E-Mails kommt nicht aus dem Next.js-Code, sondern aus den Firebase-Authentication-E-Mail-Templates bzw. dem Public-facing project name. Das muss in der Firebase Console auf `GradeGlow` angepasst werden.

---

<a id="archiv-beta-premium-social-mobile-update"></a>

## Originaldatei: `BETA_PREMIUM_SOCIAL_MOBILE_UPDATE.md`

# GradeGlow Beta Update – Premium Boundaries, Beta Badges, Circle Profile & Mobile Polish

Version: `beta-2026-07-02-premium-social-mobile`

## Enthalten

- Neue Seite `/premium` als Paywall-Vorbereitung ohne echte Zahlungen.
- Zentrale Feature-Gate-Logik in `src/lib/featureGates.ts`.
- Free/Beta/Plus/Admin-Grenzen dokumentiert und in der App sichtbar gemacht.
- Public Study Profiles veröffentlichen jetzt `badgeIds` mit `beta-2026`.
- Study Circle Mitglieder und Freunde zeigen Beta-Badges.
- Circle-Mitglieder sind anklickbar und öffnen ein öffentliches Profilmodal.
- Im Profilmodal kann man sichtbare Circle-Mitglieder als Freund hinzufügen oder bestehende Freunde entfernen.
- Admin Feedback Control Center hat Schnellfilter für aktive, erledigte und archivierte Meldungen.
- Erledigte Feedbacks sind weiter über Statusfilter einsehbar und änderbar.
- Mobile/PWA CSS-Pass für kleinere Schrift, kompaktere Felder, bessere Safe-Area und Quick-Rail-Dichte.
- Service Worker Cache auf `gradeglow-v26`, `/premium` in App-Shell.
- Launch-Checkliste ergänzt um Premium-Seite und Firebase-Auth-Mail-Hinweis mit Owner-/Console-Rechte-Hinweis.

## Nicht enthalten

- Keine echte Zahlung.
- Keine Stripe-/RevenueCat-/StoreKit-Integration.
- Keine Firebase Functions.
- Keine Firestore Rules geändert.

## Testfokus

1. `/premium` öffnen und Free/Beta/Plus-Grenzen prüfen.
2. Study Circle öffnen, Mitglied anklicken, Profilmodal prüfen.
3. Circle-Mitglied, das noch kein Freund ist, über Profilmodal hinzufügen.
4. Freundesprofile auf Beta-Badge prüfen.
5. `/admin` öffnen, Feedback auf erledigt setzen und über Erledigt/Alle Status wiederfinden.
6. iPhone/PWA: Insights, Prüfungen/Lernplan, Study Circle und Launch Center auf Schrift-/Feldgröße prüfen.
7. Service Worker Update nach Deploy: PWA einmal neu laden, falls Update-Hinweis erscheint.

## Firebase Auth-Mail `project-...-Team`

Wenn Firebase die Änderung blockiert, liegt es sehr wahrscheinlich nicht am GradeGlow-Code. Prüfe in Firebase Console:

- Projektrollen: Du brauchst Owner oder ausreichende IAM-Rechte.
- Authentication → Templates / Branding / Public-facing project name.
- Google Cloud Console → OAuth Consent Screen / App name.
- Falls ein fremdes/älteres Firebase-Projekt genutzt wird: Projektbesitz oder Support prüfen.

---

<a id="archiv-beta-profile-mobile-ui-fix-update"></a>

## Originaldatei: `BETA_PROFILE_MOBILE_UI_FIX_UPDATE.md`

# GradeGlow Profile + Mobile UI Fix

## Anlass
Umgesetzt nach handschriftlichem UI-Feedback aus `UI fix.pdf`.

## Änderungen
- Mobile Schrift wieder größer und besser lesbar.
- Mobile/PWA-Theme-Flächen stärker an das ausgewählte Theme gebunden.
- Hero-Card oben ca. kompakter und mit verbleibenden Tagen bis zur nächsten Prüfung.
- Schnellzugriff auf Mobile entfernt, weil die Hotbar die Hauptnavigation enthält.
- Fortschritt deutlicher als Uni-Fortschritt erklärt.
- Fortschritt bekommt im Profil eine eigene Kreisgrafik mit Schnitt und Semester.
- Hotbar als transparentere Glass-Bar mit leichtem Blur überarbeitet.
- Timer-Tab nicht mehr so hoch angehoben; aktive Page bekommt eine sichtbare Umrandung.
- Neues `/profile` als echte App-Seite mit Hotbar.
- `/settings` bleibt getrennt für Profilbearbeitung, Features, Theme und Daten.
- Profilseite enthält Wochen-/Monatstrends, Lernzeit, Sessions, Top-Fach und letzte Session.

## Version
- App: `beta-2026-07-08-profile-mobile-ui-fix`
- Service Worker: `gradeglow-v44`

---

<a id="archiv-beta-pwa-readiness-update"></a>

## Originaldatei: `BETA_PWA_READINESS_UPDATE.md`

# GradeGlow PWA Readiness Update

Version: `beta-2026-07-02-pwa-readiness`

## Ziel

Dieser Patch setzt den nächsten sinnvollen Beta-Schritt nach der Release-Stability um: GradeGlow soll sich auf iPhone, iPad, Android und Desktop klarer wie eine installierbare App verhalten, ohne Capacitor oder App-Store-Builds bereits einzuführen.

## Änderungen

### PWA-Install-Karte

- Die Install-Karte erkennt jetzt iOS/iPadOS, Android und Desktop besser.
- iPhone/iPad bekommen konkrete Schritte:
  - Safari öffnen
  - Teilen-Symbol antippen
  - Zum Home-Bildschirm wählen
- Android/Desktop bekommen passende Install-Hinweise.
- Ein App-Link kann direkt kopiert werden.
- Online-/Offline-Status bleibt sichtbar.
- Wenn ein neuer Service-Worker bereitsteht, zeigt die Karte einen Update-Button.

### Service Worker / Offline

- Cache-Version auf `gradeglow-v24` erhöht.
- Zusätzliche Beta-Routen werden vorgecached:
  - `/feedback`
  - `/diagnostics`
  - `/schedule`
- Offline-Seite nennt jetzt auch Account-Aktionen und bietet einen Diagnose-Link.
- Firebase Auth Helper `__/auth/` bleibt weiterhin vom Service Worker ausgenommen.

### Mobile Safe-Area

- Zusätzliche CSS-Variablen für iOS Safe-Areas:
  - `--gg-safe-top`
  - `--gg-safe-right`
  - `--gg-safe-bottom`
  - `--gg-safe-left`
- Hilfsklassen ergänzt:
  - `.gg-safe-bottom`
  - `.gg-safe-x`
- Buttons/Links bekommen besseres Mobile-Tap-Verhalten.
- Standalone-PWA verhindert stärkeres Overscroll-Verhalten.

### Manifest / Meta

- Manifest hat jetzt eine App-ID und startet aus dem Homescreen mit `/?source=pwa`.
- `display_override` ergänzt, mit Fallback auf `standalone` und `browser`.
- `prefer_related_applications: false` gesetzt.
- iOS Status-Bar auf `black-translucent` gestellt.
- Telefon-Autodetection im Layout deaktiviert.

### Diagnostics

- Beta-Test-Checkliste erweitert um:
  - PWA installieren oder iOS-Install-Anleitung prüfen
  - Offline-Seite kurz testen
  - Update-Hinweis nach neuem Deploy prüfen

## Nicht geändert

- `firestore.rules`
- Firebase Functions
- Firebase Deploy-Konfiguration
- Capacitor-Abhängigkeiten

## Testempfehlung

1. Auf iPhone/iPad in Safari öffnen.
2. Install-Karte prüfen: iOS-Schritte müssen angezeigt werden.
3. App über Teilen → Zum Home-Bildschirm installieren.
4. PWA starten und prüfen, ob Safari-Leisten verschwinden.
5. Kurz offline gehen und eine bereits gecachte Route öffnen.
6. Nach einem neuen Deploy prüfen, ob der Update-Button erscheint.
7. `/diagnostics` öffnen und PWA-Checks abhaken.

---

<a id="archiv-beta-pwa-shell-monetization-prep-update"></a>

## Originaldatei: `BETA_PWA_SHELL_MONETIZATION_PREP_UPDATE.md`

# GradeGlow Beta Update – PWA Shell + Monetization Prep

Version: `beta-2026-07-02-pwa-shell-monetization-prep`

## Fokus

Dieser Patch trennt Mobile-Web und installierte PWA sauberer, entfernt Timer-Überreste aus dem Plan und bereitet Monetarisierung vor, ohne echte Anzeigen oder Zahlungen live zu schalten.

## Änderungen

- Mobile/PWA Header überarbeitet:
  - Appbar liegt jetzt im normalen Dokumentfluss statt als störendes Overlay.
  - Standalone-PWA nutzt eigene Safe-Area-Abstände.
  - Header sollte Content, Uhrzeit und Dynamic Island nicht mehr überdecken.
- Bottom-Hotbar weiter korrigiert:
  - sitzt unten als echte App-Tabbar.
  - PWA nutzt einen kompakteren Safe-Area-Modus.
  - Content bekommt passenden unteren Abstand.
- Plan/Timer weiter getrennt:
  - Plan-Tab zeigt keinen alten integrierten Timer-Control-Block mehr.
  - laufende Timer werden über `/timer` geöffnet.
  - Timer bleibt eigenständige Seite mit Fach, Modus, Dauer und Speichern/Verwerfen.
- Premium-Seite auf Mobile verbessert:
  - Feature-Tabelle wird mobil als Kartenliste dargestellt.
  - keine gequetschte Vier-Spalten-Tabelle mehr.
- Monetarisierung vorbereitet:
  - Empfehlung: Plus zuerst, Ads nur optional und sehr zurückhaltend.
  - neue Monetarisierungssektion auf `/premium`.
  - keine echten Ads, kein AdSense/AdMob, keine Payment-Integration aktiv.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine Payment- oder Ad-SDK-Abhängigkeiten hinzugefügt.
- Kein Firebase Deploy nötig.

---

<a id="archiv-beta-release-stability-update"></a>

## Originaldatei: `BETA_RELEASE_STABILITY_UPDATE.md`

# GradeGlow Beta Release Stability Update

Version: `beta-2026-07-02-release-stability`

## Ziel

Dieser Patch macht GradeGlow nach den Onboarding- und Lösch-Fixes beta-tauglicher. Schwerpunkt ist nicht ein großes neues Feature, sondern stabile Nutzerführung, mobile PWA-Reife und eine klare Test-Checkliste.

## Änderungen

### Onboarding Completion

- Nach erfolgreichem Onboarding leitet GradeGlow mit `?welcome=1` weiter.
- Das Dashboard zeigt danach einmalig eine Willkommens-/Setup-abgeschlossen-Box.
- Der Query-Parameter wird direkt aus der URL entfernt, damit die Box nicht dauerhaft wieder erscheint.
- `Setup überspringen` speichert jetzt explizit Minimal-Features statt aus Versehen wieder optionale Bereiche zu aktivieren.

### Account-Löschung / Datenschutz-UX

- Löschvorgänge zeigen jetzt konkrete Zwischenschritte an:
  - Sicherheitsbestätigung
  - Study-Circle-Daten
  - Module/Prüfungen/Stundenplan
  - öffentliche Profile/Benachrichtigungen
  - lokaler Cache
  - Firebase Login-Account
- Nach erfolgreicher App-Daten-Löschung wird der Nutzer abgemeldet und zur Startseite zurückgeführt.
- Nach erfolgreicher Account-Löschung wird ebenfalls zur Startseite zurückgeführt.
- Lokale GradeGlow-Daten werden gründlicher geleert, inklusive Nutzer-Key-bezogener Daten und Timer-/Quick-Rail-Resten.
- Netzwerkfehler bei Firebase-Löschung werden verständlicher gemeldet.

### Diagnostics / Beta-Test-Checkliste

- `/diagnostics` enthält jetzt eine lokale Beta-Test-Checkliste.
- Checkliste umfasst u. a.:
  - neuer Account
  - Onboarding Enter-Test
  - Feature-Auswahl
  - Profil Darkmode
  - Modul/Prüfung/Lerneinheit
  - Timer-Seitenwechsel
  - Study Circle
  - Export
  - App-Daten- und Account-Löschung mit Testaccount
- Der Checklistenstand wird lokal pro Nutzer gespeichert und kann zurückgesetzt werden.

### Beta Launch Panel

- Launch-Panel wurde für diesen Patch neu sichtbar gemacht (`dismissed-v2`).
- Beta-Test-Aufgabe ergänzt um Export und Lösch-Flow.

## Nicht geändert

- `firestore.rules`
- Firebase Functions
- Firebase Deploy-Konfiguration

## Testempfehlung

1. Neuen Testaccount erstellen.
2. Onboarding Step 1 ausfüllen und Enter drücken: darf nicht automatisch abschließen.
3. Step 2 ohne Auswahl versuchen: muss blockieren.
4. Empfohlen / Alles aktivieren / Minimal starten testen.
5. Nach Abschluss Dashboard-Willkommensbox prüfen.
6. `/diagnostics` öffnen und Checkliste abhaken.
7. Profil im System-/Darkmode prüfen.
8. Study Circle Code und Circle-Code testen.
9. Daten exportieren.
10. Mit Testaccount App-Daten löschen.
11. Mit neuem Testaccount komplette Account-Löschung testen.

---

<a id="archiv-beta-social-branding-readiness-update"></a>

## Originaldatei: `BETA_SOCIAL_BRANDING_READINESS_UPDATE.md`

# GradeGlow Beta Update: Social Polish + Branding Readiness

Version: `beta-2026-07-02-social-branding-readiness`

## Enthalten

- Study Circle v2 UI weiter poliert:
  - Freundescode, Circle erstellen und Circle-Code beitreten liegen jetzt zusammen im Bereich „Codes & Einladungen“.
  - Enter/Return in den Code-Feldern löst die passende Aktion aus und löst kein falsches Setup-/Seitenverhalten aus.
  - Aktiver Circle zeigt jetzt Owner/Member-Badge und den Circle-Code in einer klareren Kopierbox.
  - Linke Study-Circle-Karte ist weniger überladen und zeigt stattdessen einen Schnellcheck für Beta-Tests.
- Firebase Auth-Mail-Branding dokumentiert:
  - `/info` enthält jetzt eine konkrete Checkliste, warum `project-...-Team` nicht aus dem Code kommt.
  - Schritte für Public-facing name, Auth Templates, Sender name, Reply-to und Testmail sind dokumentiert.
- App-Version aktualisiert.

## Nicht geändert

- `firestore.rules` wurden nicht verändert.
- Firebase Functions wurden nicht deployed und nicht aktiviert.
- Keine Blaze-Abhängigkeit hinzugefügt.

## Testfokus

1. Study Circle öffnen und Sharing aktivieren.
2. Eigenen Freundescode kopieren.
3. Bei einem zweiten Account Freundescode einfügen und Enter drücken.
4. Prüfen: Beide Accounts sind danach gegenseitig befreundet.
5. Circle erstellen, Circle-Code kopieren, zweitem Account beitreten lassen.
6. Prüfen: Aktiver Circle zeigt Name, Owner/Member, Code, Mitglieder und Wochenmissionen.
7. `/info` öffnen und Firebase Auth-Mail-Branding-Checkliste prüfen.

## Commands

```bash
npm run lint
npm run typecheck
npm run build
```

Oder alles zusammen:

```bash
npm run check
```

## Deploy-Hinweis

Für diesen Patch reicht der normale Vercel-Code-Deploy über Git.

```bash
git status
git add .
git commit -m "polish study circle and document auth branding"
git push origin HEAD
```

Firebase Deploy ist nur nötig, wenn Firestore Rules geändert wurden. In diesem Patch also nicht nötig.

Firebase Functions weiterhin nicht deployen, solange das Firebase-Projekt auf Spark/free läuft.

---

<a id="archiv-beta-store-readiness-update"></a>

## Originaldatei: `BETA_STORE_READINESS_UPDATE.md`

# GradeGlow Beta Store Readiness Update

Version: `beta-2026-07-02-store-readiness`

## Ziel

Dieser Patch bereitet GradeGlow strukturiert auf App Store, TestFlight, PWA-Listing und spätere Store-Kommunikation vor, ohne Capacitor-Abhängigkeiten, Zahlungen, Ads oder Firebase Functions zu aktivieren.

## Neu

- Neue Seite `/store`
  - Store Readiness Score
  - lokale Store-Checkliste pro Account
  - Listing Draft mit Untertitel, Kurzbeschreibung und Keywords
  - Screenshot-Story für Store-/Marketing-Screenshots
  - Datenschutz-Label-Vorbereitung
  - kopierbarer Store Readiness Report
- Launch Center erweitert
  - Auto-Check für Store Readiness Center
  - manueller Check: Store Center geprüft
- PWA/Manifest erweitert
  - Shortcut für Store Readiness
  - Service Worker Cache `gradeglow-v33`
  - `/store` in App-Shell aufgenommen
- Navigation erweitert
  - Desktop/Beta-Navigation kennt jetzt Store als Beta-Werkzeug
- App-Version aktualisiert
  - `beta-2026-07-02-store-readiness`

## Nicht geändert

- Keine Firestore Rules
- Keine Firebase Functions
- Keine echten Ads
- Keine Zahlungen
- Keine Capacitor-Abhängigkeiten
- Keine neuen npm Dependencies

## Test

```bash
npm run lint
npm run typecheck
npm run build
```

In der Sandbox liefen Lint und Typecheck sauber. Build konnte wegen eines lokalen `node_modules`-Symlinks nicht final getestet werden; lokal/Vercel mit normalem `npm install` ausführen.

## Git

```bash
git add .
git commit -m "add store readiness center"
git push origin HEAD
```

---

<a id="archiv-beta-study-circle-polish-update"></a>

## Originaldatei: `BETA_STUDY_CIRCLE_POLISH_UPDATE.md`

# GradeGlow Beta – Study Circle Polish Update

Version: `beta-2026-07-02-study-circle-polish`

## Ziel

Dieser Patch poliert Study Circle v2 als nächsten Schritt nach dem Beta-Test Control Center. Der Fokus liegt auf einer klareren Circle-Verwaltung, besseren Einladungen und einem weniger technischen Standard-Layout.

## Änderungen

- Aktiver Circle zeigt jetzt eine kompaktere Verwaltungsbox.
- Circle-Code kann weiterhin direkt kopiert werden.
- Zusätzlich kann eine fertige Einladung mit Circle-Name und Circle-Code kopiert werden.
- Circle-Owner können das Wochenziel direkt im UI ändern.
- Wochenziel wird in Minuten gespeichert und auf 30 bis 6000 Minuten begrenzt.
- Mitgliederliste im aktiven Circle ergänzt.
- Mitgliederliste zeigt Owner/Member, eigene Person und Lernzeit der Woche.
- Technischer Study-Circle-Status ist jetzt einklappbar, damit das normale UI weniger nach Debug wirkt.
- App-Version aktualisiert.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine Capacitor-Abhängigkeiten ergänzt.

## Testplan

1. Study Circle öffnen.
2. Sharing aktivieren.
3. Circle erstellen.
4. Circle-Code kopieren.
5. Einladung kopieren.
6. Wochenziel als Owner ändern.
7. Mit zweitem Account Circle-Code beitreten.
8. Prüfen, ob Mitgliederliste und Leaderboard aktualisiert werden.
9. Technischen Status öffnen und wieder schließen.

---

<a id="archiv-beta-study-circle-v2-layout-update"></a>

## Originaldatei: `BETA_STUDY_CIRCLE_V2_LAYOUT_UPDATE.md`

# GradeGlow Beta – Study Circle v2 Layout Update

- Circle erstellen und Circle beitreten wurden aus der rechten Mini-Kachel entfernt.
- Die Circle-/Clan-Verwaltung steht jetzt links direkt unter dem eigenen Freundescode.
- Die rechte Spalte bleibt für Freund hinzufügen, Statistiken, Circle Game und Debug-Status.
- App-Version: beta-2026-07-02-study-circle-v2-layout

---

<a id="archiv-beta-study-circle-v2-update"></a>

## Originaldatei: `BETA_STUDY_CIRCLE_V2_UPDATE.md`

# GradeGlow Beta – Study Circle v2

## Neu

- Freund hinzufügen ist jetzt gegenseitig: Wenn Nutzer A den Code von Nutzer B eingibt, erscheinen beide gegenseitig als Freunde.
- Neuer Clan-/Circle-Modus:
  - Circle erstellen
  - Circle-Code kopieren
  - Circle per Code beitreten
  - aktiven Circle auswählen
  - Circle verlassen
  - Mitgliederliste und gemeinsames Wochenziel
- Circle Game nutzt den aktiven Circle, falls vorhanden.
- Einzelne Freundescodes bleiben kompatibel.
- `src/app/info/page.tsx` ist wieder im Paket enthalten.

## Firestore

Dieses Update braucht neue Rules für:

- `users/{uid}/studyCircles/{circleId}`
- `studyCircles/{circleId}`
- `studyCircles/{circleId}/members/{uid}`
- `studyCircleCodes/{code}`
- gegenseitiges Schreiben in `users/{friendUid}/friends/{ownUid}`

Deploy:

```bash
firebase deploy --only firestore:rules
```

## Version

`beta-2026-07-02-study-circle-v2`

---

<a id="archiv-beta-test-control-center-update"></a>

## Originaldatei: `BETA_TEST_CONTROL_CENTER_UPDATE.md`

# GradeGlow Beta Test Control Center Update

Version: `beta-2026-07-02-beta-control-center`

## Was geändert wurde

- `/admin` wurde zum Beta-Test Control Center erweitert.
- Die Admin-Übersicht zeigt jetzt mehr Beta-Kennzahlen:
  - Beta-Tester
  - aktive Premium/Admin-Accounts
  - aktive Rückmeldungen
  - kritische Rückmeldungen
  - aktive Bugs
  - aktive Feature-Wünsche
- Feedback kann jetzt direkt in `/admin` besser verwaltet werden:
  - Suche nach Betreff, User, Seite oder Nachricht
  - Filter nach Typ
  - Filter nach Status
  - Status ändern: offen, in Arbeit, geplant, erledigt, archiviert
  - Priorität ändern: niedrig, mittel, hoch, kritisch
  - Admin-Notiz speichern
  - Schnellaktionen: In Arbeit, Erledigt, Archivieren
- Feedback-Priorität `critical` wurde ergänzt.
- `/diagnostics` Admin-Panel zeigt jetzt zusätzliche Kontrollzahlen:
  - offene Diagnostics
  - kritische Diagnostics
  - aktive Client Errors
- Client Errors werden im Admin-Diagnostics-Panel zusätzlich gruppiert, damit wiederkehrende Fehler schneller auffallen.

## Nicht geändert

- `firestore.rules` wurden nicht verändert.
- Firebase Functions wurden nicht deployed oder aktiviert.
- Keine neuen Firebase Functions nötig.

## Test

```bash
npm run lint
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 CI=1 npm run build
```

Alle drei Checks laufen durch.

## Firebase Deploy

Nicht nötig, weil keine Rules geändert wurden.

Functions weiterhin nicht deployen, solange das Projekt auf Spark/free läuft.

---

<a id="archiv-beta-theme-stability-update"></a>

## Originaldatei: `BETA_THEME_STABILITY_UPDATE.md`

# GradeGlow Beta Theme Stability Update

## Enthalten

- Study Circle veröffentlicht jetzt Profilbilder auch dann, wenn kein hochgeladenes Base64-Bild existiert, aber ein Firebase/Google-Avatar vorhanden ist.
- Freundes-Profile akzeptieren öffentliche Bild-URLs und Base64-Avatare.
- Module und Stundenplan nutzen beim Seitenwechsel sofort das lokale Backup, während Firestore im Hintergrund prüft. Dadurch wirken ECTS, Module und Stundenplan beim Theme-Wechsel nicht mehr verschwunden.
- Die horizontale Quick-Rail merkt sich ihre Scrollposition und bringt den aktiven Bereich beim Seitenwechsel wieder in Sicht.
- Premium/Admin kann alle aktuellen Glow-Shop-Kosmetiken ohne GP-Kauf nutzen.
- Beim Auswählen eines Premium-Themes wird automatisch die passende Standard-Akzentfarbe gesetzt:
  - Rose Bloom → Rose
  - Study Sunrise → Amber
  - Lavender Haze → Violett
  - Matcha Focus → Emerald
  - Ocean Mist → Blau
  - Mocha Latte → Amber
- Akzentfarben bleiben danach weiterhin bewusst manuell kombinierbar.
- Kontrastregeln für Planner, StuPo, Admin, Study Circle, Formulare, Selects und Inputs wurden erweitert.
- Premium-Themes haben jetzt eigene Dark-Mode-Varianten.

## Nicht geändert

- Keine Firebase Functions nötig.
- Keine Firestore Rules geändert.
- Keine Datenstruktur-Migration nötig.

## Test

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

## Commit

```bash
git status
git add .
git commit -m "Stabilize beta themes and study circle avatars"
git push origin HEAD
```

---

<a id="archiv-beta-timer-home-profile-polish-update"></a>

## Originaldatei: `BETA_TIMER_HOME_PROFILE_POLISH_UPDATE.md`

# GradeGlow Timer/Home/Profile Polish

## Änderungen
- Timer-Auswahl merkt sich die zuletzt gewählte Fach/Klausur-Auswahl nach dem Speichern oder Verwerfen.
- Timer startet nicht mehr automatisch mit der ersten Prüfung; erstes Dropdown ist jetzt „Fach/Klausur auswählen“.
- Laufender Timer wird auf der Startseite nur noch in der Hero-Card gezeigt, nicht zusätzlich als zweiter Timer-Block.
- Profil-Lernzeitgrafik wirkt ruhiger: dünnere Linie, kleinere Punkte, dezenteres Grid und sichtbarer Zeitraum-Switch.
- GradeGlow-Logo bleibt auf der mobilen Startseite sichtbar.

## Version
- App-Version: beta-2026-07-18-timer-home-profile-polish
- Service Worker: gradeglow-v51

---

<a id="archiv-beta-ui-fix-2-update"></a>

## Originaldatei: `BETA_UI_FIX_2_UPDATE.md`

# GradeGlow UI Fix 2

## Umgesetzt
- Hotbar transparenter und stärker geblurt
- Kreis/Hervorhebung um den Timer in der Hotbar entfernt
- Mobile/PWA Safe-Area oben und unten weiter entschärft
- horizontales Links/Rechts-Schieben auf Mobile stärker unterbunden
- Daily-Glow/GP-Popup beim Öffnen der App, solange es für den Tag noch nicht abgeholt wurde
- Freunde entfernen jetzt mit zweitem Klick absichern statt Texteingabe
- Profil-Chip in der mobilen App-Leiste führt auf /profile statt direkt in /settings

## Version
- beta-2026-07-08-ui-fix-2
- Service Worker: gradeglow-v45

---

<a id="archiv-beta-ui-fix-3-repair-update"></a>

## Originaldatei: `BETA_UI_FIX_3_REPAIR_UPDATE.md`

# GradeGlow UI Fix 3 Repair

## Gefixt
- fehlerhaften Top-Blocker entfernt
- mobilen Header vollständig entfernt statt ihn zu verschieben
- Feedback bleibt als kleiner Floating-Button erhalten
- Hotbar stabilisiert: kein Timer-Kreis, keine hochgezogene Mitte, keine schiefe Platzierung
- Hotbar schmaler und transparenter, aber sauber zentriert
- echter Bottom-Blocker hinter der Hotbar ergänzt
- zusätzlicher End-Spacer am Seitenende, damit Content nicht unter die Hotbar läuft

## Version
- beta-2026-07-09-ui-fix-3-repair
- Service Worker: gradeglow-v47

---

<a id="archiv-beta-ui-fix-3-update"></a>

## Originaldatei: `BETA_UI_FIX_3_UPDATE.md`

# GradeGlow UI Fix 3

## Umgesetzt
- mobile Header stark reduziert; Feedback bleibt erhalten
- Top- und Bottom-Blocker ergänzt, Top-Blocker an Theme-Akzent angelehnt
- Hotbar schmaler, tiefer und transparenter mit stärkerem Blur
- unnötige/doppelte Mobile-Home-Karten reduziert
- Daily-Glow-Popup bleibt erhalten
- Profil mit klarerer Fortschrittsgrafik und Trendumschalter für Woche/Monat/Jahr
- Timer reduziert auf die wichtigsten Infos
- Plan auf Mobile mit klarerem Intro und kompakteren Steuerelementen
- Eingabefelder/Textareas auf Mobile lesbarer gemacht
- Freund entfernen weiterhin mit zweitem Klick bestätigt

## Version
- beta-2026-07-09-ui-fix-3
- Service Worker: gradeglow-v46

---

<a id="archiv-beta-ui-fix-4-typecheck-fix"></a>

## Originaldatei: `BETA_UI_FIX_4_TYPECHECK_FIX.md`

# GradeGlow UI Fix 4 Typecheck Fix

## Gefixt
- `GradeGlowDashboard.tsx`: fehlende lokale Hilfsfunktion `getDateKey(date)` ergänzt.
- `GradeGlowPlanner.tsx`: falscher Helper `createLocalDateFromKey(...)` durch vorhandenes `toDate(...)` ersetzt.
- App-Version auf `beta-2026-07-10-ui-fix-4-typecheck-fix` gesetzt.
- Service Worker auf `gradeglow-v49` gesetzt.

## Hinweis
Keine Firestore Rules, keine Functions, keine Payment-Änderungen.

---

<a id="archiv-beta-ui-fix-4-update"></a>

## Originaldatei: `BETA_UI_FIX_4_UPDATE.md`

# GradeGlow UI Fix 4 Update

## Enthaltene UI-Fixes

- **Glow Rewards:** Vorschau für den nächsten Daily-Claim korrigiert (z. B. nach Claim 1 nun 12 GP statt 10 GP).
- **Mobile Hotbar:** schmaler, stärker geblurrt, icon-only, ruhigerer aktiver Zustand und mehr Bottom-Space, damit weniger Inhalt darunter sichtbar ist.
- **Circle:** Schnellcheck-Block entfernt, damit mehr Platz für den eigentlichen Circle-Inhalt bleibt.
- **Einstellungen / Sichtbare Bereiche:** aktivierte Bereiche sind jetzt klarer hervorgehoben (dunkelgrüne Karte mit deutlichem Status).
- **Profil-Statistik:** neues Fortschrittsmodul mit 12-Wochen-Lernchart im Strava-Stil und Lernkalender-Heatmap.
- **Plan / Lernkalender:** kompakter Wochenfokus plus Agenda-Liste als übersichtlichere Alternative zum bisherigen dichten Kalender.

## Version

- App-Version: `beta-2026-07-10-ui-fix-4`
- Service Worker: `gradeglow-v48`

---

<a id="archiv-beta-ui-themes-update"></a>

## Originaldatei: `BETA_UI_THEMES_UPDATE.md`

# GradeGlow Beta UI + Theme Readiness Update

## Enthaltene Änderungen

- Premium-Seitenthemes erweitert:
  - Rose Bloom
  - Study Sunrise
  - Lavender Haze
  - Matcha Focus
  - Ocean Mist
  - Mocha Latte
- Seitenthemes und Akzentfarben sind jetzt kombinierbar.
  - Das Theme steuert große Flächen, Karten, Hintergründe und Orbs.
  - Die Akzentfarbe steuert Buttons, aktive States, Diagrammfüllungen und Progressbars.
- Theme-Variablen greifen jetzt auch auf separaten Beta-Seiten:
  - `/admin`
  - `/feedback`
  - `/diagnostics`
- Kontrast- und Button-State-Politur:
  - bessere Focus-States
  - klarere disabled-Zustände
  - konsistentere helle Karten in Premium-Themes
  - primäre Buttons und Diagramme laufen über zentrale CSS-Variablen
- UI-Audit erweitert:
  - erkennt klickbare Elemente ohne Label
  - erkennt Links ohne href
  - erkennt Buttons ohne type
  - erkennt pointer-events:none bei scheinbar aktiven Elementen
  - erkennt sehr kleine Tap-Targets
  - erkennt role=button ohne tabindex

## Nicht geändert

- Keine Firebase Functions deployed oder verpflichtend gemacht.
- Keine Dependency-Upgrades / kein `npm audit fix --force`.
- Firestore Rules wurden nicht angepasst, weil diese UI-/Theme-Änderungen keine neuen Collections oder Writes brauchen.

## Tests im Paket

- `npm run lint` erfolgreich
- `npm run typecheck` erfolgreich
- `npm run build` konnte in dieser Linux-Sandbox nicht vollständig ausgeführt werden, weil im hochgeladenen Paket nur das macOS SWC-Paket `@next/swc-darwin-arm64` enthalten war und Next für Linux `@next/swc-linux-x64-gnu` nachladen wollte. Lokal/Vercel sollte der Build mit normalem `npm install` bzw. Vercel-Install laufen.

---

<a id="archiv-beta-user-experience-polish-update"></a>

## Originaldatei: `BETA_USER_EXPERIENCE_POLISH_UPDATE.md`

# GradeGlow Beta User Experience Polish

Version: `beta-2026-07-04-beta-ux-polish`  
Service Worker: `gradeglow-v40`

## Ziel

Dieses Paket poliert die normale Beta-Nutzer-Erfahrung, ohne echte Payments, Functions oder Firestore-Rules anzufassen.

## Änderungen

### Normale Nutzer-App sauberer

- Store-Readiness und Native-App-Prep sind jetzt mit einem Beta/Admin-Gate geschützt.
- PWA-Shortcuts zeigen keine internen Bereiche mehr:
  - kein Launch Center
  - keine Monetarisierung
  - kein Store Readiness
  - kein Native Prep
- Service Worker pre-cached keine internen Beta-Werkzeuge mehr.
- Premium-/Plan-Texte zeigen normalen Nutzern keine Firebase-/ENV-Hinweise mehr.

### Feature-Auswahl stabiler

- Wenn ein Nutzer nach `Minimal` später direkt auf einen ausgeblendeten Bereich geht, erscheint jetzt ein sauberer Hinweis statt der versteckten Seite.
- Der Hinweis verlinkt direkt zu `/settings#features`.
- Mobile Home ersetzt `Circle` durch `Module`, wenn der Study-Circle-Bereich ausgeblendet wurde.
- Die mobile Bottom-Bar blendet `Circle` ebenfalls aus, wenn das Feature deaktiviert wurde.

### Beta-Test-Flow

- `BetaLaunchPanel` wurde inhaltlich zu einem nutzerfreundlichen Beta-Test-Guide entschärft.
- Diagnose-Link erscheint nur noch für Beta/Admin-Nutzer.
- Texte wirken weniger intern und erklären, was Beta-Tester konkret testen sollen.

### Feedback-Flow

- Feedback-Seite spricht Nutzer direkt an und erwähnt keine internen Firestore-Sammlungen mehr.
- Neue kleine Hilfe: Was eine gute Beta-Meldung enthalten sollte.
- Fehlertexte sind nutzerfreundlicher.

## Nicht geändert

- Keine Firebase Functions.
- Keine Firestore Rules.
- Keine echten Zahlungen.
- Keine Laptop-PWA-Struktur geändert.

## Tests

```bash
npm run lint
npm run typecheck
```

Beide Checks liefen erfolgreich.

`next build` kompiliert und beendet die TypeScript-Phase erfolgreich, hängt in der Sandbox aber in `Collecting page data using 35 workers`. Auf Vercel sollte der Build normal durchlaufen; lokal kann man ihn mit sauberem `npm install` erneut prüfen.

---

<a id="archiv-build-fix-support-email"></a>

## Originaldatei: `BUILD_FIX_SUPPORT_EMAIL.md`

# Build Fix: Support-Mail Export

Fix für Vercel-Build nach `schedule-week-fix`.

## Problem

`DiagnosticsPage.tsx` importierte `GRADEGLOW_SUPPORT_EMAIL` aus `src/lib/appVersion.ts`, aber `appVersion.ts` exportierte nur `GRADEGLOW_APP_VERSION`.

Vercel-Fehler:

```txt
The export GRADEGLOW_SUPPORT_EMAIL was not found in module [project]/src/lib/appVersion.ts
```

## Fix

`src/lib/appVersion.ts` exportiert jetzt zusätzlich:

```ts
export const GRADEGLOW_SUPPORT_EMAIL = "gradeglow.support@icloud.com";
```

## Version

`beta-2026-07-01-schedule-week-fix-1`

## Hinweise

- Keine Firestore Rules geändert.
- Keine Functions nötig.
- `src/app/info/page.tsx` ist weiterhin nicht enthalten.

---

<a id="archiv-calendar-hotbar-compact-fix-2026-07-22"></a>

## Originaldatei: `CALENDAR_HOTBAR_COMPACT_FIX_2026-07-22.md`

# Calendar and Hotbar Compact Fix — 22 July 2026

- Removed all mobile horizontal scrolling from the full month calendar.
- Forced the month view into seven equal responsive columns.
- Replaced mobile event labels with compact color dots; full details still open on tap.
- Reduced mobile day-cell height and spacing.
- Fixed overflow in the compact weekly preview and kept all seven days visible.
- Strengthened the active hotbar state in Light/System themes with the theme accent, outline and elevation.

---

<a id="archiv-capacitor-app-store-readiness"></a>

## Originaldatei: `CAPACITOR_APP_STORE_READINESS.md`

# GradeGlow: nächster Schritt zur iOS-/Android-App

Stand: 7. Oktober 2026. Dieses Paket verbessert die bestehende Web-App/PWA. Es enthält noch keinen nativen Store-Build.

## Vorhandener Stand

`capacitor.config.ts` existiert mit `appId: app.gradeglow.mobile` und `webDir: out`. Capacitor-Abhängigkeiten und native Plattformprojekte fehlen. Der aktuelle Next-Build läuft mit einem Server und erzeugt keinen verwendbaren `out`-Export. `.next` ist kein geeigneter Web-Asset-Ordner für Capacitor.

Die Hauptansichten bleiben jetzt beim Reiterwechsel gemountet. Authentifizierung und Dashboard-Daten werden dabei nicht erneut initialisiert. Die gespeicherte Theme-Wahl wird vor React angewendet. Diese Verbesserungen sind auch für eine spätere App relevant.

## Empfohlener Weg und konkrete Änderungen

Capacitor kann die bestehende React-Oberfläche in einer iOS-/Android-App wiederverwenden. Die Ansichten bleiben Web-Technik; native Funktionen werden über Plugins ergänzt. Für vollständig native UI-Komponenten wäre ein größerer Umbau, etwa mit React Native oder SwiftUI, nötig.

Die Oberfläche sollte lokal mitgeliefert werden. Die vorhandene `CAPACITOR_SERVER_URL`-Option würde die gehostete Website laden und deren Netzwerkabhängigkeit beibehalten; sie ist deshalb nicht das Ziel für diesen Release.

1. Einen eigenen mobilen Frontend-Build einrichten: Next mit `output: export` kompatibel machen oder die Client-Komponenten in einen separaten SPA-Build übernehmen. Den regulären Web-Build erhalten.
2. Serverabhängige Stellen im mobilen Build ersetzen: Firebase-Auth-Rewrite, dynamische Icon-Routen und Checkout-Routen mit serverseitigen `searchParams`. Die Firebase-Web-Push-Route für den mobilen Build durch native Push-Integration ersetzen; statische Icons mitliefern. Mobile Authentifizierung und Zahlungsrückkehr über passende Login-/Deep-Link-Flows verbinden. Dienste bleiben bei Firebase bzw. dem Backend.
3. Einen Asset-Ordner mit `index.html` erzeugen und sicherstellen, dass Hauptansichten lokal erreichbar sind. Offline-Start, Netzwerkfehler und Datenabgleich gezielt testen; die aktuelle PWA-Optimierung garantiert noch keine Offline-Navigation.
4. Capacitor und die iOS-/Android-Plattformen installieren, vorhandene Konfiguration gegen die gewählte Version prüfen. Erst mit funktionierendem mobilem Web-Bundle `cap add` und `cap sync` ausführen.
5. Splashscreen, Statusleiste und Tastatur an das gespeicherte Theme anpassen; die vorhandene Vorbereitung enthält feste helle Farben. Safe Areas, native Push-Benachrichtigungen und Deep Links auf Geräten testen.
6. iOS in Xcode und Android in Android Studio bauen, signieren und testen. Danach TestFlight bzw. den Play-Testkanal vorbereiten.

Das ist ein eigener Implementierungsschritt. Die Konfigurationsdatei allein macht aus dem Projekt noch keine installierbare native App.

## Primärquellen

- https://capacitorjs.com/docs/getting-started
- https://nextjs.org/docs/app/guides/static-exports
- https://capacitorjs.com/docs

---

<a id="archiv-capacitor-native-prep"></a>

## Originaldatei: `CAPACITOR_NATIVE_PREP.md`

# GradeGlow Capacitor / Native App Prep

Patch: `beta-2026-07-02-capacitor-prep`

## Ziel

Dieser Patch bereitet GradeGlow für eine spätere iOS-/Android-App vor, ohne die aktuelle Web-App oder PWA zu gefährden.

Wichtig:

- Vercel bleibt das normale Deployment.
- PWA bleibt produktiv.
- Firebase Functions werden nicht deployed.
- Keine Blaze-Pflicht.
- Keine nativen Plattformordner (`ios/`, `android/`) wurden erzeugt.
- Keine echten Zahlungen, keine Ads, keine In-App-Purchases.
- Keine neuen npm-Abhängigkeiten wurden installiert.

## Neue Dateien

- `capacitor.config.ts`
- `src/lib/nativeAppReadiness.ts`
- `src/components/NativeAppReadinessPage.tsx`
- `src/app/native/page.tsx`

## Native App Readiness Seite

Neue Route:

```txt
/native
```

Die Seite enthält:

- Native Readiness Score
- App-ID: `app.gradeglow.mobile`
- App-Name: `GradeGlow`
- WebDir: `out`
- lokale Native-Checkliste pro Account
- kopierbarer Native App Readiness Report
- klare Trennung zwischen PWA-first und späterem Store-Build

## Capacitor Config

`capacitor.config.ts` ist bewusst ohne Type-Import aus `@capacitor/cli` geschrieben, damit `npm run typecheck` nicht fehlschlägt, solange Capacitor noch nicht installiert ist.

Die Config ist vorbereitet für:

- App-ID
- App-Name
- späteres `out`-Verzeichnis
- iOS/Android Safe-Area-/Statusbar-/Keyboard-Defaults
- optionalen gehosteten Preview-Build über `CAPACITOR_SERVER_URL`

## Spätere Befehle

Erst ausführen, wenn du wirklich mit Xcode/Android Studio weiterarbeitest:

```bash
npm install @capacitor/core @capacitor/cli
npm install -D @capacitor/assets
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npm run build
npx cap sync
```

## Wichtige technische Entscheidung

GradeGlow ist aktuell eine Next.js/Vercel-App. Für Capacitor gibt es später zwei Wege:

### Weg A: Hosted Native Preview

Die native App lädt deine Vercel-App über `CAPACITOR_SERVER_URL`.

Vorteil:

- Schnell testbar.
- Kein sofortiger Next static export nötig.

Nachteil:

- Für Store-Review muss genau geprüft werden, ob es nicht nur wie ein dünner WebView-Wrapper wirkt.
- Offline-Fähigkeit hängt stärker vom Web/PWA-Cache ab.

### Weg B: Static Export

GradeGlow wird so angepasst, dass `next build` ein statisches `out/` erzeugt.

Vorteil:

- Sauberer für native Verpackung.
- App enthält mehr lokal gebündelte Oberfläche.

Nachteil:

- Next.js-Funktionen, die Serververhalten brauchen, müssen geprüft werden.
- Firebase Auth Redirects, PWA Routes und dynamische Pages müssen einzeln getestet werden.

## Was vor TestFlight geprüft werden muss

1. iOS PWA bleibt stabil.
2. Mobile Shell hat keine Header-/Statusbar-Overlaps.
3. Bottom-Hotbar verdeckt keine Inhalte.
4. `/timer` ist wirklich eigene Fokus-Seite.
5. Google Login funktioniert im Capacitor WebView.
6. Passwort-Reset und Account-Löschung funktionieren in native WebView.
7. Push-Strategie ist entschieden.
8. Plus/IAP-Strategie ist entschieden.
9. Datenschutz/Impressum/Support final geprüft.
10. App-Icons und Splashscreen sind sauber generiert.

## Monetarisierung Hinweis

Für digitale Plus-Funktionen in einer iOS-App müssen später Apples In-App-Purchase-Regeln geprüft werden. Deshalb sind echte Zahlungen in diesem Patch bewusst nicht aktiv.

Ads bleiben nur als optionale spätere Sponsor Card sinnvoll. Keine Ads im Timer oder Fokusmodus.

---

<a id="archiv-deployment"></a>

## Originaldatei: `DEPLOYMENT.md`

# GradeGlow Deployment auf Vercel

## 1. Projekt vorbereiten

Lokal prüfen:

```bash
npm install
npm run check
```

Falls `npm run build` lokal funktioniert, ist die App bereit für Vercel.

## 2. Firebase Web-App Werte kopieren

In Firebase:

1. Project Settings öffnen
2. Web-App auswählen
3. Firebase Config kopieren
4. Werte in Vercel als Environment Variables eintragen

Benötigt werden:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## 3. Vercel Projekt anlegen

1. Projekt aus GitHub importieren
2. Framework Preset: Next.js
3. Build Command: `npm run build`
4. Install Command: `npm install`
5. Environment Variables eintragen
6. Deploy klicken

## 4. Firebase Authorized Domains

Nach dem Vercel Deployment musst du die Vercel Domain in Firebase Authentication erlauben.

Beispiele:

```txt
gradeglow.vercel.app
www.deine-domain.de
```

Firebase Console → Authentication → Settings → Authorized domains.

## 5. OAuth Provider aktivieren

### Google

Firebase Console → Authentication → Sign-in method → Google aktivieren.

### GitHub

1. GitHub OAuth App erstellen
2. Callback URL aus Firebase eintragen
3. Client ID und Client Secret in Firebase hinterlegen
4. GitHub Provider aktivieren

### Apple

Apple Login braucht zusätzliche Apple Developer Daten:

- Service ID
- Team ID
- Key ID
- Private Key
- OAuth Redirect URL aus Firebase

Danach Apple Provider in Firebase aktivieren.

## 6. Firestore Rules veröffentlichen

In Firebase Console → Firestore Database → Rules den Inhalt aus `firestore.rules` einfügen und veröffentlichen.

## 7. PWA testen

Nach dem Deployment:

1. Vercel URL in Chrome öffnen
2. Dashboard öffnen
3. Install-Button testen
4. DevTools → Application → Manifest prüfen
5. DevTools → Application → Service Workers prüfen
6. Kurz offline gehen und prüfen, ob `offline.html` erscheint

## 8. Vercel Analytics & Speed Insights

Vercel Analytics ist eingebaut über:

```tsx
import { Analytics } from "@vercel/analytics/next";
```

Speed Insights ist zusätzlich eingebaut über:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";
```

Beide Komponenten liegen im Root Layout (`src/app/layout.tsx`). Auf Vercel musst du im Projekt zusätzlich Analytics und Speed Insights aktivieren:

1. Vercel Projekt öffnen
2. Tab **Analytics** öffnen und Analytics aktivieren
3. Tab **Speed Insights** öffnen und Speed Insights aktivieren
4. Danach neues Production Deployment auslösen

## 9. Eigene Domain als Zusatz-Domain

Empfehlung für GradeGlow:

```txt
gradeglow.app
```

Die bestehende Vercel Domain bleibt weiterhin erreichbar. Die eigene Domain ist nur ein zusätzlicher Einstiegspunkt.

Vercel Setup:

1. Vercel Projekt öffnen
2. Settings → Domains
3. `gradeglow.app` hinzufügen
4. Falls du auch `www.gradeglow.app` willst, ebenfalls hinzufügen
5. DNS-Einträge beim Domain-Anbieter exakt so setzen, wie Vercel sie anzeigt
6. Warten, bis Vercel die Domain als validiert anzeigt

Danach auch Firebase aktualisieren:

- Firebase Console → Authentication → Settings → Authorized domains
- `gradeglow.app` hinzufügen
- optional zusätzlich `www.gradeglow.app` hinzufügen

Falls Google/GitHub Login über die neue Domain genutzt werden soll, müssen die OAuth Redirects ebenfalls ergänzt werden:

```txt
https://gradeglow.app/__/auth/handler
https://www.gradeglow.app/__/auth/handler
```

Die bestehende Firebase Handler-URL bleibt zusätzlich drin:

```txt
https://gradeglow.firebaseapp.com/__/auth/handler
```

## 10. Wichtiger Hinweis

Die Firebase Web Config darf mit `NEXT_PUBLIC_` im Browser landen. Sie ersetzt aber keine Firestore Security Rules. Die Rules sind der eigentliche Schutz für private Nutzerdaten.


## Neue App-Routes prüfen

Nach dem Deployment sollten diese URLs erreichbar sein:

- `/`
- `/modules`
- `/planning`
- `/exams`
- `/insights`
- `/backup`
- `/settings`
- `/info`

Wenn am Handy noch die alte Ein-Seiten-Ansicht erscheint, Safari/Browser-Cache hart neu laden oder die PWA einmal schließen und erneut öffnen. Der Service Worker nutzt jetzt mindestens `gradeglow-v12`.


### Mobile/PWA Layout Fix

Dieses Update enthält zusätzliche Mobile-Sicherungen gegen horizontales Überlaufen in der installierten iOS-PWA. Wichtige Änderungen: Safe-Area-Abstand für die Statusleiste, `overflow-x-hidden`, umbrechende Buttons/Texte und kompaktere Header auf kleinen Screens. Nach dem Deployment die installierte PWA einmal komplett schließen und neu öffnen, damit der Service Worker und die neue CSS-Version greifen.


### Prüfungen-Kalender testen

Nach dem Deployment im Bereich `/exams` prüfen:

1. Prüfung mit Datum anlegen
2. Monats-/Wochenansicht umschalten
3. Prüfungstag im Kalender anklicken
4. Lernblock-Empfehlungen und den rechten Lernplan prüfen
5. Mobile/PWA testen, weil der Kalender bewusst als 7-Spalten-Layout gebaut ist


## Update: Prüfungsplanung v2

- Kalender nutzt deutsche Datumsanzeige (TT.MM.JJJJ) und 24h-Uhrzeit.
- Automatischer Lernplan verteilt Blöcke mit maximal 5 Stunden Lernzeit pro Tag.
- Prüfungsseite ist nicht mehr doppelt eingeklappt, sondern zeigt Kalender und Details direkter.
- Mobile/PWA-Kalenderzellen sind kompakter und gegen horizontalen Overflow abgesichert.
- Service Worker Cache-Version: `gradeglow-v13`.

## Nach Update Onboarding/Lernblöcke

Nach dem Deployment bitte besonders testen:

1. Neuer Account → Onboarding-Wizard erscheint.
2. Bestehender Account → falls kein Onboarding-Flag gesetzt ist, einmal Setup abschließen oder überspringen.
3. `/exams` → Prüfung erstellen, Lernstart-Tage ändern, Plan neu generieren.
4. Lerneinheit verschieben, abhaken, Notiz ergänzen und ausblenden.
5. `/settings` → Daten & Account Bereich sichtbar. Löschung nur nach Bestätigung `LÖSCHEN`.
6. PWA nach Deployment einmal vollständig schließen, weil der Service Worker jetzt `gradeglow-v14` nutzt.

---

<a id="archiv-exam-details-input-calendar-fix"></a>

## Originaldatei: `EXAM_DETAILS_INPUT_CALENDAR_FIX.md`

# Prüfungsdetails: Eingabe- und Kalender-Sync-Fix

- Numerische Felder in den Prüfungsdetails verwenden jetzt lokale Texteingaben.
- Werte werden erst beim Verlassen des Feldes oder mit Enter validiert und gespeichert.
- Felder können vollständig geleert und anschließend frei neu eingegeben werden.
- „Einheit min“ akzeptiert jetzt unter anderem 45 direkt, ohne aus 15 → 152 → 300 zu springen.
- Mindestwert für eine Lerneinheit ist 1 Minute; Obergrenze bleibt das Tagesmaximum.
- Dasselbe Eingabeverhalten gilt für Starttage, Gesamtpensum und Tagesmaximum.
- Beim Ändern des Prüfungsdatums springt der Kalender sofort zum neuen Monat/Tag und zeigt den Termin dort an.

---

<a id="archiv-fcm-setup"></a>

## Originaldatei: `FCM_SETUP.md`

# GradeGlow Firebase Cloud Messaging Setup

Dieses Update baut echte Web-Push-Benachrichtigungen über Firebase Cloud Messaging ein.

## Was neu ist

- Dynamischer Firebase Messaging Service Worker unter `/firebase-messaging-sw.js`
- Frontend-Hook für Push-Permission und FCM Token
- Token-Speicherung unter `users/{uid}/notificationTokens/{tokenId}`
- Notification Settings unter `users/{uid}/notificationSettings/main`
- Notification Center unter `users/{uid}/notifications/{notificationId}`
- Cloud Function `sendFriendActivityPush`
- Push an Freunde, wenn `studyActivityEvents/{uid}` geändert wird
- Ruhezeiten zwischen 22:00 und 08:00 Uhr, einstellbar in der App

## Firebase Console: Web Push Key erzeugen

1. Firebase Console öffnen
2. Projekt `gradeglow` auswählen
3. Projekteinstellungen öffnen
4. Tab `Cloud Messaging`
5. Abschnitt `Web Push certificates`
6. Key Pair generieren
7. Den öffentlichen Schlüssel kopieren

Dann in `.env.local` eintragen:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=dein_public_web_push_key
```

Auch in Vercel unter Project Settings → Environment Variables eintragen.

## Lokal installieren

```bash
npm install
cd functions
npm install
cd ..
```

## Lokal prüfen

```bash
npm run lint
npm run typecheck
npm run build
cd functions && npm run build && cd ..
```

## Firebase deployen

Wichtig: Cloud Functions Deployment braucht in Firebase normalerweise den Blaze/pay-as-you-go Plan. Lege am besten direkt ein Budget-Limit in Google Cloud an.

```bash
firebase deploy --only firestore:rules,functions
```

Falls du nur Rules deployen willst:

```bash
firebase deploy --only firestore:rules
```

Falls du nur Functions deployen willst:

```bash
firebase deploy --only functions
```

## Firestore-Struktur

```txt
users/{uid}/notificationSettings/main
users/{uid}/notificationTokens/{tokenId}
users/{uid}/notifications/{notificationId}
studyActivityEvents/{uid}
```

## Test-Flow

1. Zwei Firebase-Accounts erstellen oder zwei Browser/Profile nutzen
2. Bei beiden Study Circle aktivieren
3. Freundecode austauschen
4. Unter Einstellungen → Benachrichtigungen Push aktivieren
5. Bei Account A eine Lernsession starten
6. Account B sollte eine Notification-Center-Nachricht erhalten und, wenn Push erlaubt ist, eine Browser-Push-Benachrichtigung

## Wichtig

Push funktioniert nur, wenn der Browser Benachrichtigungen erlaubt und die Seite über HTTPS läuft. Lokal funktioniert es auf `localhost`. Auf iPhone/iPad ist Web-Push in der Praxis am verlässlichsten, wenn GradeGlow als PWA zum Home Screen hinzugefügt wurde.

---

<a id="archiv-gradeglow-3-ui-patch"></a>

## Originaldatei: `GRADEGLOW_3_UI_PATCH.md`

# GradeGlow 3.0 UI Patch

## Enthalten
- neuer themenabhängiger Fokus-Timer mit Fortschrittsring
- ruhige Timer-Animation mit Reduced-Motion-Fallback
- kompakte Wochenvorschau ohne horizontales Scrollen
- optimierter gemeinsamer Ein-/Ausklappbereich für Wochenfokus und Agenda
- verfeinertes Lernzeitdiagramm mit Theme-Farben, Glow-Fläche und Punkt-Tooltips
- verbesserte mobile Abstände und Touch-Zustände

## Test
1. `npm install`
2. `npm run dev`
3. Kalender, Timer und Profil auf Mobile/PWA prüfen
4. `npm run typecheck`
5. `npm run lint`
6. `npm run build`

---

<a id="archiv-july-22-ui-calendar-edit-update"></a>

## Originaldatei: `JULY_22_UI_CALENDAR_EDIT_UPDATE.md`

# GradeGlow UI-, Kalender- und Bearbeitungsupdate (22.07.2026)

- Light-Theme mit klareren, hochwertigeren Flächen und weicheren Kontrasten verbessert.
- PWA-/Safe-Area-Fläche oben übernimmt jetzt dynamisch den aktiven Theme-Hintergrund.
- Mobile Kalenderansicht repariert: keine gequetschten 7-Spalten-Karten mehr; Kalender bleibt sichtbar und ist horizontal nutzbar.
- Wochenfokus/Agenda sowie Fortschrittsübersicht lassen sich unabhängig ein- und ausklappen.
- Der eigentliche Kalender wird niemals eingeklappt.
- Prüfungen können im Detailbereich hinsichtlich Titel, Datum, Uhrzeit, Fach und Notiz bearbeitet werden.
- Prüfungen und Lerneinheiten erhalten vor dem Löschen eine Bestätigung.
- KI-Lerneinheiten werden als `source: "ai"` gekennzeichnet.
- Manuell bearbeitete KI-Einheiten erhalten `userEdited: true` und werden bei einer Neugenerierung nicht mehr überschrieben.
- Manuelle Einheiten werden als `source: "manual"` gespeichert.

## Prüfung

- `npm run typecheck`: erfolgreich
- `npm run lint`: erfolgreich
- `npm run build`: konnte in der isolierten Umgebung nicht abgeschlossen werden, weil das Next.js-SWC-Paket vom Paketserver mit HTTP 503 nicht geladen werden konnte. Es gab keinen lokalen TypeScript- oder ESLint-Fehler.

---

<a id="archiv-mobile-pwa-calendar-dock-fix-2026-07-22"></a>

## Originaldatei: `MOBILE_PWA_CALENDAR_DOCK_FIX_2026-07-22.md`

# Mobile PWA calendar and dock correction

- Month calendar is a true seven-column layout that fits portrait screens.
- Calendar no longer uses nested horizontal scrolling.
- Swipe left/right directly on the calendar changes month/week; vertical page scrolling remains available.
- Day cells are reduced to a compact 3.35rem height and use tiny event bars.
- Bottom navigation is one translucent dock with a quiet active background and indicator dot.
- Timer navigation slot is no longer oversized.
- Focus timer ring is reduced for portrait PWA screens.

---

<a id="archiv-oct-07-darkmode-navigation-update"></a>

## Originaldatei: `OCT_07_DARKMODE_NAVIGATION_UPDATE.md`

# GradeGlow – Darkmode, Logo und Navigation

Stand: 7. Oktober 2026. Vollständiger Projektstand, einschließlich des vorherigen Updates für Einstieg und Gast-Demo.

## Änderungen

- Darkmode-Hotbar mit dunklem Hintergrund, klarem Rand, lesbaren inaktiven Icons und deutlich markiertem aktivem Reiter. Der Dock im Portal trägt eigene Theme- und Akzentwerte.
- Einstellungen → Look & Feel: vier Logo-Modi Automatisch, Hell, Dunkel und Rosé. Automatisch folgt dem Design-Modus. Mit „Profil speichern“ übernehmen. Dies betrifft das Logo in der App; ein installiertes PWA-Homescreen-Icon wird dadurch nicht ausgetauscht. Premium-Icons bleiben verfügbar; die Auswahl einer dieser Varianten aktiviert das Standardlogo.
- Zehn Dashboard-Routen teilen eine dauerhaft gemountete Dashboard-Instanz. Die fünf Hotbar-Reiter behalten Authentifizierung, Daten-Hooks und Dock beim Wechsel; Browser-Zurück bleibt nutzbar. Eigenständige Seiten wie Einstellungen teilen die Authentifizierung, können das Dashboard beim Wechsel aber neu mounten.
- Gespeicherter Design-Modus wird im Dokumentkopf vor React angewendet. Dokument-Hintergrund und Farbschema folgen der App. System-Darkmode wird nicht mehr von einer späteren hellen Standardregel überschrieben.
- Service-Worker-Cache auf Version 53 erhöht.

## Übernahme

Das gesamte Projekt übernehmen, insbesondere `layout.tsx`, `GradeGlowAppHost.tsx`, `AuthGate.tsx` und Routendateien zusammen. Dashboard-Routendateien geben die Ansicht an den gemeinsamen Root-Host ab; einzelne Dateien auszulassen würde diese Ansichten beschädigen.

Eigene Umgebungsvariablen beibehalten. `npm ci`, anschließend `npm run check`. Lokaler Start: `npm run dev`. Dieses Paket wurde nicht auf der Live-Website veröffentlicht und enthält weder `node_modules` noch Build-Ausgaben.

## Verifiziert

- ESLint, TypeScript und Produktions-Build bestanden. Eine bereits vorhandene ESLint-Warnung zum Hook in `Planner.tsx` bleibt bestehen.
- Mobiles Chromium mit 393 × 852 Pixeln: Dark-/Light-Hotbar, zentrierter Dock ohne horizontalen Überlauf; dieselben Dashboard-/Dock-DOM-Knoten bei fünf Reiterwechseln und Browser-Zurück, kein erneuter Auth-Ladescreen.
- Vier Logo-Optionen, automatische Anpassung beim System-Moduswechsel, gespeicherte Rosé-Auswahl und Wiederherstellung des expliziten Darkmode nach Neuladen bei hellem System-Modus geprüft.
- Gast-Einstieg, isolierte Demo-Daten, Basic-/Pro-Umschaltung und bestehender Registrierungsablauf erneut in Komponententests geprüft.

Browserprüfung mit lokalen Demo-Daten. Firebase-Login, Cloud-Synchronisierung und iPhone-PWA einschließlich Notch wurden in diesem Durchlauf nicht auf einem realen Gerät geprüft. Der Umbau vermeidet das erneute Laden der Kernansichten, verspricht jedoch keine vollständig netzunabhängige Navigation.

## Native App

Der weitere Weg steht in `CAPACITOR_APP_STORE_READINESS.md`. Capacitor-Konfiguration ist vorhanden; ein lokal gebündelter mobiler Build und native Plattformprojekte müssen noch implementiert werden.

---

<a id="archiv-oct-07-einstieg-demo-update"></a>

## Originaldatei: `OCT_07_EINSTIEG_DEMO_UPDATE.md`

# GradeGlow – Einstieg & Probezugang (07.10.2026)

Grundlage: vollständiges GradeGlow-Paket vom 22.07.2026.

## Änderungen
- Eine Willkommensseite mit Logo, kurzem Text und drei Einstiegswegen.
- Registrierung und Login erst nach Auswahl; Zurück-Button führt zum Einstieg.
- Beta-Kommunikation, doppelte Hero-Fläche, Techniktexte und deaktivierter Apple-Button auf dem Einstieg entfernt.
- Vorhandenes Onboarding folgt nach der Anmeldung; E-Mail-Bestätigung bleibt erhalten.
- Probezugang ohne Registrierung mit fünf Beispielmodulen, zwei Prüfungen und Lerneinheiten.
- Basic/Pro-Vorschau verwendet dieselben Funktionslimits wie Free/Premium. Sie ist eine lokale Vorschau und aktiviert kein Abo.
- Demo nutzt einen separaten Benutzerbereich; Änderungen bleiben auf dem Gerät. Navigation und Neuladen erhalten die Sitzung; Beenden beendet den Probezugang.
- „Konto erstellen“ verlässt die Demo. Neue Konten starten ohne Beispieldaten und ohne Pro-Freischaltung.
- Safe-Area-Hintergrund, viewport-fit=cover und transparente iOS-Statusleiste für PWA vorbereitet.
- Beta-Panels im normalen Dashboard ausgeblendet; sie bleiben intern verfügbar.
- Service-Worker-Version erhöht, damit installierte PWAs das Update laden.

## Einspielen
Das Archiv enthält das vollständige Projekt im Ordner GradeGlow-2.
Den Inhalt dieses Ordners in das bestehende Projekt übernehmen, einschließlich der beiden neuen Dateien src/lib/guestDemo.ts und src/components/DemoAccessBar.tsx.
Bestehende Umgebungsvariablen behalten. Firebase, Abos und Deployment-Konfiguration müssen für dieses Update nicht geändert werden.
Dann wie gewohnt über das bestehende Repository deployen. Dieses Paket wurde nicht veröffentlicht.

## Prüfung
npm run check erfolgreich: Lint ohne Fehler (eine bereits vorhandene Warnung in GradeGlowPlanner.tsx), TypeScript und Produktionsbuild.
React/DOM-Integration geprüft: Willkommensseite, separate Login-/Registeransicht, Demo-Daten, Planwechsel und Limits, Sitzungswiederherstellung, Beenden, Registrierung nach Demo, getrennte Kontodaten.
Demo-Hooks bei konfigurierter Cloud geprüft: Module, Prüfungen und Profil bleiben lokal.
PWA-Metadaten im Produktions-HTML geprüft.
Ein visueller Test auf einem echten iPhone/in der installierten PWA steht noch aus; Social Login und E-Mail-Versand wurden hier nicht live getestet.

---

<a id="archiv-oct-07-mobile-ui-calendar-update"></a>

## Originaldatei: `OCT_07_MOBILE_UI_CALENDAR_UPDATE.md`

# GradeGlow: Mobile UI, Lumi und Kalender

Stand: 7. Oktober 2026. Vollständiges Quellprojekt, kein Live-Deployment und kein nativer iOS-/Android-Build.

## Was geändert wurde

- Fester mobiler Kopfbereich: „GradeGlow“ auf Home, ansonsten der aktuelle Bereich. Mit App-Menü, Einstellungen und Abstand zur Geräte-Safe-Area.
- Beschrifteter, kontrastreicher Dock für Home, Kalender, Fokus, optional Circle und Profil. Inhalte erhalten eigenen unteren Abstand; Kopfbereich und Inhalte addieren Safe Areas nicht doppelt.
- Onboarding-Verlauf reicht über die gesamte Dokumenthöhe bis unter den Home-Indikator. Der andersfarbige untere Streifen entfällt.
- Neuer mobiler Feed: ein erreichbarer nächster Schritt, echte Lernaktivität der Woche, anstehende Lernblöcke/Prüfungen und Studienfortschritt. Keine erfundenen Streaks oder Belohnungen.
- „Lumi“, ein eigenständiges SVG-Sternmaskottchen mit Buch. Reagiert mit einem fröhlichen Ausdruck auf erledigte Lernblöcke; kein Duolingo-Asset.
- Neuer Kalender mit Tag, Woche und Monat, Heute-Sprung, Datumsauswahl, Inhaltsfilter und Plus-Menü. Die Tagesansicht zeigt alle 24 Stunden, die Woche eine gut lesbare Agenda, der Monat ein Raster mit Terminpunkten und ausgewähltem Tag.
- Überschneidende Lernblöcke werden nebeneinander angezeigt. Eine Prüfung hat im bisherigen Datenmodell keine Dauer: Sie erhält nur einen visuellen Marker mit „Dauer offen“, keine erfundene gespeicherte Prüfungsdauer.
- Bestehende Tagesdetails, Prüfungsformulare, Lernblock-Erstellung und desktopseitiges Verschieben auf ein anderes Datum sind weiter angebunden. Touch-Geräte können das Datum in den Details bearbeiten.
- Tagesübersicht, Formulare, Moduldetails und Daily Glow verwenden native Browser-Dialoge. Diese liegen über dem Dock, sperren Hintergrund-Scrollen und bieten Fokusbegrenzung/Escape. Daily-Glow-Aktionen werden nicht mehr verdeckt.
- Profilkarten und Diagramm-Bedienelemente skalieren besser auf kleinen Displays. Dunkle Vergleichskarten bleiben dunkel und lesbar.
- Die persistente App-Ansicht verwaltet jetzt auch Scrollpositionen pro Reiter. Neue Bereiche beginnen oben, bereits besuchte Bereiche behalten ihre Position.
- Die bisherigen vier Logo-Varianten und die Dark-/Light-/System-Auswahl bleiben erhalten.

## Technische Schwerpunkte

Neue Komponenten: `MobileAppHeader`, `AppDialog`, `StudyHomeFeed`, `GlowMascot`, `StudyCalendar`.

`src/app/mobile-ui.css` bündelt die Regeln für den neuen mobilen Aufbau und wird nach den bisherigen globalen Styles geladen. `src/lib/calendarLayout.ts` berechnet lokale Kalendertage und kollisionsfreie Ereignisspuren. Der Service-Worker-Cache ist auf `gradeglow-v54` angehoben.

## Prüfung

- Lint, Typecheck und Produktions-Build. Keine Lint-Fehler; eine bestehende Hook-Abhängigkeitswarnung im Planner bleibt unverändert.
- Bestehende Einstiegstests: Login/Registrierung, isolierter Gastmodus, Basic/Pro, sauberer Ausstieg, Erhalt vorhandener Daten.
- Kalender-Layouttests: Überlappungen, direkt angrenzende Termine, Tagesgrenze, ungültige Uhrzeiten und lokale Datumsberechnung über die Zeitumstellung.
- Browser-Prüfung in Chromium: 320×568, 360×740, 375×667, 393×852, 430×932, 768×1024, 844×390 und 1024×768. Dark/Light, Querformat und simulierte obere/untere Safe Areas.
- Reiterwechsel ohne Austausch des Dashboard-Hauptknotens/Docks, Tages-/Wochen-/Monatsansicht, Terminerstellung, Modal-Top-Layer, Daily-Glow-Button-Kontrast sowie Logo-/Theme-Persistenz.

Nicht geprüft: echtes iPhone-Safari/PWA-Verhalten, echte Android-Geräte und angemeldete Cloud-Synchronisierung. Die UI bleibt eine PWA; diese Änderung erzeugt keine native App.

## Übernahme

Das vollständige Projekt übernehmen, nicht nur einzelne Komponenten: Layout, App-Host, Styles und Dialoge gehören zusammen. Konfigurationswerte und bestehende private Umgebungsdateien aus dem eigenen Projekt behalten; keine Zugangsdaten sind im Paket enthalten.

```sh
npm ci
npm run check
npm run dev
```

Nach dem späteren Deployment die bereits installierte PWA vollständig schließen und neu öffnen. Bei weiterhin altem Stand die Service-Worker-Aktualisierung prüfen; lokale Nutzerdaten nicht pauschal löschen.

---

<a id="archiv-oct-08-lumi-homescreen-update"></a>

## Originaldatei: `OCT_08_LUMI_HOMESCREEN_UPDATE.md`

# Lumi und Homescreen-Icon – 8. Oktober 2026

Gezielte Ergänzung zum mobilen UI-Update vom 7. Oktober. Kalender, Feed-Daten, Konten und gespeicherte Noten bleiben unverändert.

- Lumi erhält einen schattierten Sternkörper, goldene Kopfhörer, Hoodie, Sneaker, einen kleinen Glow-Stern und eine Peace-Geste. Er zwinkert bei erledigten Lernblöcken. Die dezente Bewegung respektiert reduzierte Animationen.
- Einstellungen unterscheiden klar zwischen dem Logo innerhalb der App und dem tatsächlichen Homescreen-Icon.
- Drei Homescreen-Bilder: Hell, Dunkel und Rosé, jeweils als echte PNGs für Apple-Touch-Icon und Web-App-Manifest. Die Auswahl führt auf eine eigene Installationsseite mit bereits serverseitig passender Icon-Metadaten-Konfiguration.
- Alle Varianten behalten dieselbe Manifest-ID, denselben Scope und dieselbe Start-URL. Die Auswahl ist keine Änderung des Lernprofils und ersetzt kein bereits installiertes Icon per JavaScript.

## Dark/Light automatisch

Ein automatischer Wechsel eines bereits installierten PWA-Icons ist hier nicht zuverlässig zugesichert. Die standardisierten Manifest-Icon-Felder enthalten keine Dark-/Light-Zuordnung; SVG-Unterstützung allein ist kein Nachweis, dass iOS gespeicherte Home-Bildschirm-Bilder bei jedem Moduswechsel neu rendert. Deshalb gibt es eine ausdrücklich manuelle Installationsauswahl.

Native iOS-Apps können eigene dunkle/getönte Icon-Varianten im Xcode-Asset-Katalog bzw. Icon Composer hinterlegen. Dieses Quellprojekt enthält weiterhin keinen fertigen nativen iOS-Build.

Quellen:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/
- https://developer.apple.com/documentation/xcode/configuring-your-app-icon

## Übernehmen

Das aktualisierte Projekt enthält weiterhin den vorherigen UI-Stand. Für diese Ergänzung sind nur Lumi, die zusätzlichen Homescreen-Komponenten/Styles/Installationsseiten, die Icon-Assets, Einstellungen, Layout-Import sowie App-/Cache-Version geändert.

Nach dem Deployment: Einstellungen → „Icon auf deinem Homescreen“ → Stil wählen → Installationsseite in Safari öffnen → Teilen → Zum Home-Bildschirm. Vorhandenes Icon erst entfernen, wenn Konto und Daten über die neue Verknüpfung geprüft sind; keine Website-Daten löschen. Android kann bei bereits vorhandener Installation das bisherige Icon beibehalten.

Build und Browser-Prüfung kontrollieren die Metadaten, Assets, Auswahl und Darstellung. Der tatsächliche iOS-Homescreen-Installationsdialog und ein Wechsel des Systems wurden nicht auf einem echten iPhone getestet.

---

<a id="archiv-phase2-notes"></a>

## Originaldatei: `PHASE2_NOTES.txt`

UI FIX AND MASCOT — FOREGROUND FOCUS FIX
GradeGlow: weiterhin Next.js-Homescreen-PWA, kein aktiver Capacitor-Wrapper.
Keine neuen Dependencies. Native TODO-Skelette bleiben unverändert.
Alle Quelldateien im ZIP sind vollständig und unter ihren originalen Pfaden.

ZUORDNUNG DER AKTUELLEN FIXES
1 Nav / echter Bildschirmrand:
  src/app/mobile-ui.css
  src/app/layout.tsx
  src/app/manifest.ts
  src/lib/appearance.ts
2 Header / Overlay-Diagnose:
  src/app/mobile-ui.css
  src/components/MobileAppHeader.tsx
  src/components/GradeGlowDashboard.tsx
3 Tageskalender / Lernplan:
  src/components/StudyCalendar.tsx
  src/lib/calendarLayout.ts
  src/components/GradeGlowPlanner.tsx
  src/app/mobile-ui.css
4 Vordergrund-Timer / Kontrast:
  src/lib/focusSession.ts
  src/components/FocusSessionProvider.tsx
  src/components/FocusReturnNotice.tsx
  src/components/FocusSettingsCard.tsx
  src/lib/focusNotifications.ts
  src/components/GradeGlowDashboard.tsx
  src/lib/gradeglowExams.ts
  src/lib/studyStats.ts
  src/types.ts
  src/app/mobile-ui.css
5 ECTS:
  src/components/EctsProgressRing.tsx
  src/components/GradeGlowDashboard.tsx
  src/app/mobile-ui.css
6 Donnerstag / heutiger Haken / Chartwerte:
  src/components/LearningTrend.tsx
  src/components/StudyHomeFeed.tsx
  src/app/mobile-ui.css
Cache-Aktualisierung: public/sw.js (v59).
Tests: tests/focus-session.test.mjs, tests/ui-fixes.test.mjs.
package.json, package-lock.json und capacitor.config.ts sind unverändert.

HEADER-DIAGNOSE
Der gelieferte Stand enthält am Header bereits filter:none und backdrop-filter:none.
Ein Reset dort allein verändert darüberliegende Backdrops nicht.
Konkrete gefundene Konflikte:
- Toasts: fixed + top-3 + z-50 + backdrop-blur. Jetzt unterhalb des Headers,
  mit geringerem z-index und ohne wirksamen Backdrop-Blur auf mobilen Screens.
- Alter body::before-Layer mit z-index:9998 im Safe-Area-Bereich: in der
  mobilen App deaktiviert. Die Header-Fläche selbst übernimmt den oberen Inset.
- dialog.gg-app-dialog::backdrop: blur(7px) zeichnet beim geöffneten Dialog auch
  Header-Inhalt weich. Dieser Blur wurde entfernt; der Hintergrund dimmt nur.
Der Header-Reset (filter/backdrop/text-shadow/opacity) ist für App-Header und
Kinder aktiv; Masken, Blend-Modi, will-change und Header-Pseudo-Overlays sind aus.
Ohne aktuelle iPhone-Ansicht lässt sich NICHT beweisen, welche Regel die im
geschlossenen Zustand gemeldete Unschärfe auf dem Gerät verursacht hat.
Die automatisierten Tests sind keine iPhone-Pixel-/Safe-Area-Prüfung.

ZEITREGELN
- States: idle, running, away, paused, finished, abgebrochen.
- Nur sichtbare Vordergrundsegmente zählen. Kulanzkonstante AWAY_GRACE_MS=10000.
- Beim Verlassen sofort away; Fokuszeit bleibt stehen. Bis einschließlich
  10 Sekunden wird die Unterbrechung nach Rückkehr vollständig toleriert.
  Bei mehr als 10 Sekunden wird die GESAMTE Abwesenheit ausgeschlossen.
- focusedMs ist die Quelle aller neuen Timer-Lernzeiten. Dauer in Minuten
  wird daraus abgeleitet, nie aus Endzeit minus Beginn.
- awayMs/awayCount zählen ausgeschlossene Abwesenheiten. Die lokalen
  absences enthalten auch tolerierte kurze Intervalle.
- Ereignisse: visibilitychange, pagehide/pageshow, focus/blur.
  Mehrfachereignisse sind idempotent. Bei Rückkehr automatisch running, außer
  nach manueller Pause oder echter Wiederherstellung eines beendeten Prozesses.
- Rückkehrtext: „Pausiert, weil du die App verlassen hast (2:14)“; verschwindet
  nach 8 Sekunden oder per „Alles klar“.
- Sichtbare Heartbeats speichern alle 5 Sekunden einen fokussierten Checkpoint.
  Nach Reload/App-Kill bleibt die Session paused, beim letzten sicheren Stand.
  Fehlende Ereignisse beim Kill können echte Vordergrundzeit seit dem Checkpoint
  verlieren (normalerweise bis etwa 5 Sekunden; bei eingefrorenem JS mehr),
  führen aber nicht zu einer Gutschrift unbekannter Hintergrundzeit.
  Der unbekannte Abstand zum Checkpoint ist eine konservative Abwesenheitsschätzung.
- Die Countdown-Deadline wird erst beim Fortsetzen neu aus der restlichen
  Fokuszeit berechnet. Eine lange Abwesenheit beendet den Fokusblock nicht.
- Ein gespeicherter Lernblock enthält focusedMs, awayMs, awayCount. Aggregierte
  Daten werden über den vorhandenen Account-Sync mit dem Lernblock gespeichert;
  detaillierte Abwesenheitsintervalle bleiben im lokalen Timer-Store.
  Study Sharing erhält nur die abgeleitete Lerndauer, keine Abwesenheitsdaten.
- Historische/manuell abgeschlossene Einheiten ohne focusedMs behalten ihre
  ursprüngliche Dauer; verlorene Vordergrundhistorie lässt sich nicht nachträglich
  aus Start-/Endzeiten rekonstruieren.
- Bildschirm wach halten: standardmäßig an, abschaltbar in Einstellungen.
  request('screen') nur während sichtbarer laufender Session; Freigabe bei
  Pause/away/Ende, erneute Anfrage bei Rückkehr. Fehler bleiben still.
  Verfügbarkeit hängt vom Browser und iOS ab, keine Garantie gegen Sperrung.
- Benachrichtigungen weiterhin nur nach gesondertem Opt-in und Browserfreigabe.
  Keine garantierten Alarme bei App-Kill, keine anderen Apps werden gesperrt.
- Happy beim Lauf, sleepy bei Pause/away, panic bei away über 60 Sekunden,
  celebrate bei fertig. Der Rückkehrhinweis zeigt in Einstellungen die Reaktion.
- Leere Timer-Sessions erhalten keine künstliche Lernminute.

PRÜFUNG
  node --test tests/*.test.mjs
  npm run typecheck
  npm run lint
  npm run build
42 Tests: State-Store, Grace-Grenzen, Kill/Reload, gespeicherte Metriken, tatsächliche
Provider-Eventhandler mit simuliertem Safari und Wake-Lock, SSR-Chart/ECTS/Home.
Typecheck/Build erfolgreich. Lint: 0 Fehler, bestehende focusedExam-Hook-Warnung.
Echte iPhone-Render- und OS-Tests bleiben manuell.

IPHONE-CHECKLISTE
[ ] Nach Deployment einmal vollständig schließen/öffnen; neuen Cache v59 laden.
    Safari und installierte PWA, Light/Dark/System sowie kleines iPhone prüfen.
[ ] Nav bündig bis zum Bildschirmrand; nur Home-Bar-Inset darunter. Kein leerer
    Block, keine zweite Linie. Alle fünf Tabs gleich; nur aktive Pille, 12px Rand.
[ ] Header scharf bei Scrollen, Navigation, Toast und geöffnetem Menü; SVG-Icons
    mittig in 44x44-Buttons. Bei verbleibender Unschärfe Screenshot + iOS-Version.
[ ] Kalender: nur 280px/40dvh Stundenfenster scrollt, Lernplan liegt darunter.
    00–06 und 20–24 durch Scrollen erreichbar. Start heute jetzt−1h innerhalb
    06–18, anderes Datum erster Termin oder 06. Stundenhöhe 44px.
[ ] Jetzt-Linie nahe einem Stundenlabel prüfen: unter 14px Distanz Label verborgen.
    Auch abends 21:29/21:45 testen. Studienblöcke durchgehend akzentfarben.
[ ] Lernplan: zwei Aktionsbuttons nebeneinander, versteckte Einträge als Textlink,
    ein Filter-Chip öffnet beide Filter; eine Akkordeon-Liste.
[ ] Timer: 1min Vordergrund, 2:14 andere App, 1min Vordergrund, speichern:
    focusedMs ungefähr120000, awayMs134000, awayCount1; Home/Profil/Kalender2min.
[ ] Wechsel unter/über10s testen: Kulanz bis10s; darüber kein Abwesenheitsanteil
    gutgeschrieben. Doppelereignisse ergeben einen einzigen Abwesenheitseintrag.
[ ] Bildschirm wach halten aus: Sperrbildschirm2min, entsperren, automatisch
    fortsetzen; gesperrte Zeit zählt nicht. Einstellung an und Stromsparmodus prüfen.
[ ] PWA während running/away killen, später neu öffnen: paused am letzten
    Checkpoint, Fach erhalten, kein nachträgliches Lernen. Fortsetzen manuell.
[ ] Manuelle Pause, Hintergrund und Rückkehr: bleibt pausiert.
[ ] Zielende im Vordergrund: celebrate, genau einmal speichern. Geplante Einheit
    wird aktualisiert; kurzer Zeitwert bleibt nach Reload unverändert.
[ ] Fokus-Seite Dark/System: Karte, Selects, Labels und Meldungen kontrastreich.
[ ] ECTS: runder88x88-SVG-Ring, nur Prozent innen; ECTS + Restzahl rechts.
[ ] Lerntrend: Mo–So inklusiveDo; nur heutiger Wert dauerhaft, andere perTap
    mit genauer Zeit. Monat/Jahr weiterhin maximal6 X-Labels.
[ ] Heute auf Home nach erledigtem Block: Ring UND Haken bleiben.
[ ] Hinweise ablehnen/erlauben/ausschalten; kein Prompt ohne eigenen Tap.
    Bei Zustimmung zeigt Hintergrundhinweis „pausiert“, nicht „läuft weiter“.

Native Vorbereitung unverändert: plugins/focus-lock/APPLE_SETUP.txt.

---

<a id="archiv-premium-setup"></a>

## Originaldatei: `PREMIUM_SETUP.md`

# GradeGlow Premium / Beta-Test Setup

Dieses Projekt hat Premium bereits zentral vorbereitet über:

```txt
src/lib/gradeglowAccess.ts
src/hooks/useGradeGlowAccess.ts
firestore.rules
```

## Empfohlene Variante: entitlements/{uid}

Für manuell vergebene Premium-, Beta-, Lifetime- oder Admin-Rechte ist diese Collection am saubersten:

```txt
entitlements/{USER_UID}
```

Für 1 Jahr Beta-Test-Premium ab dem 24.06.2026 trägst du in Firebase Console ein:

| Feld | Typ | Wert |
|---|---|---|
| `plan` | string | `premium` |
| `premiumUntil` | string | `2027-06-24` |
| `premiumSource` | string | `beta_test` |
| `premiumStatus` | string | `active` |
| `note` | string | `1 Jahr Beta-Test Premium` |
| `updatedAtIso` | string | aktueller ISO-Zeitstempel, optional |

Warum diese Variante besser ist:

- User können `entitlements/{uid}` lesen, aber nicht selbst schreiben.
- Die App liest diesen Plan automatisch über `useGradeGlowAccess`.
- Du vermischst Profil-/App-Daten nicht mit Zahlungs-/Premiumrechten.

## Alternative Variante: users/{uid}

Der Code ist zusätzlich kompatibel mit Premium-Feldern direkt im User-Dokument:

```txt
users/{USER_UID}
```

Mögliche Felder:

| Feld | Typ | Wert |
|---|---|---|
| `plan` | string | `premium` |
| `isPremium` | boolean | `true` |
| `premiumStatus` | string | `active` |
| `premiumSource` | string | `beta_test` |
| `premiumExpiresAt` | timestamp | `24.06.2027` |
| `betaTester` | boolean | `true` |

Wichtig: Wenn beide existieren, gewinnt `entitlements/{uid}`.

## Was wurde eingebaut?

### 1. `src/lib/gradeglowAccess.ts`

- Erkennt weiterhin alte Entitlement-Dokumente.
- Erkennt zusätzlich `users/{uid}` Felder wie `isPremium`, `premiumStatus`, `premiumExpiresAt`.
- Lässt Premium automatisch auslaufen, wenn das Ablaufdatum überschritten ist.

### 2. `src/hooks/useGradeGlowAccess.ts`

- Hört jetzt auf beide Dokumente:
  - `entitlements/{uid}`
  - `users/{uid}`
- Berechnet daraus den aktiven Plan und die Limits.

### 3. `src/components/PremiumGate.tsx`

Für neue Premium-Features kannst du später so sperren:

```tsx
import PremiumGate from "../components/PremiumGate";

<PremiumGate plan={entitlement.plan}>
  <DeinPremiumFeature />
</PremiumGate>
```

### 4. `src/lib/premium.ts`

Hilfsfunktionen, falls du später über ein Admin-Panel oder Backend automatische Payloads erzeugen willst:

```ts
buildOneYearBetaEntitlement();
buildOneYearBetaUserFields();
```

## Firestore Rules

Die Rules erlauben:

- User lesen ihr eigenes `entitlements/{uid}` Dokument.
- User schreiben `entitlements/{uid}` nicht selbst.
- User lesen ihr eigenes `users/{uid}` Dokument.
- User dürfen geschützte Premium-Felder unter `users/{uid}` nicht selbst setzen oder verändern.

Geschützte Felder:

```txt
plan
isPremium
premiumStatus
premiumSource
premiumExpiresAt
premiumUntil
betaTester
role
```

## Nach dem Eintragen testen

1. App neu laden.
2. In GradeGlow zu Einstellungen gehen.
3. Unter `Plan & Premium` sollte stehen:

```txt
Premium aktiv bis 2027-06-24 · Beta
```

Dann sind Premium-Themes, höhere Limits und Advanced Stats aktiv.

---

<a id="archiv-safe-profile-load-update"></a>

## Originaldatei: `SAFE_PROFILE_LOAD_UPDATE.md`

# GradeGlow Safe Profile Load Update

Dieses Paket schützt Profil- und Study-Circle-Daten vor leeren Zwischenständen während Firebase Auth/Firestore noch lädt.

## Änderungen

- Dashboard zeigt jetzt einen echten Ladezustand, bis das Cloud-Profil geladen ist.
- `saveProfile` blockiert Speichern, solange das Profil noch nicht geladen wurde.
- Auto-Saves aus Rewards/Planner können dadurch keine leeren Default-Profile mehr über echte Profildaten schreiben.
- Study Circle wartet auf das geladene Profil, bevor öffentliche Profile veröffentlicht oder gelöscht werden.
- Study-Circle-Buttons sind deaktiviert, solange das Profil lädt.
- Vor künftigen Profil-Speicherungen wird ein lokales Profil-Backup gehalten (`gradeglow-profile-backups-v1-{uid}`).

## Wichtig

Dieses Update verhindert zukünftige Überschreibungen. Bereits überschriebenen Firestore-Daten kann die App ohne vorhandenes Backup nicht automatisch rekonstruieren.

---

<a id="archiv-study-circle-dock-center-patch"></a>

## Originaldatei: `STUDY_CIRCLE_DOCK_CENTER_PATCH.md`

# Study Circle / Mobile Dock patch

- Mobile navigation is rendered through a React portal directly into `document.body` so transformed app wrappers cannot offset it.
- A full-width fixed shell centers the dock against the actual viewport.
- The Study Circle landing state now shows only the user's compact profile/code card above the comparison.
- Intro text, plan/sharing status, friend/circle management, notifications and privacy controls are only shown after expanding the profile card.

---

<a id="archiv-study-session-persistence-update"></a>

## Originaldatei: `STUDY_SESSION_PERSISTENCE_UPDATE.md`

# Study Session Persistence Update

## Was wurde gefixt?

### 1. Manuelle Lernzeiten und Timer-Lernzeiten bleiben gespeichert

Der Prüfungs-/Lernplan-Sync entfernt jetzt rekursiv `undefined` aus verschachtelten Daten, bevor Exam-Dokumente in Firestore gespeichert werden.

Warum wichtig: Firestore akzeptiert keine `undefined`-Werte, auch nicht innerhalb von Arrays wie `studySessions`. Dadurch konnten manuelle Lerneinheiten oder Timer-Sessions lokal kurz erscheinen, aber der Cloud-Save konnte fehlschlagen und nach Reload wieder verschwinden.

Geändert in:

```txt
src/hooks/useGradeGlowExams.ts
```

### 2. Lokales Backup wird gerettet

Wenn localStorage mehr manuelle/erledigte Lernblöcke enthält als Firestore, wird dieser lokale Stand beim Laden bevorzugt und erneut in die Cloud geschrieben. Dadurch gehen Lerneinheiten, die vorher lokal gespeichert waren, nicht direkt durch einen älteren Cloud-Stand verloren.

### 3. Lernblöcke sind direkt editierbar

In der Tagesübersicht im Kalender können Lernblöcke jetzt direkt angepasst werden:

- Datum
- Uhrzeit
- Dauer
- Titel
- Notizen
- erledigt/nicht erledigt

Außerdem wurden die Detailfelder im Lernplan-Fokus auf native Date-/Time-Inputs umgestellt, damit Datum und Uhrzeit zuverlässig bearbeitbar sind.

Geändert in:

```txt
src/components/GradeGlowPlanner.tsx
```

## Deploy

Da nur Frontend und Firestore-Client-Sync geändert wurden, reicht normalerweise:

```bash
npm install
npm run build
git status
git add .
git commit -m "Fix study session persistence and editing"
git push origin HEAD
```

Firestore Rules musst du nur neu deployen, wenn du sie lokal verändert hast:

```bash
firebase deploy --only firestore:rules
```

Cloud Functions musst du für diesen Fix nicht deployen.

---

<a id="archiv-update-notes-beta-admin"></a>

## Originaldatei: `UPDATE_NOTES_BETA_ADMIN.md`

# Update Notes: Beta Feedback, Data Controls & Admin

## Added

- `/feedback` route with authenticated beta feedback form
- `/admin` route for admin-only beta user management
- reusable `BetaNoticeCard`
- Firestore `feedback` collection helpers
- Admin entitlement helpers
- data export and deletion request in settings
- stronger delete flow for schedule, friends, feedback, study circle data and notification data
- Admin access gated through `entitlements/{uid}.plan = admin`

## Verification

- `npm run typecheck` passed
- `npm run lint` passed
- `cd functions && npm run build` passed
- `npm run build` could not complete in this sandbox because Next tried to download Linux SWC and npm registry access is blocked here. This is the same sandbox limitation as before, not a TypeScript or ESLint failure.

---

<a id="archiv-update-notes-june-24"></a>

## Originaldatei: `UPDATE_NOTES_JUNE_24.md`

# GradeGlow Update vom 24.06.2026

Integriert:

- Prüfungskalender mit Ansichtsfilter: Alles, Nur Prüfungen, Nur Lernplan.
- Neuer Bereich `/schedule` für einen eigenen Uni-Stundenplan.
- Stundenplan-Sync über `users/{uid}/schedule/{scheduleId}` plus lokales Backup.
- Fokus-Timer mit frei einstellbarer Dauer und Presets: 25, 30, 45, 60, 90, 120 Minuten.
- In-App-Popup oben, wenn Freunde eine Lernsession starten oder abschließen.
- Toggle in Study Circle: „Popups aktivieren“.
- Firestore Rules um `users/{uid}/schedule/{scheduleId}` erweitert.

Geprüft:

```bash
npm run typecheck
npm run lint
npm run build
```

Alle Checks laufen durch.

---

<a id="archiv-plugins-focus-lock-apple-setup"></a>

## Originaldatei: `plugins/focus-lock/APPLE_SETUP.txt`

Family Controls — spätere native iOS-Anbindung

Jetzt nur vorbereitet: TypeScript-Vertrag, Web-No-op und leere Swift-TODO-Datei.
Kein Capacitor-Paket, Xcode-Projekt oder nativer Sperr-Code wurde hinzugefügt.

1. APP-ID
   Im Apple-Developer-Konto unter Certificates, Identifiers & Profiles eine
   explizite App-ID mit deiner tatsächlichen Bundle-ID verwenden/registrieren.
   capacitor.config.ts sieht derzeit app.gradeglow.mobile vor. Beim späteren
   Xcode-Projekt muss die Bundle-ID dazu passen. Extension-IDs separat anlegen.

2. CAPABILITY FÜR ENTWICKLUNG
   Im späteren Xcode-App-Target unter Signing & Capabilities „Family Controls“
   hinzufügen, ebenso bei jedem verwendeten Screen-Time-Extension-Target.
   Das Entitlement heißt com.apple.developer.family-controls = true.
   Bei manueller Signierung Capability auch an der App-ID aktivieren und
   Provisioning-Profile neu erstellen. App Group für App/Monitor gemeinsam
   vorsehen, damit Auswahl und Deadline im nativen Speicher verfügbar bleiben.

3. DISTRIBUTION BEANTRAGEN
   Der Account Holder beantragt Family Controls für Distribution:
   https://developer.apple.com/contact/request/family-controls-distribution
   Alternativ: Certificates, Identifiers & Profiles > Capability Requests.
   Für App und jede genutzte Screen-Time-Extension separat beantragen; für
   spätere DeviceActivityMonitor-/Shield-Targets gilt die Freigabe nicht
   automatisch durch die Haupt-App. Vor TestFlight/App-Store-Auslieferung nötig.

4. IM ANTRAG ERKLÄREN
   GradeGlow hilft Studierenden, freiwillige Lernblöcke einzuhalten. Nutzer
   aktivieren die Funktion bewusst, autorisieren individual Screen Time und
   wählen selbst im FamilyActivityPicker die störenden Apps aus. Nur diese
   Auswahl wird zeitlich begrenzt mit ManagedSettings abgeschirmt; Pause,
   Abbruch und Ablauf geben die Sperren wieder frei. Die Berechtigung bleibt
   widerrufbar. Die App sammelt keine installierte App-Liste für Werbung oder
   Profiling; opaque Auswahl-Tokens bleiben lokal. Screenshots des Opt-in- und
   Auswahl-Flows beilegen, sofern das Formular danach fragt. Nicht behaupten,
   dass Nutzer GradeGlow nicht verlassen könnten. Kein fremdes Gerät überwachen.

5. NACH FREIGABE
   Status „Assigned“ und benötigte Distribution-Methoden prüfen. Automatic
   Signing aktualisiert die Profile; bei Manual Signing neu generieren.
   Anschließend native Implementierung und Tests ergänzen. Erst dann den
   Web-Adapter gegen das reale Capacitor-Plugin austauschen. Der native Bridge-
   Name muss FocusLock sein; Date wird als untilIso übergeben.

WICHTIGE NATIVE TODOS
- FamilyControls AuthorizationCenter für .individual, nur nach Nutzeraktion.
- FamilyActivityPicker, lokale persistente FamilyActivitySelection, opaque Tokens.
- ManagedSettingsStore für die ausdrücklich gewählte Auswahl.
- DeviceActivityMonitor-Extension + nativer Zeitplan, um abgelaufene Shields
  auch ohne laufenden Hauptprozess aufzuheben. System-Callbacks können erst
  bei Gerätenutzung erfolgen; abgelaufene Deadlines auch in der Extension und
  beim App-Start abgleichen. Kurze Sessions/System-Schedule-Limits prüfen.
- Pause/Stop: eigenen Shield-Store löschen; Resume: neuen Ablaufzeitpunkt setzen.
- Berechtigungsentzug und ersetzte Sessions müssen ebenfalls freigeben.
- isSupported erst true melden, wenn die native Funktion wirklich einsatzbereit ist.

PRIMÄRQUELLEN (geprüft am 09.10.2026)
https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement
https://developer.apple.com/documentation/xcode/configuring-family-controls
https://developer.apple.com/documentation/deviceactivity/deviceactivitymonitor
https://developer.apple.com/documentation/deviceactivity/deviceactivitycenter
https://capacitorjs.com/docs/plugins/ios
https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
