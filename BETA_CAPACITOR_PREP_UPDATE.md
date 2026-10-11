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
