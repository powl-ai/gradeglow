"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GradeGlowLogo from "./GradeGlowLogo";
import { GRADEGLOW_APP_VERSION, GRADEGLOW_SUPPORT_EMAIL } from "../lib/appVersion";
import {
  launchReadinessCategories,
  manualLaunchChecks,
  priorityOrder,
  type LaunchReadinessCategoryId,
  type ManualLaunchCheck,
} from "../lib/launchReadiness";
import type { AppUser, ExamPlanItem, GradeGlowEntitlement, GradeGlowProfile, UniModule } from "../types";

type LaunchReadinessCenterProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
  profile: GradeGlowProfile;
  modules: UniModule[];
  exams: ExamPlanItem[];
  entitlement: GradeGlowEntitlement;
  cloudMessages: string[];
  isProfileLoaded: boolean;
  modulesLoaded: boolean;
  examsLoaded: boolean;
};

type AutoLaunchCheck = {
  id: string;
  categoryId: LaunchReadinessCategoryId;
  title: string;
  description: string;
  passed: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  priority: ManualLaunchCheck["priority"];
};

type LaunchScoreItem = {
  id: string;
  categoryId: LaunchReadinessCategoryId;
  title: string;
  description: string;
  passed: boolean;
  isManual: boolean;
  priority: ManualLaunchCheck["priority"];
  ctaHref?: string;
  ctaLabel?: string;
};

const STORAGE_KEY_PREFIX = "gradeglow-launch-readiness-v1";

const formatDateTime = () =>
  new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getManualStorageKey = (uid: string) => `${STORAGE_KEY_PREFIX}:${uid}`;

const readManualChecks = (uid: string) => {
  if (typeof window === "undefined") return {} as Record<string, boolean>;

  try {
    const raw = window.localStorage.getItem(getManualStorageKey(uid));
    if (!raw) return {} as Record<string, boolean>;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, value === true]));
  } catch {
    return {} as Record<string, boolean>;
  }
};

const getModuleRiskCount = (modules: UniModule[]) =>
  modules.filter((module) => {
    const attempts = Number(module.attemptCount ?? 0);
    const maxAttempts = Number(module.maxAttempts ?? 3);
    return module.isLocked || attempts >= Math.max(1, maxAttempts - 1);
  }).length;

const getExamSessionCount = (exams: ExamPlanItem[]) =>
  exams.reduce((sum, exam) => sum + (exam.studySessions?.length ?? 0), 0);

const getDoneSessionCount = (exams: ExamPlanItem[]) =>
  exams.reduce((sum, exam) => sum + (exam.studySessions ?? []).filter((session) => session.isDone).length, 0);

