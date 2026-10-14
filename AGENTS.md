# Regeln für KI-Assistenten in diesem Repo

Gilt für Claude, ChatGPT/Codex und jeden anderen Agenten.

## Produkt

GradeGlow ist ein Lern- und Klausurplaner für Studierende (Next.js, Firebase, Vercel, als
Homescreen-Web-App auf dem iPhone benutzt). Der Kern ist der Klausur-Rückwärtsplan und der
Heute-Screen. Neue Features nur, wenn sie diesen Kern stärken.

## Design

Vor jeder sichtbaren Änderung `DESIGN.md` lesen und befolgen. Neue Styles nur in
`src/app/gg-design.css`, mit Klassen-Präfix `gg-ds-`. In `globals.css` und `mobile-ui.css` nichts
Neues hinzufügen, nur Fehler beheben.

## Arbeitsweise

- Keine neuen `*_UPDATE.md`- oder `*_PATCH.md`-Dateien im Repo-Root. Was sich geändert hat, steht in
  der Commit-Nachricht und im Pull Request.
- Kein `!important` in neuem Code. Wenn ein alter Style stört, den alten Style reparieren.
- Kein `100vh`/`100lvh` für App-Höhen. Die Shell nutzt `--gg-app-height`.
- Änderungen über einen Branch und Pull Request, nicht direkt auf `main`. Vor dem Mergen muss der
  Vercel-Preview-Build grün sein.
- Prüfen vor dem Abgeben: `npm run check` (Lint, Typen, Build) und `node --test tests/`.
- Sichtbare Änderungen auf 390 px Breite ansehen (Screenshot), in hell und dunkel.
- Texte in der App auf Deutsch, du-Form, kurz. Keine Floskeln.
