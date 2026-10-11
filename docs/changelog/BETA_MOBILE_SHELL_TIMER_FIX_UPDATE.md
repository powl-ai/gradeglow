# Beta Mobile Shell + Timer Fix

Version: `beta-2026-07-02-mobile-shell-timer-fix`

## Änderungen

- Mobile Header liegt nicht mehr als fixed Overlay über dem Content, sondern sitzt in der App-Shell und bleibt kompakter.
- Mobile/PWA Content startet nicht mehr mit künstlich großem Top-Abstand.
- Bottom Hotbar sitzt tiefer und braucht weniger Höhe.
- Standalone-PWA bekommt eigenen Bottom-/Safe-Area-Feinschliff.
- `/timer` ist jetzt eine echte Timer-Seite statt erneut die volle Plan-/Kalenderansicht zu rendern.
- Timer-Seite enthält nur:
  - Fach/Prüfungsauswahl
  - Modus
  - Dauer-Presets
  - Start
  - Speichern/Verwerfen
- Gespeicherte Timer werden als erledigte Lernzeit beim gewählten Fach abgelegt.
- Plan/Kalender bleiben im Plan-Tab.
- Service Worker Cache: `gradeglow-v31`.

## Nicht geändert

- Firestore Rules
- Firebase Functions
- Firebase Deploy-Konfiguration
- Keine neuen npm-Abhängigkeiten

## Testcheck

- Mobile Safari: Header verdeckt die Uhrzeit nicht.
- PWA: Header/Hotbar sitzen in der Safe-Area.
- Home: Content verschwindet nicht hinter der Hotbar.
- Timer-Tab: zeigt nur Timer, keinen Kalender.
- Timer starten, speichern, danach im Plan als erledigte Lernzeit prüfen.
