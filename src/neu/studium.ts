import type { ModuleStatus, UniModule, UniScheduleItem } from "../types";

// Grades, ECTS and timetable for the profile screen. Pure, same rules as the old dashboard.

type GradedModule = Pick<UniModule, "grade" | "assessments" | "status" | "ects">;

const assessmentWeight = (module: Pick<UniModule, "assessments">) =>
  module.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);

/** The module grade, or the weighted grade of its partial assessments when it has any. */
export const finalGrade = (module: Pick<UniModule, "grade" | "assessments">): number | null => {
  if (module.assessments.length === 0) return module.grade;
  const weight = assessmentWeight(module);
  if (weight === 0) return null;
  return module.assessments.reduce((sum, assessment) => sum + assessment.grade * assessment.weight, 0) / weight;
};

/** A grade worse than 4,0 means failed, whatever the stored status says. */
export const effectiveStatus = (module: Pick<UniModule, "grade" | "assessments" | "status">): ModuleStatus => {
  const grade = finalGrade(module);
  if (module.assessments.length > 0 && assessmentWeight(module) >= 100 && grade !== null) return grade > 4 ? "failed" : "passed";
  if (module.assessments.length === 0 && grade !== null && grade > 4) return "failed";
  return module.status;
};

export type GradeSummary = { average: number | null; gradedEcts: number; earnedEcts: number; openEcts: number; targetEcts: number; progress: number };

/** ECTS-weighted average of passed, graded modules; earned ECTS include ungraded passes. */
export const gradeSummary = (modules: GradedModule[], targetEcts: number): GradeSummary => {
  const target = targetEcts > 0 ? targetEcts : 180;
  let gradedEcts = 0, weighted = 0, earnedEcts = 0, openEcts = 0;
  modules.forEach((module) => {
    const status = effectiveStatus(module);
    const grade = finalGrade(module);
    const ects = Number.isFinite(module.ects) ? Math.max(0, module.ects) : 0;
    if (status === "passed" || status === "ungraded") earnedEcts += ects;
    else openEcts += ects;
    if (status === "passed" && grade !== null) { gradedEcts += ects; weighted += grade * ects; }
  });
  return {
    average: gradedEcts > 0 ? weighted / gradedEcts : null, gradedEcts, earnedEcts, openEcts, targetEcts: target,
    progress: Math.min(1, earnedEcts / target),
  };
};

/** German grade: 1,7 stays 1,7; an average like 2.333 becomes 2,33. */
export const gradeLabel = (grade: number | null, digits = 1) =>
  grade === null || !Number.isFinite(grade) ? "–" : grade.toFixed(digits).replace(".", ",");

/** "1,7" or "2.3" → number; empty → null; anything outside 1–5 → undefined (invalid). */
export const parseGrade = (text: string): number | null | undefined => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) && value >= 1 && value <= 5 ? value : undefined;
};

/** Modules grouped by semester, ascending; names alphabetical inside a semester. */
export const bySemester = <T extends Pick<UniModule, "semester" | "name">>(modules: T[]) => {
  const groups = new Map<number, T[]>();
  modules.forEach((module) => {
    const semester = Number.isFinite(module.semester) ? module.semester : 1;
    groups.set(semester, [...(groups.get(semester) ?? []), module]);
  });
  return [...groups.entries()].sort((a, b) => a[0] - b[0])
    .map(([semester, items]) => ({ semester, items: [...items].sort((a, b) => a.name.localeCompare(b.name, "de")) }));
};

export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Montag" }, { value: 2, label: "Dienstag" }, { value: 3, label: "Mittwoch" }, { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" }, { value: 6, label: "Samstag" }, { value: 0, label: "Sonntag" },
];

/** Visible timetable entries per weekday, Monday first, by start time; empty days are left out. */
export const scheduleByDay = <T extends Pick<UniScheduleItem, "weekday" | "startTime" | "isHidden" | "title">>(items: T[]) =>
  WEEKDAYS.map((day) => ({
    ...day,
    items: items.filter((item) => !item.isHidden && item.weekday === day.value)
      .sort((a, b) => (a.startTime || "99").localeCompare(b.startTime || "99") || a.title.localeCompare(b.title, "de")),
  })).filter((day) => day.items.length > 0);

/** "10:15" style check for the two time fields; the end must be after the start when both are set. */
export const validTimes = (start: string, end: string) => {
  const ok = (value: string) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  return ok(start) && ok(end) && (start === "" || end === "" || start < end);
};

export type ModuleInput = { name: string; ects: number; semester: number; status: ModuleStatus; grade: number | null };

/**
 * Builds a new module or updates an existing one from the simple form.
 * A grade worse than 4,0 makes it failed; a newly failed module counts one attempt.
 * Modules with partial assessments keep their stored grade (it is derived from the parts).
 */
export const applyModuleInput = (input: ModuleInput, existing: UniModule | null, makeId: () => string = () => crypto.randomUUID()): UniModule => {
  const hasParts = (existing?.assessments.length ?? 0) > 0;
  const grade = existing && hasParts ? existing.grade : input.grade;
  const status: ModuleStatus = !hasParts && grade !== null && grade > 4 ? "failed" : input.status;
  const maxAttempts = Math.max(1, Math.round(existing?.maxAttempts ?? 3));
  const before = Math.max(0, Math.round(existing?.attemptCount ?? 0));
  const attemptCount = status === "failed" && existing?.status !== "failed" ? Math.min(before + 1, maxAttempts) : Math.min(before, maxAttempts);
  const base: UniModule = existing ?? {
    id: makeId(), name: "", ects: 0, grade: null, semester: input.semester, status: "open", assessments: [], category: "unknown",
    plannedSemester: input.semester, attemptCount: 0, maxAttempts, isLocked: false, stupoMatched: false, stupoSource: "", notes: "", targetGrade: null,
  };
  return {
    ...base, name: input.name.trim(), ects: input.ects, semester: input.semester, grade, status,
    attemptCount, maxAttempts, isLocked: status === "failed" && attemptCount >= maxAttempts,
  };
};

export const STATUS_LABELS: Record<ModuleStatus, string> = { passed: "Bestanden", ungraded: "Unbenotet", open: "Offen", failed: "Nicht bestanden" };
