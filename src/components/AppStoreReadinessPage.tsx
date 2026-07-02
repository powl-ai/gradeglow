"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GradeGlowLogo from "./GradeGlowLogo";
import { GRADEGLOW_APP_VERSION, GRADEGLOW_SUPPORT_EMAIL } from "../lib/appVersion";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import type { AppUser } from "../types";

type StoreCheck = {
  id: string;
  title: string;
  description: string;
  category: "Listing" | "Screenshots" | "Recht" | "Technik" | "Monetarisierung" | "Native";
  priority: "hoch" | "mittel" | "niedrig";
};

const STORE_CHECKS: StoreCheck[] = [
  {
    id: "positioning",
    category: "Listing",
    priority: "hoch",
    title: "Positionierung final",
    description: "Ein Satz muss sitzen: GradeGlow ist für Studierende, die Noten, ECTS, Prüfungen und Lernplan an einem Ort statt in Notizen/Excel organisieren wollen.",
  },
  {
    id: "privacy-policy",
    category: "Recht",
    priority: "hoch",
    title: "Datenschutz/Impressum final",
    description: "Vor echter Veröffentlichung Verantwortliche Stelle, Impressum, Datenschutz, Löschung, Export und Support rechtlich sauber prüfen.",
  },
  {
    id: "auth-branding",
    category: "Technik",
    priority: "hoch",
    title: "Firebase Auth-Branding geprüft",
    description: "Test-Mail darf möglichst nicht mehr project-...-Team zeigen. Falls Firebase blockt: Owner/IAM/Public-facing name/Auth-Templates prüfen.",
  },
  {
    id: "ios-pwa-safe-area",
    category: "Technik",
    priority: "hoch",
    title: "iOS PWA Safe-Area stabil",
    description: "Home, Plan, Timer, Circle und Profil in Safari und installierter PWA prüfen: kein Header-Overlap, keine verdeckte Hotbar.",
  },
  {
    id: "screenshots-home",
    category: "Screenshots",
    priority: "mittel",
    title: "Screenshot: Mobile Home",
    description: "Heute im Fokus, Studienfortschritt und kompakte Statistik als erster Store-Screenshot.",
  },
  {
    id: "screenshots-plan",
    category: "Screenshots",
    priority: "mittel",
    title: "Screenshot: Prüfungsplan",
    description: "Kalender/Lernplan ohne Timer-Mischung, mit Prüfung, Sessions und Fortschritt zeigen.",
  },
  {
    id: "screenshots-circle",
    category: "Screenshots",
    priority: "mittel",
    title: "Screenshot: Study Circle",
    description: "Circle-Code, Leaderboard, Beta-Badge und Profilmodal zeigen, ohne private Noten sichtbar zu machen.",
  },
  {
    id: "plus-boundaries",
    category: "Monetarisierung",
    priority: "mittel",
    title: "Free/Plus sauber entschieden",
    description: "Keine echten Zahlungen live. Erst Plus-Grenzen, Sponsor-Card-Regeln und Datenschutz/AGB klären.",
  },
  {
    id: "capacitor-decision",
    category: "Native",
    priority: "mittel",
    title: "Capacitor-Entscheidung vorbereitet",
    description: "Capacitor ist vorbereitet, aber iOS/Android-Ordner werden erst erzeugt, wenn TestFlight/Play-Test wirklich dran ist.",
  },
  {
    id: "native-center-reviewed",
    category: "Native",
    priority: "mittel",
    title: "Native App Readiness geprüft",
    description: "/native öffnen und App-ID, WebDir, Safe-Area, Auth, Push, Ads/IAP und rechtliche Blocker durchgehen.",
  },
];

const screenshotPlan = [
  {
    title: "1. Heute im Fokus",
    text: "Mobile Home mit nächster Prüfung, ECTS und Fortschritt. Keine Beta-Debugbox im Screenshot.",
  },
  {
    title: "2. Prüfungsplan",
    text: "Lernplan, Kalender und verschiebbare Sessions. Timer soll dabei nicht im Plan untergehen.",
  },
  {
    title: "3. Fokus-Timer",
    text: "Eigene Timer-Seite mit Fach, Modus, Dauer und Speichern der Lernzeit.",
  },
  {
    title: "4. Study Circle",
    text: "Circle, Leaderboard, Badges und Freundschaft. Private Noten bleiben unsichtbar.",
  },
  {
    title: "5. Vertrauen",
    text: "Export, Löschung, Datenschutz/Info und Support-Mail als Vertrauenssignal.",
  },
];

