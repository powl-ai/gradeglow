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
