# GradeGlow Beta Update – Mobile Social Notifications

Version: `beta-2026-07-02-mobile-social-notifications`

## Schwerpunkt

Dieser Patch macht die mobile/PWA-Ansicht deutlich kompakter und verbessert den Social Flow im Study Circle.

## Änderungen

- Mobile/PWA Density Pass:
  - globale mobile Rem-Skalierung reduziert
  - Karten-Paddings auf kleinen Screens verkleinert
  - Eingabefelder, Selects und Textareas kompakter
  - Buttons und Avatare kompakter
  - große Überschriften auf iPhone/PWA weiter reduziert
  - Safe-Area und In-App-Toasts mobile-freundlicher

- Study Circle Profile:
  - Leaderboard-Einträge sind jetzt anklickbar
  - Profilmodal ist damit nicht nur in der Mitgliederliste, sondern auch im Ranking erreichbar
  - Beta-Badges werden im Leaderboard und Profilmodal sichtbarer angezeigt
  - Profilmodal erlaubt weiterhin Freund hinzufügen / Freund entfernen

- Freund hinzugefügt Benachrichtigung:
  - Wenn dich jemand über den Freundescode hinzufügt, erscheint in der App ein Toast: `... hat dich hinzugefügt`
  - Die Erkennung läuft über die gegenseitige Friend-Doc-Anlage und braucht keine Firebase Functions
  - Hintergrund-Push für diese spezielle Meldung bleibt ohne Functions/Blaze bewusst nicht aktiv

- Firestore:
  - keine Rules geändert
  - Friend-Dokumente bekommen zusätzliche Snapshot-Metadaten (`addedAtIso`, `addedByUid`, `addedByDisplayNameSnapshot`)

- Service Worker:
  - Cache-Version auf `gradeglow-v27`

## Testplan

1. Mobile/PWA auf iPhone öffnen.
2. Dashboard, Insights, Freunde, Admin, Launch prüfen.
3. Prüfen, ob Schrift und Felder weniger übergroß wirken.
4. Mit Account A den Code von Account B hinzufügen.
5. Bei Account B muss ein In-App-Toast erscheinen: `A hat dich hinzugefügt`.
6. Im Circle Leaderboard auf ein Profil tippen.
7. Profilmodal prüfen: Badge, Studiengang, Wochenzeit, Freund hinzufügen/entfernen.

## Deploy

- Normales Vercel/Git Deployment reicht.
- Kein Firebase Deploy nötig.
- Firebase Functions weiterhin nicht deployen, solange Blaze nicht aktiv ist.
