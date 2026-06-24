"use client";

import type { ReactNode } from "react";
import type { UserPlan } from "../types";
import { isPremiumPlan } from "../lib/gradeglowAccess";

type PremiumGateProps = {
  plan: UserPlan;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function PremiumGate({ plan, children, fallback }: PremiumGateProps) {
  if (isPremiumPlan(plan)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <div className="rounded-3xl bg-slate-950 p-5 text-white ring-1 ring-slate-900">
          <p className="text-sm font-black">Premium-Feature</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Dieses Feature ist für Premium-, Lifetime- oder Admin-Accounts freigeschaltet.
          </p>
        </div>
      )}
    </>
  );
}
