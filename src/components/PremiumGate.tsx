"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { GradeGlowEntitlement, PlanLimits } from "../types";
import { getFeatureAccess, type GradeGlowFeatureGateId } from "../lib/featureGates";
import { getPlanLimits } from "../lib/gradeglowAccess";

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
    <div className={`rounded-3xl bg-slate-950 text-white ring-1 ring-slate-900 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black">Premium vorbereitet</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{access.reason}</p>
        </div>
        <span className="self-start rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-white ring-1 ring-white/10">
          {access.badge}
        </span>
      </div>
      <Link href="/premium" className="mt-4 inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">
        Free vs Plus ansehen
      </Link>
    </div>
  );
}
