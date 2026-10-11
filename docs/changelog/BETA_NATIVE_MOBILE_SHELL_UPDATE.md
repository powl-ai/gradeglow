# GradeGlow Beta Native Mobile Shell Update

Version: `beta-2026-07-02-native-mobile-shell`

## Ziel

Mobile/PWA soll nicht mehr wie eine verkleinerte Desktop-Webseite wirken, sondern eine eigene App-Shell bekommen.

## Änderungen

- Desktop-Hero auf Mobile ausgeblendet.
- Neuer kompakter Mobile-App-Header mit Menü, Seitentitel und Profilzugriff.
- Desktop-Quick-Rail auf Mobile ausgeblendet.
- Neue native Bottom-Tabbar für Home, Plan, Timer, Circle und Profil.
- Overview auf Mobile mit eigener Today-first Ansicht statt vier großer Desktop-KPI-Karten.
- Kompakte mobile Statistikliste für Schnitt, ECTS, offene Sessions und erledigte Sessions.
- Mobile Safe-Area und Bottom-Padding an PWA-Tabbar angepasst.
- Footer auf Mobile entfernt, weil Profil/Mehr-Menü diese Links bündelt.
- Service Worker Cache auf `gradeglow-v29` erhöht.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions geändert oder deployed.
- Keine neuen npm-Abhängigkeiten.
- Desktop-Layout bleibt im Kern erhalten.

## Testfokus

1. iPhone Safari normal öffnen.
2. PWA vom Homescreen öffnen.
3. Home prüfen: kompakter Header, Today Card, Statistikliste.
4. Bottom-Tabs prüfen: Home, Plan, Timer, Circle, Profil.
5. Desktop prüfen: Hero und Quick-Rail müssen weiterhin sichtbar sein.
