import { describePlannedBlock, planTopicBlocks } from "../lib/examTopics";
import type { ExamPlanItem, StudySessionItem } from "../types";
import { addDays, dateKey, daysBetween, fromKey } from "./model";

// Backward plan for one exam: spreads study blocks over the days before the
// exam, respects a daily limit across all exams and skips Sundays.

export const PLAN_DEFAULTS = { startDays: 21, dailyLimit: 120, blockMinutes: 60, minutesPerDay: 50 };

type Options = { today: string; booked?: Map<string, number>; makeId?: () => string };

export function planSessions(exam: ExamPlanItem, { today, booked = new Map(), makeId = () => crypto.randomUUID() }: Options): StudySessionItem[] {
  const daysUntil = daysBetween(today, exam.examDate);
  if (exam.status === "done" || daysUntil < 1) return [];
  const startDays = exam.studyStartDays > 0 ? exam.studyStartDays : PLAN_DEFAULTS.startDays;
  const dailyLimit = exam.dailyStudyLimitMinutes > 0 ? exam.dailyStudyLimitMinutes : PLAN_DEFAULTS.dailyLimit;
  const length = exam.sessionGoalMinutes > 0 ? exam.sessionGoalMinutes : PLAN_DEFAULTS.blockMinutes;

  const first = Math.max(0, daysUntil - startDays);
  const days = Array.from({ length: daysUntil - first }, (_, i) => dateKey(addDays(fromKey(today), first + i)))
    .filter((key) => fromKey(key).getDay() !== 0);
  const candidates = days.length > 0 ? days : [dateKey(addDays(fromKey(exam.examDate), -1))];

  const total = exam.targetStudyMinutes > 0
    ? exam.targetStudyMinutes
    : candidates.length * PLAN_DEFAULTS.minutesPerDay * (exam.priority === "high" ? 1.25 : exam.priority === "low" ? 0.75 : 1);
  const count = Math.max(1, Math.round(total / length));
  const topics = planTopicBlocks(exam.topics ?? [], count);
  const subject = exam.moduleName || exam.title;
  const load = new Map(booked);
  const sessions: StudySessionItem[] = [];

  for (let i = 0; i < count; i += 1) {
    const desired = count === 1 ? candidates.length - 1 : Math.round((i / (count - 1)) * (candidates.length - 1));
    // Nearest day with room, preferring later days on ties (closer to the exam is fresher).
    const day = candidates
      .map((key, index) => ({ key, distance: Math.abs(index - desired), used: load.get(key) ?? 0 }))
      .filter((option) => option.used + length <= dailyLimit)
      .sort((a, b) => a.distance - b.distance || a.used - b.used)[0];
    if (!day) break;
    load.set(day.key, day.used + length);
    const block = topics[i];
    const described = block ? describePlannedBlock(block, subject) : null;
    sessions.push({
      id: makeId(), examId: exam.id,
      title: described?.title ?? `Lernblock ${i + 1}`,
      dateKey: day.key, time: "", durationMinutes: length,
      focus: described?.focus ?? "Stoff durcharbeiten und Aufgaben rechnen",
      notes: "", isDone: false, isHidden: false, isManual: false, source: "ai", userEdited: false,
      ...(block?.kind === "topic" ? { topicId: block.topic.id } : {}),
    });
  }
  return sessions.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

/** Minutes already booked per day by other exams' open blocks. */
export const bookedMinutes = (exams: ExamPlanItem[], exceptExamId?: string) => {
  const booked = new Map<string, number>();
  exams.filter((exam) => exam.id !== exceptExamId && !exam.isHidden).forEach((exam) => exam.studySessions
    .filter((s) => !s.isDone && !s.isHidden)
    .forEach((s) => booked.set(s.dateKey, (booked.get(s.dateKey) ?? 0) + s.durationMinutes)));
  return booked;
};

/** Re-plan the open future: keeps done, manual and hand-edited blocks and everything in the past. */
export const replan = (exam: ExamPlanItem, all: ExamPlanItem[], today: string) => {
  const keep = exam.studySessions.filter((s) => s.isDone || s.isManual || s.userEdited || s.dateKey < today);
  const fresh = planSessions(exam, { today, booked: bookedMinutes(all, exam.id) });
  return [...keep, ...fresh]
    .sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`));
};
