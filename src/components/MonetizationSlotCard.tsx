"use client";

import type { GradeGlowEntitlement, PlanLimits } from "../types";
import { areSponsorSlotsEnabled, isEntitlementAdsFree } from "../lib/monetization";

type MonetizationSlotCardProps = {
  entitlement: GradeGlowEntitlement;
  limits: PlanLimits;
  placement?: string;
};

export default function MonetizationSlotCard({ entitlement, limits, placement = "home-free-card" }: MonetizationSlotCardProps) {
  if (!areSponsorSlotsEnabled || isEntitlementAdsFree(entitlement, limits)) return null;

  return (
    <aside className="rounded-3xl bg-white/85 p-4 shadow-sm ring-1 ring-amber-100 backdrop-blur" data-monetization-placement={placement}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-amber-600">Anzeige · vorbereitet</p>
          <h3 className="mt-1 text-sm font-black text-slate-950">Ruhiger Sponsor Slot</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            Dieser Platz bleibt leer, bis du Sponsor Slots bewusst aktivierst und rechtlich geprüft hast.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-1 text-[0.65rem] font-black text-amber-700 ring-1 ring-amber-100">Free</span>
      </div>
    </aside>
  );
}
