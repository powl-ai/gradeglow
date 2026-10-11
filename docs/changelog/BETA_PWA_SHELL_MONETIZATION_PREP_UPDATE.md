# GradeGlow Beta Update – PWA Shell + Monetization Prep

Version: `beta-2026-07-02-pwa-shell-monetization-prep`

## Fokus

Dieser Patch trennt Mobile-Web und installierte PWA sauberer, entfernt Timer-Überreste aus dem Plan und bereitet Monetarisierung vor, ohne echte Anzeigen oder Zahlungen live zu schalten.

## Änderungen

- Mobile/PWA Header überarbeitet:
  - Appbar liegt jetzt im normalen Dokumentfluss statt als störendes Overlay.
  - Standalone-PWA nutzt eigene Safe-Area-Abstände.
  - Header sollte Content, Uhrzeit und Dynamic Island nicht mehr überdecken.
- Bottom-Hotbar weiter korrigiert:
  - sitzt unten als echte App-Tabbar.
  - PWA nutzt einen kompakteren Safe-Area-Modus.
  - Content bekommt passenden unteren Abstand.
- Plan/Timer weiter getrennt:
  - Plan-Tab zeigt keinen alten integrierten Timer-Control-Block mehr.
  - laufende Timer werden über `/timer` geöffnet.
  - Timer bleibt eigenständige Seite mit Fach, Modus, Dauer und Speichern/Verwerfen.
- Premium-Seite auf Mobile verbessert:
  - Feature-Tabelle wird mobil als Kartenliste dargestellt.
  - keine gequetschte Vier-Spalten-Tabelle mehr.
- Monetarisierung vorbereitet:
  - Empfehlung: Plus zuerst, Ads nur optional und sehr zurückhaltend.
  - neue Monetarisierungssektion auf `/premium`.
  - keine echten Ads, kein AdSense/AdMob, keine Payment-Integration aktiv.

## Nicht geändert

- Keine Firestore Rules geändert.
- Keine Firebase Functions deployed.
- Keine Payment- oder Ad-SDK-Abhängigkeiten hinzugefügt.
- Kein Firebase Deploy nötig.
