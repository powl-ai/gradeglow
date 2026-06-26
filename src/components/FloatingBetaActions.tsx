"use client";

import Link from "next/link";

type FloatingBetaActionsProps = {
  isAdmin?: boolean;
};

export default function FloatingBetaActions({ isAdmin = false }: FloatingBetaActionsProps) {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-5 sm:right-5">
      <Link
        href="/feedback"
        className="rounded-full bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-2xl shadow-slate-950/20 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-violet-800"
      >
        Bug / Feedback
      </Link>
      <div className="hidden flex-col gap-2 sm:flex">
        <Link
          href="/diagnostics"
          className="rounded-full bg-white/90 px-4 py-2.5 text-xs font-black text-slate-700 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:text-violet-700"
        >
          Diagnose
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-full bg-white/90 px-4 py-2.5 text-xs font-black text-slate-700 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:text-violet-700"
          >
            Admin
          </Link>
        )}
      </div>
    </div>
  );
}
