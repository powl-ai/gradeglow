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