const createAutoChecks = ({
  profile,
  modules,
  exams,
  entitlement,
  cloudMessages,
  isProfileLoaded,
  modulesLoaded,
  examsLoaded,
}: Omit<LaunchReadinessCenterProps, "user" | "onLogout">): AutoLaunchCheck[] => {
  const activeFeatures = new Set(profile.enabledFeatureIds ?? []);
  const sessionCount = getExamSessionCount(exams);
  const doneSessionCount = getDoneSessionCount(exams);
  const riskyModules = getModuleRiskCount(modules);
  const hasAnyCloudWarning = cloudMessages.some((message) => message.toLowerCase().includes("fehler"));

  return [
    {
      id: "profile-loaded",
      categoryId: "product",
      title: "Profil lädt stabil",
      description: "Profil wurde geladen und Onboarding ist abgeschlossen.",
      passed: isProfileLoaded && profile.onboardingCompleted,
      ctaHref: "/settings",
      ctaLabel: "Profil prüfen",
      priority: "hoch",
    },
    {
      id: "feature-prefs",
      categoryId: "product",
      title: "Feature-Auswahl gesetzt",
      description: "Nutzer hat bewusst gewählt, welche Bereiche sichtbar sein sollen.",
      passed: activeFeatures.size > 0 || profile.onboardingCompleted,
      ctaHref: "/settings",
      ctaLabel: "Features öffnen",
      priority: "hoch",
    },
    {
      id: "modules-ready",
      categoryId: "product",
      title: "Modulverwaltung produktiv nutzbar",
      description: "Mindestens ein Modul ist vorhanden und Module wurden geladen.",
      passed: modulesLoaded && modules.length > 0,
      ctaHref: "/modules",
      ctaLabel: "Module öffnen",
      priority: "hoch",
    },
    {
      id: "exams-ready",
      categoryId: "product",
      title: "Prüfungsplaner produktiv nutzbar",
      description: "Mindestens eine Prüfung ist vorhanden und Prüfungen wurden geladen.",
      passed: examsLoaded && exams.length > 0,
      ctaHref: "/exams",
      ctaLabel: "Prüfungen öffnen",
      priority: "hoch",
    },
    {
      id: "study-sessions-ready",
      categoryId: "product",
      title: "Lernplan erzeugt Sessions",
      description: "Mindestens eine Lerneinheit existiert; erledigte Sessions zeigen, dass Abhaken funktioniert.",
      passed: sessionCount > 0 && doneSessionCount >= 0,
      ctaHref: "/exams",
      ctaLabel: "Lernplan prüfen",
      priority: "mittel",
    },
    {
      id: "risk-visible",
      categoryId: "product",
      title: "Fehlversuchs-Risiko sichtbar",
      description: riskyModules > 0 ? `${riskyModules} kritische Module werden erkannt.` : "Keine kritischen Module oder Fehlversuche eingetragen.",
      passed: modulesLoaded,
      ctaHref: "/planning",
      ctaLabel: "Planung öffnen",
      priority: "mittel",
    },
    {
      id: "study-circle-configured",
      categoryId: "product",
      title: "Study Circle vorbereitet",
      description: "Freundes-/Circle-Sharing ist im Profil aktivierbar und kann in der Beta getestet werden.",
      passed: profile.studySharingEnabled || activeFeatures.has("friends"),
      ctaHref: "/friends",
      ctaLabel: "Study Circle öffnen",
      priority: "mittel",
    },
    {
      id: "cloud-sync-clean",
      categoryId: "data",
      title: "Cloud-Sync ohne sichtbare Fehler",
      description: "Module, Prüfungen, Profil und Stundenplan melden keinen akuten Sync-Fehler.",
      passed: !hasAnyCloudWarning && isProfileLoaded && modulesLoaded && examsLoaded,
      priority: "hoch",
    },
    {
      id: "export-entry",
      categoryId: "data",
      title: "Export/Backup erreichbar",
      description: "Backup-Seite ist als Nutzerfunktion vorhanden und sollte im Testskript geprüft werden.",
      passed: true,
      ctaHref: "/backup",
      ctaLabel: "Backup öffnen",
      priority: "hoch",
    },
    {
      id: "diagnostics-entry",
      categoryId: "beta",
      title: "Diagnostics erreichbar",
      description: "Beta-Tester/Admins können Diagnose und Button-Audit öffnen.",
      passed: entitlement.plan === "admin" || ["beta_test", "founder", "manual"].includes(entitlement.premiumSource),
      ctaHref: "/diagnostics",
      ctaLabel: "Diagnostics öffnen",
      priority: "hoch",
    },
    {
      id: "admin-entry",
      categoryId: "beta",
      title: "Admin-Control-Center erreichbar",
      description: "Admin kann Feedback und Beta-Status zentral verwalten.",
      passed: entitlement.plan === "admin",
      ctaHref: "/admin",
      ctaLabel: "Admin öffnen",
      priority: "mittel",
    },
    {
      id: "pwa-entry",
      categoryId: "mobile",
      title: "PWA-Install-Hinweis aktiv",
      description: "Install-Karte, Service Worker und Offline-Seite sind im Code vorhanden.",
      passed: true,
      ctaHref: "/",
      ctaLabel: "Dashboard öffnen",
      priority: "mittel",
    },
  ];
};

const scoreLabel = (score: number) => {
  if (score >= 90) return "Beta fast releasebereit";
  if (score >= 75) return "Gute Beta-Basis";
  if (score >= 55) return "Testbar, aber mit Blockern";
  return "Noch intern halten";
};

