"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useGradeGlowExams } from "../hooks/useGradeGlowExams";
import type {
  AppUser,
  ExamKind,
  ExamPlanItem,
  ExamPriority,
  ExamStatus,
  ModuleStatus,
  UniModule,
} from "../types";

type GradeGlowPlannerProps = {
  user: AppUser;
  modules: UniModule[];
};

type StudySession = {
  dateLabel: string;
  title: string;
  focus: string;
  duration: string;
};

const examKindOptions: { value: ExamKind; label: string }[] = [
  { value: "exam", label: "Klausur" },
  { value: "presentation", label: "Präsentation" },
  { value: "paper", label: "Hausarbeit" },
  { value: "project", label: "Projekt" },
  { value: "oral", label: "Mündlich" },
  { value: "other", label: "Sonstiges" },
];

const priorityOptions: { value: ExamPriority; label: string }[] = [
  { value: "low", label: "locker" },
  { value: "normal", label: "normal" },
  { value: "high", label: "hoch" },
];

const statusOptions: { value: ExamStatus; label: string }[] = [
  { value: "planned", label: "geplant" },
  { value: "learning", label: "lerne gerade" },
  { value: "done", label: "erledigt" },
];

const emptyForm = {
  title: "",
  moduleId: "",
  examDate: "",
  examTime: "",
  kind: "exam" as ExamKind,
  priority: "normal" as ExamPriority,
  notes: "",
};

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getDaysUntil = (dateString: string) => {
  const date = toDate(dateString);
  if (!date) return 0;

  const diff = startOfLocalDay(date).getTime() - startOfLocalDay(new Date()).getTime();
  return Math.ceil(diff / 86_400_000);
};

const formatDate = (dateString: string) => {
  const date = toDate(dateString);
  if (!date) return dateString;

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getFinalGrade = (module: UniModule) => {
  if (module.assessments.length === 0) return module.grade;

  const totalWeight = module.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
  if (totalWeight === 0) return null;

  return (
    module.assessments.reduce(
      (sum, assessment) => sum + assessment.grade * assessment.weight,
      0
    ) / totalWeight
  );
};

const getEffectiveStatus = (module: UniModule): ModuleStatus => {
  const finalGrade = getFinalGrade(module);
  const totalAssessmentWeight = module.assessments.reduce(
    (sum, assessment) => sum + assessment.weight,
    0
  );

  if (module.assessments.length > 0 && totalAssessmentWeight >= 100) {
    if (finalGrade !== null && finalGrade > 4.0) return "failed";
    if (finalGrade !== null && finalGrade <= 4.0) return "passed";
  }

  if (module.assessments.length === 0 && finalGrade !== null && finalGrade > 4.0) {
    return "failed";
  }

  return module.status;
};

const getPriorityClassName = (priority: ExamPriority) => {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "low":
      return "bg-sky-50 text-sky-700 ring-sky-100";
    case "normal":
      return "bg-violet-50 text-violet-700 ring-violet-100";
  }
};

