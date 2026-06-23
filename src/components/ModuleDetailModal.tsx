"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGradeGlowExams } from "../hooks/useGradeGlowExams";
import type { AppUser, ExamPlanItem, ModuleStatus, UniModule } from "../types";

type ModuleDetailModalProps = {
  user: AppUser;
  module: UniModule;
  onClose: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onUpdateModule: (
    moduleId: string,
    patch: Pick<UniModule, "notes" | "targetGrade">,
  ) => void;
};

const statusLabel: Record<ModuleStatus, string> = {
  passed: "Bestanden",
  ungraded: "Unbenotet",
  open: "Offen",
  failed: "Nicht bestanden",
};

const statusStyle: Record<ModuleStatus, string> = {
  passed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ungraded: "bg-sky-50 text-sky-700 ring-sky-200",
  open: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
};

const categoryLabel: Record<UniModule["category"], string> = {
  mandatory: "Pflichtmodul",
  electiveMandatory: "Wahlpflichtmodul",
  elective: "Wahlmodul",
  unknown: "Modulart offen",
};

const parseNumber = (value: string) => Number(value.replace(",", "."));

const formatGrade = (value: number) => value.toFixed(2).replace(".", ",");

const formatCompactNumber = (value: number) => String(value).replace(".", ",");

const getTotalAssessmentWeight = (module: UniModule) =>
  module.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);

const getFinalGrade = (module: UniModule) => {
  if (module.assessments.length === 0) return module.grade;

  const totalWeight = getTotalAssessmentWeight(module);
  if (totalWeight === 0) return null;

  return (
    module.assessments.reduce(
      (sum, assessment) => sum + assessment.grade * assessment.weight,
      0,
    ) / totalWeight
  );
};

const getEffectiveStatus = (module: UniModule): ModuleStatus => {
  const finalGrade = getFinalGrade(module);
  const totalAssessmentWeight = getTotalAssessmentWeight(module);

  if (module.assessments.length > 0 && totalAssessmentWeight >= 100) {
    if (finalGrade !== null && finalGrade > 4.0) return "failed";
    if (finalGrade !== null && finalGrade <= 4.0) return "passed";
  }

  if (module.assessments.length === 0 && finalGrade !== null && finalGrade > 4.0) {
    return "failed";
  }

  return module.status;
};

const toDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
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

const formatTime = (timeString: string) => (timeString ? `${timeString} Uhr` : "ohne Uhrzeit");

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