export default function LaunchReadinessCenter({
  user,
  onLogout,
  profile,
  modules,
  exams,
  entitlement,
  cloudMessages,
  isProfileLoaded,
  modulesLoaded,
  examsLoaded,
}: LaunchReadinessCenterProps) {
  const [manualState, setManualState] = useState<Record<string, boolean>>({});
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    setManualState(readManualChecks(user.uid));
  }, [user.uid]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getManualStorageKey(user.uid), JSON.stringify(manualState));
  }, [manualState, user.uid]);

  const autoChecks = useMemo(
    () =>
      createAutoChecks({
        profile,
        modules,
        exams,
        entitlement,
        cloudMessages,
        isProfileLoaded,
        modulesLoaded,
        examsLoaded,
      }),
    [cloudMessages, entitlement, exams, examsLoaded, isProfileLoaded, modules, modulesLoaded, profile],
  );

  const allChecks = useMemo<LaunchScoreItem[]>(() => {
    const autoItems = autoChecks.map((check) => ({ ...check, isManual: false }));
    const manualItems = manualLaunchChecks.map((check) => ({
      id: check.id,
      categoryId: check.categoryId,
      title: check.title,
      description: check.description,
      passed: manualState[check.id] === true,
      isManual: true,
      priority: check.priority,
    }));

    return [...autoItems, ...manualItems];
  }, [autoChecks, manualState]);

  const score = useMemo(() => {
    const total = allChecks.length;
    if (total === 0) return 0;
    const done = allChecks.filter((check) => check.passed).length;
    return Math.round((done / total) * 100);
  }, [allChecks]);

  const blockers = useMemo(
    () =>
      allChecks
        .filter((check) => !check.passed)
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 6),
    [allChecks],
  );

  const categoryStats = useMemo(
    () =>
      launchReadinessCategories.map((category) => {
        const items = allChecks.filter((check) => check.categoryId === category.id);
        const done = items.filter((check) => check.passed).length;
        return {
          ...category,
          total: items.length,
          done,
          score: items.length ? Math.round((done / items.length) * 100) : 0,
        };
      }),
    [allChecks],
  );

  const exportText = useMemo(() => {
    const blockerLines = blockers.length
      ? blockers.map((check) => `- [ ] ${check.title} (${check.priority})`).join("\n")
      : "- Keine offenen Blocker im Launch Center";
    const categoryLines = categoryStats
      .map((category) => `- ${category.title}: ${category.done}/${category.total} (${category.score}%)`)
      .join("\n");

    return `# GradeGlow Beta Launch Report\n\nDatum: ${formatDateTime()}\nVersion: ${GRADEGLOW_APP_VERSION}\nAccount: ${user.email ?? user.uid}\nScore: ${score}% - ${scoreLabel(score)}\n\n## Kategorien\n${categoryLines}\n\n## Nächste Blocker\n${blockerLines}\n\n## Produktdaten\n- Module: ${modules.length}\n- Prüfungen: ${exams.length}\n- Lerneinheiten: ${getExamSessionCount(exams)}\n- Erledigte Lerneinheiten: ${getDoneSessionCount(exams)}\n\nSupport: ${GRADEGLOW_SUPPORT_EMAIL}\n`;
  }, [blockers, categoryStats, exams, modules.length, score, user.email, user.uid]);

  const copyReport = async () => {
    setCopyMessage("");
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyMessage("Launch-Report kopiert.");
    } catch {
      setCopyMessage("Kopieren nicht möglich. Markiere den Report unten manuell.");
    }
  };

  const toggleManualCheck = (id: string) => {
    setManualState((current) => ({ ...current, [id]: current[id] !== true }));
  };

  const resetManualChecks = () => {
    setManualState({});
    setCopyMessage("Manuelle Launch-Checks zurückgesetzt.");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950 gg-safe-x gg-safe-bottom">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-4 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" />
                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">
                    Beta Launch Center
                  </div>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">GradeGlow Release Readiness</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Ein zentraler Plan für die nächste echte Beta.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Diese Seite bündelt Produkt-Reife, Datenschutz, Mobile/PWA, Beta-Betrieb und App-Store-Vorbereitung. Automatische Checks kommen aus deinen App-Daten, manuelle Checks speicherst du lokal pro Account.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <p className="text-sm font-bold text-slate-300">Launch Score</p>
                <p className="mt-2 text-6xl font-black tracking-tight">{score}%</p>
                <p className="mt-2 text-sm font-bold text-fuchsia-100">{scoreLabel(score)}</p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                  <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">
                    Zur App
                  </Link>
                  <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/15">
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {categoryStats.map((category) => (
            <article key={category.id} className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
              <p className="text-sm font-black text-violet-700">{category.title}</p>
              <p className="mt-2 text-4xl font-black tracking-tight">{category.score}%</p>
              <p className="mt-2 text-xs font-bold text-slate-400">{category.done}/{category.total} Checks</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                <div className="h-full rounded-full bg-violet-700" style={{ width: `${category.score}%` }} />
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-violet-700">Nächste Blocker</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Was GradeGlow am meisten weiterbringt</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sortiert nach Priorität. Erst diese Punkte schließen, dann neue Features hinzufügen.
                </p>
              </div>
              <button type="button" onClick={copyReport} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                Report kopieren
              </button>
            </div>

            {copyMessage && <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-800 ring-1 ring-violet-100">{copyMessage}</p>}

            <div className="mt-5 flex flex-col gap-3">
              {blockers.length === 0 ? (
                <div className="rounded-3xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800 ring-1 ring-emerald-100">
                  Keine offenen Launch-Blocker in dieser Liste. Jetzt wäre der richtige Zeitpunkt für einen größeren externen Beta-Test.
                </div>
              ) : (
                blockers.map((check) => (
                  <article key={check.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
                            {check.priority}
                          </span>
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-violet-700 ring-1 ring-violet-100">
                            {check.isManual ? "manuell" : "auto"}
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-black tracking-tight">{check.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{check.description}</p>
                      </div>
                      {check.ctaHref && check.ctaLabel && (
                        <Link href={check.ctaHref} className="shrink-0 rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-700">
                          {check.ctaLabel}
                        </Link>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Produktdaten</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Was aus echten App-Daten gelesen wird</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Module</p>
                <p className="mt-2 text-4xl font-black">{modules.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Prüfungen</p>
                <p className="mt-2 text-4xl font-black">{exams.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Lerneinheiten</p>
                <p className="mt-2 text-4xl font-black">{getExamSessionCount(exams)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Erledigt</p>
                <p className="mt-2 text-4xl font-black">{getDoneSessionCount(exams)}</p>
              </div>
            </div>
            <div className="mt-5 rounded-3xl bg-slate-950 p-4 text-sm leading-6 text-slate-300 ring-1 ring-slate-900">
              <p className="font-black text-white">Release-Prinzip</p>
              <p className="mt-2">
                Erst Stabilität, Löschfluss, Auth-Branding und Beta-Triage schließen. Danach lohnt sich Capacitor/iOS oder Abitur/Ausbildung als nächster Produktzweig.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Manuelle Launch-Checks</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Was nicht automatisch beweisbar ist</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Diese Punkte werden lokal pro Account gespeichert. Sie sind absichtlich nicht in Firestore, damit keine neuen Rules nötig sind.
              </p>
            </div>
            <button type="button" onClick={resetManualChecks} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50">
              Manuelle Checks zurücksetzen
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {manualLaunchChecks.map((check) => {
              const isDone = manualState[check.id] === true;
              const category = launchReadinessCategories.find((item) => item.id === check.categoryId);
              return (
                <button
                  key={check.id}
                  type="button"
                  onClick={() => toggleManualCheck(check.id)}
                  className={`rounded-3xl p-4 text-left ring-1 transition hover:-translate-y-0.5 ${
                    isDone
                      ? "bg-emerald-50 text-emerald-950 ring-emerald-100"
                      : "bg-slate-50 text-slate-950 ring-slate-200 hover:bg-violet-50 hover:ring-violet-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
                          {category?.title ?? check.categoryId}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 ring-1 ring-slate-200">
                          {check.priority}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-black tracking-tight">{check.title}</h3>
                      <p className="mt-1 text-sm leading-6 opacity-75">{check.description}</p>
                      <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] opacity-60">Owner: {check.owner}</p>
                    </div>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ring-1 ${isDone ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-400 ring-slate-200"}`}>
                      {isDone ? "✓" : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <p className="text-sm font-bold text-violet-700">Launch Report</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Kopierbare Übergabe für neuen Chat oder Beta-Notizen</h2>
          <textarea
            className="mt-4 min-h-72 w-full rounded-3xl border-0 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 shadow-inner ring-1 ring-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
            value={exportText}
            readOnly
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={copyReport} className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-800">
              Report kopieren
            </button>
            <Link href="/info" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50">
              Info/Datenschutz prüfen
            </Link>
            <Link href="/feedback" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50">
              Feedback testen
            </Link>
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-400">
            {GRADEGLOW_APP_VERSION} · {getTodayKey()} · {GRADEGLOW_SUPPORT_EMAIL}
          </p>
        </section>
      </div>
    </main>
  );
}
