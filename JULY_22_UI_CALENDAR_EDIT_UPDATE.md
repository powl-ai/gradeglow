# GradeGlow UI-, Kalender- und Bearbeitungsupdate (22.07.2026)

- Light-Theme mit klareren, hochwertigeren Flächen und weicheren Kontrasten verbessert.
- PWA-/Safe-Area-Fläche oben übernimmt jetzt dynamisch den aktiven Theme-Hintergrund.
- Mobile Kalenderansicht repariert: keine gequetschten 7-Spalten-Karten mehr; Kalender bleibt sichtbar und ist horizontal nutzbar.
- Wochenfokus/Agenda sowie Fortschrittsübersicht lassen sich unabhängig ein- und ausklappen.
- Der eigentliche Kalender wird niemals eingeklappt.
- Prüfungen können im Detailbereich hinsichtlich Titel, Datum, Uhrzeit, Fach und Notiz bearbeitet werden.
- Prüfungen und Lerneinheiten erhalten vor dem Löschen eine Bestätigung.
- KI-Lerneinheiten werden als `source: "ai"` gekennzeichnet.
- Manuell bearbeitete KI-Einheiten erhalten `userEdited: true` und werden bei einer Neugenerierung nicht mehr überschrieben.
- Manuelle Einheiten werden als `source: "manual"` gespeichert.

## Prüfung

- `npm run typecheck`: erfolgreich
- `npm run lint`: erfolgreich
- `npm run build`: konnte in der isolierten Umgebung nicht abgeschlossen werden, weil das Next.js-SWC-Paket vom Paketserver mit HTTP 503 nicht geladen werden konnte. Es gab keinen lokalen TypeScript- oder ESLint-Fehler.
