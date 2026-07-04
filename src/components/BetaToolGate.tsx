"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import type { AppUser } from "../types";

type BetaToolGateProps = {
  user: AppUser;
  title: string;
  description: string;
  children: ReactNode;
};

export default function BetaToolGate({ user, title, description, children }: BetaToolGateProps) {
  const { entitlement, accessSyncStatus } = useGradeGlowAccess(user);
  const canOpenBetaTool = entitlement.plan === "admin" || ["beta_test", "founder", "manual"].includes(entitlement.premiumSource);

  if (accessSyncStatus === "cloud-loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ff] px-4 text-slate-950">
        <section className="max-w-md rounded-[2rem] bg-white/90 p-6 text-center shadow-sm ring-1 ring-violet-100">
          <p className="text-sm font-bold text-violet-700">GradeGlow Beta</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Zugriff wird geprüft…</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Einen Moment, GradeGlow lädt deine Beta-Rechte.</p>
        </section>
      </main>
    );
  }

  if (!canOpenBetaTool) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ff] px-4 text-slate-950">
        <section className="max-w-md rounded-[2rem] bg-white/90 p-6 text-center shadow-sm ring-1 ring-violet-100">
          <p className="text-sm font-bold text-violet-700">{title}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Nur für interne Beta sichtbar</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/feedback" className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white">
              Feedback senden
            </Link>
            <Link href="/" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200">
              Zur App
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
