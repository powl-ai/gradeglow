# GradeGlow Beta Theme Stability Update

## Enthalten

- Study Circle veröffentlicht jetzt Profilbilder auch dann, wenn kein hochgeladenes Base64-Bild existiert, aber ein Firebase/Google-Avatar vorhanden ist.
- Freundes-Profile akzeptieren öffentliche Bild-URLs und Base64-Avatare.
- Module und Stundenplan nutzen beim Seitenwechsel sofort das lokale Backup, während Firestore im Hintergrund prüft. Dadurch wirken ECTS, Module und Stundenplan beim Theme-Wechsel nicht mehr verschwunden.
- Die horizontale Quick-Rail merkt sich ihre Scrollposition und bringt den aktiven Bereich beim Seitenwechsel wieder in Sicht.
- Premium/Admin kann alle aktuellen Glow-Shop-Kosmetiken ohne GP-Kauf nutzen.
- Beim Auswählen eines Premium-Themes wird automatisch die passende Standard-Akzentfarbe gesetzt:
  - Rose Bloom → Rose
  - Study Sunrise → Amber
  - Lavender Haze → Violett
  - Matcha Focus → Emerald
  - Ocean Mist → Blau
  - Mocha Latte → Amber
- Akzentfarben bleiben danach weiterhin bewusst manuell kombinierbar.
- Kontrastregeln für Planner, StuPo, Admin, Study Circle, Formulare, Selects und Inputs wurden erweitert.
- Premium-Themes haben jetzt eigene Dark-Mode-Varianten.

## Nicht geändert

- Keine Firebase Functions nötig.
- Keine Firestore Rules geändert.
- Keine Datenstruktur-Migration nötig.

## Test

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
git commit -m "Stabilize beta themes and study circle avatars"
git push origin HEAD
```
