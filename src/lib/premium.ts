import { Timestamp } from "firebase/firestore";
import type { UserPlan } from "../types";
import { isPremiumPlan } from "./gradeglowAccess";

export type PremiumSource = "beta_test" | "manual" | "stripe" | "promo" | "founder";

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getBetaPremiumUntilDate = (startDate = new Date()) => {
  const expiresAt = new Date(startDate);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  return expiresAt;
};

export const buildOneYearBetaEntitlement = (startDate = new Date()) => {
  const expiresAt = getBetaPremiumUntilDate(startDate);

  return {
    plan: "premium" as UserPlan,
    premiumUntil: formatDateOnly(expiresAt),
    premiumSource: "beta_test" as PremiumSource,
    premiumStatus: "active",
    note: "1 Jahr Beta-Test Premium",
    updatedAtIso: startDate.toISOString(),
  };
};

export const buildOneYearBetaUserFields = (startDate = new Date()) => {
  const expiresAt = getBetaPremiumUntilDate(startDate);

  return {
    plan: "premium" as UserPlan,
    isPremium: true,
    premiumStatus: "active",
    premiumSource: "beta_test" as PremiumSource,
    premiumExpiresAt: Timestamp.fromDate(expiresAt),
    betaTester: true,
  };
};

export const canUsePremiumFeature = (plan: UserPlan) => isPremiumPlan(plan);
