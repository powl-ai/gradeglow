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
