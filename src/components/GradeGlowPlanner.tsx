"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { formatLimit } from "../lib/gradeglowAccess";
import { publishStudyActivity } from "../lib/studyActivity";
import type {
  AppUser,
  ExamKind,
  ExamPlanItem,
  ExamPriority,
  ExamStatus,
  GradeGlowProfile,
  ModuleStatus,
  StudySessionItem,
  UniModule,
  PlanLimits,
} from "../types";

type GradeGlowPlannerProps = {
  modules: UniModule[];
  exams: ExamPlanItem[];
  setExams: Dispatch<SetStateAction<ExamPlanItem[]>>;
  isLoaded: boolean;
  syncMessage: string;
  limits: PlanLimits;
  planLabel: string;
  user: AppUser;
  profile: GradeGlowProfile;
};

type CalendarMode = "month" | "week";

type StudyForm = {
  examId: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
};

type ActiveStudyTimer = {
  examId: string;
  sessionId: string | null;
  title: string;
  startedAt: number;
};

const DEFAULT_DAILY_STUDY_LIMIT_MINUTES = 300;
const DEFAULT_STUDY_START_DAYS = 21;
const DEFAULT_SESSION_GOAL_MINUTES = 90;

const examKindOptions: { value: ExamKind; label: string; emoji: string }[] = [
  { value: "exam", label: "Klausur", emoji: "📝" },
  { value: "presentation", label: "Präsentation", emoji: "🎤" },
  { value: "paper", label: "Hausarbeit", emoji: "📄" },
  { value: "project", label: "Projekt", emoji: "🧩" },
  { value: "oral", label: "Mündlich", emoji: "💬" },
  { value: "other", label: "Sonstiges", emoji: "📌" },
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

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const emptyForm = {
  title: "",
  moduleId: "",
  examDate: "",
  examTime: "",
  kind: "exam" as ExamKind,
  priority: "normal" as ExamPriority,
  notes: "",
  studyStartDays: String(DEFAULT_STUDY_START_DAYS),
  targetStudyHours: "",
  dailyStudyLimitHours: "5",
  sessionGoalMinutes: String(DEFAULT_SESSION_GOAL_MINUTES),
};

const emptyStudyForm: StudyForm = {
  examId: "",
  title: "",
  date: "",
  time: "",
  duration: "90",
  notes: "",
};

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) {
      return `${year}-${month}-${day}`;
    }
    return "";
  }

  const germanMatch = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2}|\d{4})$/);
  if (!germanMatch) return "";

  const day = Number(germanMatch[1]);
  const month = Number(germanMatch[2]);
  const rawYear = Number(germanMatch[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return getDateKey(date);
};

const normalizeTimeInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const colonMatch = trimmed.match(/^(\d{1,2})[:.](\d{2})$/);
  const compactMatch = trimmed.match(/^(\d{3,4})$/);
  let hours = 0;
  let minutes = 0;

  if (colonMatch) {
    hours = Number(colonMatch[1]);
    minutes = Number(colonMatch[2]);
  } else if (compactMatch) {
    const compact = compactMatch[1].padStart(4, "0");
    hours = Number(compact.slice(0, 2));
    minutes = Number(compact.slice(2, 4));
  } else {
    return "";
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

const formatDateInput = (dateString: string) => {
  const date = toDate(dateString);
  if (!date) return dateString;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatTime = (timeString: string) => {
  const normalized = normalizeTimeInput(timeString);
  return normalized ? `${normalized} Uhr` : "ohne Uhrzeit";
};

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(date);

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

const formatTimer = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(rest).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
};

const formatTimeInputFromDate = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const clampMinutes = (value: number, fallback: number, min: number, max = 10_000) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
};

const getExamDailyLimit = (exam: ExamPlanItem) =>
  clampMinutes(exam.dailyStudyLimitMinutes, DEFAULT_DAILY_STUDY_LIMIT_MINUTES, 30, 720);

const getExamSessionGoal = (exam: ExamPlanItem) =>
  clampMinutes(exam.sessionGoalMinutes, DEFAULT_SESSION_GOAL_MINUTES, 15, getExamDailyLimit(exam));

const getExamTargetStudyMinutes = (exam: ExamPlanItem) =>
  Math.max(0, Math.round(Number(exam.targetStudyMinutes) || 0));

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const startOfWeek = (date: Date) => {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(start, mondayOffset);
};

const buildCalendarDays = (cursorDate: Date, mode: CalendarMode) => {
  if (mode === "week") {
    const weekStart = startOfWeek(cursorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }

  const monthStart = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
};

const isSameMonth = (date: Date, cursorDate: Date) =>
  date.getMonth() === cursorDate.getMonth() && date.getFullYear() === cursorDate.getFullYear();

const getFinalGrade = (module: UniModule) => {
  if (module.assessments.length === 0) return module.grade;

  const totalWeight = module.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);
  if (totalWeight === 0) return null;

  return module.assessments.reduce((sum, assessment) => sum + assessment.grade * assessment.weight, 0) / totalWeight;
};

const getEffectiveStatus = (module: UniModule): ModuleStatus => {
  const finalGrade = getFinalGrade(module);
  const totalAssessmentWeight = module.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);

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

const getCountdownLabel = (daysUntil: number) => {
  if (daysUntil > 1) return `noch ${daysUntil} Tage`;
  if (daysUntil === 1) return "morgen";
  if (daysUntil === 0) return "heute";
  if (daysUntil === -1) return "gestern";
  return `vor ${Math.abs(daysUntil)} Tagen`;
};

const getCountdownClassName = (daysUntil: number) => {
  if (daysUntil < 0) return "bg-slate-100 text-slate-500 ring-slate-200";
  if (daysUntil <= 3) return "bg-rose-50 text-rose-700 ring-rose-100";
  if (daysUntil <= 14) return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
};

const getStudyPhase = (daysUntil: number) => {
  if (daysUntil < 0) return "Termin ist vorbei · Status prüfen";
  if (daysUntil === 0) return "leichte Wiederholung + Organisation";
  if (daysUntil <= 3) return "Endspurt: Probeklausur, Fehlerliste, Formeln";
  if (daysUntil <= 10) return "aktive Aufgabenphase: rechnen, schreiben, abfragen";
  if (daysUntil <= 21) return "Grundlagen festigen + Lücken schließen";
  return "Stoff sammeln, grob planen, erste Wiederholung starten";
};

const getStudyLoadLabel = (studyMinutes: number, exams: number) => {
  if (exams > 0 && studyMinutes === 0) return { label: "Prüfung", className: "bg-rose-50 text-rose-700" };
  if (exams > 0) return { label: "Prüfung + Lernen", className: "bg-rose-50 text-rose-700" };
  if (studyMinutes === 0) return { label: "frei", className: "bg-white text-slate-400" };
  if (studyMinutes <= 90) return { label: "leicht", className: "bg-emerald-50 text-emerald-700" };
  if (studyMinutes <= 180) return { label: "normal", className: "bg-violet-50 text-violet-700" };
  return { label: "viel", className: "bg-amber-50 text-amber-700" };
};

const getPriorityWeight = (priority: ExamPriority) => {
  if (priority === "high") return 3;
  if (priority === "normal") return 2;
  return 1;
};

const getProgressClassName = (percentage: number) => {
  if (percentage >= 90) return "bg-emerald-500";
  if (percentage >= 50) return "bg-violet-500";
  if (percentage > 0) return "bg-amber-500";
  return "bg-slate-300";
};

const getExamProgress = (exam: ExamPlanItem, includeHiddenSessions = false) => {
  const sessions = includeHiddenSessions
    ? exam.studySessions
    : exam.studySessions.filter((session) => !session.isHidden);
  const totalSessions = sessions.length;
  const doneSessions = sessions.filter((session) => session.isDone).length;
  const plannedMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const doneMinutes = sessions
    .filter((session) => session.isDone)
    .reduce((sum, session) => sum + session.durationMinutes, 0);
  const percentage = plannedMinutes > 0 ? Math.round((doneMinutes / plannedMinutes) * 100) : 0;

  return {
    totalSessions,
    doneSessions,
    plannedMinutes,
    doneMinutes,
    remainingMinutes: Math.max(plannedMinutes - doneMinutes, 0),
    percentage: Math.min(100, Math.max(0, percentage)),
  };
};

const getRecommendedTotalMinutes = (exam: ExamPlanItem, module: UniModule | undefined) => {
  const daysUntil = Math.max(getDaysUntil(exam.examDate), 0);
  const windowDays = Math.max(1, Math.min(exam.studyStartDays || DEFAULT_STUDY_START_DAYS, Math.max(daysUntil, 1)));
  const dailyLimit = getExamDailyLimit(exam);
  const manualTarget = getExamTargetStudyMinutes(exam);

  if (manualTarget > 0) {
    return Math.min(manualTarget, windowDays * dailyLimit);
  }

  const grade = module ? getFinalGrade(module) : null;
  const status = module ? getEffectiveStatus(module) : "open";
  const isRisky = status === "failed" || (grade !== null && grade > 3);
  const priorityMultiplier = exam.priority === "high" ? 1.25 : exam.priority === "low" ? 0.72 : 1;
  const basePerDay = daysUntil <= 3 ? 80 : daysUntil <= 10 ? 65 : 45;
  const estimated = Math.round(windowDays * basePerDay * priorityMultiplier);
  const cappedByDailyLimit = Math.min(estimated, windowDays * dailyLimit);
  return isRisky ? Math.min(cappedByDailyLimit + 180, windowDays * dailyLimit) : cappedByDailyLimit;
};

const getSessionLength = (exam: ExamPlanItem) => getExamSessionGoal(exam);

const getFocusTopic = (index: number, total: number) => {
  if (total <= 1) return "leichte Wiederholung, Packliste, Schlaf und Prüfungsorganisation";
  const progress = index / Math.max(total - 1, 1);
  if (progress < 0.15) return "Stoffliste, Folien, alte Aufgaben und offene Lücken sammeln";
  if (progress < 0.32) return "Grundlagen wiederholen und kompakte Zusammenfassung bauen";
  if (progress < 0.5) return "Aufgabentypen rechnen und typische Fehler markieren";
  if (progress < 0.68) return "schwierige Themen gezielt nacharbeiten und Karteikarten ergänzen";
  if (progress < 0.84) return "Probeklausur oder große Aufgabenserie unter Zeitdruck";
  if (progress < 0.95) return "Fehleranalyse und zweite Runde der schwachen Themen";
  return "finale Wiederholung: Formeln, Definitionen, Beispiele, Schlaf";
};

const getCandidateStudyDates = (exam: ExamPlanItem) => {
  const today = startOfLocalDay(new Date());
  const examDate = toDate(exam.examDate);
  if (!examDate) return [today];
  const daysUntil = Math.max(getDaysUntil(exam.examDate), 0);
  if (daysUntil === 0) return [today];

  const startOffset = Math.max(0, daysUntil - Math.max(1, exam.studyStartDays || DEFAULT_STUDY_START_DAYS));
  const length = Math.max(1, daysUntil - startOffset);
  return Array.from({ length }, (_, index) => addDays(today, startOffset + index));
};

const pickBestStudyDate = (
  candidates: Date[],
  desiredIndex: number,
  durationMinutes: number,
  bookedByDate: Map<string, number>,
  dailyLimitMinutes: number,
) => {
  const orderedIndexes: number[] = [];
  for (let radius = 0; radius < candidates.length; radius += 1) {
    const right = desiredIndex + radius;
    const left = desiredIndex - radius;
    if (right >= 0 && right < candidates.length) orderedIndexes.push(right);
    if (radius !== 0 && left >= 0 && left < candidates.length) orderedIndexes.push(left);
  }

  const uniqueIndexes = [...new Set(orderedIndexes)];
  const exact = uniqueIndexes.find((index) => {
    const booked = bookedByDate.get(getDateKey(candidates[index])) ?? 0;
    return booked + durationMinutes <= dailyLimitMinutes;
  });
  if (exact !== undefined) return candidates[exact];

  const withCapacity = uniqueIndexes.find((index) => {
    const booked = bookedByDate.get(getDateKey(candidates[index])) ?? 0;
    return booked < dailyLimitMinutes;
  });

  return withCapacity === undefined ? null : candidates[withCapacity];
};

const createStudySessionsForExam = (
  exam: ExamPlanItem,
  moduleById: Map<string, UniModule>,
  bookedByDate = new Map<string, number>(),
): StudySessionItem[] => {
  if (exam.status === "done" || getDaysUntil(exam.examDate) < 0) return [];

  const linkedModule = exam.moduleId ? moduleById.get(exam.moduleId) : undefined;
  const totalMinutes = getRecommendedTotalMinutes(exam, linkedModule);
  const sessionLength = getSessionLength(exam);
  const dailyLimit = getExamDailyLimit(exam);
  const sessionCount = Math.max(1, Math.ceil(totalMinutes / sessionLength));
  const candidates = getCandidateStudyDates(exam);
  let remainingMinutes = totalMinutes;
  const sessions: StudySessionItem[] = [];

  Array.from({ length: sessionCount }).forEach((_, index) => {
    if (remainingMinutes <= 0) return;
    const durationMinutes = Math.min(sessionLength, remainingMinutes);
    const desiredIndex = candidates.length === 1 ? 0 : Math.round((index / Math.max(sessionCount - 1, 1)) * (candidates.length - 1));
    const selectedDate = pickBestStudyDate(candidates, desiredIndex, durationMinutes, bookedByDate, dailyLimit);
    if (!selectedDate) return;

    const dateKey = getDateKey(selectedDate);
    const availableMinutes = Math.max(dailyLimit - (bookedByDate.get(dateKey) ?? 0), 0);
    const cappedDuration = Math.min(durationMinutes, availableMinutes);
    if (cappedDuration <= 0) return;

    bookedByDate.set(dateKey, (bookedByDate.get(dateKey) ?? 0) + cappedDuration);
    remainingMinutes -= cappedDuration;

    sessions.push({
      id: crypto.randomUUID(),
      examId: exam.id,
      title: `${sessions.length + 1}. Session · ${exam.moduleName || exam.title}`,
      dateKey,
      time: "",
      durationMinutes: cappedDuration,
      focus: getFocusTopic(index, sessionCount),
      notes: "",
      isDone: false,
      isHidden: false,
      isManual: false,
    });
  });

  return sessions;
};

const sortSessions = (sessions: StudySessionItem[]) =>
  [...sessions].sort((a, b) => {
    const dateDiff = a.dateKey.localeCompare(b.dateKey);
    if (dateDiff !== 0) return dateDiff;
    return a.time.localeCompare(b.time);
  });

export default function GradeGlowPlanner({
  modules,
  exams,
  setExams,
  isLoaded,
  syncMessage,
  limits,
  planLabel,
  user,
  profile,
}: GradeGlowPlannerProps) {
  const [form, setForm] = useState(emptyForm);
  const [manualStudyForm, setManualStudyForm] = useState<StudyForm>(emptyStudyForm);
  const [focusedExamId, setFocusedExamId] = useState<string | null>(null);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [calendarCursorDate, setCalendarCursorDate] = useState(() => startOfLocalDay(new Date()));
  const [showHiddenItems, setShowHiddenItems] = useState(false);
  const [examFilterId, setExamFilterId] = useState("all");
  const [moduleFilterId, setModuleFilterId] = useState("all");
  const [isExamFormOpen, setIsExamFormOpen] = useState(false);
  const [isManualStudyOpen, setIsManualStudyOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState<ActiveStudyTimer | null>(null);
  const [examLimitMessage, setExamLimitMessage] = useState("");
  const [timerExamId, setTimerExamId] = useState("");
  const [timerSessionId, setTimerSessionId] = useState("free");
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [draggedSession, setDraggedSession] = useState<{ examId: string; sessionId: string } | null>(null);
  const [calendarMoveMessage, setCalendarMoveMessage] = useState("");
  const [selectedCalendarSessionId, setSelectedCalendarSessionId] = useState<string | null>(null);
  const focusPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeTimer) return undefined;

    setTimerNow(Date.now());
    const interval = window.setInterval(() => setTimerNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const sortedModules = useMemo(() => [...modules].sort((a, b) => a.name.localeCompare(b.name)), [modules]);
  const moduleById = useMemo(() => new Map(modules.map((module) => [module.id, module])), [modules]);

  const sortedExams = useMemo(
    () =>
      [...exams].sort((a, b) => {
        const dateDiff = a.examDate.localeCompare(b.examDate);
        if (dateDiff !== 0) return dateDiff;
        return a.examTime.localeCompare(b.examTime);
      }),
    [exams],
  );

  const modulesWithExams = useMemo(
    () => sortedModules.filter((module) => sortedExams.some((exam) => exam.moduleId === module.id)),
    [sortedExams, sortedModules],
  );

  const visibleExams = useMemo(
    () =>
      sortedExams.filter((exam) => {
        if (!showHiddenItems && exam.isHidden) return false;
        if (examFilterId !== "all" && exam.id !== examFilterId) return false;
        if (moduleFilterId !== "all" && exam.moduleId !== moduleFilterId) return false;
        return true;
      }),
    [examFilterId, moduleFilterId, showHiddenItems, sortedExams],
  );

  const upcomingExams = useMemo(() => visibleExams.filter((exam) => exam.status !== "done"), [visibleExams]);

  const focusedExam =
    visibleExams.find((exam) => exam.id === focusedExamId) ??
    visibleExams.find((exam) => exam.status !== "done") ??
    visibleExams[0] ??
    null;

  useEffect(() => {
    if (!isLoaded || sortedExams.length === 0) return;
    const booked = new Map<string, number>();
    const nextExamById = new Map(sortedExams.map((exam) => [exam.id, exam]));
    let changed = false;

    const planningOrder = [...sortedExams].sort((a, b) => {
      const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      const dateDiff = a.examDate.localeCompare(b.examDate);
      if (dateDiff !== 0) return dateDiff;
      return a.examTime.localeCompare(b.examTime);
    });

    planningOrder.forEach((exam) => {
      exam.studySessions.forEach((session) => {
        if (session.isHidden || session.isDone) return;
        booked.set(session.dateKey, (booked.get(session.dateKey) ?? 0) + session.durationMinutes);
      });

      if (exam.studySessions.length > 0 || exam.status === "done" || getDaysUntil(exam.examDate) < 0) {
        return;
      }

      changed = true;
      nextExamById.set(exam.id, { ...exam, studySessions: createStudySessionsForExam(exam, moduleById, booked) });
    });

    if (changed) setExams(sortedExams.map((exam) => nextExamById.get(exam.id) ?? exam));
  }, [isLoaded, moduleById, setExams, sortedExams]);

  const allStudySessions = useMemo(
    () => sortSessions(sortedExams.flatMap((exam) => exam.studySessions.map((session) => ({ ...session, examId: exam.id })))),
    [sortedExams],
  );

  const visibleStudySessions = useMemo(() => {
    const visibleExamIds = new Set(visibleExams.map((exam) => exam.id));
    return allStudySessions.filter((session) => visibleExamIds.has(session.examId) && (showHiddenItems || !session.isHidden));
  }, [allStudySessions, showHiddenItems, visibleExams]);

  const focusedPlan = focusedExam
    ? sortSessions(focusedExam.studySessions).filter((session) => showHiddenItems || !session.isHidden)
    : [];

  const calendarDays = useMemo(() => buildCalendarDays(calendarCursorDate, calendarMode), [calendarCursorDate, calendarMode]);

  const examsByDate = useMemo(() => {
    const grouped = new Map<string, ExamPlanItem[]>();
    visibleExams.forEach((exam) => {
      const current = grouped.get(exam.examDate) ?? [];
      grouped.set(exam.examDate, [...current, exam]);
    });
    return grouped;
  }, [visibleExams]);

  const studySessionsByDate = useMemo(() => {
    const grouped = new Map<string, StudySessionItem[]>();
    visibleStudySessions.forEach((session) => {
      const current = grouped.get(session.dateKey) ?? [];
      grouped.set(session.dateKey, [...current, session]);
    });
    return grouped;
  }, [visibleStudySessions]);

  const nextExam = upcomingExams.find((exam) => getDaysUntil(exam.examDate) >= 0) ?? upcomingExams[0] ?? null;
  const todayKey = getDateKey(new Date());
  const todaySessions = studySessionsByDate.get(todayKey) ?? [];
  const todayStudyMinutes = todaySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const thisWeekDays = buildCalendarDays(new Date(), "week");
  const thisWeekSessions = thisWeekDays.flatMap((date) => studySessionsByDate.get(getDateKey(date)) ?? []);
  const thisWeekStudyMinutes = thisWeekSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const thisWeekDoneMinutes = thisWeekSessions
    .filter((session) => session.isDone)
    .reduce((sum, session) => sum + session.durationMinutes, 0);
  const thisWeekRemainingMinutes = Math.max(thisWeekStudyMinutes - thisWeekDoneMinutes, 0);
  const thisWeekProgress = thisWeekStudyMinutes > 0 ? Math.round((thisWeekDoneMinutes / thisWeekStudyMinutes) * 100) : 0;
  const doneStudyMinutes = visibleStudySessions.filter((session) => session.isDone).reduce((sum, session) => sum + session.durationMinutes, 0);
  const hiddenCount = sortedExams.filter((exam) => exam.isHidden).length + allStudySessions.filter((session) => session.isHidden).length;
  const activeFilterCount = [examFilterId !== "all", moduleFilterId !== "all"].filter(Boolean).length;
  const focusedProgress = focusedExam ? getExamProgress(focusedExam, showHiddenItems) : null;
  const timerExamIdValue = timerExamId || focusedExam?.id || sortedExams[0]?.id || "";
  const timerExam = sortedExams.find((exam) => exam.id === timerExamIdValue) ?? focusedExam ?? sortedExams[0] ?? null;
  const timerSessions = timerExam ? sortSessions(timerExam.studySessions).filter((session) => showHiddenItems || !session.isHidden) : [];
  const timerSessionIdValue = timerSessions.some((session) => session.id === timerSessionId) ? timerSessionId : "free";
  const selectedTimerSession = timerSessionIdValue === "free" ? null : timerSessions.find((session) => session.id === timerSessionIdValue) ?? null;

  const normalizedFormDate = normalizeDateInput(form.examDate);
  const normalizedFormTime = normalizeTimeInput(form.examTime);
  const isExamLimitReached = Number.isFinite(limits.maxExams) && exams.length >= limits.maxExams;
  const parsedStudyStartDays = Math.max(1, Math.round(Number(form.studyStartDays.replace(",", ".")) || DEFAULT_STUDY_START_DAYS));
  const parsedTargetStudyMinutes = Math.max(0, Math.round((Number(form.targetStudyHours.replace(",", ".")) || 0) * 60));
  const parsedDailyStudyLimitMinutes = clampMinutes((Number(form.dailyStudyLimitHours.replace(",", ".")) || 5) * 60, DEFAULT_DAILY_STUDY_LIMIT_MINUTES, 30, 720);
  const parsedSessionGoalMinutes = clampMinutes(Number(form.sessionGoalMinutes.replace(",", ".")) || DEFAULT_SESSION_GOAL_MINUTES, DEFAULT_SESSION_GOAL_MINUTES, 15, parsedDailyStudyLimitMinutes);
  const isDateInvalid = form.examDate.trim().length > 0 && !normalizedFormDate;
  const isTimeInvalid = form.examTime.trim().length > 0 && !normalizedFormTime;

  const normalizedManualDate = normalizeDateInput(manualStudyForm.date);
  const normalizedManualTime = normalizeTimeInput(manualStudyForm.time);
  const parsedManualDuration = Math.max(15, Math.round(Number(manualStudyForm.duration.replace(",", ".")) || 90));

  const scrollToFocusPanel = () => {
    window.setTimeout(() => {
      focusPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const jumpToExamDetails = (examId: string, sessionId?: string) => {
    const exam = sortedExams.find((item) => item.id === examId);
    setFocusedExamId(examId);
    if (exam) {
      const targetDate = sessionId
        ? exam.studySessions.find((session) => session.id === sessionId)?.dateKey
        : exam.examDate;
      const parsedDate = targetDate ? toDate(targetDate) : null;
      if (parsedDate) setCalendarCursorDate(parsedDate);
    }
    setSelectedCalendarSessionId(sessionId ?? null);
    scrollToFocusPanel();
  };

  const resetCalendarFilters = () => {
    setExamFilterId("all");
    setModuleFilterId("all");
    setFocusedExamId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !normalizedFormDate || isTimeInvalid) return;

    if (isExamLimitReached) {
      setExamLimitMessage(`Free-Limit erreicht: Du kannst im ${planLabel} Plan aktuell maximal ${formatLimit(limits.maxExams, "Prüfungen")} anlegen.`);
      return;
    }

    const selectedModule = modules.find((module) => module.id === form.moduleId);
    const baseExam: ExamPlanItem = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      moduleId: selectedModule?.id ?? null,
      moduleName: selectedModule?.name ?? "",
      examDate: normalizedFormDate,
      examTime: normalizedFormTime,
      kind: form.kind,
      status: "planned",
      priority: form.priority,
      notes: form.notes.trim(),
      studyStartDays: parsedStudyStartDays,
      targetStudyMinutes: parsedTargetStudyMinutes,
      dailyStudyLimitMinutes: parsedDailyStudyLimitMinutes,
      sessionGoalMinutes: parsedSessionGoalMinutes,
      isHidden: false,
      studySessions: [],
    };

    const booked = new Map<string, number>();
    allStudySessions.forEach((session) => {
      if (session.isHidden || session.isDone) return;
      booked.set(session.dateKey, (booked.get(session.dateKey) ?? 0) + session.durationMinutes);
    });
    const exam = { ...baseExam, studySessions: createStudySessionsForExam(baseExam, moduleById, booked) };

    setExamLimitMessage("");
    setExams((currentExams) => [...currentExams, exam]);
    setFocusedExamId(exam.id);
    setManualStudyForm((current) => ({ ...current, examId: exam.id }));
    setCalendarCursorDate(toDate(exam.examDate) ?? new Date());
    setIsExamFormOpen(false);
    setForm(emptyForm);
  };

  const updateExam = (examId: string, updater: (exam: ExamPlanItem) => ExamPlanItem) => {
    setExams((currentExams) => currentExams.map((exam) => (exam.id === examId ? updater(exam) : exam)));
  };

  const updateExamStatus = (examId: string, status: ExamStatus) => updateExam(examId, (exam) => ({ ...exam, status }));

  const deleteExam = (examId: string) => {
    setExams((currentExams) => currentExams.filter((exam) => exam.id !== examId));
    if (focusedExamId === examId) setFocusedExamId(null);
  };

  const updateStudySession = (examId: string, sessionId: string, updater: (session: StudySessionItem) => StudySessionItem) => {
    updateExam(examId, (exam) => ({
      ...exam,
      studySessions: exam.studySessions.map((session) => (session.id === sessionId ? updater(session) : session)),
    }));
  };

  const deleteStudySession = (examId: string, sessionId: string) => {
    updateExam(examId, (exam) => ({
      ...exam,
      studySessions: exam.studySessions.filter((session) => session.id !== sessionId),
    }));
  };

  const moveStudySessionToDate = (examId: string, sessionId: string, targetDateKey: string) => {
    const targetDate = toDate(targetDateKey);
    if (!targetDate) return;

    let movedTitle = "Lernblock";
    updateStudySession(examId, sessionId, (current) => {
      movedTitle = current.title;
      return { ...current, dateKey: targetDateKey };
    });
    setFocusedExamId(examId);
    setSelectedCalendarSessionId(sessionId);
    setCalendarCursorDate(targetDate);
    setCalendarMoveMessage(`${movedTitle} auf ${formatDate(targetDateKey)} verschoben. Details sind unten geöffnet.`);
    scrollToFocusPanel();
  };

  const handleSessionDragStart = (examId: string, sessionId: string) => {
    setDraggedSession({ examId, sessionId });
    setCalendarMoveMessage("Ziehe den Lernblock auf einen anderen Kalendertag.");
  };

  const handleSessionDrop = (targetDateKey: string) => {
    if (!draggedSession) return;
    moveStudySessionToDate(draggedSession.examId, draggedSession.sessionId, targetDateKey);
    setDraggedSession(null);
  };

  const regenerateExamPlan = (examId: string) => {
    const exam = sortedExams.find((item) => item.id === examId);
    if (!exam) return;

    const booked = new Map<string, number>();
    sortedExams.forEach((item) => {
      if (item.id === examId) return;
      item.studySessions.forEach((session) => {
        if (session.isHidden || session.isDone) return;
        booked.set(session.dateKey, (booked.get(session.dateKey) ?? 0) + session.durationMinutes);
      });
    });

    const manualSessions = exam.studySessions.filter((session) => session.isManual);
    const generatedSessions = createStudySessionsForExam(exam, moduleById, booked);
    updateExam(examId, (current) => ({ ...current, studySessions: [...manualSessions, ...generatedSessions] }));
  };

  const addManualStudySession = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const examId = manualStudyForm.examId || focusedExam?.id || "";
    if (!examId || !normalizedManualDate) return;

    const session: StudySessionItem = {
      id: crypto.randomUUID(),
      examId,
      title: manualStudyForm.title.trim() || "Manuelle Lerneinheit",
      dateKey: normalizedManualDate,
      time: normalizedManualTime,
      durationMinutes: parsedManualDuration,
      focus: manualStudyForm.title.trim() || "Eigener Lernblock",
      notes: manualStudyForm.notes.trim(),
      isDone: false,
      isHidden: false,
      isManual: true,
    };

    updateExam(examId, (exam) => ({ ...exam, studySessions: sortSessions([...exam.studySessions, session]) }));
    setFocusedExamId(examId);
    setCalendarCursorDate(toDate(session.dateKey) ?? new Date());
    setManualStudyForm({ ...emptyStudyForm, examId });
    setIsManualStudyOpen(false);
  };


  const startSelectedStudyTimer = () => {
    if (!timerExam) return;
    startStudyTimer(
      timerExam.id,
      selectedTimerSession?.id ?? null,
      selectedTimerSession?.title ?? timerExam.title,
    );
  };

  const startStudyTimer = (examId: string, sessionId: string | null, title: string) => {
    const startedAt = new Date();
    if (sessionId) {
      updateStudySession(examId, sessionId, (current) => ({
        ...current,
        startedAtIso: startedAt.toISOString(),
      }));
    }

    setActiveTimer({
      examId,
      sessionId,
      title,
      startedAt: startedAt.getTime(),
    });

    void publishStudyActivity({
      user,
      profile,
      status: "started",
      title,
      examId,
      sessionId,
      startedAtIso: startedAt.toISOString(),
    });
  };

  const discardStudyTimer = () => {
    setActiveTimer(null);
  };

  const stopStudyTimer = () => {
    if (!activeTimer) return;

    const startedAtDate = new Date(activeTimer.startedAt);
    const completedAtDate = new Date();
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - activeTimer.startedAt) / 60_000));
    const timerNote = `Timer: ${formatMinutes(elapsedMinutes)} am ${formatDate(getDateKey(startedAtDate))}`;

    if (activeTimer.sessionId) {
      updateStudySession(activeTimer.examId, activeTimer.sessionId, (current) => ({
        ...current,
        dateKey: getDateKey(startedAtDate),
        time: current.time || formatTimeInputFromDate(startedAtDate),
        durationMinutes: elapsedMinutes,
        isDone: true,
        startedAtIso: current.startedAtIso || startedAtDate.toISOString(),
        completedAtIso: completedAtDate.toISOString(),
        notes: current.notes ? `${current.notes}\n${timerNote}` : timerNote,
      }));
    } else {
      const session: StudySessionItem = {
        id: crypto.randomUUID(),
        examId: activeTimer.examId,
        title: `Timer-Lernzeit · ${activeTimer.title}`,
        dateKey: getDateKey(startedAtDate),
        time: formatTimeInputFromDate(startedAtDate),
        durationMinutes: elapsedMinutes,
        focus: "Per Timer erfasste Lernzeit",
        notes: timerNote,
        isDone: true,
        isHidden: false,
        startedAtIso: startedAtDate.toISOString(),
        completedAtIso: completedAtDate.toISOString(),
        isManual: true,
      };

      updateExam(activeTimer.examId, (exam) => ({
        ...exam,
        studySessions: sortSessions([...exam.studySessions, session]),
      }));
    }

    void publishStudyActivity({
      user,
      profile,
      status: "completed",
      title: activeTimer.title,
      examId: activeTimer.examId,
      sessionId: activeTimer.sessionId,
      durationMinutes: elapsedMinutes,
      startedAtIso: startedAtDate.toISOString(),
      completedAtIso: completedAtDate.toISOString(),
    });

    setFocusedExamId(activeTimer.examId);
    setSelectedCalendarSessionId(activeTimer.sessionId);
    setCalendarCursorDate(new Date());
    setActiveTimer(null);
  };

  const moveCalendar = (direction: -1 | 1) => {
    setCalendarCursorDate((current) => (calendarMode === "month" ? addMonths(current, direction) : addDays(current, direction * 7)));
  };

  const timerElapsedSeconds = activeTimer ? Math.max(0, Math.floor((timerNow - activeTimer.startedAt) / 1000)) : 0;

  const calendarTitle =
    calendarMode === "month"
      ? formatMonthLabel(calendarCursorDate)
      : `${formatShortDate(startOfWeek(calendarCursorDate))} – ${formatShortDate(addDays(startOfWeek(calendarCursorDate), 6))}`;

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="rounded-3xl bg-white/90 p-4 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">Prüfungskalender</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Lernen planen, verschieben und abhaken</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Automatische Lernblöcke sind ein Vorschlag. Du kannst sie verschieben, abhaken, verstecken oder eigene Einheiten hinzufügen. Tageslimit und Session-Länge kannst du pro Prüfung selbst einstellen.
            </p>
          </div>

          <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              {(["month", "week"] as CalendarMode[]).map((mode) => (
                <button key={mode} type="button" className={`rounded-xl px-3 py-2 text-sm font-black transition ${calendarMode === mode ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`} onClick={() => setCalendarMode(mode)}>
                  {mode === "month" ? "Monat" : "Woche"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200 sm:min-w-80">
              <button type="button" className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200" onClick={() => moveCalendar(-1)} aria-label="Vorheriger Zeitraum">←</button>
              <p className="truncate px-2 text-center text-sm font-black text-slate-700">{calendarTitle}</p>
              <button type="button" className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200" onClick={() => moveCalendar(1)} aria-label="Nächster Zeitraum">→</button>
            </div>

            <button type="button" className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5" onClick={() => setCalendarCursorDate(new Date())}>
              Heute anzeigen
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Nächste Prüfung</p>
            <p className="mt-2 truncate text-xl font-black">{nextExam ? nextExam.title : "Noch offen"}</p>
            <p className="mt-1 text-sm text-slate-300">{nextExam ? `${formatDate(nextExam.examDate)} · ${getCountdownLabel(getDaysUntil(nextExam.examDate))}` : "Lege einen Termin an."}</p>
          </div>
          <div className="rounded-3xl bg-violet-50 p-4 ring-1 ring-violet-100">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Heute lernen</p>
            <p className="mt-2 text-3xl font-black text-violet-700">{formatMinutes(todayStudyMinutes)}</p>
            <p className="text-sm font-semibold text-violet-600">{todaySessions.length} Session(s)</p>
          </div>
          <div className="rounded-3xl bg-fuchsia-50 p-4 ring-1 ring-fuchsia-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400">Wochenziel</p>
                <p className="mt-2 text-3xl font-black text-fuchsia-700">{formatMinutes(thisWeekStudyMinutes)}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-fuchsia-700 ring-1 ring-fuchsia-100">{thisWeekProgress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-fuchsia-100">
              <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${thisWeekProgress}%` }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-fuchsia-600">{formatMinutes(thisWeekDoneMinutes)} erledigt · {formatMinutes(thisWeekRemainingMinutes)} offen</p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">Erledigt</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{formatMinutes(doneStudyMinutes)}</p>
            <p className="text-sm font-semibold text-emerald-600">abgehakte Lernzeit{activeFilterCount > 0 ? " im Filter" : ""}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200" onClick={() => setIsExamFormOpen((open) => !open)}>
            {isExamFormOpen ? "Prüfungsformular schließen" : "+ Prüfung eintragen"}
          </button>
          <button type="button" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200" onClick={() => setIsManualStudyOpen((open) => !open)}>
            {isManualStudyOpen ? "Lerneinheit schließen" : "+ Lerneinheit manuell"}
          </button>
          <button type="button" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200" onClick={() => setShowHiddenItems((show) => !show)}>
            {showHiddenItems ? "Versteckte ausblenden" : `Versteckte anzeigen (${hiddenCount})`}
          </button>
          <div className="grid gap-2 rounded-3xl bg-slate-950 p-2 text-white ring-1 ring-slate-900 sm:grid-cols-[minmax(180px,1fr)_minmax(170px,1fr)_auto] sm:items-center">
            <select
              className="min-w-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-black text-white outline-none"
              value={timerExamIdValue}
              onChange={(event) => {
                setTimerExamId(event.target.value);
                setTimerSessionId("free");
              }}
              disabled={!sortedExams.length || Boolean(activeTimer)}
              aria-label="Prüfung für Timer auswählen"
            >
              {sortedExams.length === 0 ? <option value="">Keine Prüfung</option> : sortedExams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
            <select
              className="min-w-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-black text-white outline-none"
              value={timerSessionIdValue}
              onChange={(event) => setTimerSessionId(event.target.value)}
              disabled={!timerExam || Boolean(activeTimer)}
              aria-label="Lerneinheit für Timer auswählen"
            >
              <option value="free">freie Lernzeit</option>
              {timerSessions.map((session) => (
                <option key={session.id} value={session.id}>{session.title}</option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-40"
              disabled={!timerExam || Boolean(activeTimer)}
              onClick={startSelectedStudyTimer}
            >
              Timer starten
            </button>
          </div>
        </div>

        {activeTimer && (
          <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-white shadow-xl shadow-violet-950/10 ring-1 ring-white/10 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Lerntimer läuft</p>
              <p className="mt-1 text-xl font-black">{formatTimer(timerElapsedSeconds)}</p>
              <p className="mt-1 text-sm text-slate-300">{activeTimer.title}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex">
              <button type="button" className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950" onClick={stopStudyTimer}>Speichern</button>
              <button type="button" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10" onClick={discardStudyTimer}>Verwerfen</button>
            </div>
          </div>
        )}


        <div className="mt-4 rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-200 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Filter Prüfung</span>
                <select
                  className="field-input bg-white"
                  value={examFilterId}
                  onChange={(event) => {
                    const nextExamId = event.target.value;
                    setExamFilterId(nextExamId);
                    if (nextExamId !== "all") setFocusedExamId(nextExamId);
                  }}
                >
                  <option value="all">Alle sichtbaren Prüfungen</option>
                  {sortedExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}{exam.moduleName ? ` · ${exam.moduleName}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Filter Modul</span>
                <select
                  className="field-input bg-white"
                  value={moduleFilterId}
                  onChange={(event) => setModuleFilterId(event.target.value)}
                >
                  <option value="all">Alle Module</option>
                  {modulesWithExams.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                {visibleExams.length} von {sortedExams.length} Termin(en)
              </span>
              <button
                type="button"
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 disabled:opacity-40"
                onClick={resetCalendarFilters}
                disabled={activeFilterCount === 0}
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        </div>
      </div>

      {isExamFormOpen && (
        <form className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6" onSubmit={handleSubmit}>
          <div className="mb-5">
            <p className="text-sm font-bold text-violet-700">Termin eintragen</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Prüfung oder Deadline</h2>
            <p className="mt-2 text-xs font-black text-slate-400">Plan: {planLabel} · Prüfungslimit: {formatLimit(limits.maxExams)}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-bold text-slate-700">Titel</span><input className="field-input" placeholder="z. B. Statistik Klausur" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Modul</span><select className="field-input" value={form.moduleId} onChange={(event) => setForm((current) => ({ ...current, moduleId: event.target.value }))}><option value="">Kein Modul verknüpfen</option>{sortedModules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Typ</span><select className="field-input" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as ExamKind }))}>{examKindOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Datum</span><input className="field-input" placeholder="TT.MM.JJJJ" value={form.examDate} onChange={(event) => setForm((current) => ({ ...current, examDate: event.target.value }))} onBlur={() => { if (normalizedFormDate) setForm((current) => ({ ...current, examDate: formatDateInput(normalizedFormDate) })); }} /><span className={`mt-1 block text-xs font-semibold ${isDateInvalid ? "text-rose-600" : "text-slate-400"}`}>{isDateInvalid ? "Bitte TT.MM.JJJJ eingeben." : "Europäisches Format"}</span></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Uhrzeit</span><input className="field-input" placeholder="14:00" value={form.examTime} onChange={(event) => setForm((current) => ({ ...current, examTime: event.target.value }))} onBlur={() => { if (normalizedFormTime) setForm((current) => ({ ...current, examTime: normalizedFormTime })); }} /><span className={`mt-1 block text-xs font-semibold ${isTimeInvalid ? "text-rose-600" : "text-slate-400"}`}>{isTimeInvalid ? "Bitte 24h-Format eingeben." : "24h, kein AM/PM"}</span></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Priorität</span><select className="field-input" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as ExamPriority }))}>{priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Lernstart vor Prüfung</span><input className="field-input" inputMode="numeric" value={form.studyStartDays} onChange={(event) => setForm((current) => ({ ...current, studyStartDays: event.target.value }))} /><span className="mt-1 block text-xs font-semibold text-slate-400">Tage vorher, z. B. 21 = 3 Wochen</span></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Lernpensum gesamt</span><input className="field-input" inputMode="decimal" placeholder="Auto" value={form.targetStudyHours} onChange={(event) => setForm((current) => ({ ...current, targetStudyHours: event.target.value }))} /><span className="mt-1 block text-xs font-semibold text-slate-400">in Stunden, leer = Auto-Schätzung</span></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Tageslimit</span><input className="field-input" inputMode="decimal" value={form.dailyStudyLimitHours} onChange={(event) => setForm((current) => ({ ...current, dailyStudyLimitHours: event.target.value }))} /><span className="mt-1 block text-xs font-semibold text-slate-400">max. Stunden pro Lerntag</span></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Länge pro Lerneinheit</span><input className="field-input" inputMode="numeric" value={form.sessionGoalMinutes} onChange={(event) => setForm((current) => ({ ...current, sessionGoalMinutes: event.target.value }))} /><span className="mt-1 block text-xs font-semibold text-slate-400">Minuten pro automatisch erzeugtem Block</span></label>
            <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-bold text-slate-700">Notizen</span><textarea className="field-input min-h-24 resize-y" placeholder="Stoff, Raum, Kapitel, offene Themen…" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          </div>
          {(examLimitMessage || isExamLimitReached) && (
            <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-800 ring-1 ring-amber-100">
              {examLimitMessage || `Free-Limit erreicht: Upgrade/Premium ist vorbereitet. Aktuell sind maximal ${formatLimit(limits.maxExams, "Prüfungen")} möglich.`}
            </p>
          )}
          <button type="submit" className="mt-5 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-50" disabled={!form.title.trim() || !normalizedFormDate || isTimeInvalid || isExamLimitReached}>Prüfung speichern & Lernplan erzeugen</button>
        </form>
      )}

      {isManualStudyOpen && (
        <form className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6" onSubmit={addManualStudySession}>
          <div className="mb-5"><p className="text-sm font-bold text-violet-700">Manuell planen</p><h2 className="mt-1 text-2xl font-black tracking-tight">Lerneinheit hinzufügen</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Zu Prüfung</span><select className="field-input" value={manualStudyForm.examId || focusedExam?.id || ""} onChange={(event) => setManualStudyForm((current) => ({ ...current, examId: event.target.value }))}>{sortedExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Titel/Fokus</span><input className="field-input" placeholder="z. B. Altklausur 1" value={manualStudyForm.title} onChange={(event) => setManualStudyForm((current) => ({ ...current, title: event.target.value }))} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Datum</span><input className="field-input" placeholder="TT.MM.JJJJ" value={manualStudyForm.date} onChange={(event) => setManualStudyForm((current) => ({ ...current, date: event.target.value }))} onBlur={() => { if (normalizedManualDate) setManualStudyForm((current) => ({ ...current, date: formatDateInput(normalizedManualDate) })); }} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Uhrzeit</span><input className="field-input" placeholder="16:00" value={manualStudyForm.time} onChange={(event) => setManualStudyForm((current) => ({ ...current, time: event.target.value }))} onBlur={() => { if (normalizedManualTime) setManualStudyForm((current) => ({ ...current, time: normalizedManualTime })); }} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Dauer in Minuten</span><input className="field-input" inputMode="numeric" value={manualStudyForm.duration} onChange={(event) => setManualStudyForm((current) => ({ ...current, duration: event.target.value }))} /></label>
            <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-bold text-slate-700">Notizen</span><textarea className="field-input min-h-20 resize-y" placeholder="Was genau willst du schaffen?" value={manualStudyForm.notes} onChange={(event) => setManualStudyForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          </div>
          <button type="submit" className="mt-5 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 disabled:opacity-50" disabled={!sortedExams.length || !normalizedManualDate}>Lerneinheit speichern</button>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur">
        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1 text-center text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-400 sm:gap-2 sm:text-xs">
            {weekdayLabels.map((weekday) => <div key={weekday} className="px-0.5 py-2">{weekday}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((date) => {
              const dateKey = getDateKey(date);
              const dayExams = examsByDate.get(dateKey) ?? [];
              const daySessions = studySessionsByDate.get(dateKey) ?? [];
              const dayStudyMinutes = daySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
              const isToday = dateKey === todayKey;
              const load = getStudyLoadLabel(dayStudyMinutes, dayExams.length);
              const muted = calendarMode === "month" && !isSameMonth(date, calendarCursorDate);
              const isDropTarget = Boolean(draggedSession);
              return (
                <div
                  key={dateKey}
                  className={`min-h-24 overflow-hidden rounded-xl p-1.5 ring-1 transition sm:min-h-32 sm:rounded-2xl sm:p-2.5 ${isDropTarget ? "ring-violet-300" : ""} ${isToday ? "bg-violet-50 ring-violet-300" : muted ? "bg-slate-50/70 ring-slate-100" : "bg-white ring-slate-200"}`}
                  onDragOver={(event) => {
                    if (!draggedSession) return;
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleSessionDrop(dateKey);
                  }}
                >
                  <div className="flex items-start justify-between gap-1"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.68rem] font-black sm:h-7 sm:w-7 sm:text-xs ${isToday ? "bg-violet-700 text-white" : muted ? "text-slate-300" : "text-slate-700"}`}>{date.getDate()}</span><span className={`hidden rounded-full px-2 py-1 text-[0.6rem] font-black sm:inline-flex ${load.className}`}>{load.label}</span></div>
                  <div className="mt-1.5 space-y-1">
                    {dayExams.slice(0, 1).map((exam) => { const kind = examKindOptions.find((option) => option.value === exam.kind); return <button key={exam.id} type="button" className="block w-full truncate rounded-lg bg-rose-50 px-1.5 py-1 text-left text-[0.58rem] font-black text-rose-700 ring-1 ring-rose-100 sm:rounded-xl sm:px-2 sm:text-[0.68rem]" onClick={() => jumpToExamDetails(exam.id)} title={`${exam.title} · Details öffnen`}><span className="sm:hidden">{kind?.emoji ?? "📌"}</span><span className="hidden sm:inline">{kind?.emoji ?? "📌"} {exam.title}</span></button>; })}
                    {dayExams.length > 1 && <p className="truncate rounded-lg bg-rose-50 px-1.5 py-1 text-[0.58rem] font-bold text-rose-500 sm:rounded-xl sm:px-2 sm:text-[0.68rem]">+{dayExams.length - 1} Prüfung</p>}
                    {daySessions.slice(0, calendarMode === "week" ? 4 : 2).map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        draggable
                        className={`block w-full cursor-grab truncate rounded-lg px-1.5 py-1 text-left text-[0.58rem] font-bold ring-1 active:cursor-grabbing sm:rounded-xl sm:px-2 sm:text-[0.68rem] ${session.isDone ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-violet-50 text-violet-700 ring-violet-100"}`}
                        onClick={() => jumpToExamDetails(session.examId, session.id)}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", `${session.examId}:${session.id}`);
                          handleSessionDragStart(session.examId, session.id);
                        }}
                        onDragEnd={() => setDraggedSession(null)}
                        title={`${session.title}: ${formatMinutes(session.durationMinutes)} · zum Verschieben ziehen`}
                      >
                        {session.isDone ? "✓ " : "↕ "}{session.title || "Lernblock"}
                      </button>
                    ))}
                    {daySessions.length > (calendarMode === "week" ? 4 : 2) && <p className="truncate rounded-lg bg-violet-50 px-1.5 py-1 text-[0.58rem] font-bold text-violet-500 sm:rounded-xl sm:px-2 sm:text-[0.68rem]">+{daySessions.length - (calendarMode === "week" ? 4 : 2)} Lernblock</p>}
                    {dayStudyMinutes > 0 && <p className="truncate rounded-lg bg-slate-50 px-1.5 py-1 text-[0.58rem] font-black text-slate-500 ring-1 ring-slate-100">Σ {formatMinutes(dayStudyMinutes)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><p className="text-sm font-black text-slate-700">Legende</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-100">Prüfung</span><span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700 ring-1 ring-violet-100">Lernblock ziehbar</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">erledigt</span><span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">viel geplant</span></div>{calendarMoveMessage && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{calendarMoveMessage}</p>}</div>
        </div>
      </div>

      <section className="grid gap-5 2xl:grid-cols-[minmax(520px,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-bold text-violet-700">Prüfungen</p><h2 className="mt-1 text-2xl font-black tracking-tight">Termine & Sichtbarkeit</h2><p className="mt-2 text-sm text-slate-500">Blende alte oder irrelevante Prüfungen aus, ohne sie zu löschen.</p></div>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">{syncMessage}</span>
          </div>
          <div className="mt-5 space-y-3">
            {sortedExams.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/70 p-6 text-center text-sm font-semibold text-violet-700">Noch keine Prüfungen geplant.</div>
            ) : visibleExams.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">Für diesen Filter gibt es aktuell keine sichtbaren Prüfungen.</div>
            ) : visibleExams.map((exam) => {
              const daysUntil = getDaysUntil(exam.examDate);
              const kind = examKindOptions.find((option) => option.value === exam.kind);
              const progress = getExamProgress(exam, showHiddenItems);
              return <article key={exam.id} className={`rounded-3xl p-4 ring-1 ${exam.isHidden ? "bg-slate-50 opacity-70 ring-slate-200" : "bg-slate-50 ring-slate-200"}`}>
                <div className="flex flex-col gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ring-1 ${getPriorityClassName(exam.priority)}`}>{priorityOptions.find((option) => option.value === exam.priority)?.label}</span>
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusClassName(exam.status)}`}>{statusOptions.find((option) => option.value === exam.status)?.label}</span>
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ring-1 ${getCountdownClassName(daysUntil)}`}>{getCountdownLabel(daysUntil)}</span>
                      {exam.isHidden && <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">ausgeblendet</span>}
                    </div>
                    <h3 className="text-lg font-black tracking-tight [overflow-wrap:break-word]">{exam.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{kind?.label ?? "Termin"} · {formatDate(exam.examDate)}{exam.examTime && ` · ${formatTime(exam.examTime)}`}{exam.moduleName && ` · ${exam.moduleName}`}</p>
                    <p className="mt-1 text-sm text-slate-500">Lernstart {exam.studyStartDays} Tage vorher · {progress.doneSessions}/{progress.totalSessions} Sessions · {formatMinutes(progress.remainingMinutes)} offen</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                      <div className={`h-full rounded-full ${getProgressClassName(progress.percentage)}`} style={{ width: `${progress.percentage}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-black text-slate-400">{progress.percentage}% Lernfortschritt</p>
                    {exam.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{exam.notes}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-start"><select className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" value={exam.status} onChange={(event) => updateExamStatus(exam.id, event.target.value as ExamStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button type="button" className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-violet-700 ring-1 ring-violet-100" onClick={() => jumpToExamDetails(exam.id)}>Details</button><button type="button" className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-600 ring-1 ring-slate-200" onClick={() => updateExam(exam.id, (current) => ({ ...current, isHidden: !current.isHidden }))}>{exam.isHidden ? "Einblenden" : "Ausblenden"}</button><button type="button" className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-rose-600 ring-1 ring-rose-100" onClick={() => deleteExam(exam.id)}>Löschen</button></div>
                </div>
              </article>;
            })}
          </div>
        </div>

        <div ref={focusPanelRef} className="scroll-mt-24 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-violet-950/10 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-6"><div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" /><div className="absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="relative"><p className="text-sm font-bold text-fuchsia-200">Lernplan-Fokus</p><h2 className="mt-1 text-2xl font-black tracking-tight">Prüfung im Detail</h2><p className="mt-2 text-sm leading-6 text-slate-300">Hier kannst du Lernblöcke abhaken, verschieben, verstecken und Notizen ergänzen.</p>
              {!focusedExam ? <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center text-sm font-semibold text-slate-300 ring-1 ring-white/10">Speichere eine Prüfung, dann erscheint hier dein Plan.</div> : <>
                <div className="mt-5 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Aktiver Fokus</p>
                      <h3 className="mt-2 text-xl font-black">{focusedExam.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{formatDate(focusedExam.examDate)} · {formatTime(focusedExam.examTime)} · {getCountdownLabel(getDaysUntil(focusedExam.examDate))}</p>
                      <p className="mt-2 text-sm font-semibold text-fuchsia-100">{getStudyPhase(getDaysUntil(focusedExam.examDate))}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <button type="button" className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-fuchsia-100 ring-1 ring-white/10" onClick={() => regenerateExamPlan(focusedExam.id)}>Plan neu generieren</button>
                      <button type="button" className="rounded-2xl bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 disabled:opacity-40" disabled={Boolean(activeTimer)} onClick={() => startStudyTimer(focusedExam.id, null, focusedExam.title)}>Timer</button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><p className="text-xs text-slate-400">geplante Lernzeit</p><p className="mt-1 text-lg font-black">{focusedProgress ? formatMinutes(focusedProgress.plannedMinutes) : "0 min"}</p></div>
                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><p className="text-xs text-slate-400">erledigt</p><p className="mt-1 text-lg font-black">{focusedProgress ? formatMinutes(focusedProgress.doneMinutes) : "0 min"}</p></div>
                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><p className="text-xs text-slate-400">offen</p><p className="mt-1 text-lg font-black">{focusedProgress ? formatMinutes(focusedProgress.remainingMinutes) : "0 min"}</p></div>
                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><span className="text-xs text-slate-400">Start Tage vorher</span><input className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-lg font-black text-white outline-none" inputMode="numeric" value={focusedExam.studyStartDays} onChange={(event) => { const value = Math.max(1, Math.round(Number(event.target.value) || DEFAULT_STUDY_START_DAYS)); updateExam(focusedExam.id, (exam) => ({ ...exam, studyStartDays: value })); }} /></label>
                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><span className="text-xs text-slate-400">Gesamtpensum h</span><input className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-lg font-black text-white outline-none" inputMode="decimal" placeholder="Auto" value={getExamTargetStudyMinutes(focusedExam) > 0 ? String(Math.round((getExamTargetStudyMinutes(focusedExam) / 60) * 10) / 10) : ""} onChange={(event) => { const value = Math.max(0, Math.round((Number(event.target.value.replace(",", ".")) || 0) * 60)); updateExam(focusedExam.id, (exam) => ({ ...exam, targetStudyMinutes: value })); }} /></label>
                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><span className="text-xs text-slate-400">Tag max. h</span><input className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-lg font-black text-white outline-none" inputMode="decimal" value={String(Math.round((getExamDailyLimit(focusedExam) / 60) * 10) / 10)} onChange={(event) => { const value = clampMinutes((Number(event.target.value.replace(",", ".")) || 5) * 60, DEFAULT_DAILY_STUDY_LIMIT_MINUTES, 30, 720); updateExam(focusedExam.id, (exam) => ({ ...exam, dailyStudyLimitMinutes: value, sessionGoalMinutes: Math.min(getExamSessionGoal(exam), value) })); }} /></label>
                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10"><span className="text-xs text-slate-400">Einheit min</span><input className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-lg font-black text-white outline-none" inputMode="numeric" value={getExamSessionGoal(focusedExam)} onChange={(event) => { const value = clampMinutes(Number(event.target.value) || DEFAULT_SESSION_GOAL_MINUTES, DEFAULT_SESSION_GOAL_MINUTES, 15, getExamDailyLimit(focusedExam)); updateExam(focusedExam.id, (exam) => ({ ...exam, sessionGoalMinutes: value })); }} /></label>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${focusedProgress?.percentage ?? 0}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-black text-slate-400">{focusedProgress?.percentage ?? 0}% Fortschritt · {focusedProgress?.doneSessions ?? 0}/{focusedProgress?.totalSessions ?? 0} Sessions erledigt</p>
                </div>
                <div className="mt-4 space-y-3">{focusedPlan.length === 0 ? <p className="rounded-3xl bg-white/10 p-4 text-sm leading-6 text-slate-300 ring-1 ring-white/10">Für diese Prüfung ist aktuell kein Lernblock geplant. Erzeuge einen Plan neu oder füge manuell eine Einheit hinzu.</p> : focusedPlan.map((session) => <div key={session.id} className={`rounded-3xl p-4 ring-1 ${selectedCalendarSessionId === session.id ? "bg-fuchsia-500/20 ring-fuchsia-300/40" : session.isDone ? "bg-emerald-500/15 ring-emerald-300/20" : "bg-white/10 ring-white/10"}`}><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><label className="flex min-w-0 flex-1 items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-emerald-400" checked={session.isDone} onChange={() => updateStudySession(focusedExam.id, session.id, (current) => ({ ...current, isDone: !current.isDone, completedAtIso: current.isDone ? "" : new Date().toISOString() }))} /><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="block font-black">{session.title}</span>{selectedCalendarSessionId === session.id && <span className="rounded-full bg-fuchsia-300 px-2 py-0.5 text-[0.65rem] font-black text-slate-950">aus Kalender</span>}</span><span className="mt-1 block text-sm leading-6 text-slate-300">{formatDate(session.dateKey)} · {formatTime(session.time)} · {formatMinutes(session.durationMinutes)} · {session.focus || "Eigener Lernblock"}</span></span></label><div className="flex flex-wrap gap-2"><button type="button" className="rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-black text-slate-950 disabled:opacity-40" disabled={Boolean(activeTimer)} onClick={() => startStudyTimer(focusedExam.id, session.id, session.title)}>Timer</button><button type="button" className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-black text-fuchsia-100 ring-1 ring-white/10" onClick={() => updateStudySession(focusedExam.id, session.id, (current) => ({ ...current, isHidden: !current.isHidden }))}>{session.isHidden ? "Einblenden" : "Ausblenden"}</button><button type="button" className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-black text-rose-100 ring-1 ring-white/10" onClick={() => deleteStudySession(focusedExam.id, session.id)}>Löschen</button></div></div><div className="mt-3 grid gap-2 sm:grid-cols-4"><input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-400" value={formatDateInput(session.dateKey)} onChange={(event) => { const dateKey = normalizeDateInput(event.target.value); if (dateKey) updateStudySession(focusedExam.id, session.id, (current) => ({ ...current, dateKey })); }} placeholder="TT.MM.JJJJ" /><input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-400" value={session.time} onChange={(event) => updateStudySession(focusedExam.id, session.id, (current) => ({ ...current, time: normalizeTimeInput(event.target.value) || event.target.value }))} placeholder="16:00" /><input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-400" inputMode="numeric" value={session.durationMinutes} onChange={(event) => updateStudySession(focusedExam.id, session.id, (current) => ({ ...current, durationMinutes: Math.max(15, Math.round(Number(event.target.value) || current.durationMinutes)) }))} /><input className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-400" value={session.title} onChange={(event) => updateStudySession(focusedExam.id, session.id, (current) => ({ ...current, title: event.target.value }))} placeholder="Titel" /></div><textarea className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400" value={session.notes} onChange={(event) => updateStudySession(focusedExam.id, session.id, (current) => ({ ...current, notes: event.target.value }))} placeholder="Notizen zu dieser Lerneinheit…" /></div>)}</div>
              </>}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
