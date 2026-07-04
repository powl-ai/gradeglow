"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import GlowRewardsPanel from "./GlowRewardsPanel";
import GradeGlowInsights from "./GradeGlowInsights";
import GradeGlowLogo from "./GradeGlowLogo";
import GradeGlowPlanner from "./GradeGlowPlanner";
import PlanUsagePanel from "./PlanUsagePanel";
import PwaInstallCard from "./PwaInstallCard";
import BetaNoticeCard from "./BetaNoticeCard";
import BetaLaunchPanel from "./BetaLaunchPanel";
import StudyFriendsPanel from "./StudyFriendsPanel";
import StudyPlanningPanel from "./StudyPlanningPanel";
import UniSchedulePanel from "./UniSchedulePanel";
import OnboardingWizard from "./OnboardingWizard";
import ModuleDetailModal from "./ModuleDetailModal";
import { useGradeGlowModules } from "../hooks/useGradeGlowModules";
import { useGradeGlowExams } from "../hooks/useGradeGlowExams";
import { useGradeGlowSchedule } from "../hooks/useGradeGlowSchedule";
import { useFriendActivityToast } from "../hooks/useFriendActivityToast";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { formatLimit, planLabels } from "../lib/gradeglowAccess";
import { publishStudyActivity } from "../lib/studyActivity";
import { getAvatarFrameWrapperClassName, getProfileBannerClassName } from "../lib/glowRewards";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import {
  DEFAULT_TARGET_ECTS,
  useGradeGlowProfile,
} from "../hooks/useGradeGlowProfile";
import { migrateModules } from "../lib/gradeglowModules";
import type {
  AppUser,
  Assessment,
  BackupFile,
  GradeGlowFeatureId,
  ModuleStatus,
  StatusFilter,
  UniModule,
  StudySessionItem,
} from "../types";

type AssessmentInput = {
  name: string;
  weight: string;
  grade: string;
};

type EditInput = {
  name: string;
  ects: string;
  grade: string;
  semester: string;
  plannedSemester: string;
  status: ModuleStatus;
  attemptCount: string;
  maxAttempts: string;
};

export type DashboardPage =
  | "overview"
  | "insights"
  | "friends"
  | "exams"
  | "timer"
  | "planning"
  | "schedule"
  | "modules"
  | "feedback"
  | "diagnostics"
  | "backup"
  | "launch"
  | "premium"
  | "store"
  | "native"
  | "monetization";

type GradeGlowDashboardProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
  page?: DashboardPage;
};

type DashboardNavItem = {
  id: DashboardPage;
  href: string;
  label: string;
  description: string;
  emoji: string;
  featureId?: GradeGlowFeatureId;
  betaOnly?: boolean;
  adminOnly?: boolean;
  navHidden?: boolean;
};

const dashboardNavItems: DashboardNavItem[] = [
  {
    id: "overview",
    href: "/",
    label: "Überblick",
    description: "Schnitt, ECTS und Fortschritt",
    emoji: "✨",
  },
  {
    id: "insights",
    href: "/insights",
    label: "Insights",
    description: "Diagramme und Glow Check",
    emoji: "📊",
    featureId: "insights",
  },
  {
    id: "friends",
    href: "/friends",
    label: "Freunde",
    description: "Study Circle und Lernvergleich",
    emoji: "👥",
    featureId: "friends",
  },
  {
    id: "exams",
    href: "/exams",
    label: "Plan",
    description: "Prüfungsplaner und Lernplan",
    emoji: "🗓️",
  },
  {
    id: "timer",
    href: "/timer",
    label: "Timer",
    description: "Fokus-Timer und aktive Lernsessions",
    emoji: "▶",
    navHidden: true,
  },
  {
    id: "schedule",
    href: "/schedule",
    label: "Stundenplan",
    description: "Uni-Plan mit Vorlesungen und Übungen",
    emoji: "📅",
    featureId: "schedule",
  },
  {
    id: "planning",
    href: "/planning",
    label: "StuPo & Planung",
    description: "Import, Semesterplanung und Fehlversuche",
    emoji: "🧭",
    featureId: "planning",
  },
  {
    id: "modules",
    href: "/modules",
    label: "Module",
    description: "Eintragen, bearbeiten und Leistungen",
    emoji: "📚",
  },
  {
    id: "diagnostics",
    href: "/diagnostics",
    label: "Diagnose",
    description: "Bugs, Status und Button-Audit",
    emoji: "🛠",
    betaOnly: true,
  },
  {
    id: "launch",
    href: "/launch",
    label: "Launch",
    description: "Beta-Reife und Release-Plan",
    emoji: "🚀",
    betaOnly: true,
  },
  {
    id: "premium",
    href: "/premium",
    label: "Plus",
    description: "Free, Beta und Premium",
    emoji: "⭐",
  },
  {
    id: "store",
    href: "/store",
    label: "Store",
    description: "App Store, Screenshots und Listing vorbereiten",
    emoji: "🛍",
    betaOnly: true,
  },

  {
    id: "monetization",
    href: "/monetization",
    label: "Monetarisierung",
    description: "Checkout, Plus und Ads vorbereiten",
    emoji: "€",
    betaOnly: true,
  },
  {
    id: "native",
    href: "/native",
    label: "Native",
    description: "Capacitor, TestFlight und App-Wrapper vorbereiten",
    emoji: "📱",
    betaOnly: true,
  },
  {
    id: "backup",
    href: "/backup",
    label: "Backup",
    description: "Export, Import und CSV",
    emoji: "💾",
    navHidden: true,
  },
];

const statusOptions: {
  value: ModuleStatus;
  label: string;
  shortLabel: string;
}[] = [
  { value: "passed", label: "Bestanden", shortLabel: "Bestanden" },
  { value: "ungraded", label: "Unbenotet bestanden", shortLabel: "Unbenotet" },
  { value: "open", label: "Offen", shortLabel: "Offen" },
  { value: "failed", label: "Nicht bestanden", shortLabel: "Nicht bestanden" },
];

const emptyAssessmentInput: AssessmentInput = {
  name: "",
  weight: "",
  grade: "",
};

const ACTIVE_TIMER_STORAGE_KEY = "gradeglow-active-study-timer-v1";
const QUICK_RAIL_SCROLL_STORAGE_KEY = "gradeglow-quick-rail-scroll-left-v1";
const WELCOME_QUERY_PARAM = "welcome";

const mobileTabItems: Array<{ href: string; label: string; icon: string; match: DashboardPage[] }> = [
  { href: "/", label: "Home", icon: "⌂", match: ["overview"] },
  { href: "/exams", label: "Plan", icon: "▦", match: ["exams"] },
  { href: "/timer", label: "Timer", icon: "▶", match: ["timer"] },
  { href: "/friends", label: "Circle", icon: "●", match: ["friends"] },
  { href: "/settings", label: "Profil", icon: "◌", match: [] },
];

type StoredActiveStudyTimer = {
  examId: string;
  sessionId: string | null;
  title: string;
  startedAt: number;
  mode: "stopwatch" | "focus" | "pomodoro";
  goalMinutes: number;
};

const readStoredActiveStudyTimer = (): StoredActiveStudyTimer | null => {
  if (typeof window === "undefined") return null;

  try {
    const rawTimer = window.localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
    if (!rawTimer) return null;
    const parsed = JSON.parse(rawTimer) as Partial<StoredActiveStudyTimer>;
    if (!parsed.examId || typeof parsed.startedAt !== "number" || !Number.isFinite(parsed.startedAt)) return null;
    return {
      examId: String(parsed.examId),
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title : "Lernsession",
      startedAt: parsed.startedAt,
      mode: parsed.mode === "stopwatch" || parsed.mode === "pomodoro" || parsed.mode === "focus" ? parsed.mode : "focus",
      goalMinutes: Math.max(1, Math.round(Number(parsed.goalMinutes) || 90)),
    };
  } catch {
    return null;
  }
};

const getTodayDateKey = () => new Date().toISOString().slice(0, 10);

const formatTimeInputFromDate = (date: Date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const formatCompactDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};


