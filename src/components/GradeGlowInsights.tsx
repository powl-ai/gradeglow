"use client";

import StudyFriendsPanel from "./StudyFriendsPanel";
import { formatStudyMinutes, getStudySubjectStats } from "../lib/studyStats";
import type { AppUser, ExamPlanItem, GradeGlowProfile, ModuleStatus, UniModule } from "../types";

type GradeGlowInsightsProps = {
  user: AppUser;
  modules: UniModule[];
  exams: ExamPlanItem[];
  profile: GradeGlowProfile;
  totalTargetEcts: number;
  saveProfile: (nextProfile: GradeGlowProfile) => Promise<void>;
};

const statusConfig: Record<ModuleStatus, { label: string; barClassName: string; dotClassName: string }> = {
  passed: {
    label: "Bestanden",
    barClassName: "bg-emerald-500",
    dotClassName: "bg-emerald-500",
  },
  ungraded: {
    label: "Unbenotet",
    barClassName: "bg-sky-500",
    dotClassName: "bg-sky-500",
  },
  open: {
    label: "Offen",
    barClassName: "bg-amber-500",
    dotClassName: "bg-amber-500",
  },
  failed: {
    label: "Nicht bestanden",
    barClassName: "bg-rose-500",
    dotClassName: "bg-rose-500",
  },
};

const formatGrade = (value: number) => value.toFixed(2).replace(".", ",");
const formatNumber = (value: number) => String(value).replace(".", ",");

const getTotalAssessmentWeight = (module: UniModule) =>
  module.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);

