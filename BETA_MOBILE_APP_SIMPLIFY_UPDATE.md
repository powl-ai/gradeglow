# GradeGlow Beta Update: Mobile App Simplify

Version: `beta-2026-07-02-mobile-app-simplify`

## Ziel

Mobile/PWA soll nicht mehr wie eine zusammengedrückte Desktop-Webseite wirken. Die Startseite wird auf Mobile stärker reduziert, sekundäre Boxen werden standardmäßig eingeklappt und die untere Tabbar wird zur primären Navigation.

## Änderungen

- Mobile Appbar ist jetzt fixed und mit mehr Statusbar-Abstand versehen.
- Obere Quick-Rail/Schnellnavigation wird unter `lg` hart ausgeblendet.
- Bottom Tabbar sitzt wirklich unten am Screen und reserviert Safe-Area-Platz.
- App-Content bekommt mehr unteren Abstand, damit nichts hinter der Tabbar verschwindet.
- Ready-Check ist auf Mobile standardmäßig eingeklappt.
- Free/Premium-Limits sind auf Mobile standardmäßig eingeklappt.
- Glow Rewards sind auf Mobile standardmäßig eingeklappt.
- PWA Install/Update ist auf Mobile standardmäßig eingeklappt.
- Plan und Timer sind in der unteren Tabbar getrennt:
  - `/exams` = Plan
  - `/timer` = Timer/Fokusansicht auf Basis des Planers
- Neue Route: `/timer`
- Service Worker Cache: `gradeglow-v30`

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine neuen npm-Abhängigkeiten.

## Test

- Mobile Safari/PWA öffnen.
- Prüfen, dass oben keine Scroll-Rail mehr sichtbar ist.
- Prüfen, dass die Uhrzeit/Statusbar nicht überdeckt wird.
- Prüfen, dass unten die Tabbar nichts mehr verdeckt.
- Home: Ready-Check, Limits, Glow und PWA sollen eingeklappt sein.
- Plan und Timer in der Bottom Tabbar getrennt testen.
