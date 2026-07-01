export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: "local" | "firebase";
};

export type StartMode = "manual" | "stupo" | "template" | "demo";

export type ThemeMode = "system" | "light" | "dark";

export type AccentColor = "violet" | "pink" | "blue" | "emerald" | "amber" | "cyan" | "rose";

export type PageThemeId =
  | "default"
  | "theme-night-library"
  | "theme-study-sunrise"
  | "theme-lavender-haze"
  | "theme-matcha-focus"
  | "theme-ocean-mist"
  | "theme-mocha-latte";

export type AppIconId =
  | "default"
  | "app-icon-lavender"
  | "app-icon-matcha"
  | "app-icon-ocean"
  | "app-icon-mocha"
  | "app-icon-rose";

export type GradeGlowFeatureId =
  | "insights"
  | "friends"
  | "schedule"
  | "planning"
  | "rewards";

export type UserPlan = "free" | "premium" | "lifetime" | "admin";

export type GradeGlowEntitlement = {
  plan: UserPlan;
  storedPlan: UserPlan;
  premiumUntil: string;
  premiumSource: string;
  note: string;
  updatedAtIso: string;
  isManuallyGranted: boolean;
};

export type PlanLimits = {
  maxFriends: number;
  maxModules: number;
  maxExams: number;
  advancedStats: boolean;
  premiumThemes: boolean;
  exportBackup: boolean;
  adsFree: boolean;
};

export type GradeGlowProfile = {
  displayName: string;
  university: string;
  degreeProgram: string;
  degreeType: string;
  currentSemester: number;
  targetEcts: number;
  studyWeekDays: number;
  preferredStartMode: StartMode;
  onboardingCompleted: boolean;
  avatarDataUrl: string;
  studySharingEnabled: boolean;
  shareStudyTime: boolean;
  shareStudySubjects: boolean;
  shareStudyStreak: boolean;
  glowPoints: number;
  dailyLoginStreak: number;
  dailyLoginLastClaimDateKey: string;
  studyReminderNotificationsEnabled: boolean;
  friendActivityNotificationsEnabled: boolean;
  studyReminderTime: string;
  lastStudyDateKey: string;
  lastStudyCompletedAtIso: string;
  currentStudyStreakDays: number;
  maxStudyStreakDays: number;
  purchasedCosmeticIds: string[];
  rewardedStudySessionIds: string[];
  totalStudySessionRewards: number;
  activeAvatarFrameId: string;
  activeProfileBannerId: string;
  activeAppIconId: AppIconId;
  activePageThemeId: PageThemeId;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  enabledFeatureIds: GradeGlowFeatureId[];
};

export type ModuleStatus = "passed" | "ungraded" | "open" | "failed";

export type ModuleCategory = "mandatory" | "electiveMandatory" | "elective" | "unknown";

export type StatusFilter = "all" | ModuleStatus;

export type Assessment = {
  id: string;
  name: string;
  weight: number;
  grade: number;
};

export type UniModule = {
  id: string;
  name: string;
  ects: number;
  grade: number | null;
  semester: number;
  status: ModuleStatus;
  assessments: Assessment[];
  category: ModuleCategory;
  plannedSemester: number;
  attemptCount: number;
  maxAttempts: number;
  isLocked: boolean;
  stupoMatched: boolean;
  stupoSource: string;
  notes: string;
  targetGrade: number | null;
};

export type ExamKind = "exam" | "presentation" | "paper" | "project" | "oral" | "other";

export type ExamStatus = "planned" | "learning" | "done";

export type ExamPriority = "low" | "normal" | "high";

export type StudySessionItem = {
  id: string;
  examId: string;
  title: string;
  dateKey: string;
  time: string;
  durationMinutes: number;
  focus: string;
  notes: string;
  isDone: boolean;
  isHidden: boolean;
  isManual: boolean;
  startedAtIso?: string;
  completedAtIso?: string;
};