export default function GradeGlowDashboard({
  user,
  onLogout,
  page = "overview",
}: GradeGlowDashboardProps) {
  const { modules, setModules, isLoaded, syncStatus, syncMessage, dataModel } =
    useGradeGlowModules(user);
  const {
    exams,
    setExams,
    isLoaded: areExamsLoaded,
    syncMessage: examsSyncMessage,
  } = useGradeGlowExams(user);
  const {
    scheduleItems,
    setScheduleItems,
    isLoaded: isScheduleLoaded,
    syncMessage: scheduleSyncMessage,
  } = useGradeGlowSchedule(user);
  const { entitlement, limits } = useGradeGlowAccess(user);

  const [name, setName] = useState("");
  const [ects, setEcts] = useState("");
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("1");
  const [status, setStatus] = useState<ModuleStatus>("passed");

  const [targetAverage, setTargetAverage] = useState("2,0");
  const [targetRemainingEcts, setTargetRemainingEcts] = useState("");

  const [assessmentInputs, setAssessmentInputs] = useState<
    Record<string, AssessmentInput>
  >({});
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const [editingModules, setEditingModules] = useState<Record<string, boolean>>(
    {},
  );
  const [editInputs, setEditInputs] = useState<Record<string, EditInput>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [moduleLimitMessage, setModuleLimitMessage] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);


  const [globalTimer, setGlobalTimer] = useState<StoredActiveStudyTimer | null>(null);
  const [globalTimerNow, setGlobalTimerNow] = useState(() => Date.now());
  const [standaloneTimerExamId, setStandaloneTimerExamId] = useState("");
  const [standaloneTimerMode, setStandaloneTimerMode] = useState<StoredActiveStudyTimer["mode"]>("focus");
  const [standaloneTimerMinutes, setStandaloneTimerMinutes] = useState("30");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickRailRef = useRef<HTMLElement | null>(null);
  const activeQuickRailItemRef = useRef<HTMLAnchorElement | null>(null);

  const { profile, isProfileLoaded, profileSyncMessage, saveProfile } = useGradeGlowProfile(user);
  const { toast: friendActivityToast, dismissToast: dismissFriendActivityToast } = useFriendActivityToast(user, profile);
  const { foregroundMessage, clearForegroundMessage } = usePushNotifications(user);
  const themeClassName = getThemeClassName(profile.themeMode);
  const effectivePageThemeId = getEffectivePageThemeId(profile.activePageThemeId, limits.premiumThemes);
  const themeStyle = getPageThemeStyle(effectivePageThemeId);

  useEffect(() => {
    const syncTimer = () => {
      setGlobalTimer(readStoredActiveStudyTimer());
      setGlobalTimerNow(Date.now());
    };

    syncTimer();
    const interval = window.setInterval(syncTimer, 1000);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACTIVE_TIMER_STORAGE_KEY) syncTimer();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const totalTargetEcts =
    profile.targetEcts > 0 ? profile.targetEcts : DEFAULT_TARGET_ECTS;

  const parseNumber = (value: string) => Number(value.replace(",", "."));

  const isModuleLimitReached = Number.isFinite(limits.maxModules) && modules.length >= limits.maxModules;

  const formatGrade = (value: number) => value.toFixed(2).replace(".", ",");

  const formatCompactNumber = (value: number) =>
    String(value).replace(".", ",");

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

    if (
      module.assessments.length === 0 &&
      finalGrade !== null &&
      finalGrade > 4.0
    ) {
      return "failed";
    }

    return module.status;
  };

  const getNextAttemptState = (
    module: UniModule,
    nextStatus: ModuleStatus,
    explicitAttemptCount?: number,
    explicitMaxAttempts?: number,
  ) => {
    const maxAttempts = Math.max(
      1,
      Math.round(explicitMaxAttempts ?? module.maxAttempts ?? 3),
    );
    const hasExplicitAttemptCount = explicitAttemptCount !== undefined;
    const currentAttempts = Math.max(
      0,
      Math.round(explicitAttemptCount ?? module.attemptCount ?? 0),
    );
    const shouldAutoAddAttempt =
      !hasExplicitAttemptCount &&
      nextStatus === "failed" &&
      module.status !== "failed";
    const attemptCount = shouldAutoAddAttempt
      ? Math.min(Math.max(currentAttempts + 1, 1), maxAttempts)
      : Math.min(currentAttempts, maxAttempts);

    return {
      attemptCount,
      maxAttempts,
      isLocked: attemptCount >= maxAttempts,
    };
  };

  const getStatusLabel = (moduleStatus: ModuleStatus) => {
    switch (moduleStatus) {
      case "passed":
        return "Bestanden";
      case "ungraded":
        return "Unbenotet";
      case "open":
        return "Offen";
      case "failed":
        return "Nicht bestanden";
    }
  };

  const getStatusStyle = (moduleStatus: ModuleStatus) => {
    switch (moduleStatus) {
      case "passed":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
      case "ungraded":
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
      case "open":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    }
  };

  const getSyncStyle = () => {
    switch (syncStatus) {
      case "cloud-saved":
      case "cloud-ready":
        return "bg-emerald-400/15 text-emerald-50 ring-emerald-300/25";
      case "cloud-saving":
      case "cloud-loading":
        return "bg-amber-400/15 text-amber-50 ring-amber-300/25";
      case "cloud-error":
        return "bg-rose-400/15 text-rose-50 ring-rose-300/25";
      case "local":
        return "bg-white/10 text-violet-50 ring-white/15";
    }
  };

  const handleAddModule = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!name.trim() || !ects || !semester) return;

    if (isModuleLimitReached) {
      setModuleLimitMessage(`Free-Limit erreicht: Du kannst im ${planLabels[entitlement.plan]} Plan aktuell maximal ${formatLimit(limits.maxModules, "Module")} anlegen.`);
      return;
    }

    const parsedEcts = parseNumber(ects);
    const parsedSemester = parseNumber(semester);
    const numericGrade = grade ? parseNumber(grade) : null;

    if (!Number.isFinite(parsedEcts) || !Number.isFinite(parsedSemester))
      return;
    if (numericGrade !== null && !Number.isFinite(numericGrade)) return;

    const effectiveNewStatus: ModuleStatus =
      numericGrade !== null && numericGrade > 4 ? "failed" : status;
    const initialAttemptCount = effectiveNewStatus === "failed" ? 1 : 0;

    const newModule: UniModule = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ects: parsedEcts,
      grade: numericGrade,
      semester: parsedSemester,
      status: effectiveNewStatus,
      assessments: [],
      category: "unknown",
      plannedSemester: parsedSemester,
      attemptCount: initialAttemptCount,
      maxAttempts: 3,
      isLocked: initialAttemptCount >= 3,
      stupoMatched: false,
      stupoSource: "",
      notes: "",
      targetGrade: null,
    };

    setModuleLimitMessage("");
    setModules((currentModules) => [...currentModules, newModule]);
    setExpandedModules((currentExpanded) => ({
      ...currentExpanded,
      [newModule.id]: false,
    }));

    setName("");
    setEcts("");
    setGrade("");
    setSemester("1");
    setStatus("passed");
  };

  const deleteModule = (moduleId: string) => {
    setSelectedModuleId((currentModuleId) =>
      currentModuleId === moduleId ? null : currentModuleId,
    );
    setModules((currentModules) =>
      currentModules.filter((module) => module.id !== moduleId),
    );
  };

  const updateModuleDetails = (
    moduleId: string,
    patch: Pick<UniModule, "notes" | "targetGrade">,
  ) => {
    setModules((currentModules) =>
      currentModules.map((module) =>
        module.id === moduleId ? { ...module, ...patch } : module,
      ),
    );
  };

  const toggleAssessments = (moduleId: string) => {
    setExpandedModules((currentExpanded) => ({
      ...currentExpanded,
      [moduleId]: !currentExpanded[moduleId],
    }));
  };

  const startEditingModule = (module: UniModule) => {
    setEditingModules((currentEditing) => ({
      ...currentEditing,
      [module.id]: true,
    }));

    setEditInputs((currentInputs) => ({
      ...currentInputs,
      [module.id]: {
        name: module.name,
        ects: String(module.ects).replace(".", ","),
        grade:
          module.grade !== null ? String(module.grade).replace(".", ",") : "",
        semester: String(module.semester),
        plannedSemester: String(module.plannedSemester ?? module.semester),
        status: module.status,
        attemptCount: String(module.attemptCount ?? 0),
        maxAttempts: String(module.maxAttempts ?? 3),
      },
    }));
  };

  const cancelEditingModule = (moduleId: string) => {
    setEditingModules((currentEditing) => ({
      ...currentEditing,
      [moduleId]: false,
    }));
  };

  const updateEditInput = (
    moduleId: string,
    field: keyof EditInput,
    value: string,
  ) => {
    setEditInputs((currentInputs) => {
      const currentInput = currentInputs[moduleId];
      if (!currentInput) return currentInputs;

      return {
        ...currentInputs,
        [moduleId]: {
          ...currentInput,
          [field]: value,
        },
      };
    });
  };

  const saveEditedModule = (moduleId: string) => {
    const input = editInputs[moduleId];
    if (
      !input ||
      !input.name.trim() ||
      !input.ects ||
      !input.semester ||
      !input.plannedSemester
    )
      return;

    const parsedEcts = parseNumber(input.ects);
    const parsedSemester = parseNumber(input.semester);
    const parsedPlannedSemester = parseNumber(input.plannedSemester);
    const numericGrade = input.grade ? parseNumber(input.grade) : null;
    const parsedAttemptCount = input.attemptCount
      ? parseNumber(input.attemptCount)
      : 0;
    const parsedMaxAttempts = input.maxAttempts
      ? parseNumber(input.maxAttempts)
      : 3;

    if (
      !Number.isFinite(parsedEcts) ||
      !Number.isFinite(parsedSemester) ||
      !Number.isFinite(parsedPlannedSemester) ||
      !Number.isFinite(parsedAttemptCount) ||
      !Number.isFinite(parsedMaxAttempts)
    ) {
      return;
    }
    if (numericGrade !== null && !Number.isFinite(numericGrade)) return;

    setModules((currentModules) =>
      currentModules.map((module) => {
        if (module.id !== moduleId) return module;

        const nextStatus: ModuleStatus =
          numericGrade !== null && numericGrade > 4 ? "failed" : input.status;
        const explicitAttemptCount =
          nextStatus === "failed" &&
          module.status !== "failed" &&
          parsedAttemptCount <= (module.attemptCount ?? 0)
            ? undefined
            : parsedAttemptCount;
        const attemptState = getNextAttemptState(
          module,
          nextStatus,
          explicitAttemptCount,
          parsedMaxAttempts,
        );

        return {
          ...module,
          name: input.name.trim(),
          ects: parsedEcts,
          grade: numericGrade,
          semester: parsedSemester,
          plannedSemester: Math.max(1, Math.round(parsedPlannedSemester)),
          status: nextStatus,
          ...attemptState,
        };
      }),
    );

    setEditingModules((currentEditing) => ({
      ...currentEditing,
      [moduleId]: false,
    }));
  };

  const updateAssessmentInput = (
    moduleId: string,
    field: keyof AssessmentInput,
    value: string,
  ) => {
    setAssessmentInputs((currentInputs) => ({
      ...currentInputs,
      [moduleId]: {
        ...(currentInputs[moduleId] ?? emptyAssessmentInput),
        [field]: value,
      },
    }));
  };

  const addAssessment = (moduleId: string) => {
    const input = assessmentInputs[moduleId];
    if (!input?.name.trim() || !input.weight || !input.grade) return;

    const parsedWeight = parseNumber(input.weight);
    const parsedGrade = parseNumber(input.grade);

    if (!Number.isFinite(parsedWeight) || !Number.isFinite(parsedGrade)) return;

    const newAssessment: Assessment = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      weight: parsedWeight,
      grade: parsedGrade,
    };

    setModules((currentModules) =>
      currentModules.map((module) => {
        if (module.id !== moduleId) return module;

        const nextAssessments = [...module.assessments, newAssessment];
        const totalWeight = nextAssessments.reduce(
          (sum, assessment) => sum + assessment.weight,
          0,
        );
        const calculatedGrade =
          totalWeight > 0
            ? nextAssessments.reduce(
                (sum, assessment) => sum + assessment.grade * assessment.weight,
                0,
              ) / totalWeight
            : null;
        const shouldMarkFailed =
          totalWeight >= 100 &&
          calculatedGrade !== null &&
          calculatedGrade > 4.0;

        return {
          ...module,
          assessments: nextAssessments,
          ...(shouldMarkFailed
            ? {
                status: "failed" as ModuleStatus,
                ...getNextAttemptState(module, "failed"),
              }
            : {}),
        };
      }),
    );

    setAssessmentInputs((currentInputs) => ({
      ...currentInputs,
      [moduleId]: emptyAssessmentInput,
    }));
  };

  const deleteAssessment = (moduleId: string, assessmentId: string) => {
    setModules((currentModules) =>
      currentModules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              assessments: module.assessments.filter(
                (assessment) => assessment.id !== assessmentId,
              ),
            }
          : module,
      ),
    );
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportJsonBackup = () => {
    const backup: BackupFile = {
      app: "GradeGlow",
      version: 1,
      exportedAt: new Date().toISOString(),
      modules,
    };

    const date = new Date().toISOString().slice(0, 10);

    downloadFile(
      JSON.stringify(backup, null, 2),
      `gradeglow-backup-${date}.json`,
      "application/json",
    );

    setImportMessage("Backup wurde exportiert.");
  };

  const escapeCsvValue = (value: string | number | null) => {
    const stringValue = value === null ? "" : String(value);
    return `"${stringValue.replaceAll('"', '""')}"`;
  };

  const exportCsv = () => {
    const rows = [
      [
        "Semester",
        "Modul",
        "ECTS",
        "Status",
        "Gesamtnote",
        "Berechnete Modulnote",
        "Einzelleistungen",
        "Modulart",
        "Geplantes Semester",
        "Fehlversuche",
        "Max. Versuche",
        "StuPo-Quelle",
        "Notizen",
        "Zielnote",
      ],
      ...modules.map((module) => {
        const finalGrade = getFinalGrade(module);
        const effectiveStatus = getEffectiveStatus(module);

        const assessmentSummary = module.assessments
          .map(
            (assessment) =>
              `${assessment.name}: ${assessment.weight}% / Note ${formatGrade(assessment.grade)}`,
          )
          .join(" | ");

        return [
          module.semester,
          module.name,
          module.ects,
          getStatusLabel(effectiveStatus),
          module.grade !== null ? formatGrade(module.grade) : "",
          finalGrade !== null ? formatGrade(finalGrade) : "",
          assessmentSummary,
          module.category,
          module.plannedSemester,
          module.attemptCount,
          module.maxAttempts,
          module.stupoSource,
          module.notes,
          module.targetGrade !== null ? formatGrade(module.targetGrade) : "",
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(";"))
      .join("\n");

    const date = new Date().toISOString().slice(0, 10);

    downloadFile(
      "\ufeff" + csv,
      `gradeglow-export-${date}.csv`,
      "text/csv;charset=utf-8",
    );

    setImportMessage("CSV wurde exportiert.");
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const importJsonBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const fileContent = String(reader.result);
        const parsed = JSON.parse(fileContent);
        const rawModules = Array.isArray(parsed) ? parsed : parsed.modules;

        if (!Array.isArray(rawModules)) {
          setImportMessage(
            "Import fehlgeschlagen: Keine gültige Backup-Datei.",
          );
          return;
        }

        const importedModules = migrateModules(rawModules);
        setModules(importedModules);
        setImportMessage(
          `Import erfolgreich: ${importedModules.length} Modul(e) geladen.`,
        );
      } catch {
        setImportMessage(
          "Import fehlgeschlagen: Datei konnte nicht gelesen werden.",
        );
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  };

  const analytics = useMemo(() => {
    const gradedModules = modules.filter((module) => {
      const finalGrade = getFinalGrade(module);
      const effectiveStatus = getEffectiveStatus(module);
      return effectiveStatus === "passed" && finalGrade !== null;
    });

    const gradedEcts = gradedModules.reduce(
      (sum, module) => sum + module.ects,
      0,
    );

    const passedEcts = modules
      .filter((module) => {
        const effectiveStatus = getEffectiveStatus(module);
        return effectiveStatus === "passed" || effectiveStatus === "ungraded";
      })
      .reduce((sum, module) => sum + module.ects, 0);

    const openEcts = modules
      .filter((module) => getEffectiveStatus(module) === "open")
      .reduce((sum, module) => sum + module.ects, 0);

    const failedEcts = modules
      .filter((module) => getEffectiveStatus(module) === "failed")
      .reduce((sum, module) => sum + module.ects, 0);

    const openGradedEcts = modules
      .filter((module) => {
        const effectiveStatus = getEffectiveStatus(module);
        return effectiveStatus === "open" || effectiveStatus === "failed";
      })
      .reduce((sum, module) => sum + module.ects, 0);

    const weightedGradeSum = gradedModules.reduce((sum, module) => {
      const finalGrade = getFinalGrade(module) ?? 0;
      return sum + finalGrade * module.ects;
    }, 0);

    const average = weightedGradeSum / gradedEcts || 0;
    const progress = (passedEcts / totalTargetEcts) * 100;

    return {
      gradedModules,
      gradedEcts,
      passedEcts,
      openEcts,
      failedEcts,
      openGradedEcts,
      weightedGradeSum,
      average,
      progress,
    };
    // Grade/status helpers are pure calculations for the current render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, totalTargetEcts]);

  const target = targetAverage ? parseNumber(targetAverage) : 0;
  const remainingGradedEcts = targetRemainingEcts
    ? parseNumber(targetRemainingEcts)
    : analytics.openGradedEcts;

  const requiredAverage =
    remainingGradedEcts > 0 && target > 0
      ? (target * (analytics.gradedEcts + remainingGradedEcts) -
          analytics.weightedGradeSum) /
        remainingGradedEcts
      : 0;

  const targetIsAlreadyReached =
    analytics.gradedEcts > 0 &&
    analytics.average <= target &&
    remainingGradedEcts === 0;

  const targetOutlook = (() => {
    if (remainingGradedEcts <= 0 || target <= 0) {
      return {
        label: "Noch keine Prognose",
        text: "Trage offene benotete ECTS ein oder importiere offene Module, damit GradeGlow deinen benötigten Restschnitt berechnen kann.",
        className: "bg-slate-400/15 text-slate-100 ring-1 ring-slate-300/20",
      };
    }

    if (requiredAverage < 1.0) {
      return {
        label: "rechnerisch kaum/nicht erreichbar",
        text: "Für dieses Ziel bräuchtest du rechnerisch einen Restschnitt besser als 1,0. Das ist mit normalen Noten nicht erreichbar.",
        className: "bg-rose-400/15 text-rose-100 ring-1 ring-rose-300/20",
      };
    }

    if (requiredAverage <= 1.7) {
      return {
        label: "ambitioniert",
        text: "Das Ziel ist rechnerisch erreichbar, aber du brauchst ab jetzt sehr starke Noten.",
        className: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/20",
      };
    }

    if (requiredAverage <= 2.7) {
      return {
        label: "machbar",
        text: "Das Ziel ist realistisch, wenn deine nächsten Leistungen ungefähr in diesem Bereich landen.",
        className:
          "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20",
      };
    }

    if (requiredAverage <= 4.0) {
      return {
        label: "sehr entspannt",
        text: "Das Ziel ist rechnerisch erreichbar und du hast noch etwas Puffer.",
        className: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/20",
      };
    }

    return {
      label: "sehr entspannt",
      text: "Selbst ein Restschnitt von 4,0 wäre rechnerisch noch ausreichend.",
      className: "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/20",
    };
  })();

  const sortedModules = [...modules].sort((a, b) => {
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.name.localeCompare(b.name);
  });

  const visibleModules = sortedModules.filter((module) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      module.name.toLowerCase().includes(normalizedSearch) ||
      String(module.semester).includes(normalizedSearch);

    const effectiveStatus = getEffectiveStatus(module);
    const matchesStatus =
      statusFilter === "all" || effectiveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const semesterGroups = visibleModules.reduce<Record<number, UniModule[]>>(
    (groups, module) => {
      if (!groups[module.semester]) groups[module.semester] = [];
      groups[module.semester].push(module);
      return groups;
    },
    {},
  );

  const semesterNumbers = Object.keys(semesterGroups)
    .map(Number)
    .sort((a, b) => a - b);

  const getSemesterPassedEcts = (semesterModules: UniModule[]) =>
    semesterModules
      .filter((module) => {
        const effectiveStatus = getEffectiveStatus(module);
        return effectiveStatus === "passed" || effectiveStatus === "ungraded";
      })
      .reduce((sum, module) => sum + module.ects, 0);

  const getSemesterAverage = (semesterModules: UniModule[]) => {
    const gradedSemesterModules = semesterModules.filter((module) => {
      const finalGrade = getFinalGrade(module);
      const effectiveStatus = getEffectiveStatus(module);
      return effectiveStatus === "passed" && finalGrade !== null;
    });

    const semesterGradedEcts = gradedSemesterModules.reduce(
      (sum, module) => sum + module.ects,
      0,
    );

    return (
      gradedSemesterModules.reduce((sum, module) => {
        const finalGrade = getFinalGrade(module) ?? 0;
        return sum + finalGrade * module.ects;
      }, 0) / semesterGradedEcts || 0
    );
  };

  const statusCounts = statusOptions.reduce<Record<ModuleStatus, number>>(
    (counts, option) => {
      counts[option.value] = modules.filter(
        (module) => getEffectiveStatus(module) === option.value,
      ).length;
      return counts;
    },
    { passed: 0, ungraded: 0, open: 0, failed: 0 },
  );

  const userLabel =
    profile.displayName || user.displayName || user.email || "GradeGlow User";
  const userInitial = userLabel.trim().charAt(0).toUpperCase() || "G";
  const avatarSource = profile.avatarDataUrl || user.photoURL || "";
  const avatarFrameWrapperClassName = getAvatarFrameWrapperClassName(profile.activeAvatarFrameId);
  const profileBannerClassName = getProfileBannerClassName(profile.activeProfileBannerId);
  const degreeProgramLabel =
    profile.degreeProgram || "Studiengang noch nicht gesetzt";
  const enabledFeatureIds = new Set(profile.enabledFeatureIds);
  const isBetaDiagnosticsUser = entitlement.plan === "admin" || ["beta_test", "founder", "manual"].includes(entitlement.premiumSource);
  const visibleDashboardNavItems = dashboardNavItems.filter((item) => {
    if (item.navHidden) return false;
    if (item.featureId && !enabledFeatureIds.has(item.featureId)) return false;
    if (item.betaOnly && !isBetaDiagnosticsUser) return false;
    if (item.adminOnly && entitlement.plan !== "admin") return false;
    return true;
  });
  const activeNavItem =
    dashboardNavItems.find((item) => item.id === page) ?? dashboardNavItems[0];
  const upcomingMobileExams = exams
    .filter((exam) => exam.status !== "done" && !exam.isHidden)
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  const nextMobileExam = upcomingMobileExams[0] ?? null;
  const openStudySessionsCount = exams.reduce(
    (count, exam) => count + exam.studySessions.filter((session) => !session.isDone && !session.isHidden).length,
    0,
  );
  const doneStudySessionsCount = exams.reduce(
    (count, exam) => count + exam.studySessions.filter((session) => session.isDone && !session.isHidden).length,
    0,
  );
  const mobilePageKicker = page === "overview" ? "Heute" : activeNavItem.label;
  const globalTimerExam = globalTimer ? exams.find((exam) => exam.id === globalTimer.examId) ?? null : null;
  const globalTimerElapsedSeconds = globalTimer ? Math.max(0, Math.floor((globalTimerNow - globalTimer.startedAt) / 1000)) : 0;
  const globalTimerModeLabel = globalTimer?.mode === "pomodoro" ? "Pomodoro" : globalTimer?.mode === "stopwatch" ? "Stoppuhr" : "Fokus-Timer";
  const standaloneTimerExam = exams.find((exam) => exam.id === standaloneTimerExamId) ?? exams.find((exam) => exam.status !== "done" && !exam.isHidden) ?? exams[0] ?? null;
  const standaloneTimerGoalMinutes = standaloneTimerMode === "pomodoro" ? 25 : standaloneTimerMode === "stopwatch" ? 300 : Math.max(1, Math.min(300, Math.round(Number(standaloneTimerMinutes) || 30)));
  const standaloneTimerLimitSeconds = globalTimer ? Math.max(1, globalTimer.goalMinutes) * 60 : standaloneTimerGoalMinutes * 60;
  const standaloneTimerDisplaySeconds = globalTimer?.mode === "stopwatch"
    ? globalTimerElapsedSeconds
    : Math.max(0, standaloneTimerLimitSeconds - globalTimerElapsedSeconds);

  const startStandaloneTimer = () => {
    if (!standaloneTimerExam) return;
    const title = standaloneTimerExam.moduleName || standaloneTimerExam.title || "Freie Lernzeit";
    const nextTimer: StoredActiveStudyTimer = {
      examId: standaloneTimerExam.id,
      sessionId: null,
      title,
      startedAt: Date.now(),
      mode: standaloneTimerMode,
      goalMinutes: standaloneTimerGoalMinutes,
    };
    setGlobalTimer(nextTimer);
    setGlobalTimerNow(Date.now());
    if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(nextTimer));
    void publishStudyActivity({
      user,
      profile,
      status: "started",
      title,
      examId: standaloneTimerExam.id,
      sessionId: null,
      startedAtIso: new Date(nextTimer.startedAt).toISOString(),
    });
  };

  const discardStandaloneTimer = () => {
    setGlobalTimer(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
  };

  const saveStandaloneTimer = () => {
    if (!globalTimer) return;
    const startedAt = new Date(globalTimer.startedAt);
    const completedAt = new Date();
    const minutes = Math.max(1, Math.min(globalTimer.goalMinutes || 300, Math.round((completedAt.getTime() - startedAt.getTime()) / 60_000)));
    const sessionId = crypto.randomUUID();
    const session: StudySessionItem = {
      id: sessionId,
      examId: globalTimer.examId,
      title: `Timer-Lernzeit · ${globalTimer.title}`,
      dateKey: getTodayDateKey(),
      time: formatTimeInputFromDate(startedAt),
      durationMinutes: minutes,
      focus: "Per Timer erfasste Lernzeit",
      notes: `${globalTimerModeLabel}: ${minutes} min am ${startedAt.toLocaleDateString("de-DE")}`,
      isDone: true,
      isHidden: false,
      isManual: true,
      startedAtIso: startedAt.toISOString(),
      completedAtIso: completedAt.toISOString(),
    };
    setExams((current) => current.map((exam) => exam.id === globalTimer.examId ? { ...exam, studySessions: [...exam.studySessions, session].sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`)) } : exam));
    void publishStudyActivity({
      user,
      profile,
      status: "completed",
      title: globalTimer.title,
      examId: globalTimer.examId,
      sessionId,
      durationMinutes: minutes,
      startedAtIso: startedAt.toISOString(),
      completedAtIso: completedAt.toISOString(),
    });
    discardStandaloneTimer();
  };

  const selectedModule =
    selectedModuleId !== null
      ? modules.find((module) => module.id === selectedModuleId) ?? null
      : null;
  const isInsightsVisible = page === "insights" || isInsightsOpen;
  const isBackupVisible = page === "backup" || isToolsOpen;
  const isDataStillChecking = !isLoaded || !areExamsLoaded || !isScheduleLoaded;
  const profileComplete = Boolean(profile.displayName && profile.university && profile.degreeProgram);
  const betaCloudMessages = [syncMessage, examsSyncMessage, scheduleSyncMessage].filter(Boolean);
  const renderAvatar = (className: string) => {
    const avatar = avatarSource ? (
      <div
        className={`${className} bg-cover bg-center`}
        style={{ backgroundImage: `url(${avatarSource})` }}
        aria-label="Profilbild"
        role="img"
      />
    ) : (
      <div className={className}>{userInitial}</div>
    );

    return avatarFrameWrapperClassName ? (
      <div className={`${avatarFrameWrapperClassName} shrink-0 rounded-[1.35rem]`}>
        {avatar}
      </div>
    ) : avatar;
  };

  const handleQuickRailScroll = useCallback(() => {
    const rail = quickRailRef.current;
    if (!rail || typeof window === "undefined") return;
    window.sessionStorage.setItem(QUICK_RAIL_SCROLL_STORAGE_KEY, String(rail.scrollLeft));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get(WELCOME_QUERY_PARAM) !== "1") return;

    setShowWelcomeBanner(true);
    params.delete(WELCOME_QUERY_PARAM);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  useEffect(() => {
    const rail = quickRailRef.current;
    if (!rail || typeof window === "undefined") return;

    const alignActiveItem = () => {
      const activeItem = activeQuickRailItemRef.current;
      if (!activeItem) return;

      const savedScrollLeft = Number(window.sessionStorage.getItem(QUICK_RAIL_SCROLL_STORAGE_KEY) || "0");
      if (Number.isFinite(savedScrollLeft) && savedScrollLeft > 0) {
        rail.scrollLeft = savedScrollLeft;
      }

      const railWidth = rail.clientWidth;
      const itemLeft = activeItem.offsetLeft;
      const itemRight = itemLeft + activeItem.offsetWidth;
      const visibleLeft = rail.scrollLeft;
      const visibleRight = visibleLeft + railWidth;
      const needsScroll = itemLeft < visibleLeft + 12 || itemRight > visibleRight - 12;

      if (needsScroll) {
        rail.scrollTo({
          left: Math.max(0, itemLeft - (railWidth - activeItem.offsetWidth) / 2),
          behavior: "auto",
        });
      }

      window.sessionStorage.setItem(QUICK_RAIL_SCROLL_STORAGE_KEY, String(rail.scrollLeft));
    };

    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(alignActiveItem);
      return () => window.cancelAnimationFrame(secondFrame);
    });

    return () => window.cancelAnimationFrame(firstFrame);
  }, [page]);

  if (!isProfileLoaded) {
    return (
      <main className={`gg-themed ${themeClassName} flex min-h-screen items-center justify-center bg-[#fbf7ff] px-4 text-slate-950`} data-accent={profile.accentColor} data-page-theme={effectivePageThemeId} style={themeStyle}>
        <div className="max-w-md rounded-[2rem] bg-white/95 p-6 text-center shadow-sm ring-1 ring-violet-100 backdrop-blur">
          <GradeGlowLogo size="md" appIconId={profile.activeAppIconId} />
          <p className="mt-5 text-sm font-bold text-violet-700">{profileSyncMessage}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Deine Daten werden geladen…</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            GradeGlow wartet auf dein Cloud-Profil, bevor Dashboard, Study Circle oder Rewards speichern dürfen. So werden leere Ladezustände nicht mehr über echte Profildaten geschrieben.
          </p>
        </div>
      </main>
    );
  }

  if (isProfileLoaded && !profile.onboardingCompleted) {
    if (!isLoaded || !areExamsLoaded || !isScheduleLoaded) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#fbf7ff] px-4 text-slate-950">
          <div className="rounded-[2rem] bg-white/90 p-6 text-center shadow-sm ring-1 ring-violet-100">
            <p className="text-sm font-bold text-violet-700">GradeGlow Setup</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Daten werden vorbereitet…</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Module und Prüfungen werden geladen, damit beim Demo-Start nichts überschrieben wird.
            </p>
          </div>
        </main>
      );
    }

    return (
      <OnboardingWizard
        user={user}
        profile={profile}
        modules={modules}
        exams={exams}
        saveProfile={saveProfile}
        setModules={setModules}
        setExams={setExams}
      />
    );
  }

  return (
    <main className={`gg-themed ${themeClassName} min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950`} data-accent={profile.accentColor} data-page-theme={effectivePageThemeId} style={themeStyle}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      {foregroundMessage && (
        <div className="fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[1.5rem] bg-violet-950/95 p-3 text-white shadow-2xl shadow-violet-950/25 ring-1 ring-white/10 backdrop-blur sm:top-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-200 text-sm font-black text-violet-950">
              GG
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{foregroundMessage.title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-violet-100">{foregroundMessage.body}</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-white transition hover:bg-white/20"
              onClick={clearForegroundMessage}
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {friendActivityToast && (
        <div className="fixed left-1/2 top-3 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[1.5rem] bg-slate-950/95 p-3 text-white shadow-2xl shadow-slate-950/25 ring-1 ring-white/10 backdrop-blur sm:top-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-black text-slate-950">
              GG
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">
                {friendActivityToast.status === "friend_added"
                  ? friendActivityToast.title
                  : friendActivityToast.status === "started"
                    ? `${friendActivityToast.displayName} lernt gerade`
                    : `${friendActivityToast.displayName} hat gelernt`}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-300">
                {friendActivityToast.status === "friend_added"
                  ? "Ihr seid jetzt im Study Circle verbunden."
                  : friendActivityToast.status === "completed" && friendActivityToast.durationMinutes > 0
                    ? `${friendActivityToast.durationMinutes} min · ${friendActivityToast.title}`
                    : friendActivityToast.title}
              </p>
            </div>
            <button
              type="button"
              className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-black text-white ring-1 ring-white/10"
              onClick={dismissFriendActivityToast}
              aria-label="Freundesbenachrichtigung schließen"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isNavigationOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setIsNavigationOpen(false)}
        >
          <nav
            className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/25 ring-1 ring-violet-100 sm:max-h-[calc(100vh-2rem)]"
            onClick={(event) => event.stopPropagation()}
            aria-label="GradeGlow Menü"
          >
            <div className="border-b border-violet-100 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-violet-700">Menü</p>
                  <h2 className="text-2xl font-black tracking-tight">
                    Bereiche & Profil
                  </h2>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-lg font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-violet-50 hover:text-violet-700"
                  onClick={() => setIsNavigationOpen(false)}
                  aria-label="Menü schließen"
                >
                  ×
                </button>
              </div>

              <div className={`mt-4 rounded-3xl p-4 text-white ring-1 ring-slate-900 ${profileBannerClassName}`}>
                <div className="flex items-center gap-3">
                  {renderAvatar("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/10")}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{userLabel}</p>
                    <p className="truncate text-xs font-semibold text-slate-300">
                      {degreeProgramLabel}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {user.email ?? "Lokaler Account"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Schnitt</p>
                    <p className="text-xl font-black">
                      {analytics.average > 0 ? formatGrade(analytics.average) : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Fortschritt</p>
                    <p className="text-xl font-black">
                      {Math.min(analytics.progress, 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getSyncStyle()}`}>
                    {syncMessage}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">
                    {dataModel === "firestore-module-docs" ? "Cloud-Sync" : "Lokal"}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-2">
                {visibleDashboardNavItems.map((item) => {
                  const isActive = item.id === page;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`rounded-2xl p-4 text-left ring-1 transition hover:-translate-y-0.5 ${
                        isActive
                          ? "bg-violet-700 text-white ring-violet-600 shadow-lg shadow-violet-200"
                          : "bg-slate-50 text-slate-950 ring-slate-200 hover:bg-violet-50 hover:ring-violet-100"
                      }`}
                      onClick={() => setIsNavigationOpen(false)}
                    >
                      <span className="flex items-center gap-2 text-sm font-black">
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </span>
                      <span
                        className={`mt-1 block text-xs font-semibold leading-5 ${isActive ? "text-violet-100" : "text-slate-500"}`}
                      >
                        {item.description}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-violet-100 p-4 sm:p-5">
              <Link
                href="/settings"
                className="rounded-2xl bg-slate-50 px-3 py-3 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-700"
                onClick={() => setIsNavigationOpen(false)}
              >
                Profil
              </Link>
              <button
                type="button"
                className="rounded-2xl bg-slate-950 px-3 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-800"
                onClick={() => {
                  setIsNavigationOpen(false);
                  void onLogout();
                }}
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      <div className="gg-app-shell mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+4.8rem)] pt-[calc(env(safe-area-inset-top,0px)+0.7rem)] sm:gap-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-[calc(env(safe-area-inset-top,0px)+2rem)]">
        <header className="gg-mobile-appbar lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="gg-mobile-icon-button shrink-0"
              onClick={() => setIsNavigationOpen(true)}
              aria-label="Menü öffnen"
            >
              ☰
            </button>
            <div className="min-w-0">
              <p className="gg-mobile-kicker">{mobilePageKicker}</p>
              <h1 className="truncate text-[1rem] font-black tracking-tight text-slate-950">{activeNavItem.label}</h1>
            </div>
          </div>
          <Link href="/settings" className="flex min-w-0 items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-2 text-[0.7rem] font-black text-slate-700 ring-1 ring-violet-100">
            {renderAvatar("flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[0.75rem] font-black text-violet-700")}
            <span className="max-w-[5.4rem] truncate">{userLabel}</span>
          </Link>
        </header>

        <header className="hidden overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10 lg:block">
          <div className="relative p-4 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex min-w-0 flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="group relative shrink-0 rounded-2xl transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-200/70"
                    onClick={() => setIsNavigationOpen(true)}
                    aria-label="Menü öffnen"
                    title="Menü öffnen"
                  >
                    <GradeGlowLogo size="md" tone="light" appIconId={profile.activeAppIconId} />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[0.68rem] font-black leading-none text-slate-950 shadow-md ring-1 ring-white/50 transition group-hover:scale-105">
                      ☰
                    </span>
                  </button>

                  <div
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getSyncStyle()}`}
                  >
                    {syncMessage}
                  </div>

                  <div className="hidden rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15 sm:block">
                    {dataModel === "firestore-module-docs"
                      ? "Modul-Dokumente"
                      : "Lokales Array"}
                  </div>

                  {!isLoaded && (
                    <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 ring-1 ring-white/10">
                      Lädt…
                    </div>
                  )}
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">
                  GradeGlow · {activeNavItem.label}
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {activeNavItem.label}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  {activeNavItem.description}. Wechsel über die Quick-Rail oder
                  über das Logo-Menü links oben in die anderen Bereiche.
                </p>
              </div>

              <div className={`hidden w-full min-w-0 flex-col gap-3 rounded-3xl p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-80 lg:flex lg:w-auto ${profileBannerClassName === "bg-slate-950" ? "bg-white/10" : profileBannerClassName}`}>
                <div className="flex items-center gap-3">
                  {renderAvatar("flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/10")}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{userLabel}</p>
                    <p className="truncate text-xs text-slate-300">
                      {degreeProgramLabel}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {user.email ?? "Lokaler Account"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Schnitt</p>
                    <p className="text-2xl font-black">
                      {analytics.average > 0
                        ? formatGrade(analytics.average)
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Fortschritt</p>
                    <p className="text-2xl font-black">
                      {Math.min(analytics.progress, 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/settings"
                    className="rounded-2xl bg-white/10 px-3 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Profil
                  </Link>
                  <button
                    type="button"
                    className="rounded-2xl bg-white px-3 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>


      {showWelcomeBanner && page === "overview" && (
        <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-violet-950/20 ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Setup abgeschlossen</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Willkommen bei GradeGlow.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                Dein Profil und deine Feature-Auswahl sind gespeichert. Lege jetzt Module oder Prüfungen an und teste danach Export, Study Circle und Löschung einmal mit einem Testaccount.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
              onClick={() => setShowWelcomeBanner(false)}
            >
              Verstanden
            </button>
          </div>
        </section>
      )}

        {globalTimer && page !== "exams" && (
          <section className="rounded-3xl bg-slate-950 p-4 text-white shadow-xl shadow-violet-950/10 ring-1 ring-white/10 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">Lernsession läuft weiter</p>
                <h2 className="mt-1 text-lg font-black">{globalTimer.title || globalTimerExam?.title || "Lernsession"}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-300">
                  {globalTimerModeLabel} · {formatCompactDuration(globalTimerElapsedSeconds)} aktiv{globalTimerExam ? ` · ${globalTimerExam.title}` : ""}
                </p>
              </div>
              <Link href="/timer" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">
                Timer öffnen
              </Link>
            </div>
          </section>
        )}

        <nav
          ref={quickRailRef}
          onScroll={handleQuickRailScroll}
          className="no-scrollbar sticky top-[calc(env(safe-area-inset-top,0px)+0.5rem)] z-30 hidden w-full max-w-full overflow-x-auto overscroll-x-contain rounded-[1.6rem] border border-white/70 bg-white/75 p-2 shadow-lg shadow-violet-100/60 backdrop-blur-xl lg:block"
          aria-label="GradeGlow Schnellnavigation"
        >
          <div className="flex w-max max-w-none items-center gap-2 pr-3">
            {visibleDashboardNavItems.map((item) => {
              const isActive = item.id === page;

              return (
                <Link
                  key={item.id}
                  ref={isActive ? activeQuickRailItemRef : undefined}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black ring-1 transition hover:-translate-y-0.5 sm:px-4 ${
                    isActive
                      ? "bg-slate-950 text-white ring-slate-900 shadow-md shadow-violet-100"
                      : "bg-white/80 text-slate-600 ring-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:ring-violet-100"
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {entitlement.plan === "admin" && (
              <Link
                href="/admin"
                className="flex shrink-0 items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm font-black text-white ring-1 ring-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:px-4"
              >
                <span className="text-base">⚙</span>
                <span>Admin</span>
              </Link>
            )}
          </div>
        </nav>

        {isDataStillChecking && (
          <section className="rounded-3xl bg-amber-50/90 p-4 text-sm font-bold leading-6 text-amber-900 shadow-sm ring-1 ring-amber-100 backdrop-blur sm:p-5">
            GradeGlow prüft noch Cloud-Daten. Bereits sichtbare lokale Backups bleiben erhalten — bitte erst speichern, wenn der Ladehinweis verschwunden ist.
            <span className="mt-2 block text-xs font-semibold text-amber-700">
              {betaCloudMessages.join(" · ")}
            </span>
          </section>
        )}

        {page === "overview" && (
          <>
            <section className="gg-mobile-home lg:hidden">
              <div className="gg-mobile-hero-card gg-mobile-today-card">
                <div className="min-w-0">
                  <p className="gg-mobile-kicker text-white/70">Heute</p>
                  <h2 className="mt-1 truncate text-[1.02rem] font-black text-white">{globalTimer ? "Timer läuft" : nextMobileExam ? nextMobileExam.title : "Lernplan starten"}</h2>
                  <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-white/65">
                    {globalTimer
                      ? `${globalTimerModeLabel} · ${formatCompactDuration(globalTimerElapsedSeconds)} · ${globalTimerExam?.moduleName || globalTimer.title}`
                      : nextMobileExam
                        ? `${nextMobileExam.examDate}${nextMobileExam.moduleName ? ` · ${nextMobileExam.moduleName}` : ""}`
                        : "Lege eine Prüfung an und GradeGlow baut dir den Plan."}
                  </p>
                </div>
                <Link href={globalTimer ? "/timer" : "/exams"} className="shrink-0 rounded-full bg-white px-3 py-2 text-[0.68rem] font-black text-slate-950">{globalTimer ? "Timer" : "Öffnen"}</Link>
              </div>

              <div className="gg-mobile-action-grid">
                <Link href="/timer"><span>▶</span><strong>Timer</strong><small>Fokus starten</small></Link>
                <Link href="/exams"><span>▦</span><strong>Plan</strong><small>{openStudySessionsCount} offen</small></Link>
                <Link href="/friends"><span>●</span><strong>Circle</strong><small>Freunde</small></Link>
                <Link href="/settings"><span>◌</span><strong>Profil</strong><small>Mehr</small></Link>
              </div>

              <div className="gg-mobile-stat-list">
                <div className="gg-mobile-stat-row"><span>Schnitt</span><strong>{analytics.average > 0 ? formatGrade(analytics.average) : "—"}</strong></div>
                <div className="gg-mobile-stat-row"><span>ECTS</span><strong>{analytics.passedEcts}/{totalTargetEcts}</strong></div>
                <div className="gg-mobile-stat-row"><span>Offene Sessions</span><strong>{openStudySessionsCount}</strong></div>
                <div className="gg-mobile-stat-row"><span>Erledigt</span><strong>{doneStudySessionsCount}</strong></div>
              </div>

              <div className="gg-mobile-progress-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-950">Studienfortschritt</p>
                  <p className="text-[0.72rem] font-black text-violet-700">{analytics.progress.toFixed(0)}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                  <div className="h-full rounded-full gg-overview-progress" style={{ width: `${Math.min(analytics.progress, 100)}%` }} />
                </div>
              </div>
            </section>

            <div className="hidden lg:block">
              <BetaLaunchPanel
                user={user}
                moduleCount={modules.length}
                examCount={exams.length}
                studyCircleReady={profile.studySharingEnabled}
                profileReady={isProfileLoaded}
                profileComplete={profileComplete}
                cloudMessages={betaCloudMessages}
              />
            </div>

            <details className="gg-mobile-collapsible gg-mobile-secondary-panel lg:hidden">
              <summary>
                <span><span className="gg-mobile-kicker">Beta</span>Ready-Check</span>
                <strong>{profileComplete ? "OK" : "Offen"}</strong>
              </summary>
              <div className="gg-mobile-collapsible-body">
                <BetaLaunchPanel
                  user={user}
                  moduleCount={modules.length}
                  examCount={exams.length}
                  studyCircleReady={profile.studySharingEnabled}
                  profileReady={isProfileLoaded}
                  profileComplete={profileComplete}
                  cloudMessages={betaCloudMessages}
                />
              </div>
            </details>

            <section
              id="overview"
              className="hidden scroll-mt-6 gap-4 md:grid md:grid-cols-2 xl:grid-cols-4"
            >
              <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Bestandene ECTS
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-tight">
                      {analytics.passedEcts}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-xl ring-1 ring-emerald-100">
                    ✓
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  von {totalTargetEcts} ECTS
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Benotete ECTS
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-tight">
                      {analytics.gradedEcts}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-violet-50 px-3 py-2 text-xl ring-1 ring-violet-100">
                    ★
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  zählen in den Schnitt
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Offene ECTS
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-tight">
                      {analytics.openEcts}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-amber-50 px-3 py-2 text-xl ring-1 ring-amber-100">
                    …
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  noch in Bearbeitung
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      Nicht bestanden
                    </p>
                    <p className="mt-2 text-4xl font-black tracking-tight">
                      {analytics.failedEcts}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-rose-50 px-3 py-2 text-xl ring-1 ring-rose-100">
                    !
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">ECTS betroffen</p>
              </div>
            </section>

            <div className="hidden lg:block">
              <PlanUsagePanel
                plan={entitlement.plan}
                limits={limits}
                modulesCount={modules.length}
                examsCount={exams.length}
              />
            </div>

            <details className="gg-mobile-collapsible lg:hidden">
              <summary><span><span className="gg-mobile-kicker">Limits</span>Free Nutzung</span><strong>›</strong></summary>
              <div className="gg-mobile-collapsible-body">
                <PlanUsagePanel
                  plan={entitlement.plan}
                  limits={limits}
                  modulesCount={modules.length}
                  examsCount={exams.length}
                />
              </div>
            </details>

            <div className="hidden lg:block"><BetaNoticeCard compact /></div>

            <section className="hidden rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6 lg:block">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold text-violet-700">
                    Studienfortschritt
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">
                    {analytics.passedEcts} / {totalTargetEcts} ECTS
                  </h2>
                </div>
                <p className="text-sm font-semibold text-slate-500">
                  {analytics.progress.toFixed(1)}% geschafft
                </p>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                <div
                  className="h-full rounded-full gg-overview-progress transition-all duration-500"
                  style={{ width: `${Math.min(analytics.progress, 100)}%` }}
                />
              </div>
            </section>

            {enabledFeatureIds.has("rewards") && (
              <details className="gg-mobile-collapsible lg:hidden">
                <summary><span><span className="gg-mobile-kicker">Glow</span>Belohnungen</span><strong>›</strong></summary>
                <div className="gg-mobile-collapsible-body">
                  <GlowRewardsPanel profile={profile} exams={exams} saveProfile={saveProfile} limits={limits} planLabel={planLabels[entitlement.plan]} />
                </div>
              </details>
            )}
            {enabledFeatureIds.has("rewards") && (
              <div className="hidden lg:block"><GlowRewardsPanel profile={profile} exams={exams} saveProfile={saveProfile} limits={limits} planLabel={planLabels[entitlement.plan]} /></div>
            )}

            <details className="gg-mobile-collapsible lg:hidden">
              <summary><span><span className="gg-mobile-kicker">PWA</span>Installieren & Update</span><strong>›</strong></summary>
              <div className="gg-mobile-collapsible-body"><PwaInstallCard /></div>
            </details>
            <div className="hidden lg:block"><PwaInstallCard /></div>
          </>
        )}

        {page === "insights" && (
          <section
            id="insights"
            className="scroll-mt-6 overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur"
          >
            <button
              type="button"
              className="flex w-full flex-col items-start justify-between gap-4 p-5 text-left sm:flex-row sm:items-center sm:p-6"
              onClick={() => setIsInsightsOpen((open) => !open)}
            >
              <div>
                <p className="text-sm font-bold text-violet-700">Insights</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Diagramme & Glow Check
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Einklappbar, damit das Dashboard nicht so lang wirkt.
                </p>
              </div>
              <span className="rounded-2xl bg-violet-50 px-4 py-2 text-2xl font-black text-violet-700 ring-1 ring-violet-100">
                {isInsightsVisible ? "−" : "+"}
              </span>
            </button>
            {isInsightsVisible && (
              <div className="border-t border-slate-100 p-5 sm:p-6">
                <GradeGlowInsights
                  modules={modules}
                  exams={exams}
                  totalTargetEcts={totalTargetEcts}
                />
              </div>
            )}
          </section>
        )}

        {page === "friends" && (
          <section id="friends" className="scroll-mt-6">
            <StudyFriendsPanel
              user={user}
              profile={profile}
              exams={exams}
              saveProfile={saveProfile}
              isProfileLoaded={isProfileLoaded}
            />
          </section>
        )}

        {page === "exams" && (
          <section id="exams" className="scroll-mt-6">
            <GradeGlowPlanner
              modules={modules}
              exams={exams}
              setExams={setExams}
              isLoaded={areExamsLoaded}
              syncMessage={examsSyncMessage}
              limits={limits}
              planLabel={planLabels[entitlement.plan]}
              user={user}
              profile={profile}
              saveProfile={saveProfile}
              isProfileLoaded={isProfileLoaded}
            />
          </section>
        )}

        {page === "timer" && (
          <section id="timer" className="gg-timer-only-page scroll-mt-6">
            <div className="gg-timer-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="gg-mobile-kicker">Fokus</p>
                  <h2>Timer</h2>
                  <p className="gg-timer-subtitle">Nur Dauer, Fach und Start. Planung bleibt im Plan-Tab.</p>
                </div>
                {globalTimer && <span className="gg-timer-live-pill">läuft</span>}
              </div>

              <div className="gg-timer-display">
                <span>{globalTimer ? formatCompactDuration(standaloneTimerDisplaySeconds) : `${standaloneTimerGoalMinutes}:00`}</span>
                <small>{globalTimer ? `${globalTimerModeLabel} · ${globalTimer.title}` : "bereit"}</small>
              </div>

              {!globalTimer && (
                <div className="gg-timer-form">
                  <label>
                    <span>Fach / Prüfung</span>
                    <select value={standaloneTimerExam?.id ?? ""} onChange={(event) => setStandaloneTimerExamId(event.target.value)} disabled={!exams.length}>
                      {exams.length === 0 && <option>Erst Prüfung im Plan anlegen</option>}
                      {exams.map((exam) => (
                        <option key={exam.id} value={exam.id}>{exam.moduleName || exam.title}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Modus</span>
                    <select value={standaloneTimerMode} onChange={(event) => setStandaloneTimerMode(event.target.value as StoredActiveStudyTimer["mode"])}>
                      <option value="focus">Fokus-Timer</option>
                      <option value="pomodoro">Pomodoro · 25 min</option>
                      <option value="stopwatch">Stoppuhr</option>
                    </select>
                  </label>
                  {standaloneTimerMode === "focus" && (
                    <div>
                      <span className="gg-timer-label">Dauer</span>
                      <div className="gg-timer-presets">
                        {[15, 25, 30, 45, 60, 90].map((minutes) => (
                          <button key={minutes} type="button" className={standaloneTimerGoalMinutes === minutes ? "is-active" : ""} onClick={() => setStandaloneTimerMinutes(String(minutes))}>{minutes}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="gg-timer-actions">
                {globalTimer ? (
                  <>
                    <button type="button" className="gg-timer-primary" onClick={saveStandaloneTimer}>Speichern</button>
                    <button type="button" className="gg-timer-secondary" onClick={discardStandaloneTimer}>Verwerfen</button>
                  </>
                ) : (
                  <button type="button" className="gg-timer-primary" onClick={startStandaloneTimer} disabled={!standaloneTimerExam}>Timer starten</button>
                )}
              </div>
            </div>

            <div className="gg-timer-hint">
              Gespeicherte Timer landen automatisch als erledigte Lernzeit im passenden Fach. Lernblöcke verschieben und abhaken machst du weiter unter Plan.
            </div>
          </section>
        )}

        {page === "schedule" && (
          <section id="schedule" className="scroll-mt-6">
            <UniSchedulePanel
              modules={modules}
              scheduleItems={scheduleItems}
              setScheduleItems={setScheduleItems}
              isLoaded={isScheduleLoaded}
              syncMessage={scheduleSyncMessage}
              profile={profile}
              saveProfile={saveProfile}
              isProfileLoaded={isProfileLoaded}
            />
          </section>
        )}

        {page === "planning" && (
          <div id="study-planning" className="scroll-mt-6">
            <StudyPlanningPanel modules={modules} setModules={setModules} />
          </div>
        )}

        {page === "modules" && (
          <>
            <section
              id="modules"
              className="scroll-mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]"
            >
              <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur">
                <button
                  type="button"
                  className="flex w-full flex-col items-start justify-between gap-4 p-5 text-left sm:flex-row sm:items-center sm:p-6"
                  onClick={() => setIsAddModuleOpen((open) => !open)}
                >
                  <div>
                    <p className="text-sm font-bold text-violet-700">
                      Schnellerfassung
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">
                      Modul hinzufügen
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Pflicht: Name, ECTS und Semester. Note darf leer bleiben.
                    </p>
                    <p className="mt-2 text-xs font-black text-slate-400">
                      Plan: {planLabels[entitlement.plan]} · Modullimit: {formatLimit(limits.maxModules)}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-violet-50 px-4 py-2 text-2xl font-black text-violet-700 ring-1 ring-violet-100">
                    {isAddModuleOpen ? "−" : "+"}
                  </span>
                </button>

                {isAddModuleOpen && (
                  <form
                    className="border-t border-slate-100 p-5 sm:p-6"
                    onSubmit={handleAddModule}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block md:col-span-2">
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          Modulname
                        </span>
                        <input
                          className="field-input"
                          placeholder="z. B. Statistik"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          Semester
                        </span>
                        <input
                          className="field-input"
                          placeholder="z. B. 1"
                          inputMode="decimal"
                          value={semester}
                          onChange={(event) => setSemester(event.target.value)}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          ECTS
                        </span>
                        <input
                          className="field-input"
                          placeholder="z. B. 6"
                          inputMode="decimal"
                          value={ects}
                          onChange={(event) => setEcts(event.target.value)}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          Gesamtnote
                        </span>
                        <input
                          className="field-input"
                          placeholder="optional, z. B. 2,3"
                          inputMode="decimal"
                          value={grade}
                          onChange={(event) => setGrade(event.target.value)}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                          Status
                        </span>
                        <select
                          className="field-input"
                          value={status}
                          onChange={(event) =>
                            setStatus(event.target.value as ModuleStatus)
                          }
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-500">
                        <p>Note &gt; 4,0 wird automatisch als „nicht bestanden“ gewertet.</p>
                        {(moduleLimitMessage || isModuleLimitReached) && (
                          <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-800 ring-1 ring-amber-100">
                            {moduleLimitMessage || `Free-Limit erreicht: Upgrade/Premium ist vorbereitet. Aktuell sind maximal ${formatLimit(limits.maxModules, "Module")} möglich.`}
                          </p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:opacity-50"
                        disabled={!name.trim() || !ects || !semester || isModuleLimitReached}
                      >
                        Modul speichern
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-violet-700">Planung</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">
                      Zielnotenrechner
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Was du ab jetzt im Schnitt brauchst.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">
                      Ziel-Schnitt
                    </span>
                    <input
                      className="field-input"
                      placeholder="z. B. 1,8"
                      inputMode="decimal"
                      value={targetAverage}
                      onChange={(event) => setTargetAverage(event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">
                      Noch benotete ECTS
                    </span>
                    <input
                      className="field-input"
                      placeholder="optional"
                      inputMode="decimal"
                      value={targetRemainingEcts}
                      onChange={(event) =>
                        setTargetRemainingEcts(event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
                  <p className="text-sm text-slate-300">
                    Benötigter Restschnitt
                  </p>
                  <p className="mt-2 text-5xl font-black tracking-tight">
                    {remainingGradedEcts > 0 && target > 0
                      ? formatGrade(requiredAverage)
                      : "—"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Berechnet mit {analytics.gradedEcts} benoteten ECTS und{" "}
                    {remainingGradedEcts} offenen benoteten ECTS
                    {targetRemainingEcts
                      ? " (manuell gesetzt)."
                      : " aus deinen offenen/nicht bestandenen Modulen."}
                  </p>

                  {remainingGradedEcts > 0 && target > 0 && (
                    <div
                      className={`mt-4 rounded-2xl p-3 text-sm font-bold ${targetOutlook.className}`}
                    >
                      <span className="block text-xs uppercase tracking-[0.18em] text-white/60">
                        Einschätzung
                      </span>
                      <span className="mt-1 block text-base">
                        {targetOutlook.label}
                      </span>
                      <span className="mt-1 block font-semibold opacity-90">
                        {targetOutlook.text}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 grid gap-2 text-xs font-bold text-slate-300 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                      Aktueller Schnitt:{" "}
                      {analytics.average > 0
                        ? formatGrade(analytics.average)
                        : "—"}
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                      Benotete ECTS: {analytics.gradedEcts}
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                      Offene benotete ECTS: {remainingGradedEcts}
                    </div>
                  </div>

                  {targetIsAlreadyReached && (
                    <div className="mt-4 rounded-2xl bg-emerald-400/15 p-3 text-sm font-bold text-emerald-100 ring-1 ring-emerald-300/20">
                      Ziel bereits erreicht.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur">
              <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold text-violet-700">Module</p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight">
                    Semesterübersicht
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {modules.length} Modul(e) insgesamt ·{" "}
                    {visibleModules.length} sichtbar
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[34rem]">
                  <input
                    className="field-input"
                    placeholder="Modul suchen oder Semester eingeben…"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`filter-pill ${statusFilter === "all" ? "filter-pill-active" : ""}`}
                      onClick={() => setStatusFilter("all")}
                    >
                      Alle · {modules.length}
                    </button>
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`filter-pill ${statusFilter === option.value ? "filter-pill-active" : ""}`}
                        onClick={() => setStatusFilter(option.value)}
                      >
                        {option.shortLabel} · {statusCounts[option.value]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {modules.length === 0 && (
                <div className="border-t border-slate-100 p-6">
                  <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/70 p-8 text-center">
                    <p className="text-4xl">✨</p>
                    <h3 className="mt-3 text-2xl font-black">
                      Noch keine Module eingetragen
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Starte oben mit deinem ersten Modul. Danach erscheinen
                      hier automatisch Semestergruppen, Schnitte und
                      Einzelleistungen.
                    </p>
                    <button
                      type="button"
                      className="mt-5 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
                      onClick={() => setIsAddModuleOpen(true)}
                    >
                      Erstes Modul anlegen
                    </button>
                  </div>
                </div>
              )}

              {modules.length > 0 && visibleModules.length === 0 && (
                <div className="border-t border-slate-100 p-6">
                  <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500 ring-1 ring-slate-200">
                    Keine Module für diese Suche oder diesen Filter gefunden.
                  </div>
                </div>
              )}

              {visibleModules.length > 0 && (
                <div className="flex flex-col gap-6 border-t border-slate-100 p-5 sm:p-6">
                  {semesterNumbers.map((semesterNumber) => {
                    const semesterModules = semesterGroups[semesterNumber];
                    const semesterPassedEcts =
                      getSemesterPassedEcts(semesterModules);
                    const semesterAverage = getSemesterAverage(semesterModules);

                    return (
                      <div
                        key={semesterNumber}
                        className="rounded-3xl bg-slate-50/80 p-4 ring-1 ring-slate-200"
                      >
                        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <h3 className="text-2xl font-black tracking-tight">
                              {semesterNumber}. Semester
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {semesterModules.length} Modul(e) ·{" "}
                              {semesterPassedEcts} bestandene ECTS
                              {semesterAverage > 0 &&
                                ` · Schnitt ${formatGrade(semesterAverage)}`}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                            {semesterAverage > 0
                              ? `Ø ${formatGrade(semesterAverage)}`
                              : "Noch kein Schnitt"}
                          </div>
                        </div>

                        <div className="grid gap-4">
                          {semesterModules.map((module) => {
                            const finalGrade = getFinalGrade(module);
                            const effectiveStatus = getEffectiveStatus(module);
                            const totalAssessmentWeight =
                              getTotalAssessmentWeight(module);
                            const isEditing = editingModules[module.id];
                            const weightProgress = Math.min(
                              totalAssessmentWeight,
                              100,
                            );

                            return (
                              <article
                                key={module.id}
                                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
                              >
                                {!isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-violet-50/60 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
                                      onClick={() => toggleAssessments(module.id)}
                                      aria-expanded={Boolean(expandedModules[module.id])}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                          <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusStyle(effectiveStatus)}`}>
                                            {getStatusLabel(effectiveStatus)}
                                          </span>
                                          {module.assessments.length > 0 && (
                                            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-100">
                                              {module.assessments.length} Leistung(en)
                                            </span>
                                          )}
                                          {(module.attemptCount ?? 0) > 0 && (
                                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                                              Versuch {module.attemptCount}/{module.maxAttempts ?? 3}
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="truncate text-lg font-black tracking-tight sm:text-xl">{module.name}</h4>
                                      </div>

                                      <div className="grid w-full grid-cols-4 gap-2 text-center lg:w-auto lg:min-w-[24rem]">
                                        <div className="rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-100">
                                          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">Sem.</p>
                                          <p className="mt-0.5 text-sm font-black">S{module.semester}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-100">
                                          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">ECTS</p>
                                          <p className="mt-0.5 text-sm font-black">{formatCompactNumber(module.ects)}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-100">
                                          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">Schnitt</p>
                                          <p className="mt-0.5 text-sm font-black">{finalGrade !== null ? formatGrade(finalGrade) : "—"}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-2 text-lg font-black text-slate-500 ring-1 ring-slate-200">
                                          {expandedModules[module.id] ? "−" : "+"}
                                        </div>
                                      </div>
                                    </button>

                                    {expandedModules[module.id] && (
                                      <div className="border-t border-slate-100 p-4 sm:p-5">
                                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                        <div className="min-w-0 flex-1">
                                          <div className="mb-3 flex flex-wrap items-center gap-2">
                                            <span
                                              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusStyle(effectiveStatus)}`}
                                            >
                                              {getStatusLabel(effectiveStatus)}
                                            </span>
                                            {module.assessments.length > 0 && (
                                              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-100">
                                                {module.assessments.length}{" "}
                                                Einzelleistung(en)
                                              </span>
                                            )}
                                            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                                              geplant S
                                              {module.plannedSemester ??
                                                module.semester}
                                            </span>
                                            {module.targetGrade !== null && (
                                              <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-black text-fuchsia-700 ring-1 ring-fuchsia-100">
                                                Ziel {formatGrade(module.targetGrade)}
                                              </span>
                                            )}
                                            {(module.attemptCount ?? 0) > 0 && (
                                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                                                Versuch {module.attemptCount}/
                                                {module.maxAttempts ?? 3}
                                              </span>
                                            )}
                                          </div>

                                          <h4 className="truncate text-xl font-black tracking-tight sm:text-2xl">
                                            {module.name}
                                          </h4>

                                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                ECTS
                                              </p>
                                              <p className="mt-1 text-xl font-black">
                                                {formatCompactNumber(
                                                  module.ects,
                                                )}
                                              </p>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Modulnote
                                              </p>
                                              <p className="mt-1 text-xl font-black">
                                                {finalGrade !== null
                                                  ? formatGrade(finalGrade)
                                                  : "—"}
                                              </p>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Gewichtung
                                              </p>
                                              <p className="mt-1 text-xl font-black">
                                                {module.assessments.length > 0
                                                  ? `${totalAssessmentWeight}%`
                                                  : "—"}
                                              </p>
                                            </div>
                                          </div>

                                          {module.assessments.length > 0 && (
                                            <div className="mt-4">
                                              <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
                                                <span>Einzelleistungen</span>
                                                <span>
                                                  {totalAssessmentWeight}% /
                                                  100%
                                                </span>
                                              </div>
                                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                  className={`h-full rounded-full ${totalAssessmentWeight > 100 ? "bg-rose-500" : "gg-module-progress"}`}
                                                  style={{
                                                    width: `${weightProgress}%`,
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {module.assessments.length > 0 && (
                                            <div className="mt-4 rounded-2xl bg-violet-50/70 p-3 ring-1 ring-violet-100">
                                              <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-violet-700">
                                                Eingetragene Leistungen
                                              </p>
                                              <div className="grid gap-2">
                                                {module.assessments
                                                  .slice(0, 3)
                                                  .map((assessment) => (
                                                    <div
                                                      key={assessment.id}
                                                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-violet-100"
                                                    >
                                                      <span className="font-black text-slate-800">
                                                        {assessment.name}
                                                      </span>
                                                      <span className="font-bold text-slate-500">
                                                        {assessment.weight}% ·
                                                        Note{" "}
                                                        {formatGrade(
                                                          assessment.grade,
                                                        )}
                                                      </span>
                                                    </div>
                                                  ))}
                                              </div>
                                              {module.assessments.length >
                                                3 && (
                                                <p className="mt-2 text-xs font-bold text-violet-700">
                                                  +{" "}
                                                  {module.assessments.length -
                                                    3}{" "}
                                                  weitere Leistung(en) im
                                                  Aufklappbereich
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap lg:justify-end">
                                          <button
                                            type="button"
                                            className="soft-button w-full sm:w-auto"
                                            onClick={() =>
                                              setSelectedModuleId(module.id)
                                            }
                                          >
                                            Details
                                          </button>

                                          <button
                                            type="button"
                                            className="soft-button w-full sm:w-auto"
                                            onClick={() =>
                                              startEditingModule(module)
                                            }
                                          >
                                            Bearbeiten
                                          </button>

                                          <button
                                            type="button"
                                            className="w-full rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-100 sm:w-auto"
                                            onClick={() =>
                                              deleteModule(module.id)
                                            }
                                          >
                                            Löschen
                                          </button>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        className="mt-5 flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-100 transition hover:bg-violet-50 hover:ring-violet-100"
                                        onClick={() =>
                                          toggleAssessments(module.id)
                                        }
                                      >
                                        <div>
                                          <p className="font-black">
                                            Einzelleistungen
                                          </p>
                                          <p className="mt-0.5 text-sm text-slate-500">
                                            {module.assessments.length === 0
                                              ? "Aufklappen, um Klausur, Präsentation oder Projekt einzutragen."
                                              : `${module.assessments.length} Leistung(en) · ${totalAssessmentWeight}% eingetragen`}
                                          </p>
                                        </div>

                                        <span className="rounded-xl bg-white px-3 py-1 text-lg font-black text-slate-500 ring-1 ring-slate-200">
                                          {expandedModules[module.id]
                                            ? "−"
                                            : "+"}
                                        </span>
                                      </button>
                                      </div>
                                    )}

                                    {expandedModules[module.id] && (
                                      <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                                        {module.assessments.length === 0 && (
                                          <p className="mb-4 rounded-2xl bg-white p-3 text-sm text-slate-500 ring-1 ring-slate-200">
                                            Noch keine Einzelleistungen
                                            eingetragen.
                                          </p>
                                        )}

                                        <div className="mb-4 grid gap-2">
                                          {module.assessments.map(
                                            (assessment) => (
                                              <div
                                                key={assessment.id}
                                                className="flex flex-col justify-between gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-200 sm:flex-row sm:items-center"
                                              >
                                                <div>
                                                  <p className="font-black">
                                                    {assessment.name}
                                                  </p>
                                                  <p className="mt-0.5 text-slate-500">
                                                    {assessment.weight}%
                                                    Gewichtung · Note{" "}
                                                    {formatGrade(
                                                      assessment.grade,
                                                    )}
                                                  </p>
                                                </div>

                                                <button
                                                  type="button"
                                                  className="self-start rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100 sm:self-auto"
                                                  onClick={() =>
                                                    deleteAssessment(
                                                      module.id,
                                                      assessment.id,
                                                    )
                                                  }
                                                >
                                                  Entfernen
                                                </button>
                                              </div>
                                            ),
                                          )}
                                        </div>

                                        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                                          <input
                                            className="field-input bg-white"
                                            placeholder="Leistung, z. B. Klausur"
                                            value={
                                              assessmentInputs[module.id]
                                                ?.name ?? ""
                                            }
                                            onChange={(event) =>
                                              updateAssessmentInput(
                                                module.id,
                                                "name",
                                                event.target.value,
                                              )
                                            }
                                          />

                                          <input
                                            className="field-input bg-white"
                                            placeholder="Gewichtung %"
                                            inputMode="decimal"
                                            value={
                                              assessmentInputs[module.id]
                                                ?.weight ?? ""
                                            }
                                            onChange={(event) =>
                                              updateAssessmentInput(
                                                module.id,
                                                "weight",
                                                event.target.value,
                                              )
                                            }
                                          />

                                          <input
                                            className="field-input bg-white"
                                            placeholder="Note"
                                            inputMode="decimal"
                                            value={
                                              assessmentInputs[module.id]
                                                ?.grade ?? ""
                                            }
                                            onChange={(event) =>
                                              updateAssessmentInput(
                                                module.id,
                                                "grade",
                                                event.target.value,
                                              )
                                            }
                                          />

                                          <button
                                            type="button"
                                            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                                            onClick={() =>
                                              addAssessment(module.id)
                                            }
                                          >
                                            Hinzufügen
                                          </button>
                                        </div>

                                        {totalAssessmentWeight > 100 && (
                                          <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
                                            Achtung: Die Gewichtung liegt über
                                            100%.
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="bg-slate-50/80 p-4 sm:p-5">
                                    <div className="mb-5 flex items-center justify-between gap-4">
                                      <div>
                                        <p className="text-sm font-bold text-violet-700">
                                          Bearbeitung
                                        </p>
                                        <h4 className="text-2xl font-black tracking-tight">
                                          Modul bearbeiten
                                        </h4>
                                      </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                      <label className="block md:col-span-2">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          Modulname
                                        </span>
                                        <input
                                          className="field-input bg-white"
                                          placeholder="Modulname"
                                          value={
                                            editInputs[module.id]?.name ?? ""
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "name",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          StuPo-Semester
                                        </span>
                                        <input
                                          className="field-input bg-white"
                                          placeholder="Semester"
                                          inputMode="decimal"
                                          value={
                                            editInputs[module.id]?.semester ??
                                            ""
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "semester",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          Geplantes Semester
                                        </span>
                                        <input
                                          className="field-input bg-white"
                                          placeholder="Semester"
                                          inputMode="decimal"
                                          value={
                                            editInputs[module.id]
                                              ?.plannedSemester ?? ""
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "plannedSemester",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          ECTS
                                        </span>
                                        <input
                                          className="field-input bg-white"
                                          placeholder="ECTS"
                                          inputMode="decimal"
                                          value={
                                            editInputs[module.id]?.ects ?? ""
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "ects",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          Gesamtnote
                                        </span>
                                        <input
                                          className="field-input bg-white"
                                          placeholder="optional"
                                          inputMode="decimal"
                                          value={
                                            editInputs[module.id]?.grade ?? ""
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "grade",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          Status
                                        </span>
                                        <select
                                          className="field-input bg-white"
                                          value={
                                            editInputs[module.id]?.status ??
                                            "passed"
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "status",
                                              event.target
                                                .value as ModuleStatus,
                                            )
                                          }
                                        >
                                          {statusOptions.map((option) => (
                                            <option
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </label>

                                      <label className="block">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          Fehlversuche
                                        </span>
                                        <input
                                          className="field-input bg-white"
                                          placeholder="0"
                                          inputMode="numeric"
                                          value={
                                            editInputs[module.id]
                                              ?.attemptCount ?? "0"
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "attemptCount",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="mb-1.5 block text-sm font-bold text-slate-700">
                                          Max. Versuche
                                        </span>
                                        <input
                                          className="field-input bg-white"
                                          placeholder="3"
                                          inputMode="numeric"
                                          value={
                                            editInputs[module.id]
                                              ?.maxAttempts ?? "3"
                                          }
                                          onChange={(event) =>
                                            updateEditInput(
                                              module.id,
                                              "maxAttempts",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                      <button
                                        type="button"
                                        className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                                        onClick={() =>
                                          cancelEditingModule(module.id)
                                        }
                                      >
                                        Abbrechen
                                      </button>

                                      <button
                                        type="button"
                                        className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-800"
                                        onClick={() =>
                                          saveEditedModule(module.id)
                                        }
                                      >
                                        Speichern
                                      </button>
                                    </div>

                                    {module.assessments.length > 0 && (
                                      <p className="mt-4 rounded-2xl bg-white p-3 text-sm text-slate-500 ring-1 ring-slate-200">
                                        Hinweis: Wenn Einzelleistungen
                                        eingetragen sind, wird die sichtbare
                                        Modulnote aus diesen Leistungen
                                        berechnet.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {page === "feedback" && (
          <section id="feedback" className="scroll-mt-6 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Feedback</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Bug melden oder Feature wünschen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Feedback wird auf einer eigenen Seite gesammelt, damit Beta-Meldungen sauber in Firebase landen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/feedback" className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-800">
                Feedback-Seite öffnen
              </Link>
              {entitlement.plan === "admin" && (
                <Link href="/admin" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800">
                  Admin-Beta-Verwaltung
                </Link>
              )}
            </div>
          </section>
        )}

        {page === "diagnostics" && (
          <section id="diagnostics" className="scroll-mt-6 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Beta Diagnostics</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Status prüfen und Bug melden</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Diagnose läuft auf einer eigenen Seite, damit Browserdaten, Button-Audit und Fehlerberichte sauber gespeichert werden.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/diagnostics" className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-800">
                Diagnose-Seite öffnen
              </Link>
              <Link href="/feedback" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50">
                Klassisches Feedback
              </Link>
            </div>
          </section>
        )}

        {page === "backup" && (
          <section
            id="backup"
            className="scroll-mt-6 overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur"
          >
            <button
              type="button"
              className="flex w-full flex-col items-start justify-between gap-4 p-5 text-left sm:flex-row sm:items-center sm:p-6"
              onClick={() => setIsToolsOpen((open) => !open)}
            >
              <div>
                <p className="text-sm font-bold text-violet-700">
                  Backup & Export
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Daten sichern & übertragen
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  JSON Backup, Import oder CSV für Excel.
                </p>
              </div>
              <span className="rounded-2xl bg-violet-50 px-4 py-2 text-2xl font-black text-violet-700 ring-1 ring-violet-100">
                {isBackupVisible ? "−" : "+"}
              </span>
            </button>

            {isBackupVisible && (
              <div className="border-t border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    onClick={exportJsonBackup}
                  >
                    Backup exportieren
                  </button>

                  <button
                    type="button"
                    className="soft-button"
                    onClick={triggerImport}
                  >
                    Backup importieren
                  </button>

                  <button
                    type="button"
                    className="soft-button"
                    onClick={exportCsv}
                  >
                    CSV exportieren
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={importJsonBackup}
                  />
                </div>

                {importMessage && (
                  <div className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700 ring-1 ring-violet-100">
                    {importMessage}
                  </div>
                )}

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Achtung: Beim Import wird deine aktuelle Modul-Liste durch die
                  importierte Backup-Datei ersetzt.
                </p>
              </div>
            )}
          </section>
        )}

        {selectedModule && (
          <ModuleDetailModal
            module={selectedModule}
            exams={exams}
            examsLoaded={areExamsLoaded}
            onClose={() => setSelectedModuleId(null)}
            onDelete={() => deleteModule(selectedModule.id)}
            onStartEdit={() => {
              startEditingModule(selectedModule);
              setSelectedModuleId(null);
            }}
            onUpdateModule={updateModuleDetails}
          />
        )}

        <footer className="hidden flex-col items-center justify-between gap-3 pb-2 text-xs font-bold text-slate-400 sm:flex-row lg:flex">
          <span>GradeGlow Prototype</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/feedback" className="transition hover:text-violet-700">Feedback</Link>
            {isBetaDiagnosticsUser && <Link href="/diagnostics" className="transition hover:text-violet-700">Diagnose</Link>}
            <Link href="/settings" className="transition hover:text-violet-700">Profil & Backup</Link>
            <Link href="/legal" className="transition hover:text-violet-700">Legal Hub</Link>
            {entitlement.plan === "admin" && <Link href="/admin" className="transition hover:text-violet-700">Admin</Link>}
          </div>
        </footer>
      </div>

      <nav className="gg-mobile-tabbar lg:hidden" aria-label="GradeGlow App Navigation">
        {mobileTabItems.map((item) => {
          const isActive = item.match.includes(page);
          return (
            <Link key={`${item.href}-${item.label}`} href={item.href} className={isActive ? "is-active" : ""}>
              <span className="gg-mobile-tab-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
