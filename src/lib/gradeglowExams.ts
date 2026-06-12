import type { ExamKind, ExamPlanItem, ExamPriority, ExamStatus } from "../types";

const LOCAL_EXAMS_KEY_PREFIX = "gradeglow-exams-v1";

const validExamKinds: ExamKind[] = [
  "exam",
  "presentation",
  "paper",
  "project",
  "oral",
  "other",
];

const validExamStatuses: ExamStatus[] = ["planned", "learning", "done"];
const validExamPriorities: ExamPriority[] = ["low", "normal", "high"];

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asExamKind = (value: unknown): ExamKind =>
  validExamKinds.includes(value as ExamKind) ? (value as ExamKind) : "exam";

const asExamStatus = (value: unknown): ExamStatus =>
  validExamStatuses.includes(value as ExamStatus) ? (value as ExamStatus) : "planned";

const asExamPriority = (value: unknown): ExamPriority =>
  validExamPriorities.includes(value as ExamPriority)
    ? (value as ExamPriority)
    : "normal";

export const getUserExamsStorageKey = (uid: string) =>
  `${LOCAL_EXAMS_KEY_PREFIX}-${uid}`;

export const migrateExams = (rawExams: unknown): ExamPlanItem[] => {
  if (!Array.isArray(rawExams)) return [];

  return rawExams
    .map((rawExam) => {
      if (typeof rawExam !== "object" || rawExam === null) return null;

      const record = rawExam as Record<string, unknown>;
      const id = asString(record.id, crypto.randomUUID());
      const title = asString(record.title).trim();
      const examDate = asString(record.examDate).trim();

      if (!id || !title || !examDate) return null;

      return {
        id,
        title,
        moduleId: typeof record.moduleId === "string" && record.moduleId ? record.moduleId : null,
        moduleName: asString(record.moduleName).trim(),
        examDate,
        examTime: asString(record.examTime).trim(),
        kind: asExamKind(record.kind),
        status: asExamStatus(record.status),
        priority: asExamPriority(record.priority),
        notes: asString(record.notes).trim(),
      } satisfies ExamPlanItem;
    })
    .filter((exam): exam is ExamPlanItem => Boolean(exam));
};

export const loadLocalExams = (storageKey: string): ExamPlanItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    return migrateExams(JSON.parse(saved));
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
};

export const saveLocalExams = (storageKey: string, exams: ExamPlanItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(exams));
};
