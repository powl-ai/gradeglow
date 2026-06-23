import type { ExamPlanItem, StudySubjectStat } from "../types";

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const startOfWeek = (date: Date) => {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
};

const isInCurrentWeek = (dateKey: string) => {
  const date = toDate(dateKey);
  if (!date) return false;

  const currentWeekStart = startOfWeek(new Date());
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
  const sessionDate = startOfLocalDay(date);

  return sessionDate >= currentWeekStart && sessionDate < nextWeekStart;
};

export const formatStudyMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export const getStudySubjectStats = (exams: ExamPlanItem[]): StudySubjectStat[] => {
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
      current.plannedMinutes += session.durationMinutes;
      if (!session.isDone) return;

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

export const getTotalDoneStudyMinutes = (exams: ExamPlanItem[]) =>
  exams.reduce(
    (sum, exam) =>
      sum +
      exam.studySessions
        .filter((session) => session.isDone && !session.isHidden)
        .reduce((sessionSum, session) => sessionSum + session.durationMinutes, 0),
    0,
  );

export const getThisWeekDoneStudyMinutes = (exams: ExamPlanItem[]) =>
  exams.reduce(
    (sum, exam) =>
      sum +
      exam.studySessions
        .filter((session) => session.isDone && !session.isHidden && isInCurrentWeek(session.dateKey))
        .reduce((sessionSum, session) => sessionSum + session.durationMinutes, 0),
    0,
  );
