# GradeGlow Monetization + Legal Connect Update

Version: `beta-2026-07-04-monetization-legal-connect`
Service Worker: `gradeglow-v37`

## Ziel
Option A + C kombiniert: Monetarisierung technisch anschlussfertiger machen und gleichzeitig die rechtliche Seitenstruktur vorbereiten, ohne echte Zahlungen, echte Ads oder Firebase Functions zu aktivieren.

## Neu

### Checkout/Provider-Vorbereitung
- Neue Datei `src/lib/checkout.ts`
- Provider-Abstraktion für:
  - `none`
  - `stripe`
  - `lemonsqueezy`
  - `paddle`
  - `app_store`
  - `play_store`
- Checkout-Flow-Schritte dokumentiert
- Entitlement-Flow dokumentiert:
  - externer Checkout
  - Rückleitung
  - Kaufprüfung
  - manuelle Plus-Freischaltung in `/admin`
  - späterer Webhook erst mit Functions/Blaze
- Checkout öffnet nur live, wenn:
  - Provider nicht `none`
  - mindestens ein Checkout-Link gesetzt ist
  - `NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT=true`

### Neue Checkout-Rückseiten
- `/checkout/success`
- `/checkout/cancel`
- Beide Seiten setzen keine Entitlements automatisch.
- Beide Seiten sind als spätere Redirect URLs für Stripe/Lemon Squeezy/Paddle vorbereitet.

### Legal Hub
- Neue Datei `src/lib/legal.ts`
- Neue Komponente `LegalCenterPage`
- Neue Routen:
  - `/legal`
  - `/legal/impressum`
  - `/legal/privacy`
  - `/legal/terms`
  - `/legal/refund`
  - `/legal/delete-account`
  - `/legal/ads`
- `/info` zeigt jetzt ebenfalls den Legal Hub.
- Alte zentrale Links wurden von `/info` auf `/legal` umgestellt.
- Inhalte sind bewusst Platzhalter und keine Rechtsberatung.

### Monetization Center erweitert
- Provider-Vergleich eingebaut
- Checkout-Links zeigen Preview/Live-Zustand
- Success/Cancel-Seiten direkt testbar
- Manuelle Entitlement-Freischaltung erklärt
- Legal Hub direkt verlinkt
- Readiness berücksichtigt Provider-Auswahl und Legal-Struktur

### Admin verbessert
- Neuer Preset: `Payment manuell geprüft`
- Setzt:
  - `plan = premium`
  - `premiumSource = payment_manual`
  - `premiumStatus = active`
  - Ablaufdatum +1 Jahr
- Entitlement Preview als JSON sichtbar
- JSON kann kopiert werden
- Weiterhin keine Functions und keine Webhooks nötig

### ENV Beispiele erweitert
- `.env.example`
- `.env.local.example`
- Monetarisierungs-ENV-Variablen ergänzt:
  - Mode
  - Provider
  - Checkout Enable Flag
  - Preise
  - Checkout URLs
  - Sponsor Slots
  - AdSense

## Wichtig
- Keine Firebase Functions deployed.
- Keine Firestore Rules geändert.
- Keine echten Payments aktiv.
- Keine echten Ads aktiv.
- Checkout bleibt Preview, solange `NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT=false` oder Provider `none` ist.

## Test
```bash
npm run lint
npm run typecheck
npm run build
```

Hinweis: Im Bearbeitungs-Sandbox konnte `npm run build` nicht final laufen, weil das hochgeladene `node_modules` nur das macOS Next/SWC-Paket enthielt und die Linux-SWC-Binary ohne Netzwerk nicht nachgeladen werden konnte. `lint` und `typecheck` liefen erfolgreich. Auf Vercel bzw. nach sauberem `npm install` sollte Next die passende SWC-Binary installieren.

## Deployment
Normales Codeupdate:
```bash
git add .
git commit -m "prepare monetization provider flow and legal hub"
git push origin HEAD
```

Firestore Rules nur deployen, falls du sie später separat änderst:
```bash
firebase deploy --only firestore:rules
```

Functions weiterhin nicht deployen, solange Blaze nicht aktiv ist:
```bash
# NICHT ausführen:
firebase deploy --only functions
```