const listingDraft = {
  subtitle: "Noten, ECTS, Prüfungen und Lernplan an einem Ort.",
  shortDescription:
    "GradeGlow hilft Studierenden, Module, Noten, ECTS, Prüfungen, Lernzeiten und Study Circles übersichtlich zu organisieren — mobil, fokussiert und ohne Excel-Chaos.",
  keywords: [
    "Studium",
    "Noten",
    "ECTS",
    "Lernplan",
    "Prüfungen",
    "Timer",
    "Produktivität",
    "Study Circle",
  ],
};

const STORAGE_PREFIX = "gradeglow-store-readiness-v1";

const priorityClass = {
  hoch: "bg-rose-50 text-rose-700 ring-rose-100",
  mittel: "bg-amber-50 text-amber-700 ring-amber-100",
  niedrig: "bg-slate-50 text-slate-600 ring-slate-200",
};

const getStorageKey = (uid: string) => `${STORAGE_PREFIX}:${uid}`;

const readStoreChecks = (uid: string) => {
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

export default function AppStoreReadinessPage({ user, onLogout }: { user: AppUser; onLogout: () => Promise<void> }) {
  const { entitlement, accessSyncMessage } = useGradeGlowAccess(user);
  const { profile } = useGradeGlowProfile(user);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copyMessage, setCopyMessage] = useState("");

  const effectivePageThemeId = getEffectivePageThemeId(profile.activePageThemeId, true);
  const themeClassName = getThemeClassName(profile.themeMode);
  const themeStyle = getPageThemeStyle(effectivePageThemeId);

  useEffect(() => {
    setChecked(readStoreChecks(user.uid));
  }, [user.uid]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getStorageKey(user.uid), JSON.stringify(checked));
  }, [checked, user.uid]);

  const doneCount = STORE_CHECKS.filter((check) => checked[check.id]).length;
  const score = Math.round((doneCount / STORE_CHECKS.length) * 100);
  const highOpen = STORE_CHECKS.filter((check) => check.priority === "hoch" && !checked[check.id]).length;

  const report = useMemo(() => {
    const openChecks = STORE_CHECKS.filter((check) => !checked[check.id]).map(
      (check) => `- [${check.priority}] ${check.title}: ${check.description}`,
    );
    return [
      "GradeGlow Store Readiness Report",
      `Version: ${GRADEGLOW_APP_VERSION}`,
      `Score: ${score}% (${doneCount}/${STORE_CHECKS.length})`,
      `Plan: ${entitlement.plan} · Quelle: ${entitlement.premiumSource || "default"}`,
      `Support: ${GRADEGLOW_SUPPORT_EMAIL}`,
      "",
      "Listing Draft:",
      `Untertitel: ${listingDraft.subtitle}`,
      `Kurzbeschreibung: ${listingDraft.shortDescription}`,
      `Keywords: ${listingDraft.keywords.join(", ")}`,
      "",
      "Offene Punkte:",
      openChecks.length ? openChecks.join("\n") : "Keine offenen Punkte.",
    ].join("\n");
  }, [checked, doneCount, entitlement.plan, entitlement.premiumSource, score]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopyMessage("Store Report kopiert.");
    } catch {
      setCopyMessage("Kopieren nicht möglich.");
    }
  };

  return (
    <main className={`gg-themed ${themeClassName} min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950`} data-accent={profile.accentColor} data-page-theme={effectivePageThemeId} style={themeStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-8">
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" appIconId={profile.activeAppIconId} />
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">{accessSyncMessage}</span>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-black text-emerald-100 ring-1 ring-emerald-200/20">Store Prep</span>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-fuchsia-200/80">App Store Readiness</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">GradeGlow für Store, TestFlight und Beta-Unterlagen vorbereiten.</h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-300">
                  Keine neuen nativen Abhängigkeiten, keine echten Zahlungen und keine Ads live. Diese Seite sammelt Listing, Screenshots, Datenschutz-Blocker und Release-Entscheidungen an einem Ort.
                </p>
              </div>
              <div className="grid gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-100">Readiness</p>
                  <p className="mt-1 text-4xl font-black tracking-tight">{score}%</p>
                  <p className="mt-1 text-sm font-bold text-slate-300">{doneCount}/{STORE_CHECKS.length} erledigt · {highOpen} hohe Blocker offen</p>
                </div>
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/launch" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Launch Center</Link>
                <Link href="/native" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Native Prep</Link>
                <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur lg:col-span-2">
            <p className="text-sm font-bold text-violet-700">Listing Draft</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Store-Text, der nicht nach Feature-Liste klingt.</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Untertitel</p>
                <p className="mt-1 font-black text-slate-950">{listingDraft.subtitle}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Kurzbeschreibung</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{listingDraft.shortDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {listingDraft.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 ring-1 ring-violet-100">{keyword}</span>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-sm font-bold text-violet-700">Entscheidung</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">PWA zuerst, Store danach.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              GradeGlow bleibt Vercel/PWA-first. Capacitor ist jetzt vorbereitet, aber TestFlight/Play-Test lohnt sich erst, wenn Mobile Shell, Datenschutz, Auth-Flows, Support und Plus-Grenzen wirklich sitzen.
            </p>
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 ring-1 ring-amber-100">
              Kein AdSense/AdMob aktiv. Keine Zahlungen aktiv. Keine Functions deployed.
            </div>
          </article>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Store Checklist</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Was vor TestFlight/App Store wirklich fertig sein muss.</h2>
            </div>
            <button
              type="button"
              onClick={() => setChecked({})}
              className="rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-white"
            >
              Zurücksetzen
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {STORE_CHECKS.map((check) => {
              const isDone = checked[check.id] === true;
              return (
                <button
                  key={check.id}
                  type="button"
                  onClick={() => setChecked((current) => ({ ...current, [check.id]: !current[check.id] }))}
                  className={`rounded-3xl p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 ${isDone ? "bg-emerald-50 ring-emerald-100" : "bg-white/80 ring-slate-200 hover:bg-violet-50"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500 ring-1 ring-slate-200">{check.category}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] ring-1 ${priorityClass[check.priority]}`}>{check.priority}</span>
                      </div>
                      <h3 className="mt-3 text-base font-black text-slate-950">{check.title}</h3>
                    </div>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ring-1 ${isDone ? "bg-emerald-500 text-white ring-emerald-500" : "bg-white text-slate-300 ring-slate-200"}`}>✓</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{check.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <p className="text-sm font-bold text-violet-700">Screenshot Story</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Nicht alles zeigen — nur den Nutzen.</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            {screenshotPlan.map((item) => (
              <article key={item.title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <h3 className="font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Datenschutz-Labels vorbereiten</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Vor Store-Listing bewusst prüfen.</h2>
            <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-slate-600">
              <li>• Accountdaten: E-Mail, Login-Anbieter, UID</li>
              <li>• App-Inhalte: Module, Noten, ECTS, Prüfungen, Lernzeiten</li>
              <li>• Social: Freundescode, Study-Circle-Profil, geteilte Lernzeit</li>
              <li>• Diagnose: Feedback, Client Errors, Button-Audits</li>
              <li>• Keine privaten Noten in Circle-Profilen veröffentlichen</li>
            </ul>
          </article>

          <article className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-violet-950/10 ring-1 ring-white/10 sm:p-6">
            <p className="text-sm font-bold text-violet-200">Report</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Für neuen Chat oder Release-Notizen kopieren.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">Der Report enthält Score, offene Blocker, Listing-Draft und Support-Info.</p>
            <button type="button" onClick={copyReport} className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">
              Store Report kopieren
            </button>
            {copyMessage && <p className="mt-3 text-sm font-bold text-emerald-200">{copyMessage}</p>}
          </article>
        </section>
      </div>
    </main>
  );
}
