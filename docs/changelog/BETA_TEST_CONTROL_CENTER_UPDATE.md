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