const getExamSortValue = (exam: ExamPlanItem) => {
  const date = toDate(exam.examDate);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

const getRequirementText = ({
  goalGrade,
  module,
  finalGrade,
  totalAssessmentWeight,
}: {
  goalGrade: number;
  module: UniModule;
  finalGrade: number | null;
  totalAssessmentWeight: number;
}) => {
  const weightedGradeSum = module.assessments.reduce(
    (sum, assessment) => sum + assessment.grade * assessment.weight,
    0,
  );
  const remainingWeight = Math.max(0, 100 - totalAssessmentWeight);

  if (totalAssessmentWeight > 100) {
    return {
      label: "Gewichtung prüfen",
      text: "Die Einzelleistungen liegen über 100%. Korrigiere erst die Gewichtungen, damit die Prognose sauber rechnen kann.",
      className: "bg-rose-50 text-rose-700 ring-rose-100",
    };
  }

  if (module.assessments.length === 0 && module.grade !== null) {
    return finalGrade !== null && finalGrade <= goalGrade
      ? {
          label: "Ziel erreicht",
          text: `Die eingetragene Gesamtnote ${formatGrade(finalGrade)} erfüllt dieses Ziel bereits.`,
          className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        }
      : {
          label: "Ziel noch nicht erreicht",
          text: `Die eingetragene Gesamtnote ${finalGrade !== null ? formatGrade(finalGrade) : "—"} liegt über dem Ziel.`,
          className: "bg-amber-50 text-amber-700 ring-amber-100",
        };
  }

  if (totalAssessmentWeight >= 100) {
    if (finalGrade === null) {
      return {
        label: "Noch keine Berechnung",
        text: "Es sind 100% Gewichtung eingetragen, aber GradeGlow kann noch keine Modulnote berechnen.",
        className: "bg-slate-50 text-slate-600 ring-slate-200",
      };
    }

    return finalGrade <= goalGrade
      ? {
          label: "Ziel erreicht",
          text: `Mit ${formatGrade(finalGrade)} ist dieses Ziel bereits erfüllt.`,
          className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        }
      : {
          label: "Ziel verfehlt",
          text: `Die berechnete Modulnote ${formatGrade(finalGrade)} liegt über dem Ziel ${formatGrade(goalGrade)}.`,
          className: "bg-rose-50 text-rose-700 ring-rose-100",
        };
  }

  if (remainingWeight <= 0) {
    return {
      label: "Keine Restleistung",
      text: "Für dieses Modul ist keine offene Gewichtung mehr übrig.",
      className: "bg-slate-50 text-slate-600 ring-slate-200",
    };
  }

  const requiredAverage = (goalGrade * 100 - weightedGradeSum) / remainingWeight;

  if (requiredAverage < 1.0) {
    return {
      label: "Rechnerisch nicht erreichbar",
      text: `Selbst eine 1,0 auf den restlichen ${formatCompactNumber(remainingWeight)}% würde für dieses Ziel nicht reichen.`,
      className: "bg-rose-50 text-rose-700 ring-rose-100",
    };
  }

  if (requiredAverage >= 4.0) {
    return {
      label: "Puffer vorhanden",
      text: `Auf den restlichen ${formatCompactNumber(remainingWeight)}% reicht rechnerisch bis zu ${formatGrade(Math.min(requiredAverage, 4.0))}.`,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    };
  }

  return {
    label: requiredAverage <= 1.7 ? "Sehr ambitioniert" : "Machbar",
    text: `Du brauchst auf den restlichen ${formatCompactNumber(remainingWeight)}% höchstens ${formatGrade(requiredAverage)} im Schnitt.`,
    className:
      requiredAverage <= 1.7
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-violet-50 text-violet-700 ring-violet-100",
  };
};

export default function ModuleDetailModal({
  user,
  module,
  onClose,
  onDelete,
  onStartEdit,
  onUpdateModule,
}: ModuleDetailModalProps) {
  const { exams, isLoaded: examsLoaded } = useGradeGlowExams(user);
  const [notesInput, setNotesInput] = useState(module.notes);
  const [targetGradeInput, setTargetGradeInput] = useState(
    module.targetGrade !== null ? String(module.targetGrade).replace(".", ",") : "",
  );
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setNotesInput(module.notes);
    setTargetGradeInput(
      module.targetGrade !== null ? String(module.targetGrade).replace(".", ",") : "",
    );
    setSaveMessage("");
  }, [module.id, module.notes, module.targetGrade]);

  const finalGrade = getFinalGrade(module);
  const effectiveStatus = getEffectiveStatus(module);
  const totalAssessmentWeight = getTotalAssessmentWeight(module);
  const attemptCount = module.attemptCount ?? 0;
  const maxAttempts = module.maxAttempts ?? 3;
  const attemptsLeft = Math.max(0, maxAttempts - attemptCount);
  const parsedTargetGrade = targetGradeInput.trim()
    ? parseNumber(targetGradeInput)
    : null;
  const targetGradeIsValid =
    parsedTargetGrade === null ||
    (Number.isFinite(parsedTargetGrade) && parsedTargetGrade >= 1 && parsedTargetGrade <= 4);

  const passRequirement = getRequirementText({
    goalGrade: 4,
    module,
    finalGrade,
    totalAssessmentWeight,
  });

  const targetRequirement =
    parsedTargetGrade !== null && targetGradeIsValid
      ? getRequirementText({
          goalGrade: parsedTargetGrade,
          module,
          finalGrade,
          totalAssessmentWeight,
        })
      : null;

  const relatedExams = useMemo(() => {
    const normalizedModuleName = module.name.trim().toLowerCase();

    return exams
      .filter((exam) => {
        const normalizedExamModule = exam.moduleName.trim().toLowerCase();
        return exam.moduleId === module.id || normalizedExamModule === normalizedModuleName;
      })
      .sort((a, b) => getExamSortValue(a) - getExamSortValue(b));
  }, [exams, module.id, module.name]);

  const visibleAssessmentCount = module.assessments.length;
  const completedStudySessions = relatedExams.reduce(
    (sum, exam) =>
      sum + exam.studySessions.filter((session) => !session.isHidden && session.isDone).length,
    0,
  );
  const visibleStudySessions = relatedExams.reduce(
    (sum, exam) => sum + exam.studySessions.filter((session) => !session.isHidden).length,
    0,
  );

  const saveDetailFields = () => {
    if (!targetGradeIsValid) {
      setSaveMessage("Bitte gib eine Zielnote zwischen 1,0 und 4,0 ein oder lass das Feld leer.");
      return;
    }

    onUpdateModule(module.id, {
      notes: notesInput.trim(),
      targetGrade: parsedTargetGrade,
    });
    setSaveMessage("Details gespeichert.");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-detail-title"
      onClick={onClose}
    >
      <div
        className="mx-auto flex min-h-full w-full max-w-5xl items-end sm:items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <section className="max-h-[calc(100svh-1.5rem)] w-full overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl shadow-slate-950/25 ring-1 ring-violet-100 sm:max-h-[calc(100svh-3rem)] sm:rounded-[2rem]">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950 p-4 text-white sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyle[effectiveStatus]}`}>
                    {statusLabel[effectiveStatus]}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-violet-100 ring-1 ring-white/10">
                    {categoryLabel[module.category]}
                  </span>
                  {module.stupoMatched && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-fuchsia-100 ring-1 ring-white/10">
                      StuPo erkannt
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-fuchsia-200">
                  Modul-Detail
                </p>
                <h2 id="module-detail-title" className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
                  {module.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  StuPo-Semester {module.semester} · geplant für Semester {module.plannedSemester ?? module.semester}
                </p>
              </div>

              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black text-white ring-1 ring-white/10 transition hover:bg-white/15"
                onClick={onClose}
                aria-label="Modul-Detail schließen"
              >
                ×
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">ECTS</p>
                  <p className="mt-2 text-2xl font-black">{formatCompactNumber(module.ects)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Note</p>
                  <p className="mt-2 text-2xl font-black">{finalGrade !== null ? formatGrade(finalGrade) : "—"}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Leistungen</p>
                  <p className="mt-2 text-2xl font-black">{visibleAssessmentCount}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Versuche</p>
                  <p className="mt-2 text-2xl font-black">{attemptCount}/{maxAttempts}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
                <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-bold text-violet-700">Was brauche ich noch?</p>
                    <h3 className="text-xl font-black tracking-tight">Bestehens-Check</h3>
                  </div>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                    {formatCompactNumber(totalAssessmentWeight)}% / 100%
                  </span>
                </div>
                <div className={`rounded-2xl p-4 text-sm ring-1 ${passRequirement.className}`}>
                  <p className="font-black">{passRequirement.label}</p>
                  <p className="mt-1 font-semibold leading-6">{passRequirement.text}</p>
                </div>

                {module.assessments.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
                      <span>Gewichtung</span>
                      <span>{formatCompactNumber(totalAssessmentWeight)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${totalAssessmentWeight > 100 ? "bg-rose-500" : "bg-violet-600"}`}
                        style={{ width: `${Math.min(totalAssessmentWeight, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-bold text-violet-700">Einzelleistungen</p>
                    <h3 className="text-xl font-black tracking-tight">Notenbestandteile</h3>
                  </div>
                  <button type="button" className="soft-button" onClick={onStartEdit}>
                    Modul bearbeiten
                  </button>
                </div>

                {module.assessments.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500 ring-1 ring-slate-200">
                    Noch keine Einzelleistungen eingetragen. Du kannst sie direkt auf der Modulkarte hinzufügen.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {module.assessments.map((assessment) => (
                      <div key={assessment.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900">{assessment.name}</p>
                          <p className="text-sm font-semibold text-slate-500">
                            {formatCompactNumber(assessment.weight)}% Gewichtung
                          </p>
                        </div>
                        <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                          Note {formatGrade(assessment.grade)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-950 p-4 text-white ring-1 ring-slate-900 sm:p-5">
                <p className="text-sm font-bold text-fuchsia-200">Zielnote</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">Modulziel speichern</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
                  <label>
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-400">Ziel</span>
                    <input
                      className="field-input bg-white text-slate-950"
                      placeholder="z. B. 2,0"
                      inputMode="decimal"
                      value={targetGradeInput}
                      onChange={(event) => setTargetGradeInput(event.target.value)}
                    />
                  </label>
                  <div className="rounded-2xl bg-white/10 p-3 text-sm font-semibold leading-6 text-slate-300 ring-1 ring-white/10">
                    Leeres Feld = kein Modulziel. GradeGlow rechnet live mit den eingetragenen Einzelleistungen.
                  </div>
                </div>
                {!targetGradeIsValid && (
                  <p className="mt-3 rounded-2xl bg-rose-400/15 p-3 text-sm font-bold text-rose-100 ring-1 ring-rose-300/20">
                    Zielnote muss zwischen 1,0 und 4,0 liegen.
                  </p>
                )}
                {targetRequirement && (
                  <div className={`mt-4 rounded-2xl p-4 text-sm ring-1 ${targetRequirement.className}`}>
                    <p className="font-black">{targetRequirement.label}</p>
                    <p className="mt-1 font-semibold leading-6">{targetRequirement.text}</p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
                <p className="text-sm font-bold text-violet-700">Notizen</p>
                <textarea
                  className="field-input mt-3 min-h-36 resize-y bg-slate-50"
                  placeholder="z. B. Themen, offene Fragen, Tutorium, wichtige Fristen…"
                  value={notesInput}
                  onChange={(event) => setNotesInput(event.target.value)}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:opacity-50"
                    onClick={saveDetailFields}
                    disabled={!targetGradeIsValid}
                  >
                    Details speichern
                  </button>
                  {saveMessage && <p className="text-sm font-bold text-violet-700">{saveMessage}</p>}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-bold text-violet-700">Zugehörige Prüfungen</p>
                    <h3 className="text-xl font-black tracking-tight">Prüfungsbezug</h3>
                  </div>
                  <Link href="/exams" className="soft-button text-center">
                    Zu Prüfungen
                  </Link>
                </div>

                {!examsLoaded ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                    Prüfungen werden geladen…
                  </p>
                ) : relatedExams.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500 ring-1 ring-slate-200">
                    Noch keine Prüfung mit diesem Modul verknüpft. Lege sie im Prüfungsplaner an und wähle dieses Modul aus.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {relatedExams.map((exam) => {
                      const visibleSessions = exam.studySessions.filter((session) => !session.isHidden);
                      const doneSessions = visibleSessions.filter((session) => session.isDone).length;
                      const plannedMinutes = visibleSessions.reduce(
                        (sum, session) => sum + session.durationMinutes,
                        0,
                      );

                      return (
                        <div key={exam.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-black text-slate-900">{exam.title}</p>
                              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                                {formatDate(exam.examDate)} · {formatTime(exam.examTime)}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                              {exam.status === "done" ? "erledigt" : exam.status === "learning" ? "lerne gerade" : "geplant"}
                            </span>
                          </div>
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            Lernplan: {doneSessions}/{visibleSessions.length} erledigt · {formatMinutes(plannedMinutes)} geplant
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {visibleStudySessions > 0 && (
                  <div className="mt-3 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700 ring-1 ring-violet-100">
                    Gesamtfortschritt: {completedStudySessions}/{visibleStudySessions} Lerneinheiten erledigt.
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
                <p className="text-sm font-bold text-violet-700">Versuchsübersicht</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Übrig</p>
                    <p className="mt-1 text-xl font-black">{attemptsLeft}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Warnung</p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {module.isLocked
                        ? "Max. Versuch erreicht"
                        : attemptsLeft <= 1 && effectiveStatus === "failed"
                          ? "kritisch prüfen"
                          : "keine akute Sperre"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
                  Hinweis: Das ist nur ein Organisations-Warnsystem und keine rechtsverbindliche Prüfungsberatung.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="soft-button" onClick={onClose}>
                  Schließen
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-100"
                  onClick={onDelete}
                >
                  Modul löschen
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
