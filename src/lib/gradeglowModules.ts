import type { Assessment, ModuleStatus, UniModule } from "../types";

export const MODULES_STORAGE_KEY = "gradeglow-modules";
export const LEGACY_MODULES_STORAGE_KEY = "bachelor-track-modules";

export const normalizeModuleStatus = (value: unknown): ModuleStatus => {
  if (value === "passed" || value === "ungraded" || value === "open" || value === "failed") {
    return value;
  }

  return "passed";
};

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
};

const toNullableGrade = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const migrateModules = (rawModules: unknown): UniModule[] => {
  if (!Array.isArray(rawModules)) return [];

  return rawModules.map((module: Partial<UniModule>) => ({
    id: typeof module.id === "string" && module.id.trim() ? module.id : createId(),
    name: typeof module.name === "string" ? module.name : "",
    ects: toNumber(module.ects, 0),
    grade: toNullableGrade(module.grade),
    semester: toNumber(module.semester, 1),
    status: normalizeModuleStatus(module.status),
    assessments: Array.isArray(module.assessments)
      ? module.assessments.map((assessment: Partial<Assessment>) => ({
          id:
            typeof assessment.id === "string" && assessment.id.trim()
              ? assessment.id
              : createId(),
          name: typeof assessment.name === "string" ? assessment.name : "",
          weight: toNumber(assessment.weight, 0),
          grade: toNumber(assessment.grade, 0),
        }))
      : [],
  }));
};

export const getUserModulesStorageKey = (userId: string) => `${MODULES_STORAGE_KEY}-${userId}`;

export const loadLocalModules = (storageKey: string) => {
  if (typeof window === "undefined") return [];

  const savedModules = window.localStorage.getItem(storageKey);
  const legacyModules = window.localStorage.getItem(LEGACY_MODULES_STORAGE_KEY);
  const modulesToLoad = savedModules ?? legacyModules;

  if (!modulesToLoad) return [];

  try {
    const parsedModules = JSON.parse(modulesToLoad);
    const migratedModules = migrateModules(parsedModules);

    if (!savedModules && legacyModules) {
      window.localStorage.setItem(storageKey, JSON.stringify(migratedModules));
    }

    return migratedModules;
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
};

export const saveLocalModules = (storageKey: string, modules: UniModule[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(modules));
};