const getStatusClassName = (status: ExamStatus) => {
  switch (status) {
    case "done":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "learning":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "planned":
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
};

const buildStudyPlan = (exam: ExamPlanItem, module: UniModule | undefined): StudySession[] => {
  const daysUntil = Math.max(getDaysUntil(exam.examDate), 0);
  const today = startOfLocalDay(new Date());
  const sessions = Math.min(Math.max(daysUntil, 3), exam.priority === "high" ? 8 : 6);
  const everyNDays = Math.max(1, Math.floor(Math.max(daysUntil, 1) / sessions));
  const grade = module ? getFinalGrade(module) : null;
  const status = module ? getEffectiveStatus(module) : "open";

  const baseTopics = [
    "Überblick: Stoffliste, Folien, alte Aufgaben und offene Lücken sammeln",
    "Grundlagen wiederholen und eine kompakte Zusammenfassung schreiben",
    "Aufgabentypen rechnen und typische Fehler markieren",
    "Schwierige Themen gezielt nacharbeiten und Karteikarten bauen",
    "Mini-Probeklausur unter Zeitdruck lösen",
    "Fehleranalyse + zweite Runde der schwachen Themen",
    "Finale Wiederholung: Formeln, Definitionen, Beispiele",
    "Leichte Wiederholung und Schlaf/Organisation statt Paniklernen",
  ];

  const titlePrefix = exam.moduleName || exam.title;
  const intensity = exam.priority === "high" || status === "failed" || (grade !== null && grade > 3)
    ? "90–120 min"
    : exam.priority === "low"
    ? "35–60 min"
    : "60–90 min";

  return Array.from({ length: sessions }, (_, index) => {
    const sessionDate = addDays(today, Math.min(index * everyNDays, Math.max(daysUntil - 1, 0)));
    const dateLabel = new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(sessionDate);

    return {
      dateLabel,
      title: `${index + 1}. Session · ${titlePrefix}`,
      focus: baseTopics[Math.min(index, baseTopics.length - 1)],
      duration: intensity,
    };
  });
};

export default function GradeGlowPlanner({ user, modules }: GradeGlowPlannerProps) {
  const { exams, setExams, isLoaded, syncMessage } = useGradeGlowExams(user);
  const [form, setForm] = useState(emptyForm);
  const [generatedExamId, setGeneratedExamId] = useState<string | null>(null);

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.name.localeCompare(b.name)),
    [modules]
  );

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => {
        const dateDiff = a.examDate.localeCompare(b.examDate);
        if (dateDiff !== 0) return dateDiff;
        return a.examTime.localeCompare(b.examTime);
      }),
    [exams]
  );

  const upcomingExams = sortedExams.filter((exam) => exam.status !== "done");
  const generatedExam = sortedExams.find((exam) => exam.id === generatedExamId) ?? upcomingExams[0];
  const generatedModule = generatedExam?.moduleId
    ? modules.find((module) => module.id === generatedExam.moduleId)
    : modules.find((module) => module.name === generatedExam?.moduleName);
  const generatedPlan = generatedExam ? buildStudyPlan(generatedExam, generatedModule) : [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.examDate) return;

    const selectedModule = modules.find((module) => module.id === form.moduleId);
    const exam: ExamPlanItem = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      moduleId: selectedModule?.id ?? null,
      moduleName: selectedModule?.name ?? "",
      examDate: form.examDate,
      examTime: form.examTime,
      kind: form.kind,
      status: "planned",
      priority: form.priority,
      notes: form.notes.trim(),
    };

    setExams((currentExams) => [...currentExams, exam]);
    setGeneratedExamId(exam.id);
    setForm(emptyForm);
  };

  const updateExamStatus = (examId: string, status: ExamStatus) => {
    setExams((currentExams) =>
      currentExams.map((exam) => (exam.id === examId ? { ...exam, status } : exam))
    );
  };

  const deleteExam = (examId: string) => {
    setExams((currentExams) => currentExams.filter((exam) => exam.id !== examId));
    if (generatedExamId === examId) setGeneratedExamId(null);
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-violet-700">Prüfungsplaner</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Termine & Deadlines</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isLoaded ? syncMessage : "Prüfungsplan wird geladen…"}
            </p>
          </div>
          <span className="rounded-2xl bg-violet-50 px-3 py-2 text-xl ring-1 ring-violet-100">🗓️</span>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Titel</span>
            <input
              className="field-input"
              placeholder="z. B. Statistik Klausur"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Modul</span>
              <select
                className="field-input"
                value={form.moduleId}
                onChange={(event) => setForm((current) => ({ ...current, moduleId: event.target.value }))}
              >
                <option value="">Kein Modul verknüpfen</option>
                {sortedModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Typ</span>
              <select
                className="field-input"
                value={form.kind}
                onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as ExamKind }))}
              >
                {examKindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Datum</span>
              <input
                className="field-input"
                type="date"
                value={form.examDate}
                onChange={(event) => setForm((current) => ({ ...current, examDate: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Uhrzeit</span>
              <input
                className="field-input"
                type="time"
                value={form.examTime}
                onChange={(event) => setForm((current) => ({ ...current, examTime: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Priorität</span>
              <select
                className="field-input"
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as ExamPriority }))}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Notizen</span>
            <textarea
              className="field-input min-h-24 resize-y"
              placeholder="Stoff, Raum, Kapitel, offene Themen…"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:opacity-50"
            disabled={!form.title.trim() || !form.examDate}
          >
            Prüfung speichern
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {sortedExams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/70 p-6 text-center text-sm font-semibold text-violet-700">
              Noch keine Prüfungen geplant.
            </div>
          ) : (
            sortedExams.map((exam) => {
              const daysUntil = getDaysUntil(exam.examDate);
              const kindLabel = examKindOptions.find((option) => option.value === exam.kind)?.label ?? "Termin";

              return (
                <article key={exam.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getPriorityClassName(exam.priority)}`}>
                          {priorityOptions.find((option) => option.value === exam.priority)?.label}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusClassName(exam.status)}`}>
                          {statusOptions.find((option) => option.value === exam.status)?.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-black tracking-tight">{exam.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {kindLabel} · {formatDate(exam.examDate)}{exam.examTime && ` · ${exam.examTime} Uhr`}
                        {exam.moduleName && ` · ${exam.moduleName}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {daysUntil > 0 ? `noch ${daysUntil} Tag(e)` : daysUntil === 0 ? "heute" : `vor ${Math.abs(daysUntil)} Tag(en)`}
                      </p>
                      {exam.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{exam.notes}</p>}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <select
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                        value={exam.status}
                        onChange={(event) => updateExamStatus(exam.id, event.target.value as ExamStatus)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5"
                        onClick={() => setGeneratedExamId(exam.id)}
                      >
                        Lernplan
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-rose-600 ring-1 ring-rose-100 transition hover:-translate-y-0.5"
                        onClick={() => deleteExam(exam.id)}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-violet-950/10 ring-1 ring-white/10">
        <div className="relative p-5 sm:p-6">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-bold text-fuchsia-200">KI-Lernplan</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Automatisch generierter Plan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Erstmal lokal und ohne API-Key: GradeGlow baut dir aus Datum, Priorität, Modulstatus und Note einen realistischen Lernrhythmus.
            </p>

            {!generatedExam ? (
              <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center text-sm font-semibold text-slate-300 ring-1 ring-white/10">
                Speichere eine Prüfung, dann erscheint hier dein Plan.
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Aktiver Fokus</p>
                  <h3 className="mt-2 text-xl font-black">{generatedExam.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {formatDate(generatedExam.examDate)} · {getDaysUntil(generatedExam.examDate) >= 0 ? `${getDaysUntil(generatedExam.examDate)} Tag(e) übrig` : "Termin liegt in der Vergangenheit"}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {generatedPlan.map((session) => (
                    <div key={`${session.dateLabel}-${session.title}`} className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-black">{session.title}</p>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-fuchsia-100 ring-1 ring-white/10">
                          {session.dateLabel} · {session.duration}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{session.focus}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
