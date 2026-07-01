# Build Fix: Support-Mail Export

Fix für Vercel-Build nach `schedule-week-fix`.

## Problem

`DiagnosticsPage.tsx` importierte `GRADEGLOW_SUPPORT_EMAIL` aus `src/lib/appVersion.ts`, aber `appVersion.ts` exportierte nur `GRADEGLOW_APP_VERSION`.

Vercel-Fehler:

```txt
The export GRADEGLOW_SUPPORT_EMAIL was not found in module [project]/src/lib/appVersion.ts
```

## Fix

`src/lib/appVersion.ts` exportiert jetzt zusätzlich:

```ts
export const GRADEGLOW_SUPPORT_EMAIL = "gradeglow.support@icloud.com";
```

## Version

`beta-2026-07-01-schedule-week-fix-1`

## Hinweise

- Keine Firestore Rules geändert.
- Keine Functions nötig.
- `src/app/info/page.tsx` ist weiterhin nicht enthalten.
