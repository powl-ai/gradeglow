"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import BetaNoticeCard from "./BetaNoticeCard";
import GradeGlowLogo from "./GradeGlowLogo";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import { getMyFeedback, submitGradeGlowFeedback } from "../lib/feedback";
import type { AppUser, FeedbackPriority, FeedbackType, GradeGlowFeedback } from "../types";

type FeedbackPageProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
};

const typeOptions: { value: FeedbackType; label: string; description: string }[] = [
  { value: "bug", label: "Bug melden", description: "Etwas funktioniert nicht oder sieht kaputt aus." },
  { value: "feature_request", label: "Feature wünschen", description: "Eine Idee für GradeGlow oder Beta-Premium." },
  { value: "feedback", label: "Allgemeines Feedback", description: "Meinung, UX, Design, Verständnis." },
  { value: "delete_request", label: "Daten/Löschung", description: "Hilfe bei Datenexport, Löschung oder Account." },
  { value: "beta_note", label: "Beta-Hinweis", description: "Etwas zur Testversion oder zum Onboarding." },
];

const priorityOptions: { value: FeedbackPriority; label: string }[] = [
  { value: "low", label: "Niedrig" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Hoch" },
];

const statusLabels: Record<string, string> = {
  open: "Offen",
  reviewing: "In Prüfung",
  planned: "Geplant",
  done: "Erledigt",
  closed: "Geschlossen",
};

export default function FeedbackPage({ user, onLogout }: FeedbackPageProps) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [priority, setPriority] = useState<FeedbackPriority>("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myFeedback, setMyFeedback] = useState<GradeGlowFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackListMessage, setFeedbackListMessage] = useState("");
  const { profile } = useGradeGlowProfile(user);
  const { limits } = useGradeGlowAccess(user);
  const effectivePageThemeId = getEffectivePageThemeId(profile.activePageThemeId, limits.premiumThemes);
  const themeClassName = getThemeClassName(profile.themeMode);
  const themeStyle = getPageThemeStyle(effectivePageThemeId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPage(window.location.pathname);
    }
  }, []);

  const loadFeedback = async () => {
    setIsLoadingFeedback(true);
    setFeedbackListMessage("");
    try {
      setMyFeedback(await getMyFeedback(user));
    } catch {
      setMyFeedback([]);
      setFeedbackListMessage("Deine Meldungen konnten gerade nicht geladen werden. Admins sehen sie trotzdem, wenn das Speichern geklappt hat.");
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  useEffect(() => {
    void loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");

    if (!subject.trim() || subject.trim().length < 3) {
      setStatusMessage("Bitte gib einen kurzen Betreff ein.");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setStatusMessage("Bitte beschreibe kurz, was passiert ist oder was du dir wünschst.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitGradeGlowFeedback(user, {
        type,
        priority,
        subject,
        message,
        page: page || "/feedback",
      });
      setSubject("");
      setMessage("");
      setPriority("normal");
      setStatusMessage("Danke, Feedback wurde gespeichert.");
      await loadFeedback();
    } catch {
      setStatusMessage("Feedback konnte nicht gespeichert werden. Prüfe Login und Firestore-Regeln.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`gg-themed ${themeClassName} min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950`} data-accent={profile.accentColor} data-page-theme={effectivePageThemeId} style={themeStyle}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-4 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" />
                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">
                    Beta Feedback
                  </div>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">GradeGlow Testphase</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">Feedback, Bugs und Feature-Wünsche.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Sammle Beta-Rückmeldungen direkt in Firestore, statt sie lose über Chatnachrichten zu verlieren.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/settings" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Einstellungen</Link>
                <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <BetaNoticeCard feedbackHref="#feedback-form" />

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <form id="feedback-form" className="scroll-mt-6 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6" onSubmit={submitFeedback}>
            <p className="text-sm font-bold text-violet-700">Neue Rückmeldung</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Was soll ich mir anschauen?</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-2xl p-4 text-left ring-1 transition hover:-translate-y-0.5 ${type === option.value ? "bg-slate-950 text-white ring-slate-900" : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-violet-50"}`}
                  onClick={() => setType(option.value)}
                >
                  <span className="block text-sm font-black">{option.label}</span>
                  <span className={`mt-1 block text-xs font-semibold leading-5 ${type === option.value ? "text-slate-300" : "text-slate-500"}`}>{option.description}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Betreff</span>
                <input className="field-input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="z. B. Kalender speichert Einheiten nicht" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Priorität</span>
                <select className="field-input" value={priority} onChange={(event) => setPriority(event.target.value as FeedbackPriority)}>
                  {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Seite/Bereich</span>
                <input className="field-input" value={page} onChange={(event) => setPage(event.target.value)} placeholder="z. B. /exams oder Kalender" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Beschreibung</span>
                <textarea
                  className="field-input min-h-44 resize-y"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Was ist passiert? Was hast du erwartet? Auf welchem Gerät/Browser?"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              {statusMessage ? <p className="text-sm font-bold text-slate-600">{statusMessage}</p> : <p className="text-sm text-slate-500">Feedback landet in Firebase unter feedback.</p>}
              <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:opacity-50">
                {isSubmitting ? "Speichere…" : "Feedback senden"}
              </button>
            </div>
          </form>

          <aside className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-violet-700">Deine letzten Meldungen</p>
                <h2 className="mt-1 text-xl font-black tracking-tight">Status</h2>
              </div>
              <button type="button" className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200" onClick={loadFeedback}>
                Neu laden
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {isLoadingFeedback && <p className="text-sm font-semibold text-slate-500">Lade Feedback…</p>}
              {feedbackListMessage && (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800 ring-1 ring-amber-100">{feedbackListMessage}</p>
              )}
              {!isLoadingFeedback && !feedbackListMessage && myFeedback.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500 ring-1 ring-slate-200">Noch keine Meldungen gespeichert.</p>
              )}
              {myFeedback.map((item) => (
                <article key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{item.subject}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{typeOptions.find((option) => option.value === item.type)?.label ?? item.type}</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[0.68rem] font-black text-violet-700 ring-1 ring-violet-100">
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-500">{item.message}</p>
                  {item.adminNote && <p className="mt-2 rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-600 ring-1 ring-slate-200">Admin: {item.adminNote}</p>}
                </article>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
