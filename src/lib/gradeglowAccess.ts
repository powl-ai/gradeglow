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
    maxModules: 35,
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

const getStringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getPlan = (value: unknown): UserPlan =>
  validPlans.includes(value as UserPlan) ? (value as UserPlan) : DEFAULT_USER_PLAN;

const isDateInFutureOrToday = (dateValue: string) => {
  if (!dateValue) return true;
  const parsed = new Date(`${dateValue}T23:59:59`);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getTime() >= Date.now();
};

export const normalizeEntitlement = (rawValue: unknown): GradeGlowEntitlement => {
  const raw = typeof rawValue === "object" && rawValue !== null
    ? (rawValue as Record<string, unknown>)
    : {};
  const storedPlan = getPlan(raw.plan);
  const premiumUntil = getStringValue(raw.premiumUntil);
  const hasActiveDate = isDateInFutureOrToday(premiumUntil);
  const effectivePlan: UserPlan =
    storedPlan === "premium" && !hasActiveDate ? "free" : storedPlan;

  return {
    plan: effectivePlan,
    storedPlan,
    premiumUntil,
    premiumSource: getStringValue(raw.premiumSource) || "default",
    note: getStringValue(raw.note),
    updatedAtIso: getStringValue(raw.updatedAtIso),
    isManuallyGranted: getStringValue(raw.premiumSource) === "manual",
  };
};

export const getPlanLimits = (plan: UserPlan): PlanLimits => limitsByPlan[plan] ?? limitsByPlan.free;

export const isUnlimited = (value: number) => !Number.isFinite(value);

export const formatLimit = (value: number, unit = "") =>
  isUnlimited(value) ? "unbegrenzt" : `${value}${unit ? ` ${unit}` : ""}`;

export const isPremiumPlan = (plan: UserPlan) => plan === "premium" || plan === "lifetime" || plan === "admin";
