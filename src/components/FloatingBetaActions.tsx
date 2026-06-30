"use client";

import Link from "next/link";
import { useState } from "react";

type FloatingBetaActionsProps = {
  isAdmin?: boolean;
};

export default function FloatingBetaActions({ isAdmin = false }: FloatingBetaActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-5 sm:right-5">
      {isOpen && (
        <div className="flex flex-col items-end gap-2 rounded-[1.35rem] bg-white/85 p-2 shadow-2xl shadow-slate-950/15 ring-1 ring-slate-200 backdrop-blur-xl">
          <Link
            href="/feedback"
            className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-violet-800"
            onClick={() => setIsOpen(false)}
          >
            Bug / Feedback
          </Link>
          <Link
            href="/diagnostics"
            className="rounded-full bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-violet-700"
            onClick={() => setIsOpen(false)}
          >
            Diagnose
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-violet-700"
              onClick={() => setIsOpen(false)}
            >
              Admin
            </Link>
          )}
        </div>
      )}

      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white shadow-2xl shadow-slate-950/20 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-violet-800"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Beta-Aktionen schließen" : "Beta-Aktionen öffnen"}
      >
        {isOpen ? "×" : "?"}
      </button>
    </div>
  );
}
