export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: "local" | "firebase";
};

export type GradeGlowProfile = {
  displayName: string;
  degreeProgram: string;
  targetEcts: number;
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
};

export type ExamKind = "exam" | "presentation" | "paper" | "project" | "oral" | "other";

export type ExamStatus = "planned" | "learning" | "done";

export type ExamPriority = "low" | "normal" | "high";

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
