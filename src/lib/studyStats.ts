import type { ExamPlanItem, StudySessionItem, StudySubjectStat } from "../types";

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date: Date) => {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
};

export const isInCurrentWeek = (dateKey: string) => {
  const date = toDate(dateKey);
  if (!date) return false;

  const currentWeekStart = startOfWeek(new Date());
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
  const sessionDate = startOfLocalDay(date);

  return sessionDate >= currentWeekStart && sessionDate < nextWeekStart;
};

const isDoneVisibleSession = (session: StudySessionItem) =>
  session.isDone && !session.isHidden;

export const formatStudyMinutes = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  if (safeMinutes < 60) return `${safeMinutes} min`;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export const getStudySubjectStats = (
  exams: ExamPlanItem[],
  options?: {
    includePlannedOnlyInCurrentWeek?: boolean;
    doneDateFilter?: (dateKey: string) => boolean;
  },
): StudySubjectStat[] => {
  const stats = new Map<string, StudySubjectStat>();

  exams.forEach((exam) => {
    const subjectId = exam.moduleId || exam.moduleName || exam.title;
    const current = stats.get(subjectId) ?? {
      subjectId,
      subjectName: exam.moduleName || exam.title,
      moduleId: exam.moduleId,
      plannedMinutes: 0,
      doneMinutes: 0,
      sessionCount: 0,
      lastStudiedAt: "",
    };

    exam.studySessions.forEach((session) => {
      if (session.isHidden) return;
      const isRelevantPlannedSession = options?.includePlannedOnlyInCurrentWeek
        ? isInCurrentWeek(session.dateKey)
        : true;

      if (isRelevantPlannedSession) {
        current.plannedMinutes += session.durationMinutes;
      }

      if (!isDoneVisibleSession(session)) return;
      if (options?.doneDateFilter && !options.doneDateFilter(session.dateKey)) return;

      current.doneMinutes += session.durationMinutes;
      current.sessionCount += 1;
      if (!current.lastStudiedAt || session.dateKey > current.lastStudiedAt) {
        current.lastStudiedAt = session.dateKey;
      }
    });

    stats.set(subjectId, current);
  });

  return [...stats.values()]
    .filter((row) => row.plannedMinutes > 0 || row.doneMinutes > 0)
    .sort((a, b) => {
      const doneDiff = b.doneMinutes - a.doneMinutes;
      if (doneDiff !== 0) return doneDiff;
      return b.plannedMinutes - a.plannedMinutes;
    });
};

export const getThisWeekStudySubjectStats = (exams: ExamPlanItem[]) =>
  getStudySubjectStats(exams, {
    includePlannedOnlyInCurrentWeek: true,
    doneDateFilter: isInCurrentWeek,
  });

export const getTotalDoneStudyMinutes = (exams: ExamPlanItem[]) =>
  exams.reduce(
    (sum, exam) =>
      sum +
      exam.studySessions
        .filter(isDoneVisibleSession)
        .reduce((sessionSum, session) => sessionSum + session.durationMinutes, 0),
    0,
  );

export const getThisWeekDoneStudyMinutes = (exams: ExamPlanItem[]) =>
  exams.reduce(
    (sum, exam) =>
      sum +
      exam.studySessions
        .filter((session) => isDoneVisibleSession(session) && isInCurrentWeek(session.dateKey))
        .reduce((sessionSum, session) => sessionSum + session.durationMinutes, 0),
    0,
  );

export const getLastDoneStudyDateKey = (exams: ExamPlanItem[]) =>
  exams.reduce<string>((latestDateKey, exam) => {
    exam.studySessions.forEach((session) => {
      if (!isDoneVisibleSession(session)) return;
      if (!latestDateKey || session.dateKey > latestDateKey) {
        latestDateKey = session.dateKey;
      }
    });
    return latestDateKey;
  }, "");

export const getStudyStreakDays = (exams: ExamPlanItem[]) => {
  const doneDateKeys = new Set<string>();

  exams.forEach((exam) => {
    exam.studySessions.forEach((session) => {
      if (isDoneVisibleSession(session)) doneDateKeys.add(session.dateKey);
    });
  });

  if (doneDateKeys.size === 0) return 0;

  const cursor = startOfLocalDay(new Date());
  let streak = 0;

  while (doneDateKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};
