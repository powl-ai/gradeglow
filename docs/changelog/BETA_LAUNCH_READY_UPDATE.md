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
