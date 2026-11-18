# Regeln für KI-Assistenten in diesem Repo

Gilt für Claude, ChatGPT/Codex und jeden anderen Agenten.

## Produkt

GradeGlow ist ein Lern- und Klausurplaner (Next.js, Firebase, Vercel, auf dem iPhone als
Homescreen-Web-App). Der Kern ist der Klausur-Rückwärtsplan und der Heute-Screen. Die neue App läuft
parallel unter `/neu` (`src/neu/`), bis sie die alte ersetzt. Neue Features nur, wenn sie den Kern stärken.

## Design

Vor jeder sichtbaren Änderung `DESIGN.md` lesen und befolgen. Styles der neuen App nur in
`src/neu/neu.css`, Klassen mit Präfix `gn-`, alles unter `.gn`. Die alte App (`globals.css`,
`mobile-ui.css`) nur noch bei Fehlern anfassen.

## Arbeitsweise

- Keine neuen `*_UPDATE.md`- oder `*_PATCH.md`-Dateien. Was sich geändert hat, steht im Commit und im PR.
- Kein `!important`, kein `100vh`/`100lvh` (die Shell nutzt `--gg-app-height`).
- Änderungen über Branch und Pull Request, nicht direkt auf `main`. Vercel-Preview muss grün sein.
- Prüfen: `npm run check` und `node --test tests/*.mjs`.
- Sichtbare Änderungen auf 390 px ansehen, hell und dunkel.
- Texte in der App auf Deutsch, du-Form, kurz, keine Floskeln.
