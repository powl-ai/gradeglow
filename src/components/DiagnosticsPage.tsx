"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import GradeGlowLogo from "./GradeGlowLogo";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import {
  createDiagnosticReport,
  getDiagnosticsSnapshot,
  getMyDiagnosticReports,
  scanCurrentPageForUiIssues,
  submitUiAudit,
} from "../lib/diagnostics";
import { GRADEGLOW_APP_VERSION, GRADEGLOW_SUPPORT_EMAIL } from "../lib/appVersion";
import type { AppUser, DiagnosticPriority, DiagnosticReport, UiIssue } from "../types";

type DiagnosticsPageProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
};

const priorityOptions: { value: DiagnosticPriority; label: string }[] = [
  { value: "low", label: "Niedrig" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Hoch" },
  { value: "critical", label: "Kritisch" },
];

const statusLabels: Record<string, string> = {
  open: "Offen",
  reviewing: "In Prüfung",
  fixed: "Gefixt",
  ignored: "Ignoriert",
  closed: "Geschlossen",
};

const betaChecklistItems = [
  "Neuen Account erstellen",
  "Onboarding Step 1 per Enter testen",
  "Onboarding Feature-Auswahl bewusst setzen",
  "Profil im Standard/System-Darkmode prüfen",
  "Modul anlegen und speichern",
  "Prüfung und Lerneinheit anlegen",
  "Timer starten und Seite wechseln",
  "Study Circle Freundescode testen",
  "Circle erstellen, beitreten und verlassen",
  "Daten exportieren",
  "PWA installieren oder iOS-Install-Anleitung prüfen",
  "Offline-Seite kurz testen",
  "Update-Hinweis nach neuem Deploy prüfen",
  "App-Daten mit Testaccount löschen",
  "Firebase Account mit Testaccount löschen",
];

const BETA_CHECKLIST_STORAGE_PREFIX = "gradeglow-beta-test-checklist-v1";

const quickBugTemplates = [
  {
    label: "Daten wirken weg",
    title: "Daten werden nach Theme-/Seitenwechsel leer angezeigt",
    buttonLabel: "Cloud-/Ladezustand",
    message: "Ich habe die Seite/Theme gewechselt und Inhalte wirkten kurz leer oder kamen erst nach Reload zurück.",
    priority: "high" as DiagnosticPriority,
  },
  {
    label: "Button kaputt",
    title: "Button ohne Funktion oder leer",
    buttonLabel: "Bitte Button/Bereich eintragen",
    message: "Ein Button war leer, nicht klickbar oder hat nichts ausgelöst. Schritte: ",
    priority: "normal" as DiagnosticPriority,
  },
  {
    label: "Theme/Lesbarkeit",
    title: "Text oder Button ist im Theme schlecht lesbar",
    buttonLabel: "Theme + Seite eintragen",
    message: "In diesem Theme ist Text/Button zu hell, zu dunkel oder nicht gut erkennbar. Theme/Akzent: ",
    priority: "normal" as DiagnosticPriority,
  },
  {
    label: "Study Circle",
    title: "Study Circle / Freundescode Problem",
    buttonLabel: "Freunde / Study Circle",
    message: "Freund hinzufügen, Profilbild, Sharing oder Code funktioniert nicht wie erwartet. Code/Schritt: ",
    priority: "high" as DiagnosticPriority,
  },
];

export default function DiagnosticsPage({ user, onLogout }: DiagnosticsPageProps) {
  const [snapshot, setSnapshot] = useState(() => getDiagnosticsSnapshot());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [priority, setPriority] = useState<DiagnosticPriority>("normal");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [uiIssues, setUiIssues] = useState<UiIssue[]>([]);
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [checkedBetaItems, setCheckedBetaItems] = useState<string[]>([]);
  const { profile } = useGradeGlowProfile(user);
  const { limits } = useGradeGlowAccess(user);
  const effectivePageThemeId = getEffectivePageThemeId(profile.activePageThemeId, limits.premiumThemes);
  const themeClassName = getThemeClassName(profile.themeMode);
  const themeStyle = getPageThemeStyle(effectivePageThemeId);

  const diagnosticRows = useMemo(
    () => [
      ["Version", GRADEGLOW_APP_VERSION],
      ["Route", snapshot.route],
      ["User UID", user.uid],
      ["E-Mail", user.email ?? "—"],
      ["Login", user.provider],
      ["Browser", snapshot.userAgent],
      ["Sprache", snapshot.browserLanguage],
      ["Viewport", snapshot.viewport],
      ["Online", snapshot.onlineStatus],
      ["Notifications", snapshot.notificationPermission],
      ["localStorage", snapshot.localStorageAvailable ? "verfügbar" : "blockiert"],
      ["Service Worker", snapshot.serviceWorkerAvailable ? "verfügbar" : "nicht verfügbar"],
      ["Push Manager", snapshot.pushManagerAvailable ? "verfügbar" : "nicht verfügbar"],
      ["Firebase Config", snapshot.firebaseConfigured ? "gesetzt" : "fehlt"],
    ],
    [snapshot, user.email, user.provider, user.uid],
  );

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const nextReports = await getMyDiagnosticReports(user);
      setReports(nextReports);
    } catch {
      setFormMessage("Diagnose-Verlauf konnte nicht geladen werden.");
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    const refresh = () => setSnapshot(getDiagnosticsSnapshot());
    refresh();
    void loadReports();

    try {
      const savedChecklist = localStorage.getItem(`${BETA_CHECKLIST_STORAGE_PREFIX}-${user.uid}`);
      if (savedChecklist) {
        const parsed = JSON.parse(savedChecklist);
        setCheckedBetaItems(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
      }
    } catch {
      setCheckedBetaItems([]);
    }

    window.addEventListener("resize", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  const toggleBetaChecklistItem = (item: string) => {
    setCheckedBetaItems((current) => {
      const nextItems = current.includes(item)
        ? current.filter((currentItem) => currentItem !== item)
        : [...current, item];

      try {
        localStorage.setItem(`${BETA_CHECKLIST_STORAGE_PREFIX}-${user.uid}`, JSON.stringify(nextItems));
      } catch {
        // ignore localStorage failures
      }

      return nextItems;
    });
  };

  const resetBetaChecklist = () => {
    setCheckedBetaItems([]);
    try {
      localStorage.removeItem(`${BETA_CHECKLIST_STORAGE_PREFIX}-${user.uid}`);
    } catch {
      // ignore localStorage failures
    }
  };

  const applyQuickTemplate = (template: (typeof quickBugTemplates)[number]) => {
    setTitle(template.title);
    setButtonLabel(template.buttonLabel);
    setMessage(template.message);
    setPriority(template.priority);
    setFormMessage("Vorlage eingefügt. Ergänze kurz deine Schritte und speichere den Bug.");
  };

  const submitBugReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    setIsSubmitting(true);
    try {
      const details = [message.trim(), buttonLabel.trim() ? `\nBetroffener Button/Bereich: ${buttonLabel.trim()}` : ""].join("");
      await createDiagnosticReport(user, {
        kind: "bug_report",
        priority,
        title: title.trim() || "Beta-Bug gemeldet",
        message: details,
        metadata: {
          buttonLabel: buttonLabel.trim(),
          snapshot,
        },
      });
      setFormMessage("Bug-Report gespeichert. Danke, das landet jetzt im Admin-Bereich.");
      setTitle("");
      setMessage("");
      setButtonLabel("");
      setPriority("normal");
      await loadReports();
    } catch {
      setFormMessage("Bug-Report konnte nicht gespeichert werden. Prüfe Firestore Rules oder deine Verbindung.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runUiAudit = async () => {
    setFormMessage("");
    setIsAuditing(true);
    try {
      const issues = scanCurrentPageForUiIssues();
      setUiIssues(issues);
      await submitUiAudit(user, issues);
      setFormMessage(issues.length > 0 ? "UI-Audit gespeichert. Auffälligkeiten sind im Admin-Bereich sichtbar." : "UI-Audit gespeichert: keine Auffälligkeiten gefunden.");
      await loadReports();
    } catch {
      setFormMessage("UI-Audit konnte nicht gespeichert werden.");
    } finally {
      setIsAuditing(false);
    }
  };

  const copyDiagnostics = async () => {
    const payload = JSON.stringify({ user: { uid: user.uid, email: user.email, provider: user.provider }, snapshot }, null, 2);
    await navigator.clipboard.writeText(payload);
    setFormMessage("Diagnose-Daten kopiert.");
  };

  return (
    <main className={`gg-themed ${themeClassName} min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950`} data-accent={profile.accentColor} data-page-theme={effectivePageThemeId} style={themeStyle}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-4 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" appIconId={profile.activeAppIconId} />
                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">{GRADEGLOW_APP_VERSION}</div>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">Beta Diagnostics</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">Fehler schneller finden.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Sammelt Browserdaten, App-Version und konkrete Bug-Reports, damit leere Buttons und Speicherfehler später nicht geraten werden müssen.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/feedback" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Feedback</Link>
                <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Beta-Test-Checkliste</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Release-Stabilität prüfen</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Hake nach jedem Testlauf ab, was funktioniert. Der Stand wird nur lokal auf diesem Gerät gespeichert.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
                {checkedBetaItems.length}/{betaChecklistItems.length} erledigt
              </span>
              <button type="button" onClick={resetBetaChecklist} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                Zurücksetzen
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {betaChecklistItems.map((item) => {
              const isDone = checkedBetaItems.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  className={`rounded-2xl p-3 text-left text-sm font-black ring-1 transition hover:-translate-y-0.5 ${isDone ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-slate-50 text-slate-700 ring-slate-200"}`}
                  onClick={() => toggleBetaChecklistItem(item)}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[0.7rem] ring-1 ring-slate-200">
                    {isDone ? "✓" : ""}
                  </span>
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <form className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6" onSubmit={submitBugReport}>
            <p className="text-sm font-bold text-violet-700">Problem melden</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Beta-Bug-Report</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Nutze das für leere Buttons, nicht gespeicherte Daten, Login-Probleme oder alles, was komisch wirkt.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {quickBugTemplates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  className="rounded-2xl bg-violet-50 px-4 py-3 text-left text-xs font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-100"
                  onClick={() => applyQuickTemplate(template)}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Kurzbeschreibung</span>
                <input className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="z. B. Button im Kalender ohne Funktion" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Betroffener Button/Bereich</span>
                <input className="field-input" value={buttonLabel} onChange={(event) => setButtonLabel(event.target.value)} placeholder="z. B. Speichern im Tagespopup" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Priorität</span>
                <select className="field-input" value={priority} onChange={(event) => setPriority(event.target.value as DiagnosticPriority)}>
                  {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Was ist passiert?</span>
                <textarea className="field-input min-h-40 resize-y" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Was hast du geklickt, was sollte passieren, was ist stattdessen passiert?" />
              </label>
            </div>

            {formMessage && <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700 ring-1 ring-violet-100">{formMessage}</p>}

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:opacity-50">
                {isSubmitting ? "Speichere…" : "Bug speichern"}
              </button>
              <button type="button" onClick={runUiAudit} disabled={isAuditing} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 disabled:opacity-50">
                {isAuditing ? "Prüfe…" : "Button-Audit starten"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-violet-700">Systemstatus</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Diagnose-Daten</h2>
              </div>
              <button type="button" onClick={() => setSnapshot(getDiagnosticsSnapshot())} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">Neu laden</button>
            </div>
            <div className="mt-5 grid gap-2">
              {diagnosticRows.map(([label, value]) => (
                <div key={label} className="grid gap-1 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 sm:grid-cols-[10rem_1fr]">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
                  <p className="break-words text-sm font-semibold text-slate-700">{String(value)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={copyDiagnostics} className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5">Diagnose kopieren</button>
              <a href={`mailto:${GRADEGLOW_SUPPORT_EMAIL}`} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5">Support-Mail</a>
            </div>
          </section>
        </section>

        {uiIssues.length > 0 && (
          <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-amber-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-amber-700">UI-Audit</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Mögliche Button-/Link-Probleme</h2>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {uiIssues.map((issue) => (
                <article key={issue.id} className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                  <p className="text-sm font-black text-amber-900">{issue.message}</p>
                  <p className="mt-2 break-words font-mono text-xs font-semibold text-amber-800">{issue.selector}</p>
                  {issue.label && <p className="mt-1 text-xs font-semibold text-amber-700">Label: {issue.label}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-violet-700">Mein Verlauf</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Gespeicherte Diagnosemeldungen</h2>
            </div>
            <button type="button" onClick={loadReports} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">Neu laden</button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {isLoadingReports && <p className="text-sm font-semibold text-slate-500">Lade…</p>}
            {!isLoadingReports && reports.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Noch keine Diagnosemeldungen.</p>}
            {reports.map((report) => (
              <article key={report.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{report.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{report.kind} · {report.priority} · {report.createdAtIso.slice(0, 10)}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">{statusLabels[report.status] ?? report.status}</span>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">{report.message}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
