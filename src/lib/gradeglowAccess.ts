import type { GradeGlowEntitlement, PlanLimits, UserPlan } from "../types";

export const DEFAULT_USER_PLAN: UserPlan = "free";

export const planLabels: Record<UserPlan, string> = {
  free: "Free",
  premium: "Premium",
  lifetime: "Lifetime",
  admin: "Admin",
};

export const planDescriptions: Record<UserPlan, string> = {
  free: "Basisfunktionen mit fairen Limits.",
  premium: "Erweiterte Statistik, mehr Freunde und später Premium-Features.",
  lifetime: "Dauerhafte Premium-Freischaltung ohne Ablaufdatum.",
  admin: "Interner Admin-/Founder-Zugriff mit allen Features.",
};

const unlimited = Number.POSITIVE_INFINITY;

const limitsByPlan: Record<UserPlan, PlanLimits> = {
  free: {
    maxFriends: 3,
    maxModules: 10,
    maxExams: 5,
    advancedStats: false,
    premiumThemes: false,
    exportBackup: true,
    adsFree: false,
  },
  premium: {
    maxFriends: 25,
    maxModules: unlimited,
    maxExams: unlimited,
    advancedStats: true,
    premiumThemes: true,
    exportBackup: true,
    adsFree: true,
  },
  lifetime: {
    maxFriends: unlimited,
    maxModules: unlimited,
    maxExams: unlimited,
    advancedStats: true,
    premiumThemes: true,
    exportBackup: true,
    adsFree: true,
  },
  admin: {
    maxFriends: unlimited,
    maxModules: unlimited,
    maxExams: unlimited,
    advancedStats: true,
    premiumThemes: true,
    exportBackup: true,
    adsFree: true,
  },
};

const validPlans: UserPlan[] = ["free", "premium", "lifetime", "admin"];
const activePremiumStatuses = ["", "active", "trialing", "beta_test"];

const getStringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getPlan = (value: unknown): UserPlan =>
  validPlans.includes(value as UserPlan) ? (value as UserPlan) : DEFAULT_USER_PLAN;

const hasToDate = (value: unknown): value is { toDate: () => Date } =>
  typeof value === "object" &&
  value !== null &&
  "toDate" in value &&
  typeof (value as { toDate?: unknown }).toDate === "function";

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (hasToDate(value)) {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T23:59:59`
      : trimmed;
    const date = new Date(normalizedValue);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

const formatDateOnly = (date: Date | null) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isDateActive = (value: unknown) => {
  if (!value) return true;

  const parsed = parseDateValue(value);
  if (!parsed) return true;

  return parsed.getTime() >= Date.now();
};

const getRawObject = (rawValue: unknown) =>
  typeof rawValue === "object" && rawValue !== null
    ? (rawValue as Record<string, unknown>)
    : {};

export const normalizeEntitlement = (rawValue: unknown): GradeGlowEntitlement => {
  const raw = getRawObject(rawValue);
  const storedPlan = getPlan(raw.plan);
  const planFromPremiumFlag: UserPlan = raw.isPremium === true ? "premium" : DEFAULT_USER_PLAN;
  const candidatePlan = storedPlan !== "free" ? storedPlan : planFromPremiumFlag;

  const premiumExpiresAt = raw.premiumExpiresAt ?? raw.expiresAt ?? raw.premiumUntil;
  const premiumUntil = getStringValue(raw.premiumUntil) || formatDateOnly(parseDateValue(premiumExpiresAt));
  const premiumStatus = getStringValue(raw.premiumStatus).toLowerCase();
  const hasActiveStatus = activePremiumStatuses.includes(premiumStatus);
  const hasActiveDate = isDateActive(premiumExpiresAt);
  const shouldExpire = candidatePlan === "premium" && (!hasActiveStatus || !hasActiveDate);
  const effectivePlan: UserPlan = shouldExpire ? "free" : candidatePlan;
  const premiumSource =
    getStringValue(raw.premiumSource) ||
    getStringValue(raw.source) ||
    (raw.betaTester === true ? "beta_test" : "default");

  return {
    plan: effectivePlan,
    storedPlan: candidatePlan,
    premiumUntil,
    premiumSource,
    note: getStringValue(raw.note),
    updatedAtIso: getStringValue(raw.updatedAtIso),
    isManuallyGranted: ["manual", "beta_test", "promo", "founder"].includes(premiumSource),
  };
};

export const mergeEntitlementSources = (
  userDocumentValue: unknown,
  entitlementDocumentValue: unknown,
): GradeGlowEntitlement => {
  const userDocument = getRawObject(userDocumentValue);
  const entitlementDocument = getRawObject(entitlementDocumentValue);

  // entitlements/{uid} wins over users/{uid}, because users/{uid} may contain normal profile data.
  return normalizeEntitlement({ ...userDocument, ...entitlementDocument });
};

export const getPlanLimits = (plan: UserPlan): PlanLimits => limitsByPlan[plan] ?? limitsByPlan.free;

export const isUnlimited = (value: number) => !Number.isFinite(value);

export const formatLimit = (value: number, unit = "") =>
  isUnlimited(value) ? "unbegrenzt" : `${value}${unit ? ` ${unit}` : ""}`;

export const isPremiumPlan = (plan: UserPlan) => plan === "premium" || plan === "lifetime" || plan === "admin";
