---
name: gradeglow-ui
description: Use for any visible change to the GradeGlow app (powl-ai/gradeglow): new screens, redesigns, styling fixes, UI feedback from Paul's phone tests. Applies GradeGlow's design system (DESIGN.md) and repo rules.
---

# GradeGlow UI

GradeGlow ist Pauls Lern- und Klausurplaner (Next.js, Vercel, als Homescreen-Web-App auf dem
iPhone). Dieser Skill sorgt dafür, dass jede Oberflächenänderung aussieht, als käme sie aus einer
Hand.

## Vor dem Bauen

1. `DESIGN.md` im Repo-Root lesen. Es ist verbindlich: Idee, Tokens, Verbote, Bausteine.
2. `AGENTS.md` lesen (Arbeitsregeln: Branch + PR, keine Patch-Notizdateien, kein `!important`).
3. Klären, welche **eine** Sache auf diesem Screen leuchten soll (die nächste Aktion). Das ist die
   einzige Akzentfläche. Wenn die Frage keine klare Antwort hat, hat der Screen zu viele Aufgaben.
4. Inhalte prüfen: Welche echten Daten stehen zur Verfügung? Keine Floskeln als Platzhalter für
   fehlende Inhalte.

## Beim Bauen

- Styles nur in `src/app/gg-design.css`, Klassen mit Präfix `gg-ds-`. Nur Tokens, keine festen
  Farben. Akzent immer über `var(--gg-accent-600)` (Nutzer können ihn ändern).
- Einen Screen ganz umziehen statt einzelne alte Klassen zu überschreiben. Alte Klassen dieses
  Screens danach nicht mehr benutzen und in `DESIGN.md` unter „Migrationsstand" abhaken.
- Drei Schriftgrößen (Groß, Titel, Text) plus Klein für Nebeninfos. Zahlen tabellarisch.
- Trennung über Abstand und Tonstufen, nie über Linien, Rahmen oder Schatten.
- Mobile zuerst (390 px), dann Desktop prüfen. Tippflächen mindestens 44 px.

## Selbstprüfung vor dem Abgeben

Screenshot auf 390 px in hell **und** dunkel ansehen und ehrlich prüfen:

- [ ] Leuchtet genau eine Sache? Ist es die richtige?
- [ ] Beantwortet der oberste Bereich „Was mache ich jetzt?" ohne Scrollen?
- [ ] Irgendwo Verlauf, Schatten, Blur, gesperrte Großbuchstaben, Rahmen um Karten, Emoji, Maskottchen?
- [ ] Irgendein Text, der nichts sagt („Das zählt.")? Streichen.
- [ ] Überschriften höchstens zwei Zeilen?
- [ ] Lauftext in voller Tinte, Grau nur für Nebeninfos?
- [ ] Funktioniert es mit einer anderen Akzentfarbe und einem Premium-Theme?
- [ ] Leerer Zustand (keine Klausur, kein Plan) sieht absichtlich aus?

Dann: `npm run check`, `node --test tests/`, Branch pushen, PR öffnen, Vercel-Preview abwarten.
Im PR einen Screenshot oder die Preview-URL nennen und sagen, was nicht geprüft werden konnte.

## Was Paul wichtig ist

- Ehrliches Feedback statt Ja-Sagen. Wenn eine Idee dem Kern (Rückwärtsplan + Heute-Screen) nicht
  hilft, das sagen und eine bessere vorschlagen.
- Die App soll sich anfühlen wie ein ruhiges, gut gemachtes Werkzeug, nicht wie ein Template.
