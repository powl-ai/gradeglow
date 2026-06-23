export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: "local" | "firebase";
};

export type StartMode = "manual" | "stupo" | "template" | "demo";

export type GradeGlowProfile = {
  displayName: string;
  university: string;
  degreeProgram: string;
  degreeType: string;
  currentSemester: number;
  targetEcts: number;
  preferredStartMode: StartMode;
  onboardingCompleted: boolean;
  avatarDataUrl: string;
  studySharingEnabled: boolean;
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
  isHidden: boolean;
  studySessions: StudySessionItem[];
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
  displayName: string;
  degreeProgram: string;
  avatarDataUrl: string;
  totalDoneMinutes: number;
  thisWeekDoneMinutes: number;
  topSubjects: StudySubjectStat[];
  updatedAtIso: string;
};
