# GradeGlow Beta Feedback Patch 2

Fokus: Mobile Einstieg, Quick-Rail-Polish und dunkle Study-Circle-Kontraste.

## Änderungen

- Mobile Login/Landing zeigt jetzt direkt Logo + Slogan + Login-Form in einem kompakten Einstieg.
- Login-Karte wurde auf Mobile verdichtet: kleinere Abstände, kürzere Beta-Erklärung, kompaktere Inputs.
- Quick-Rail liegt jetzt in einer abgerundeten, begrenzten Scroll-Schale statt über den Viewport zu laufen.
- Admin/Profil-Ende in der Quick-Rail bekommt zusätzlichen rechten Abstand.
- Privacy-Control-Karten im Study Circle haben eigene Kontrastklassen und bleiben auch im Dark/Violett-Theme lesbar.
- App-Version aktualisiert auf `beta-2026-06-30-feedback-2`.

## Hinweise

- Keine Firestore Rules geändert.
- Keine Functions nötig.
- Responsive Verhalten läuft über CSS/Tailwind Breakpoints, nicht über getrennte Apps.
