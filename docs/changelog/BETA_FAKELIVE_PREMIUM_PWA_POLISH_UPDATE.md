# GradeGlow Update: Fake-Live Premium + PWA Safe-Area Polish

Version: `beta-2026-07-04-fakelive-premium-pwa-polish`
Service Worker: `gradeglow-v38`

## Was geändert wurde

### Fake-Live Premium
- Neue Komponente `PremiumPreviewCheckoutCard`.
- `/premium` zeigt jetzt konkrete Plus-Pakete mit Fake-Live-Checkout-Preview.
- `/monetization` zeigt denselben Preview-Flow zusätzlich zum Provider-/ENV-Setup.
- `UpgradeCard` nutzt im Preview-Modus nicht mehr nur „Checkout verbinden“, sondern führt in einen klar markierten Preview-Rückweg.
- Preview-Links öffnen `/checkout/success?preview=1&cycle=...`.
- Die Success-/Cancel-Seiten unterscheiden jetzt zwischen echtem Provider-Rückweg und Fake-Live-Preview.
- Preview setzt keine Rechte, nimmt kein Geld und verändert keine Firestore-Daten.
- Konkrete Preislabels vorbereitet:
  - Monatlich: `3,99 € / Monat`
  - Jährlich: `29,99 € / Jahr`
  - Early Supporter: `49 € Early Supporter`

### Mobile/PWA Polish
- PWA-Statusbar-Problem entschärft: `appleWebApp.statusBarStyle` steht jetzt auf `default` statt `black-translucent`.
- Finaler Safe-Area-Override am Ende von `globals.css`, damit ältere mobile Shell-Regeln nicht mehr gewinnen.
- Mobile/PWA bekommt oben einen Mindestabstand, auch wenn `env(safe-area-inset-top)` auf manchen Geräten zu klein/0 ist.
- Header wird in installierter PWA wieder angezeigt und nicht mehr komplett ausgeblendet.
- Mobile Bottom-Bar bleibt safe-area-aware.
- Mobile Home bekommt eine kleine Plus-Preview-Teaser-Card im Free-Plan.

## Nicht geändert
- Keine Firebase Functions deployed.
- Keine Firestore Rules geändert.
- Keine echten Zahlungen aktiviert.
- Keine echten Ads aktiviert.
- Kein automatischer Entitlement-Webhook.

## Testcommands

```bash
npm install
npm run lint
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 CI=1 npm run build
```

## Deploy

Für normale Codeupdates reicht:

```bash
git status
git add .
git commit -m "polish fake-live premium and pwa safe area"
git push origin HEAD
```

Firestore Deploy ist nicht nötig, weil `firestore.rules` nicht geändert wurde.

```bash
# Nur falls du später Rules änderst:
firebase deploy --only firestore:rules
```

Functions weiterhin nicht deployen, solange Blaze nicht aktiv ist.

```bash
# NICHT ausführen, solange Blaze nicht aktiv ist:
firebase deploy --only functions
```
