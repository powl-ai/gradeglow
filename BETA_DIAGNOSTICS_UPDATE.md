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
