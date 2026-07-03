"use client";

import type { ReactNode } from "react";
import type { GradeGlowEntitlement, PlanLimits } from "../types";
import { getFeatureAccess, type GradeGlowFeatureGateId } from "../lib/featureGates";
import { getPlanLimits } from "../lib/gradeglowAccess";
import UpgradeCard from "./UpgradeCard";

type PremiumGateProps = {
  entitlement: GradeGlowEntitlement;
  featureId: GradeGlowFeatureGateId;
  children: ReactNode;
  limits?: PlanLimits;
  fallback?: ReactNode;
  compact?: boolean;
};

export default function PremiumGate({ entitlement, featureId, children, limits, fallback, compact = false }: PremiumGateProps) {
  const access = getFeatureAccess(featureId, entitlement, limits ?? getPlanLimits(entitlement.plan));

  if (access.allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradeCard
      compact={compact}
      title={access.label}
      description={`${access.reason} Checkout ist vorbereitet, aber erst aktiv, wenn du die Payment-Links in Vercel verbindest.`}
    />
  );
}
