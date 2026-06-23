"use client";

import Link from "next/link";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useMemo, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AppUser, ExamPlanItem, GradeGlowProfile, StartMode, UniModule } from "../types";
import { DEFAULT_TARGET_ECTS } from "../hooks/useGradeGlowProfile";
import GradeGlowLogo from "./GradeGlowLogo";
import { createDemoGradeGlowData, DEMO_EXAM_MARKER, DEMO_SOURCE } from "../lib/demoData";
import { db, isFirebaseConfigured } from "../lib/firebase";

type OnboardingWizardProps = {
  user: AppUser;
  profile: GradeGlowProfile;
  modules: UniModule[];
  exams: ExamPlanItem[];
  saveProfile: (profile: GradeGlowProfile) => Promise<void>;
  setModules: Dispatch<SetStateAction<UniModule[]>>;
  setExams: Dispatch<SetStateAction<ExamPlanItem[]>>;
};

const startOptions: {
  id: StartMode;
  title: string;
  description: string;
  href: string;
  emoji: string;
}[] = [
  {
    id: "manual",
    title: "Module manuell eintragen",
    description: "Schnellster Start, wenn du nur wenige Module hast.",
    href: "/modules",
    emoji: "✍️",
  },
  {
    id: "stupo",
    title: "StuPo importieren",
    description: "Für Pflicht-/Wahlmodule und Semesterplanung.",
    href: "/planning",
    emoji: "🧭",
  },
  {
    id: "template",
    title: "Vorlage nutzen",
    description: "Gut für typische Bachelor-Strukturen mit 180 ECTS.",
    href: "/planning",
    emoji: "📋",
  },
  {
    id: "demo",
    title: "Demo-Daten anlegen",
    description: "Erstellt Beispielmodule, Prüfungen und Lerneinheiten zum Testen.",
    href: "/",
    emoji: "✨",
  },
];

const ectsPresets = [180, 210, 120, 90];

const parseNumber = (value: string) => Number(value.replace(",", "."));

