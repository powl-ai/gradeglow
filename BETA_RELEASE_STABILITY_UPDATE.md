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
