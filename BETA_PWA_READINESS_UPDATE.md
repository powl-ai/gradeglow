# GradeGlow PWA Readiness Update

Version: `beta-2026-07-02-pwa-readiness`

## Ziel

Dieser Patch setzt den nächsten sinnvollen Beta-Schritt nach der Release-Stability um: GradeGlow soll sich auf iPhone, iPad, Android und Desktop klarer wie eine installierbare App verhalten, ohne Capacitor oder App-Store-Builds bereits einzuführen.

## Änderungen

### PWA-Install-Karte

- Die Install-Karte erkennt jetzt iOS/iPadOS, Android und Desktop besser.
- iPhone/iPad bekommen konkrete Schritte:
  - Safari öffnen
  - Teilen-Symbol antippen
  - Zum Home-Bildschirm wählen
- Android/Desktop bekommen passende Install-Hinweise.
- Ein App-Link kann direkt kopiert werden.
- Online-/Offline-Status bleibt sichtbar.
- Wenn ein neuer Service-Worker bereitsteht, zeigt die Karte einen Update-Button.

### Service Worker / Offline

- Cache-Version auf `gradeglow-v24` erhöht.
- Zusätzliche Beta-Routen werden vorgecached:
  - `/feedback`
  - `/diagnostics`
  - `/schedule`
- Offline-Seite nennt jetzt auch Account-Aktionen und bietet einen Diagnose-Link.
- Firebase Auth Helper `__/auth/` bleibt weiterhin vom Service Worker ausgenommen.

### Mobile Safe-Area

- Zusätzliche CSS-Variablen für iOS Safe-Areas:
  - `--gg-safe-top`
  - `--gg-safe-right`
  - `--gg-safe-bottom`
  - `--gg-safe-left`
- Hilfsklassen ergänzt:
  - `.gg-safe-bottom`
  - `.gg-safe-x`
- Buttons/Links bekommen besseres Mobile-Tap-Verhalten.
- Standalone-PWA verhindert stärkeres Overscroll-Verhalten.

### Manifest / Meta

- Manifest hat jetzt eine App-ID und startet aus dem Homescreen mit `/?source=pwa`.
- `display_override` ergänzt, mit Fallback auf `standalone` und `browser`.
- `prefer_related_applications: false` gesetzt.
- iOS Status-Bar auf `black-translucent` gestellt.
- Telefon-Autodetection im Layout deaktiviert.

### Diagnostics

- Beta-Test-Checkliste erweitert um:
  - PWA installieren oder iOS-Install-Anleitung prüfen
  - Offline-Seite kurz testen
  - Update-Hinweis nach neuem Deploy prüfen

## Nicht geändert

- `firestore.rules`
- Firebase Functions
- Firebase Deploy-Konfiguration
- Capacitor-Abhängigkeiten

## Testempfehlung

1. Auf iPhone/iPad in Safari öffnen.
2. Install-Karte prüfen: iOS-Schritte müssen angezeigt werden.
3. App über Teilen → Zum Home-Bildschirm installieren.
4. PWA starten und prüfen, ob Safari-Leisten verschwinden.
5. Kurz offline gehen und eine bereits gecachte Route öffnen.
6. Nach einem neuen Deploy prüfen, ob der Update-Button erscheint.
7. `/diagnostics` öffnen und PWA-Checks abhaken.