export default function OnboardingWizard({
  user,
  profile,
  modules,
  exams,
  saveProfile,
  setModules,
  setExams,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [university, setUniversity] = useState(profile.university);
  const [degreeProgram, setDegreeProgram] = useState(profile.degreeProgram);
  const [degreeType, setDegreeType] = useState(profile.degreeType || "Bachelor");
  const [currentSemester, setCurrentSemester] = useState(String(profile.currentSemester || 1));
  const [targetEcts, setTargetEcts] = useState(String(profile.targetEcts || DEFAULT_TARGET_ECTS));
  const [preferredStartMode, setPreferredStartMode] = useState<StartMode>(
    profile.preferredStartMode || "manual",
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedOption = useMemo(
    () => startOptions.find((option) => option.id === preferredStartMode) ?? startOptions[0],
    [preferredStartMode],
  );

  const buildProfile = (completed: boolean): GradeGlowProfile => {
    const parsedEcts = parseNumber(targetEcts);
    const parsedSemester = parseNumber(currentSemester);

    return {
      ...profile,
      displayName: displayName.trim() || profile.displayName || "GradeGlow User",
      university: university.trim(),
      degreeProgram: degreeProgram.trim(),
      degreeType: degreeType.trim() || "Bachelor",
      currentSemester: Number.isFinite(parsedSemester) ? Math.max(1, Math.round(parsedSemester)) : 1,
      targetEcts: Number.isFinite(parsedEcts) && parsedEcts > 0 ? parsedEcts : DEFAULT_TARGET_ECTS,
      preferredStartMode,
      onboardingCompleted: completed,
    };
  };

  const seedDemoData = async () => {
    const demoData = createDemoGradeGlowData();
    const nextModules = [
      ...modules.filter((module) => module.stupoSource !== DEMO_SOURCE),
      ...demoData.modules,
    ];
    const nextExams = [
      ...exams.filter((exam) => !exam.notes.includes(DEMO_EXAM_MARKER)),
      ...demoData.exams,
    ];

    setModules(nextModules);
    setExams(nextExams);

    if (user.provider !== "firebase" || !isFirebaseConfigured || !db) return;

    const firestore = db;
    const batch = writeBatch(firestore);
    const modulesCollectionRef = collection(firestore, "users", user.uid, "modules");
    const examsCollectionRef = collection(firestore, "users", user.uid, "exams");

    modules
      .filter((module) => module.stupoSource === DEMO_SOURCE)
      .forEach((module) => batch.delete(doc(modulesCollectionRef, module.id)));

    exams
      .filter((exam) => exam.notes.includes(DEMO_EXAM_MARKER))
      .forEach((exam) => batch.delete(doc(examsCollectionRef, exam.id)));

    demoData.modules.forEach((module) => {
      batch.set(
        doc(modulesCollectionRef, module.id),
        {
          ...module,
          ownerUid: user.uid,
          version: 2,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    demoData.exams.forEach((exam) => {
      batch.set(
        doc(examsCollectionRef, exam.id),
        {
          ...exam,
          ownerUid: user.uid,
          version: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    await batch.commit();
  };

  const finishOnboarding = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setMessage("");

    if (!displayName.trim()) {
      setMessage("Bitte gib einen Namen ein, damit dein Dashboard personalisiert ist.");
      setStep(1);
      return;
    }

    const parsedEcts = parseNumber(targetEcts);
    if (!Number.isFinite(parsedEcts) || parsedEcts < 30 || parsedEcts > 400) {
      setMessage("Bitte gib realistische Ziel-ECTS ein, z. B. 180.");
      setStep(1);
      return;
    }

    setIsSaving(true);
    try {
      if (preferredStartMode === "demo") {
        await seedDemoData();
      }

      await saveProfile(buildProfile(true));
      window.location.href = selectedOption.href;
    } catch {
      setMessage("Setup konnte nicht gespeichert werden. Versuch es bitte nochmal.");
    } finally {
      setIsSaving(false);
    }
  };

  const skip = async () => {
    setIsSaving(true);
    try {
      await saveProfile({ ...buildProfile(true), preferredStartMode: "manual" });
      window.location.href = "/modules";
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ff] px-3 py-4 text-slate-950 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/70 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/70 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col justify-center gap-5">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-5 flex items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" />
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-fuchsia-100 ring-1 ring-white/10">
                    Setup {step}/2
                  </span>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-fuchsia-200">
                  Willkommen bei GradeGlow
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                  Lass uns dein Studium kurz einrichten.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Danach weiß GradeGlow, mit welchen ECTS gerechnet wird und welcher Startweg für dich am besten passt.
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/15"
                onClick={skip}
                disabled={isSaving}
              >
                Setup überspringen
              </button>
            </div>
          </div>
        </section>

        <form className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-7" onSubmit={finishOnboarding}>
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-violet-700">Basisdaten</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Was studierst du?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Das kannst du später jederzeit unter Profil ändern.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Name</span>
                  <input className="field-input" placeholder="z. B. Paul" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Hochschule</span>
                  <input className="field-input" placeholder="z. B. HTW Berlin, TU Berlin" value={university} onChange={(event) => setUniversity(event.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Studiengang</span>
                  <input className="field-input" placeholder="z. B. Wirtschaftsingenieurwesen" value={degreeProgram} onChange={(event) => setDegreeProgram(event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Abschluss</span>
                  <select className="field-input" value={degreeType} onChange={(event) => setDegreeType(event.target.value)}>
                    <option>Bachelor</option>
                    <option>Master</option>
                    <option>Staatsexamen</option>
                    <option>Sonstiges</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Aktuelles Semester</span>
                  <input className="field-input" inputMode="numeric" value={currentSemester} onChange={(event) => setCurrentSemester(event.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Ziel-ECTS</span>
                  <input className="field-input" inputMode="decimal" value={targetEcts} onChange={(event) => setTargetEcts(event.target.value)} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ectsPresets.map((preset) => (
                      <button key={preset} type="button" className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100" onClick={() => setTargetEcts(String(preset))}>
                        {preset} ECTS
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-violet-700">Startweg</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Wie willst du starten?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  GradeGlow schickt dich danach direkt an die passende Stelle. Beim Demo-Start werden vorhandene Demo-Daten ersetzt, deine echten Daten bleiben erhalten.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {startOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`rounded-3xl p-4 text-left ring-1 transition hover:-translate-y-0.5 ${
                      preferredStartMode === option.id
                        ? "bg-violet-50 ring-violet-300"
                        : "bg-white ring-slate-200 hover:ring-violet-200"
                    }`}
                    onClick={() => setPreferredStartMode(option.id)}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <h3 className="mt-3 text-lg font-black">{option.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {message && (
            <p className="mt-5 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
              {message}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-500">
              {step === 1 ? "Noch ein Schritt, dann ist dein Dashboard bereit." : `Start: ${selectedOption.title}`}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {step === 2 && (
                <button type="button" className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700" onClick={() => setStep(1)}>
                  Zurück
                </button>
              )}
              {step === 1 ? (
                <button type="button" className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200" onClick={() => setStep(2)}>
                  Weiter
                </button>
              ) : (
                <button type="submit" className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? "Speichern…" : "Setup abschließen"}
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="text-center text-xs font-bold text-slate-400">
          Schon eingerichtet? <Link href="/settings" className="text-violet-700">Profil später bearbeiten</Link>
        </p>
      </div>
    </main>
  );
}