export type ExamPlanItem = {
  id: string;
  title: string;
  moduleId: string | null;
  moduleName: string;
  examDate: string;
  examTime: string;
  kind: ExamKind;
  status: ExamStatus;
  priority: ExamPriority;
  notes: string;
  studyStartDays: number;
  targetStudyMinutes: number;
  dailyStudyLimitMinutes: number;
  sessionGoalMinutes: number;
  isHidden: boolean;
  studySessions: StudySessionItem[];
};


export type UniScheduleItem = {
  id: string;
  title: string;
  moduleId: string | null;
  moduleName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  color: string;
  isHidden: boolean;
};

export type BackupFile = {
  app: string;
  version: number;
  exportedAt: string;
  modules: UniModule[];
};

export type SyncStatus =
  | "local"
  | "cloud-loading"
  | "cloud-ready"
  | "cloud-saving"
  | "cloud-saved"
  | "cloud-error";


export type StudySubjectStat = {
  subjectId: string;
  subjectName: string;
  moduleId: string | null;
  plannedMinutes: number;
  doneMinutes: number;
  sessionCount: number;
  lastStudiedAt: string;
};

export type PublicStudyProfile = {
  uid: string;
  friendCode: string;
  displayName: string;
  degreeProgram: string;
  avatarDataUrl: string;
  totalDoneMinutes: number;
  thisWeekDoneMinutes: number;
  topSubjects: StudySubjectStat[];
  thisWeekTopSubjects: StudySubjectStat[];
  studyStreakDays: number;
  lastStudiedDateKey: string;
  shareStudyTime: boolean;
  shareStudySubjects: boolean;
  shareStudyStreak: boolean;
  updatedAtIso: string;
};


export type StudyActivityStatus = "started" | "completed";

export type PublicStudyActivity = {
  uid: string;
  displayName: string;
  avatarDataUrl: string;
  status: StudyActivityStatus;
  title: string;
  examId: string;
  sessionId: string | null;
  durationMinutes: number;
  startedAtIso: string;
  completedAtIso: string;
  updatedAtIso: string;
};

export type NotificationKind =
  | "friend_activity"
  | "study_reminder"
  | "exam_reminder"
  | "streak_reminder"
  | "system";

export type GradeGlowNotificationSettings = {
  pushNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  friendActivityPushEnabled: boolean;
  studyReminderPushEnabled: boolean;
  examReminderPushEnabled: boolean;
  streakReminderPushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  updatedAtIso: string;
};

export type GradeGlowNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  url: string;
  actorUid: string;
  actorName: string;
  createdAtIso: string;
  readAtIso: string;
  sourceEventId: string;
};

export type FeedbackType = "bug" | "feedback" | "feature_request" | "delete_request" | "beta_note";

export type FeedbackStatus = "open" | "reviewing" | "planned" | "done" | "closed";

export type FeedbackPriority = "low" | "normal" | "high";

export type GradeGlowFeedback = {
  id: string;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  subject: string;
  message: string;
  page: string;
  userAgent: string;
  appVersion: string;
  createdAtIso: string;
  updatedAtIso: string;
  adminNote: string;
};


export type DiagnosticReportKind = "bug_report" | "client_error" | "ui_audit" | "system_check";

export type DiagnosticStatus = "open" | "reviewing" | "fixed" | "ignored" | "closed";

export type DiagnosticPriority = "low" | "normal" | "high" | "critical";

export type UiIssue = {
  id: string;
  severity: "low" | "normal" | "high";
  selector: string;
  label: string;
  message: string;
};

export type DiagnosticReport = {
  id: string;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  kind: DiagnosticReportKind;
  status: DiagnosticStatus;
  priority: DiagnosticPriority;
  title: string;
  message: string;
  page: string;
  route: string;
  userAgent: string;
  appVersion: string;
  browserLanguage: string;
  viewport: string;
  onlineStatus: string;
  notificationPermission: string;
  createdAtIso: string;
  updatedAtIso: string;
  lastSeenAtIso: string;
  occurrenceCount: number;
  errorName: string;
  errorMessage: string;
  stack: string;
  adminNote: string;
  metadata: Record<string, unknown>;
};
