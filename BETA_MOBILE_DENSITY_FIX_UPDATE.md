# GradeGlow Beta Update – Mobile Density Fix

Version: `beta-2026-07-02-mobile-density-fix`

## Ziel

Die mobile/PWA-Ansicht war trotz vorheriger Patches weiterhin zu groß und wirkte wie eine gezoomte Desktop-Ansicht. Dieser Patch setzt eine deutlich aggressivere Mobile-Dichte, damit mehr Inhalt auf einen iPhone-Screen passt.

## Änderungen

- Eigener Mobile-Density-Layer am Ende von `globals.css`.
- Mobile-Root-Fontsize reduziert.
- Große Tailwind-Typografie (`text-6xl` bis `text-xl`) auf Mobile stark begrenzt.
- Arbiträre große Textgrößen wie `text-[3rem]` und `text-[2rem]` werden auf Mobile abgefangen.
- Karten-Padding, Margins, Gaps und Rundungen deutlich reduziert.
- Inputs, Selects, Textareas und Planner-Felder kompakter gemacht.
- Buttons, Filter-Pills und Soft-Buttons kompakter gemacht.
- Avatar/Icon-Größen auf Mobile verkleinert.
- Mobile Quick-Navigation an den unteren Bildschirmrand verdichtet.
- Service Worker Cache-Version auf `gradeglow-v28` erhöht.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions geändert oder deployed.
- Keine neuen npm-Abhängigkeiten.
- Keine Payment/Capacitor-Abhängigkeiten.

## Testfokus

- iPhone Safari normaler Webmodus.
- iPhone PWA vom Homescreen.
- Dashboard/Übersicht.
- Premium/Plan-Limits.
- Insights.
- Study Circle/Freunde.
- Admin Feedback.
- Input-Fokus: prüfen, ob die Ansicht nicht unangenehm springt.
