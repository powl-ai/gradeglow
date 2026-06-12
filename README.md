# GradeGlow

GradeGlow ist eine Next.js/TypeScript/Tailwind-Web-App für Studienfortschritt, Notenschnitt, ECTS, Prüfungen und Lernplanung.

## Aktueller Funktionsstand

- Firebase Authentication
  - E-Mail/Passwort
  - Google Login
  - GitHub Login
  - Apple Login
- Firestore Cloud-Sync pro Account
- Module als einzelne Firestore-Dokumente unter `users/{userId}/modules/{moduleId}`
- Profil/Settings unter `users/{userId}/gradeglow/settings`
- Prüfungsplaner unter `users/{userId}/exams/{examId}`
- lokaler Fallback über `localStorage`
- PWA mit Manifest, Service Worker, Offline-Fallback, Install-Button und App-Icons
- Dashboard mit Semester-Gruppierung, Diagrammen, Zielnotenrechner und Backup Export/Import
- lokaler KI-Lernplan-Generator für Prüfungsvorbereitung

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
