import type { GradeGlowEntitlement, PlanLimits, UserPlan } from "../types";
import { isPremiumPlan } from "./gradeglowAccess";

export type BillingProvider = "none" | "stripe" | "lemonsqueezy" | "paddle" | "app_store" | "play_store";
export type BillingCycle = "monthly" | "yearly" | "lifetime";
export type MonetizationPlacement = "home-free-card" | "premium-explainer" | "post-session" | "plan-limit" | "settings-upgrade";

export type CheckoutLink = {
  cycle: BillingCycle;
  label: string;
  priceLabel: string;
  url: string;
  isConfigured: boolean;
  recommended?: boolean;
};

export type MonetizationSlot = {
  id: MonetizationPlacement;
  label: string;
  allowed: boolean;
  reason: string;
  surface: "App" | "Plus" | "Ads";
};

export type MonetizationReadinessCheck = {
  id: string;
  title: string;
  description: string;
  status: "ready" | "needs_config" | "blocked";
  owner: "Produkt" | "Technik" | "Recht" | "Store";
};

const getEnv = (key: string) => process.env[key]?.trim() ?? "";

export const billingProvider = (getEnv("NEXT_PUBLIC_GRADEGLOW_BILLING_PROVIDER") || "none") as BillingProvider;
export const monetizationMode = getEnv("NEXT_PUBLIC_GRADEGLOW_MONETIZATION_MODE") || "preview";
export const isCheckoutEnabled = getEnv("NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT") === "true";
export const areSponsorSlotsEnabled = getEnv("NEXT_PUBLIC_GRADEGLOW_ENABLE_SPONSOR_SLOTS") === "true";
export const isAdSenseEnabled = getEnv("NEXT_PUBLIC_GRADEGLOW_ENABLE_ADSENSE") === "true";
export const adsensePublisherId = getEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID");

export const checkoutLinks: CheckoutLink[] = [
  {
    cycle: "monthly",
    label: "Plus monatlich",
    priceLabel: getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_PRICE") || "2–4 € / Monat geplant",
    url: getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_URL"),
    isConfigured: Boolean(getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_URL")),
  },
  {
    cycle: "yearly",
    label: "Plus jährlich",
    priceLabel: getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_PRICE") || "Jahrespreis geplant",
    url: getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_URL"),
    isConfigured: Boolean(getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_URL")),
    recommended: true,
  },
  {
    cycle: "lifetime",
    label: "Lifetime / Early Supporter",
    priceLabel: getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_PRICE") || "später Early-Supporter-Angebot",
    url: getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_URL"),
    isConfigured: Boolean(getEnv("NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_URL")),
  },
];

export const hasAnyCheckoutLink = checkoutLinks.some((link) => link.isConfigured);
export const canOpenCheckout = isCheckoutEnabled && hasAnyCheckoutLink;

export const getRecommendedCheckoutLink = () =>
  checkoutLinks.find((link) => link.recommended && link.isConfigured) ?? checkoutLinks.find((link) => link.isConfigured) ?? checkoutLinks.find((link) => link.recommended) ?? checkoutLinks[0];

export const isEntitlementAdsFree = (entitlement: Pick<GradeGlowEntitlement, "plan" | "premiumSource">, limits?: Pick<PlanLimits, "adsFree">) =>
  Boolean(limits?.adsFree) || isPremiumPlan(entitlement.plan as UserPlan) || entitlement.plan === "admin" || ["beta_test", "founder", "friend_bonus", "manual", "promo"].includes(entitlement.premiumSource);

export const monetizationSlots: MonetizationSlot[] = [
  {
    id: "premium-explainer",
    label: "Plus-Vorteile statt Werbung",
    allowed: true,
    reason: "Beste erste Monetarisierung für eine Lern-App, weil sie Fokus nicht stört.",
    surface: "Plus",
  },
  {
    id: "plan-limit",
    label: "Upgrade-Hinweis bei Free-Limits",
    allowed: true,
    reason: "Nutzer sieht den Upgrade-Hinweis nur, wenn ein echtes Limit relevant wird.",
    surface: "App",
  },
  {
    id: "home-free-card",
    label: "ruhige Sponsor Card im Free-Bereich",
    allowed: true,
    reason: "Nur klar markiert, nicht direkt neben kritischen Buttons und nicht während Fokus-Sessions.",
    surface: "Ads",
  },
  {
    id: "settings-upgrade",
    label: "Plus-Hinweis im Profil/Mehr-Bereich",
    allowed: true,
    reason: "Passt zu Kontoverwaltung und stört keine Lernsession.",
    surface: "Plus",
  },
  {
    id: "post-session",
    label: "nach abgeschlossener Session",
    allowed: false,
    reason: "Erst später prüfen. Keine Ads während Timer, Fokus oder direkt neben Speichern/Löschen-Buttons.",
    surface: "Ads",
  },
];

export const monetizationReadinessChecks: MonetizationReadinessCheck[] = [
  {
    id: "business-model",
    title: "GradeGlow Plus als Hauptmodell definiert",
    description: "Plus ist als primäre Monetarisierung vorgesehen; Ads bleiben optional und zurückhaltend.",
    status: "ready",
    owner: "Produkt",
  },
  {
    id: "checkout-links",
    title: "Checkout Links konfiguriert",
    description: "Setze später die NEXT_PUBLIC_GRADEGLOW_PLUS_*_URL Variablen in Vercel.",
    status: hasAnyCheckoutLink ? "ready" : "needs_config",
    owner: "Technik",
  },
  {
    id: "checkout-enabled",
    title: "Checkout bewusst aktiviert",
    description: "NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT muss bewusst true sein, sonst bleibt alles im Preview-Modus.",
    status: canOpenCheckout ? "ready" : "needs_config",
    owner: "Technik",
  },
  {
    id: "legal-pages",
    title: "Impressum/Datenschutz/AGB/Widerruf final",
    description: "Vor echten Zahlungen und Ads rechtlich prüfen und die Info-Seiten finalisieren.",
    status: "blocked",
    owner: "Recht",
  },
  {
    id: "native-iap",
    title: "Native IAP-Strategie geklärt",
    description: "Für digitale iOS/Android-Premiumfunktionen später Store-Regeln und IAP prüfen.",
    status: "needs_config",
    owner: "Store",
  },
  {
    id: "ads-consent",
    title: "Ads nur mit Consent/Datenschutz live",
    description: "AdSense/Sponsor Slots sind vorbereitet, aber erst nach Consent- und Datenschutzprüfung aktivieren.",
    status: isAdSenseEnabled && adsensePublisherId ? "needs_config" : "blocked",
    owner: "Recht",
  },
];
