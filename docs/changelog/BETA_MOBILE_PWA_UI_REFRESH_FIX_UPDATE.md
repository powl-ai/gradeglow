# GradeGlow Mobile/PWA UI Refresh Fix

## Fix
- `src/lib/appVersion.ts` exportiert wieder `GRADEGLOW_SUPPORT_EMAIL`.
- Build-Fehler auf Legal-/Info-/Premium-/Native-/Launch-Seiten behoben.
- App-Version auf `beta-2026-07-08-mobile-pwa-ui-refresh-fix` aktualisiert.
- Service Worker auf `gradeglow-v43` erhöht.

## Ursache
Beim Mobile/PWA UI Refresh wurde `appVersion.ts` überschrieben und enthielt danach nur noch `GRADEGLOW_APP_VERSION`. Mehrere Komponenten importieren aber zusätzlich `GRADEGLOW_SUPPORT_EMAIL`.
