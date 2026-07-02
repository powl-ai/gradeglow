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
