"use client";

import Link from "next/link";
import AuthGate from "../../components/AuthGate";
import DiagnosticsPage from "../../components/DiagnosticsPage";
import { useGradeGlowAccess } from "../../hooks/useGradeGlowAccess";
import type { AppUser } from "../../types";

function DiagnosticsAccessGate({ user, logout }: { user: AppUser; logout: () => Promise<void> }) {
  const { entitlement } = useGradeGlowAccess(user);
  const canOpenDiagnostics = entitlement.plan === "admin" || ["beta_test", "founder", "manual"].includes(entitlement.premiumSource);

  if (!canOpenDiagnostics) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ff] px-4 text-slate-950">
        <section className="max-w-md rounded-[2rem] bg-white/90 p-6 text-center shadow-sm ring-1 ring-violet-100">
          <p className="text-sm font-bold text-violet-700">Beta Diagnostics</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Nur für Beta/Admin sichtbar</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Die Diagnose-Seite ist ein internes Beta-Werkzeug. Normales Feedback kannst du weiterhin senden.
          </p>
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

  return <DiagnosticsPage user={user} onLogout={logout} />;
}

export default function DiagnosticsRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <DiagnosticsAccessGate user={user} logout={logout} />}
    </AuthGate>
  );
}
