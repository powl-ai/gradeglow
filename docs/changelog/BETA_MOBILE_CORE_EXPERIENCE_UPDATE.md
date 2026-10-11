# GradeGlow Beta Update: Mobile Core Experience

Version: `beta-2026-07-02-mobile-core-experience`

## Ziel

Die mobile App soll weniger wie ein verkleinertes Web-Dashboard wirken und stärker wie eine täglich nutzbare App. Der Fokus liegt auf Home, Plan, Timer und PWA-Shell.

## Änderungen

- Mobile Home fokussiert stärker auf den heutigen Tag.
- Neue kompakte Schnellaktionen auf Mobile:
  - Timer
  - Plan
  - Circle
  - Profil
- Beta-Ready-Check ist nicht mehr der erste sichtbare Block, sondern ein sekundärer einklappbarer Bereich.
- Plan-Seite behandelt Timer nicht mehr als eigenen Plan-Baustein.
- Plan-KPIs und Kalender-Elemente sind auf Mobile kompakter.
- Installierte PWA blendet die interne Mobile-Appbar aus, damit sie nicht mit Statusbar/Dynamic Island kollidiert.
- Bottom-Hotbar wurde im Standalone-PWA-Modus tiefer und kompakter gesetzt.
- Service Worker Cache: `gradeglow-v34`.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine echten Ads oder Zahlungen aktiviert.
- Keine neuen Dependencies.
