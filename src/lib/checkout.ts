import type { BillingCycle, BillingProvider, CheckoutLink } from "./monetization";
import { billingProvider, canOpenCheckout, checkoutLinks, monetizationMode } from "./monetization";

export type CheckoutProviderOption = {
  id: BillingProvider;
  label: string;
  recommendation: "best_start" | "good_later" | "native_later" | "disabled";
  setupLevel: "leicht" | "mittel" | "hoch";
  bestFor: string;
  caveat: string;
};

export type CheckoutFlowStep = {
  id: string;
  title: string;
  description: string;
  status: "ready" | "manual" | "later";
};

export const checkoutRedirectPaths = {
  success: "/checkout/success",
  cancel: "/checkout/cancel",
};

export const checkoutProviderOptions: CheckoutProviderOption[] = [
  {
    id: "none",
    label: "Noch kein Provider",
    recommendation: "disabled",
    setupLevel: "leicht",
    bestFor: "Preview-Modus, Beta-Tests und manuelle Freischaltungen.",
    caveat: "Keine echten Zahlungen. Perfekt, solange Legal/Preis/Checkout noch nicht final sind.",
  },
  {
    id: "stripe",
    label: "Stripe Checkout Links",
    recommendation: "best_start",
    setupLevel: "mittel",
    bestFor: "Schnell startbare Web-Zahlungen mit klaren Checkout-Links und späterer Webhook-Erweiterung.",
    caveat: "Automatische Entitlements brauchen später Webhooks oder manuelle Admin-Prüfung.",
  },
  {
    id: "lemonsqueezy",
    label: "Lemon Squeezy",
    recommendation: "best_start",
    setupLevel: "leicht",
    bestFor: "Digitale Produkte mit Merchant-of-Record-Ansatz und einfachen Payment Links.",
    caveat: "Provider-Verfügbarkeit, Steuern und Branding vor Livegang prüfen.",
  },
  {
    id: "paddle",
    label: "Paddle",
    recommendation: "good_later",
    setupLevel: "mittel",
    bestFor: "SaaS-Abos mit stärkerer Zahlungs-/Steuer-Infrastruktur.",
    caveat: "Für den ersten Mini-Launch oft schwerer als reine Payment Links.",
  },
  {
    id: "app_store",
    label: "Apple In-App Purchases",
    recommendation: "native_later",
    setupLevel: "hoch",
    bestFor: "Spätere iOS-App mit digitalen Plus-Funktionen.",
    caveat: "Erst relevant, wenn eine echte native App und Store-Regeln final sind.",
  },
  {
    id: "play_store",
    label: "Google Play Billing",
    recommendation: "native_later",
    setupLevel: "hoch",
    bestFor: "Spätere Android-App mit digitalen Plus-Funktionen.",
    caveat: "Erst relevant, wenn eine echte native Android-App geplant ist.",
  },
];

export const activeCheckoutProvider =
  checkoutProviderOptions.find((provider) => provider.id === billingProvider) ?? checkoutProviderOptions[0];

export const getCheckoutLinkByCycle = (cycle: BillingCycle): CheckoutLink | undefined =>
  checkoutLinks.find((link) => link.cycle === cycle);

export const getCheckoutTarget = (cycle: BillingCycle) => {
  const link = getCheckoutLinkByCycle(cycle);

  return {
    link,
    href: canOpenCheckout && link?.url ? link.url : "/monetization",
    isLive: Boolean(canOpenCheckout && link?.url),
    mode: monetizationMode,
    provider: activeCheckoutProvider,
    successPath: checkoutRedirectPaths.success,
    cancelPath: checkoutRedirectPaths.cancel,
  };
};

export const checkoutFlowSteps: CheckoutFlowStep[] = [
  {
    id: "choose-provider",
    title: "Provider auswählen",
    description: "Für den Web-Start sind Stripe Checkout Links oder Lemon Squeezy am leichtesten. Native IAP bleibt später.",
    status: billingProvider === "none" ? "manual" : "ready",
  },
  {
    id: "add-links",
    title: "Checkout-Links in Vercel eintragen",
    description: "Monthly, Yearly und optional Lifetime als NEXT_PUBLIC_GRADEGLOW_PLUS_*_URL setzen.",
    status: checkoutLinks.some((link) => link.isConfigured) ? "ready" : "manual",
  },
  {
    id: "redirects",
    title: "Success/Cancel-URLs nutzen",
    description: "Provider später auf /checkout/success und /checkout/cancel zurückleiten lassen.",
    status: "ready",
  },
  {
    id: "enable-flag",
    title: "Checkout bewusst aktivieren",
    description: "NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT erst nach Testkauf, Legal-Check und Admin-Prozess auf true setzen.",
    status: canOpenCheckout ? "ready" : "manual",
  },
  {
    id: "entitlement",
    title: "Entitlement vergeben",
    description: "Ohne Functions/Webhooks wird Plus nach Zahlungsprüfung manuell in /admin unter entitlements/{uid} gesetzt.",
    status: "manual",
  },
  {
    id: "webhook-later",
    title: "Webhook später nachrüsten",
    description: "Erst mit Blaze/Functions oder sicherer Server-Route automatisch Premium setzen.",
    status: "later",
  },
];

export const entitlementFlowSteps = [
  "Nutzer klickt in GradeGlow auf Plus.",
  "Checkout öffnet extern über Payment-Link, sobald ENV-Flag und URL gesetzt sind.",
  "Provider leitet nach Kauf auf /checkout/success oder bei Abbruch auf /checkout/cancel zurück.",
  "Solange keine Functions/Webhooks live sind: Kauf im Provider-Dashboard prüfen.",
  "Admin öffnet /admin, trägt Firebase UID ein und setzt plan = premium, premiumSource = payment_manual, premiumStatus = active.",
  "Später: Webhook ersetzt die manuelle Freischaltung automatisch.",
];
