"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GradeGlowLogo from "./GradeGlowLogo";
import { GRADEGLOW_APP_VERSION, GRADEGLOW_SUPPORT_EMAIL } from "../lib/appVersion";
import { nativeAppConfig, nativeReadinessItems } from "../lib/nativeAppReadiness";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import type { AppUser } from "../types";

const STORAGE_PREFIX = "gradeglow-native-readiness-v1";

const priorityClass = {
  hoch: "bg-rose-50 text-rose-700 ring-rose-100",
  mittel: "bg-amber-50 text-amber-700 ring-amber-100",
  niedrig: "bg-slate-50 text-slate-600 ring-slate-200",
};

const categoryHint = {
  Setup: "Technische Grundlage",
  UI: "App-Gefühl",
  Store: "Assets & Listing",
  Monetarisierung: "Plus, IAP, Ads",
  Recht: "Vertrauen & Pflichtseiten",
};

const getStorageKey = (uid: string) => `${STORAGE_PREFIX}:${uid}`;

const readChecks = (uid: string) => {
  if (typeof window === "undefined") return {} as Record<string, boolean>;
  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));
    if (!raw) return {} as Record<string, boolean>;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, value === true]));
  } catch {
    return {} as Record<string, boolean>;
  }
};

export default function NativeAppReadinessPage({ user, onLogout }: { user: AppUser; onLogout: () => Promise<void> }) {
  const { profile } = useGradeGlowProfile(user);
  const { entitlement, accessSyncMessage } = useGradeGlowAccess(user);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copyMessage, setCopyMessage] = useState("");

  const effectivePageThemeId = getEffectivePageThemeId(profile.activePageThemeId, true);
  const themeClassName = getThemeClassName(profile.themeMode);
  const themeStyle = getPageThemeStyle(effectivePageThemeId);

  useEffect(() => {
    setChecked(readChecks(user.uid));
  }, [user.uid]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getStorageKey(user.uid), JSON.stringify(checked));
  }, [checked, user.uid]);

  const doneCount = nativeReadinessItems.filter((item) => checked[item.id]).length;
  const score = Math.round((doneCount / nativeReadinessItems.length) * 100);
  const highOpen = nativeReadinessItems.filter((item) => item.priority === "hoch" && !checked[item.id]).length;

  const groupedItems = useMemo(() => {
    return nativeReadinessItems.reduce<Record<string, typeof nativeReadinessItems>>((groups, item) => {
      groups[item.category] = [...(groups[item.category] ?? []), item];
      return groups;
    }, {});
  }, []);

  const report = useMemo(() => {
    const openItems = nativeReadinessItems
      .filter((item) => !checked[item.id])
      .map((item) => `- [${item.priority}] ${item.category}: ${item.title} — ${item.description}`);

    return [
      "GradeGlow Native App Readiness Report",
      `Version: ${GRADEGLOW_APP_VERSION}`,
      `Score: ${score}% (${doneCount}/${nativeReadinessItems.length})`,
      `App-ID: ${nativeAppConfig.appId}`,
      `App-Name: ${nativeAppConfig.appName}`,
      `WebDir: ${nativeAppConfig.webDir}`,
      `Plan: ${entitlement.plan} · Quelle: ${entitlement.premiumSource || "default"}`,
      `Support: ${GRADEGLOW_SUPPORT_EMAIL}`,
      "",
      "Strategie:",
      nativeAppConfig.currentStrategy,
      "",
      "Offene Punkte:",
      openItems.length ? openItems.join("\n") : "Keine offenen Punkte.",
    ].join("\n");
  }, [checked, doneCount, entitlement.plan, entitlement.premiumSource, score]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopyMessage("Native App Report kopiert.");
    } catch {
      setCopyMessage("Kopieren nicht möglich.");
    }
  };

  return (
    <main className={`gg-themed ${themeClassName} min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950`} data-accent={profile.accentColor} data-page-theme={effectivePageThemeId} style={themeStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10 sm:rounded-[2rem]">
          <div className="relative p-5 sm:p-8">
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <GradeGlowLogo size="md" tone="light" appIconId={profile.activeAppIconId} />
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">{accessSyncMessage}</span>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-black text-emerald-100 ring-1 ring-emerald-200/20">Native Prep</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-200/80 sm:text-sm">Capacitor Readiness</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">GradeGlow als echte iOS-/Android-App vorbereiten.</h1>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-300 sm:text-base sm:leading-7">
                  Vercel/PWA bleibt produktiv. Dieser Schritt legt nur die native Grundlage, Checkliste und Dokumentation an — ohne iOS/Android-Ordner, ohne Payments und ohne Functions-Deploy.
                </p>
              </div>
              <div className="grid gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-100">Native Score</p>
                  <p className="mt-1 text-4xl font-black tracking-tight">{score}%</p>
                  <p className="mt-1 text-sm font-bold text-slate-300">{doneCount}/{nativeReadinessItems.length} erledigt · {highOpen} hohe Blocker offen</p>
                </div>
                <Link href="/store" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Store Center</Link>
                <Link href="/launch" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Launch Center</Link>
                <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur lg:col-span-2 sm:p-6">
            <p className="text-sm font-bold text-violet-700">Native Konfiguration</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Vorsichtig vorbereitet, ohne die Web-App umzubauen.</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">App-ID</p>
                <p className="mt-1 break-all text-sm font-black text-slate-950">{nativeAppConfig.appId}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">App-Name</p>
                <p className="mt-1 text-sm font-black text-slate-950">{nativeAppConfig.appName}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">WebDir</p>
                <p className="mt-1 text-sm font-black text-slate-950">{nativeAppConfig.webDir}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{nativeAppConfig.currentStrategy}</p>
          </article>

          <article className="rounded-3xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-amber-800">Nicht live aktiv</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-950">Keine nativen Ordner im Patch.</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-800">
              Keine iOS-/Android-Ordner, keine Capacitor npm-Abhängigkeiten, keine Ads, keine In-App-Käufe und kein Functions-Deploy. Dieser Patch ist Vorbereitung, kein Store-Build.
            </p>
          </article>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Native Checkliste</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Was vor TestFlight und Play-Test geklärt sein muss.</h2>
            </div>
            <button type="button" onClick={() => setChecked({})} className="rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-white">Zurücksetzen</button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {Object.entries(groupedItems).map(([category, items]) => (
              <article key={category} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{categoryHint[category as keyof typeof categoryHint]}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{category}</h3>
                <div className="mt-3 grid gap-2">
                  {items.map((item) => {
                    const isDone = checked[item.id] === true;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setChecked((current) => ({ ...current, [item.id]: !current[item.id] }))}
                        className={`rounded-2xl p-3 text-left ring-1 transition hover:-translate-y-0.5 ${isDone ? "bg-emerald-50 ring-emerald-100" : "bg-white ring-slate-200 hover:bg-violet-50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] ring-1 ${priorityClass[item.priority]}`}>{item.priority}</span>
                            <h4 className="mt-2 text-sm font-black text-slate-950">{item.title}</h4>
                          </div>
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ring-1 ${isDone ? "bg-emerald-500 text-white ring-emerald-500" : "bg-white text-slate-300 ring-slate-200"}`}>✓</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">{item.description}</p>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Spätere Befehle</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Erst ausführen, wenn native Tests wirklich dran sind.</h2>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs font-bold leading-6 text-slate-100">{`npm install @capacitor/core @capacitor/cli
npm install -D @capacitor/assets
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npm run build
npx cap sync`}</pre>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">Wichtig: Vorher entscheiden, ob GradeGlow statisch exportierbar gemacht wird oder ob ein gehosteter Preview-Build mit CAPACITOR_SERVER_URL getestet wird.</p>
          </article>

          <article className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-violet-950/10 ring-1 ring-white/10 sm:p-6">
            <p className="text-sm font-bold text-violet-200">Report</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Für neuen Chat oder Release-Plan kopieren.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">Der Report enthält Score, App-ID, Strategie und offene native Blocker.</p>
            <button type="button" onClick={copyReport} className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">Native Report kopieren</button>
            {copyMessage && <p className="mt-3 text-sm font-bold text-emerald-200">{copyMessage}</p>}
          </article>
        </section>
      </div>
    </main>
  );
}
