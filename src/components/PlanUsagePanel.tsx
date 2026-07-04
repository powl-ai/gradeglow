"use client";

import { formatLimit, isUnlimited, planLabels } from "../lib/gradeglowAccess";
import UpgradeCard from "./UpgradeCard";
import type { PlanLimits, UserPlan } from "../types";

type UsageItem = {
  label: string;
  used: number;
  limit: number;
  unit: string;
};

type PlanUsagePanelProps = {
  plan: UserPlan;
  limits: PlanLimits;
  modulesCount: number;
  examsCount: number;
  friendsCount?: number;
};

const getUsagePercent = (used: number, limit: number) => {
  if (isUnlimited(limit)) return 18;
  return Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
};

const getUsageState = (used: number, limit: number) => {
  if (isUnlimited(limit)) return "premium";
  if (used >= limit) return "blocked";
  if (used / Math.max(limit, 1) >= 0.8) return "warning";
  return "ok";
};

const getUsageClassName = (state: string) => {
  if (state === "blocked") return "bg-rose-500";
  if (state === "warning") return "bg-amber-500";
  if (state === "premium") return "bg-fuchsia-500";
  return "bg-violet-600";
};

export default function PlanUsagePanel({ plan, limits, modulesCount, examsCount, friendsCount }: PlanUsagePanelProps) {
  const items: UsageItem[] = [
    { label: "Module", used: modulesCount, limit: limits.maxModules, unit: "Module" },
    { label: "Prüfungen", used: examsCount, limit: limits.maxExams, unit: "Prüfungen" },
    ...(typeof friendsCount === "number"
      ? [{ label: "Freunde", used: friendsCount, limit: limits.maxFriends, unit: "Freunde" }]
      : []),
  ];
  const isFreePlan = plan === "free";
  const hasReachedLimit = items.some((item) => getUsageState(item.used, item.limit) === "blocked");

  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-violet-700">Plan & Limits</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{planLabels[plan]} Nutzung</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            GradeGlow zeigt dir fair, wie viel du im aktuellen Plan schon nutzt. Plus ist vorbereitet, aber echte Käufe sind noch nicht aktiv.
          </p>
        </div>
        <span className={`self-start rounded-full px-3 py-1.5 text-xs font-black ring-1 ${isFreePlan ? "bg-slate-50 text-slate-600 ring-slate-200" : "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100"}`}>
          {isFreePlan ? "Free" : "Premium aktiv"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {items.map((item) => {
          const state = getUsageState(item.used, item.limit);
          const percent = getUsagePercent(item.used, item.limit);
          return (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-700">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.used} / {formatLimit(item.limit, item.unit)} genutzt
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black ${state === "blocked" ? "bg-rose-50 text-rose-700" : state === "warning" ? "bg-amber-50 text-amber-700" : "bg-white text-slate-500"}`}>
                  {state === "blocked" ? "Limit" : state === "warning" ? "fast voll" : "ok"}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                <div className={`h-full rounded-full ${state === "blocked" ? getUsageClassName(state) : "gg-plan-usage-fill"}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {(isFreePlan || hasReachedLimit) && (
        <div className="mt-4">
          <UpgradeCard
            compact
            title={hasReachedLimit ? "Free-Limit erreicht" : "GradeGlow Plus vorbereitet"}
            description="Später: mehr Module, mehr Prüfungen, mehr Freunde, Advanced Stats, Premium-Themes und keine Ads. In der Beta ist Plus nur als Preview sichtbar."
          />
        </div>
      )}
    </section>
  );
}
