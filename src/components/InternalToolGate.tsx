"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AccessSyncStatus } from "../hooks/useGradeGlowAccess";
import type { GradeGlowEntitlement } from "../types";

type InternalToolGateProps = {
  title: string;
  description: string;
  entitlement: GradeGlowEntitlement;
  accessSyncStatus: AccessSyncStatus;
  children: ReactNode;
};

export default function InternalToolGate({
  title,
  description,
  entitlement,
  accessSyncStatus,
  children,
}: InternalToolGateProps) {
  const isLoading = accessSyncStatus === "cloud-loading";
  const isAdmin = entitlement.plan === "admin";

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbf7ff] px-3 py-6 text-slate-950 gg-safe-top gg-safe-x gg-safe-bottom sm:px-6 lg:px-8">
        <section className="mx-auto mt-12 max-w-xl rounded-[2rem] bg-white/90 p-6 shadow-sm ring-1 ring-violet-100 backdrop-blur">
          <p className="text-sm font-bold text-violet-700">Zugriff wird geprüft</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Einen Moment, GradeGlow lädt deinen Admin-Status.</p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#fbf7ff] px-3 py-6 text-slate-950 gg-safe-top gg-safe-x gg-safe-bottom sm:px-6 lg:px-8">
        <section className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-200">Intern</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">Kein Zugriff auf {title}.</h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{description}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">Diese Seite ist nur für Admin-Accounts sichtbar. Normale Nutzer, Free-, Plus- und Beta-Accounts werden zurück in die App geführt.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/premium" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Plus ansehen</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
