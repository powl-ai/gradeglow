# GradeGlow: Mobile UI, Lumi und Kalender

Stand: 7. Oktober 2026. Vollständiges Quellprojekt, kein Live-Deployment und kein nativer iOS-/Android-Build.

## Was geändert wurde

- Fester mobiler Kopfbereich: „GradeGlow“ auf Home, ansonsten der aktuelle Bereich. Mit App-Menü, Einstellungen und Abstand zur Geräte-Safe-Area.
- Beschrifteter, kontrastreicher Dock für Home, Kalender, Fokus, optional Circle und Profil. Inhalte erhalten eigenen unteren Abstand; Kopfbereich und Inhalte addieren Safe Areas nicht doppelt.
- Onboarding-Verlauf reicht über die gesamte Dokumenthöhe bis unter den Home-Indikator. Der andersfarbige untere Streifen entfällt.
- Neuer mobiler Feed: ein erreichbarer nächster Schritt, echte Lernaktivität der Woche, anstehende Lernblöcke/Prüfungen und Studienfortschritt. Keine erfundenen Streaks oder Belohnungen.
- „Lumi“, ein eigenständiges SVG-Sternmaskottchen mit Buch. Reagiert mit einem fröhlichen Ausdruck auf erledigte Lernblöcke; kein Duolingo-Asset.
- Neuer Kalender mit Tag, Woche und Monat, Heute-Sprung, Datumsauswahl, Inhaltsfilter und Plus-Menü. Die Tagesansicht zeigt alle 24 Stunden, die Woche eine gut lesbare Agenda, der Monat ein Raster mit Terminpunkten und ausgewähltem Tag.
- Überschneidende Lernblöcke werden nebeneinander angezeigt. Eine Prüfung hat im bisherigen Datenmodell keine Dauer: Sie erhält nur einen visuellen Marker mit „Dauer offen“, keine erfundene gespeicherte Prüfungsdauer.
- Bestehende Tagesdetails, Prüfungsformulare, Lernblock-Erstellung und desktopseitiges Verschieben auf ein anderes Datum sind weiter angebunden. Touch-Geräte können das Datum in den Details bearbeiten.
- Tagesübersicht, Formulare, Moduldetails und Daily Glow verwenden native Browser-Dialoge. Diese liegen über dem Dock, sperren Hintergrund-Scrollen und bieten Fokusbegrenzung/Escape. Daily-Glow-Aktionen werden nicht mehr verdeckt.
- Profilkarten und Diagramm-Bedienelemente skalieren besser auf kleinen Displays. Dunkle Vergleichskarten bleiben dunkel und lesbar.
- Die persistente App-Ansicht verwaltet jetzt auch Scrollpositionen pro Reiter. Neue Bereiche beginnen oben, bereits besuchte Bereiche behalten ihre Position.
- Die bisherigen vier Logo-Varianten und die Dark-/Light-/System-Auswahl bleiben erhalten.

## Technische Schwerpunkte

Neue Komponenten: `MobileAppHeader`, `AppDialog`, `StudyHomeFeed`, `GlowMascot`, `StudyCalendar`.

`src/app/mobile-ui.css` bündelt die Regeln für den neuen mobilen Aufbau und wird nach den bisherigen globalen Styles geladen. `src/lib/calendarLayout.ts` berechnet lokale Kalendertage und kollisionsfreie Ereignisspuren. Der Service-Worker-Cache ist auf `gradeglow-v54` angehoben.

## Prüfung

- Lint, Typecheck und Produktions-Build. Keine Lint-Fehler; eine bestehende Hook-Abhängigkeitswarnung im Planner bleibt unverändert.
- Bestehende Einstiegstests: Login/Registrierung, isolierter Gastmodus, Basic/Pro, sauberer Ausstieg, Erhalt vorhandener Daten.
- Kalender-Layouttests: Überlappungen, direkt angrenzende Termine, Tagesgrenze, ungültige Uhrzeiten und lokale Datumsberechnung über die Zeitumstellung.
- Browser-Prüfung in Chromium: 320×568, 360×740, 375×667, 393×852, 430×932, 768×1024, 844×390 und 1024×768. Dark/Light, Querformat und simulierte obere/untere Safe Areas.
- Reiterwechsel ohne Austausch des Dashboard-Hauptknotens/Docks, Tages-/Wochen-/Monatsansicht, Terminerstellung, Modal-Top-Layer, Daily-Glow-Button-Kontrast sowie Logo-/Theme-Persistenz.

Nicht geprüft: echtes iPhone-Safari/PWA-Verhalten, echte Android-Geräte und angemeldete Cloud-Synchronisierung. Die UI bleibt eine PWA; diese Änderung erzeugt keine native App.

## Übernahme

Das vollständige Projekt übernehmen, nicht nur einzelne Komponenten: Layout, App-Host, Styles und Dialoge gehören zusammen. Konfigurationswerte und bestehende private Umgebungsdateien aus dem eigenen Projekt behalten; keine Zugangsdaten sind im Paket enthalten.

```sh
npm ci
npm run check
npm run dev
```

Nach dem späteren Deployment die bereits installierte PWA vollständig schließen und neu öffnen. Bei weiterhin altem Stand die Service-Worker-Aktualisierung prüfen; lokale Nutzerdaten nicht pauschal löschen.
