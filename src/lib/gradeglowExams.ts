import type {
  ExamKind,
  ExamPlanItem,
  ExamPriority,
  ExamStatus,
  StudySessionItem,
} from "../types";

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

const asNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const asExamKind = (value: unknown): ExamKind =>
  validExamKinds.includes(value as ExamKind) ? (value as ExamKind) : "exam";

const asExamStatus = (value: unknown): ExamStatus =>
  validExamStatuses.includes(value as ExamStatus) ? (value as ExamStatus) : "planned";

const asExamPriority = (value: unknown): ExamPriority =>
  validExamPriorities.includes(value as ExamPriority)
    ? (value as ExamPriority)
    : "normal";

const migrateStudySessions = (rawSessions: unknown, examId: string): StudySessionItem[] => {
  if (!Array.isArray(rawSessions)) return [];

  return rawSessions
    .map((rawSession): StudySessionItem | null => {
      if (typeof rawSession !== "object" || rawSession === null) return null;
      const record = rawSession as Record<string, unknown>;
      const dateKey = asString(record.dateKey).trim();
      if (!dateKey) return null;

      return {
        id: asString(record.id, createId()),
        examId: asString(record.examId, examId) || examId,
        title: asString(record.title, "Lerneinheit").trim() || "Lerneinheit",
        dateKey,
        time: asString(record.time).trim(),
        durationMinutes: Math.max(15, Math.round(asNumber(record.durationMinutes, 90))),
        focus: asString(record.focus).trim(),
        notes: asString(record.notes).trim(),
        isDone: record.isDone === true,
        isHidden: record.isHidden === true,
        isManual: record.isManual === true,
        source: record.source === "manual" || record.isManual === true ? "manual" : "ai",
        userEdited: record.userEdited === true,
        startedAtIso: asString(record.startedAtIso).trim() || undefined,
        completedAtIso: asString(record.completedAtIso).trim() || undefined,
      } satisfies StudySessionItem;
    })
    .filter((session): session is StudySessionItem => Boolean(session));
};

export const getUserExamsStorageKey = (uid: string) =>
  `${LOCAL_EXAMS_KEY_PREFIX}-${uid}`;

export const migrateExams = (rawExams: unknown): ExamPlanItem[] => {
  if (!Array.isArray(rawExams)) return [];

  return rawExams
    .map((rawExam) => {
      if (typeof rawExam !== "object" || rawExam === null) return null;

      const record = rawExam as Record<string, unknown>;
      const id = asString(record.id, createId());
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
        studyStartDays: Math.max(1, Math.round(asNumber(record.studyStartDays, 21))),
        targetStudyMinutes: Math.max(0, Math.round(asNumber(record.targetStudyMinutes, 0))),
        dailyStudyLimitMinutes: Math.max(30, Math.round(asNumber(record.dailyStudyLimitMinutes, 300))),
        sessionGoalMinutes: Math.max(15, Math.round(asNumber(record.sessionGoalMinutes, 90))),
        isHidden: record.isHidden === true,
        studySessions: migrateStudySessions(record.studySessions, id),
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