const getFinalGrade = (module: UniModule) => {
  if (module.assessments.length === 0) return module.grade;

  const totalWeight = getTotalAssessmentWeight(module);
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

export default function GradeGlowInsights({
  user,
  modules,
  exams,
  profile,
  totalTargetEcts,
  saveProfile,
}: GradeGlowInsightsProps) {
  const statusRows = (["passed", "ungraded", "open", "failed"] as ModuleStatus[]).map(
    (status) => {
      const matchingModules = modules.filter((module) => getEffectiveStatus(module) === status);
      const ects = matchingModules.reduce((sum, module) => sum + module.ects, 0);
      const percentage = totalTargetEcts > 0 ? (ects / totalTargetEcts) * 100 : 0;

      return {
        status,
        label: statusConfig[status].label,
        ects,
        modules: matchingModules.length,
        percentage,
      };
    }
  );

  const semesterRows = Object.values(
    modules.reduce<Record<number, { semester: number; ects: number; gradedEcts: number; weightedSum: number; moduleCount: number }>>(
      (groups, module) => {
        if (!groups[module.semester]) {
          groups[module.semester] = {
            semester: module.semester,
            ects: 0,
            gradedEcts: 0,
            weightedSum: 0,
            moduleCount: 0,
          };
        }

        const status = getEffectiveStatus(module);
        const finalGrade = getFinalGrade(module);
        groups[module.semester].moduleCount += 1;

        if (status === "passed" || status === "ungraded") {
          groups[module.semester].ects += module.ects;
        }

        if (status === "passed" && finalGrade !== null) {
          groups[module.semester].gradedEcts += module.ects;
          groups[module.semester].weightedSum += finalGrade * module.ects;
        }

        return groups;
      },
      {}
    )
  )
    .map((row) => ({
      ...row,
      average: row.gradedEcts > 0 ? row.weightedSum / row.gradedEcts : 0,
    }))
    .sort((a, b) => a.semester - b.semester);

  const maxSemesterEcts = Math.max(...semesterRows.map((row) => row.ects), 1);
  const averageRows = semesterRows.filter((row) => row.average > 0);
  const studyRows = getStudySubjectStats(exams);
  const maxStudyMinutes = Math.max(...studyRows.map((row) => row.doneMinutes), 1);
  const totalDoneStudyMinutes = studyRows.reduce((sum, row) => sum + row.doneMinutes, 0);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-violet-700">Diagramme</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Status & ECTS-Verteilung</h2>
            <p className="mt-1 text-sm text-slate-500">Schneller Überblick, wo deine Credits gerade stehen.</p>
          </div>
          <span className="rounded-2xl bg-violet-50 px-3 py-2 text-xl ring-1 ring-violet-100">📊</span>
        </div>

        <div className="space-y-4">
          {statusRows.map((row) => (
            <div key={row.status}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusConfig[row.status].dotClassName}`} />
                  {row.label}
                </div>
                <span className="font-black text-slate-950">
                  {formatNumber(row.ects)} ECTS · {row.modules} Modul(e)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${statusConfig[row.status].barClassName}`}
                  style={{ width: `${Math.min(row.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-violet-700">Semesteranalyse</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">ECTS & Notentrend</h2>
            <p className="mt-1 text-sm text-slate-500">Semesterweise Credits und gewichteter Schnitt.</p>
          </div>
          <span className="rounded-2xl bg-fuchsia-50 px-3 py-2 text-xl ring-1 ring-fuchsia-100">✨</span>
        </div>

        {semesterRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/70 p-8 text-center text-sm font-semibold text-violet-700">
            Sobald du Module anlegst, erscheinen hier deine Diagramme.
          </div>
        ) : (
          <div className="space-y-4">
            {semesterRows.map((row) => (
              <div key={row.semester} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{row.semester}. Semester</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {row.moduleCount} Modul(e) · {row.average > 0 ? `Ø ${formatGrade(row.average)}` : "noch kein Schnitt"}
                    </p>
                  </div>
                  <p className="text-lg font-black">{formatNumber(row.ects)} ECTS</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${Math.min((row.ects / maxSemesterEcts) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {averageRows.length > 0 && (
              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <p className="mb-3 text-sm font-bold text-slate-300">Notentrend</p>
                <div className="flex h-28 items-end gap-3">
                  {averageRows.map((row) => {
                    const height = Math.max(12, ((4.0 - Math.min(row.average, 4.0)) / 3.0) * 100);
                    return (
                      <div key={row.semester} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-20 w-full items-end rounded-2xl bg-white/10 p-1 ring-1 ring-white/10">
                          <div
                            className="w-full rounded-xl bg-white/90 transition-all duration-500"
                            style={{ height: `${height}%` }}
                            title={`Semester ${row.semester}: ${formatGrade(row.average)}`}
                          />
                        </div>
                        <div className="text-center text-xs font-black text-slate-300">
                          S{row.semester}<br />{formatGrade(row.average)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">Höhere Balken bedeuten einen besseren Schnitt.</p>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-violet-700">Lernstatistik</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Gelernt pro Fach</h2>
              <p className="mt-1 text-sm text-slate-500">Aus abgehakten Lerneinheiten im Prüfungskalender berechnet.</p>
            </div>
            <span className="rounded-2xl bg-violet-50 px-3 py-2 text-xl ring-1 ring-violet-100">⏱️</span>
          </div>

          {studyRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/70 p-8 text-center text-sm font-semibold text-violet-700">
              Sobald du Lerneinheiten im Prüfungskalender abhakt, zeigt GradeGlow hier, wofür du wirklich gelernt hast.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-300">Gesamt erledigte Lernzeit</p>
                <p className="mt-2 text-4xl font-black tracking-tight">
                  {formatStudyMinutes(totalDoneStudyMinutes)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Nur erledigte, nicht ausgeblendete Lernblöcke zählen in diese Statistik.
                </p>
              </div>

              {studyRows.map((row) => {
                const percentage = Math.min((row.doneMinutes / maxStudyMinutes) * 100, 100);
                const completion = row.plannedMinutes > 0 ? Math.round((row.doneMinutes / row.plannedMinutes) * 100) : 0;

                return (
                  <div key={row.subjectId} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">{row.subjectName}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {row.sessionCount} erledigte Session(s) · {completion}% vom sichtbaren Plan
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-black text-violet-700">
                        {formatStudyMinutes(row.doneMinutes)}
                      </p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      Geplant sichtbar: {formatStudyMinutes(row.plannedMinutes)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm ring-1 ring-slate-900 sm:p-6">
          <p className="text-sm font-bold text-fuchsia-200">Premium-Insight</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Fokus-Verteilung</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Nutze die Fachstatistik als ehrlichen Gegencheck: Nicht nur was geplant war zählt, sondern was wirklich abgehakt wurde.
          </p>
          <div className="mt-5 space-y-3">
            {studyRows.slice(0, 4).map((row, index) => (
              <div key={row.subjectId} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="truncate font-black">#{index + 1} {row.subjectName}</p>
                  <p className="shrink-0 font-black text-violet-100">{formatStudyMinutes(row.doneMinutes)}</p>
                </div>
              </div>
            ))}
            {studyRows.length === 0 && (
              <div className="rounded-2xl bg-white/10 p-4 text-sm font-semibold leading-6 text-slate-300 ring-1 ring-white/10">
                Hacke deine ersten Lerneinheiten ab, dann entsteht hier deine persönliche Top-Fächer-Liste.
              </div>
            )}
          </div>
        </div>
      </div>

      <StudyFriendsPanel
        user={user}
        profile={profile}
        exams={exams}
        saveProfile={saveProfile}
      />
    </section>
  );
}
