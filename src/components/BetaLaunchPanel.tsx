"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GRADEGLOW_APP_VERSION } from "../lib/appVersion";
import type { AppUser } from "../types";

type BetaLaunchPanelProps = {
  user: AppUser;
  moduleCount: number;
  examCount: number;
  studyCircleReady: boolean;
  profileReady: boolean;
  profileComplete: boolean;
  cloudMessages: string[];
};

const BETA_LAUNCH_DISMISS_PREFIX = "gradeglow-beta-launch-panel-dismissed-v1";

const ChecklistItem = ({ label, done, hint }: { label: string; done: boolean; hint: string }) => (
  <div className={`rounded-2xl p-3 ring-1 ${done ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-amber-50 text-amber-900 ring-amber-100"}`}>
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-black ${done ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
        {done ? "✓" : "!"}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{hint}</p>
      </div>
    </div>
  </div>
);

export default function BetaLaunchPanel({
  user,
  moduleCount,
  examCount,
  studyCircleReady,
  profileReady,
  profileComplete,
  cloudMessages,
}: BetaLaunchPanelProps) {
  const storageKey = `${BETA_LAUNCH_DISMISS_PREFIX}-${user.uid}`;
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    try {
      setIsDismissed(localStorage.getItem(storageKey) === "true");
    } catch {
      setIsDismissed(false);
    }
  }, [storageKey]);

  const checklist = useMemo(
    () => [
      {
        label: "Profil ist sicher geladen",
        done: profileReady,
        hint: profileReady ? "Profil-Speichern ist freigegeben." : "GradeGlow wartet noch auf Firestore.",
      },
      {
        label: "Basisprofil vollständig",
        done: profileComplete,
        hint: profileComplete ? "Name, Hochschule und Studiengang sind gesetzt." : "Hochschule/Studiengang einmal im Profil speichern.",
      },
      {
        label: "Mindestens ein Modul",
        done: moduleCount > 0,
        hint: moduleCount > 0 ? `${moduleCount} Modul(e) vorhanden.` : "Module eintragen, damit ECTS und Fortschritt passen.",
      },
      {
        label: "Prüfungsplan getestet",
        done: examCount > 0,
        hint: examCount > 0 ? `${examCount} Prüfung(en) vorhanden.` : "Prüfung anlegen und eine Lerneinheit abhaken.",
      },
      {
        label: "Study Circle bereit",
        done: studyCircleReady,
        hint: studyCircleReady ? "Sharing ist aktiv. Mit 1 Testperson Code prüfen." : "Für Beta okay, aber mit 1 Testperson prüfen.",
      },
    ],
    [examCount, moduleCount, profileComplete, profileReady, studyCircleReady],
  );

  const doneCount = checklist.filter((item) => item.done).length;

  if (isDismissed) return null;

  const dismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // ignore localStorage failures
    }
  };

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative bg-slate-950 p-5 text-white sm:p-6">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Beta Launch</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Ready-Check vor dem Testen</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              Nutze diese Box, um GradeGlow kurz vor jedem Beta-Test zu prüfen. Wenn etwas leer wirkt: erst Laden abwarten, dann melden.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-xs text-slate-300">Version</p>
                <p className="mt-1 text-sm font-black">{GRADEGLOW_APP_VERSION}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-xs text-slate-300">Check</p>
                <p className="mt-1 text-sm font-black">{doneCount}/{checklist.length} erledigt</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-xs text-slate-300">Cloud</p>
                <p className="mt-1 truncate text-sm font-black">{cloudMessages[0] ?? "bereit"}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/feedback" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">
                Feedback senden
              </Link>
              <Link href="/diagnostics" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">
                Diagnose öffnen
              </Link>
              <button type="button" onClick={dismiss} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">
                Ausblenden
              </button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:p-6 md:grid-cols-2">
          {checklist.map((item) => (
            <ChecklistItem key={item.label} {...item} />
          ))}
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-800 ring-1 ring-violet-100 md:col-span-2">
            <p className="text-sm font-black">Beta-Test-Aufgabe</p>
            <p className="mt-1 text-xs font-semibold leading-5">
              Account erstellen, Profil speichern, Modul + Prüfung anlegen, Lerneinheit abhaken, Theme wechseln, Freund hinzufügen, Bug/Feedback senden, neu laden.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
