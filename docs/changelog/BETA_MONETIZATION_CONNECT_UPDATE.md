# GradeGlow Beta Update: Monetization Connect Prep

Version: `beta-2026-07-02-monetization-connect`

## Ziel

Dieser Patch bereitet Monetarisierung so vor, dass später nur noch Payment-/Ad-Provider verbunden werden müssen. Es werden keine echten Zahlungen, keine Firebase Functions und keine Firestore Rules aktiviert.

## Neu

- Neue Seite `/monetization`
  - Monetization Readiness Score
  - Checkout-Link-Status
  - Plus-/Sponsor-/Ad-Strategie
  - ENV-Checkliste für Vercel
  - kopierbarer Monetization Report
- Neue zentrale Datei `src/lib/monetization.ts`
  - Billing Provider
  - Checkout-Links
  - Enable-Flags
  - Sponsor-/Ad-Slots
  - Readiness Checks
- Neue Komponenten
  - `UpgradeCard`
  - `MonetizationSlotCard`
  - `AdSenseScript`
  - `MonetizationHubPage`
- `/premium` erweitert
  - Link zu `/monetization`
  - Checkout-Preview-Karten
  - UpgradeCard mit Payment-Status
- `PremiumGate` und `PlanUsagePanel` nutzen jetzt UpgradeCard
- Launch Center erweitert
  - Kategorie Monetarisierung
  - Checks für Monetization Center und Checkout-Schutz
- PWA/Manifest/Service Worker erweitert
  - `/monetization` als App Shell Route
  - Shortcut für Monetarisierung
  - Cache `gradeglow-v36`

## ENV Variablen

```env
NEXT_PUBLIC_GRADEGLOW_MONETIZATION_MODE=preview
NEXT_PUBLIC_GRADEGLOW_BILLING_PROVIDER=none
NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT=false
NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_PRICE=2-4 EUR / Monat geplant
NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_URL=
NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_PRICE=Jahrespreis geplant
NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_URL=
NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_PRICE=Early-Supporter geplant
NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_URL=
NEXT_PUBLIC_GRADEGLOW_ENABLE_SPONSOR_SLOTS=false
NEXT_PUBLIC_GRADEGLOW_ENABLE_ADSENSE=false
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=
```

## Wichtig

- Checkout bleibt aus, solange `NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT` nicht `true` ist.
- Sponsor Slots bleiben aus, solange `NEXT_PUBLIC_GRADEGLOW_ENABLE_SPONSOR_SLOTS` nicht `true` ist.
- AdSense-Script lädt nur, wenn `NEXT_PUBLIC_GRADEGLOW_ENABLE_ADSENSE=true` und eine Publisher-ID gesetzt ist.
- Keine Ads im Timer/Fokus.
- Vor echten Zahlungen: Impressum, Datenschutz, AGB/Widerruf und Support-Prozess finalisieren.
- Für native iOS/Android-Premiumfunktionen später Store-/IAP-Regeln prüfen.

## Nicht geändert

- keine Firestore Rules
- keine Firebase Functions
- keine echten Payments
- keine echten Ads aktiv
- keine neuen npm Dependencies
