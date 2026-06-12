"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import GradeGlowInsights from "./GradeGlowInsights";
import GradeGlowPlanner from "./GradeGlowPlanner";
import PwaInstallCard from "./PwaInstallCard";
import { useGradeGlowModules } from "../hooks/useGradeGlowModules";
import { DEFAULT_TARGET_ECTS, useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { migrateModules } from "../lib/gradeglowModules";
import type {
  AppUser,
  Assessment,
  BackupFile,
  ModuleStatus,
  StatusFilter,
  UniModule,
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
  status: ModuleStatus;
};

type GradeGlowDashboardProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
};

const statusOptions: { value: ModuleStatus; label: string; shortLabel: string }[] = [
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

export default function GradeGlowDashboard({
  user,
  onLogout,
}: GradeGlowDashboardProps) {
  const { modules, setModules, isLoaded, syncStatus, syncMessage, dataModel } =
    useGradeGlowModules(user);

  const [name, setName] = useState("");
  const [ects, setEcts] = useState("");
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("1");
  const [status, setStatus] = useState<ModuleStatus>("passed");

  const [targetAverage, setTargetAverage] = useState("2,0");
  const [targetRemainingEcts, setTargetRemainingEcts] = useState("");

  const [assessmentInputs, setAssessmentInputs] = useState<Record<string, AssessmentInput>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [editingModules, setEditingModules] = useState<Record<string, boolean>>({});
  const [editInputs, setEditInputs] = useState<Record<string, EditInput>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { profile } = useGradeGlowProfile(user);
  const totalTargetEcts = profile.targetEcts > 0 ? profile.targetEcts : DEFAULT_TARGET_ECTS;

  const parseNumber = (value: string) => Number(value.replace(",", "."));

  const formatGrade = (value: number) => value.toFixed(2).replace(".", ",");

  const formatCompactNumber = (value: number) => String(value).replace(".", ",");

  const getTotalAssessmentWeight = (module: UniModule) =>
    module.assessments.reduce((sum, assessment) => sum + assessment.weight, 0);

  const getFinalGrade = (module: UniModule) => {
    if (module.assessments.length === 0) return module.grade;

    const totalWeight = getTotalAssessmentWeight(module);
    if (totalWeight === 0) return null;

    return (
      module.assessments.reduce(
        (sum, assessment) => sum + assessment.grade * assessment.weight,
        0
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

    if (module.assessments.length === 0 && finalGrade !== null && finalGrade > 4.0) {
      return "failed";
    }

    return module.status;
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

    const parsedEcts = parseNumber(ects);
    const parsedSemester = parseNumber(semester);
    const numericGrade = grade ? parseNumber(grade) : null;

    if (!Number.isFinite(parsedEcts) || !Number.isFinite(parsedSemester)) return;
    if (numericGrade !== null && !Number.isFinite(numericGrade)) return;

    const newModule: UniModule = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ects: parsedEcts,
      grade: numericGrade,
      semester: parsedSemester,
      status,
      assessments: [],
    };

    setModules((currentModules) => [...currentModules, newModule]);
    setExpandedModules((currentExpanded) => ({ ...currentExpanded, [newModule.id]: false }));

    setName("");
    setEcts("");
    setGrade("");
    setSemester("1");
    setStatus("passed");
  };

  const deleteModule = (moduleId: string) => {
    setModules((currentModules) => currentModules.filter((module) => module.id !== moduleId));
  };

  const toggleAssessments = (moduleId: string) => {
    setExpandedModules((currentExpanded) => ({
      ...currentExpanded,
      [moduleId]: !currentExpanded[moduleId],
    }));
  };

  const startEditingModule = (module: UniModule) => {
    setEditingModules((currentEditing) => ({ ...currentEditing, [module.id]: true }));

    setEditInputs((currentInputs) => ({
      ...currentInputs,
      [module.id]: {
        name: module.name,
        ects: String(module.ects).replace(".", ","),
        grade: module.grade !== null ? String(module.grade).replace(".", ",") : "",
        semester: String(module.semester),
        status: module.status,
      },
    }));
  };

  const cancelEditingModule = (moduleId: string) => {
    setEditingModules((currentEditing) => ({ ...currentEditing, [moduleId]: false }));
  };

  const updateEditInput = (moduleId: string, field: keyof EditInput, value: string) => {
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
    if (!input || !input.name.trim() || !input.ects || !input.semester) return;

    const parsedEcts = parseNumber(input.ects);
    const parsedSemester = parseNumber(input.semester);
    const numericGrade = input.grade ? parseNumber(input.grade) : null;

    if (!Number.isFinite(parsedEcts) || !Number.isFinite(parsedSemester)) return;
    if (numericGrade !== null && !Number.isFinite(numericGrade)) return;

    setModules((currentModules) =>
      currentModules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              name: input.name.trim(),
              ects: parsedEcts,
              grade: numericGrade,
              semester: parsedSemester,
              status: input.status,
            }
          : module
      )
    );

    setEditingModules((currentEditing) => ({ ...currentEditing, [moduleId]: false }));
  };

  const updateAssessmentInput = (
    moduleId: string,
    field: keyof AssessmentInput,
    value: string
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
      currentModules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              assessments: [...module.assessments, newAssessment],
            }
          : module
      )
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
                (assessment) => assessment.id !== assessmentId
              ),
            }
          : module
      )
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
      "application/json"
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
      ],
      ...modules.map((module) => {
        const finalGrade = getFinalGrade(module);
        const effectiveStatus = getEffectiveStatus(module);

        const assessmentSummary = module.assessments
          .map(
            (assessment) =>
              `${assessment.name}: ${assessment.weight}% / Note ${formatGrade(assessment.grade)}`
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
      "text/csv;charset=utf-8"
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
          setImportMessage("Import fehlgeschlagen: Keine gültige Backup-Datei.");
          return;
        }

        const importedModules = migrateModules(rawModules);
        setModules(importedModules);
        setImportMessage(`Import erfolgreich: ${importedModules.length} Modul(e) geladen.`);
      } catch {
        setImportMessage("Import fehlgeschlagen: Datei konnte nicht gelesen werden.");
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

    const gradedEcts = gradedModules.reduce((sum, module) => sum + module.ects, 0);

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
    : Math.max(totalTargetEcts - analytics.gradedEcts, 0);

  const requiredAverage =
    remainingGradedEcts > 0 && target > 0
      ? (target * (analytics.gradedEcts + remainingGradedEcts) - analytics.weightedGradeSum) /
        remainingGradedEcts
      : 0;

  const targetIsPossible =
    requiredAverage >= 1.0 && requiredAverage <= 4.0 && remainingGradedEcts > 0;

  const targetIsAlreadyReached =
    analytics.gradedEcts > 0 && analytics.average <= target && remainingGradedEcts === 0;

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
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const semesterGroups = visibleModules.reduce<Record<number, UniModule[]>>((groups, module) => {
    if (!groups[module.semester]) groups[module.semester] = [];
    groups[module.semester].push(module);
    return groups;
  }, {});

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
      0
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
        (module) => getEffectiveStatus(module) === option.value
      ).length;
      return counts;
    },
    { passed: 0, ungraded: 0, open: 0, failed: 0 }
  );

  const userLabel = profile.displayName || user.displayName || user.email || "GradeGlow User";
  const userInitial = userLabel.trim().charAt(0).toUpperCase() || "G";
  const degreeProgramLabel = profile.degreeProgram || "Studiengang noch nicht gesetzt";

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-base font-black text-violet-950 shadow-lg shadow-fuchsia-950/20">
                    GG
                  </div>

                  <div className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getSyncStyle()}`}>
                    {syncMessage}
                  </div>

                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">
                    {dataModel === "firestore-module-docs" ? "Modul-Dokumente" : "Lokales Array"}
                  </div>

                  {!isLoaded && (
                    <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 ring-1 ring-white/10">
                      Lädt…
                    </div>
                  )}
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">
                  GradeGlow Dashboard
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Dein Notenschnitt auf einen Blick.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Module, ECTS, Einzelleistungen, Zielnoten und Backups — angepasst auf dein
                  Profil und dein persönliches ECTS-Ziel.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-80">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/10">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{userLabel}</p>
                    <p className="truncate text-xs text-slate-300">{degreeProgramLabel}</p>
                    <p className="truncate text-xs text-slate-400">{user.email ?? "Lokaler Account"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Schnitt</p>
                    <p className="text-2xl font-black">
                      {analytics.average > 0 ? formatGrade(analytics.average) : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Fortschritt</p>
                    <p className="text-2xl font-black">{Math.min(analytics.progress, 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/settings"
                    className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Profil
                  </Link>
                  <button
                    type="button"
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
                    onClick={onLogout}
                  >
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Bestandene ECTS</p>
                <p className="mt-2 text-4xl font-black tracking-tight">{analytics.passedEcts}</p>
              </div>
              <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-xl ring-1 ring-emerald-100">✓</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">von {totalTargetEcts} ECTS</p>
          </div>

          <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Benotete ECTS</p>
                <p className="mt-2 text-4xl font-black tracking-tight">{analytics.gradedEcts}</p>
              </div>
              <span className="rounded-2xl bg-violet-50 px-3 py-2 text-xl ring-1 ring-violet-100">★</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">zählen in den Schnitt</p>
          </div>

          <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Offene ECTS</p>
                <p className="mt-2 text-4xl font-black tracking-tight">{analytics.openEcts}</p>
              </div>
              <span className="rounded-2xl bg-amber-50 px-3 py-2 text-xl ring-1 ring-amber-100">…</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">noch in Bearbeitung</p>
          </div>

          <div className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">Nicht bestanden</p>
                <p className="mt-2 text-4xl font-black tracking-tight">{analytics.failedEcts}</p>
              </div>
              <span className="rounded-2xl bg-rose-50 px-3 py-2 text-xl ring-1 ring-rose-100">!</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">ECTS betroffen</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-violet-700">Studienfortschritt</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{analytics.passedEcts} / {totalTargetEcts} ECTS</h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">{analytics.progress.toFixed(1)}% geschafft</p>
          </div>

          <div className="h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 transition-all duration-500"
              style={{ width: `${Math.min(analytics.progress, 100)}%` }}
            />
          </div>
        </section>

        <PwaInstallCard />

        <GradeGlowInsights modules={modules} totalTargetEcts={totalTargetEcts} />

        <GradeGlowPlanner user={user} modules={modules} />

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
              onClick={() => setIsAddModuleOpen((open) => !open)}
            >
              <div>
                <p className="text-sm font-bold text-violet-700">Schnellerfassung</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Modul hinzufügen</h2>
                <p className="mt-1 text-sm text-slate-500">Pflicht: Name, ECTS und Semester. Note darf leer bleiben.</p>
              </div>
              <span className="rounded-2xl bg-violet-50 px-4 py-2 text-2xl font-black text-violet-700 ring-1 ring-violet-100">
                {isAddModuleOpen ? "−" : "+"}
              </span>
            </button>

            {isAddModuleOpen && (
              <form className="border-t border-slate-100 p-5 sm:p-6" onSubmit={handleAddModule}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Modulname</span>
                    <input
                      className="field-input"
                      placeholder="z. B. Statistik"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Semester</span>
                    <input
                      className="field-input"
                      placeholder="z. B. 1"
                      inputMode="decimal"
                      value={semester}
                      onChange={(event) => setSemester(event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">ECTS</span>
                    <input
                      className="field-input"
                      placeholder="z. B. 6"
                      inputMode="decimal"
                      value={ects}
                      onChange={(event) => setEcts(event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Gesamtnote</span>
                    <input
                      className="field-input"
                      placeholder="optional, z. B. 2,3"
                      inputMode="decimal"
                      value={grade}
                      onChange={(event) => setGrade(event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Status</span>
                    <select
                      className="field-input"
                      value={status}
                      onChange={(event) => setStatus(event.target.value as ModuleStatus)}
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
                  <p className="text-sm text-slate-500">
                    Note &gt; 4,0 wird automatisch als „nicht bestanden“ gewertet.
                  </p>
                  <button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:opacity-50"
                    disabled={!name.trim() || !ects || !semester}
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
                <h2 className="mt-1 text-2xl font-black tracking-tight">Zielnotenrechner</h2>
                <p className="mt-1 text-sm text-slate-500">Was du ab jetzt im Schnitt brauchst.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Ziel-Schnitt</span>
                <input
                  className="field-input"
                  placeholder="z. B. 1,8"
                  inputMode="decimal"
                  value={targetAverage}
                  onChange={(event) => setTargetAverage(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Noch benotete ECTS</span>
                <input
                  className="field-input"
                  placeholder="optional"
                  inputMode="decimal"
                  value={targetRemainingEcts}
                  onChange={(event) => setTargetRemainingEcts(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Benötigter Restschnitt</p>
              <p className="mt-2 text-5xl font-black tracking-tight">
                {remainingGradedEcts > 0 && target > 0 ? formatGrade(requiredAverage) : "—"}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Berechnet mit {analytics.gradedEcts} benoteten ECTS und {remainingGradedEcts} noch benoteten ECTS.
              </p>

              {remainingGradedEcts > 0 && target > 0 && (
                <div
                  className={`mt-4 rounded-2xl p-3 text-sm font-bold ${
                    targetIsPossible
                      ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20"
                      : requiredAverage < 1
                      ? "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/20"
                      : "bg-rose-400/15 text-rose-100 ring-1 ring-rose-300/20"
                  }`}
                >
                  {targetIsPossible && "Das Ziel ist rechnerisch erreichbar."}
                  {requiredAverage < 1 && "Du liegst aktuell so gut, dass du dein Ziel sehr entspannt halten könntest."}
                  {requiredAverage > 4 && "Das Ziel ist mit den angegebenen restlichen ECTS rechnerisch nicht mehr erreichbar."}
                </div>
              )}

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
              <h2 className="mt-1 text-3xl font-black tracking-tight">Semesterübersicht</h2>
              <p className="mt-1 text-sm text-slate-500">
                {modules.length} Modul(e) insgesamt · {visibleModules.length} sichtbar
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
                <h3 className="mt-3 text-2xl font-black">Noch keine Module eingetragen</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Starte oben mit deinem ersten Modul. Danach erscheinen hier automatisch Semestergruppen, Schnitte und Einzelleistungen.
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
                const semesterPassedEcts = getSemesterPassedEcts(semesterModules);
                const semesterAverage = getSemesterAverage(semesterModules);

                return (
                  <div key={semesterNumber} className="rounded-3xl bg-slate-50/80 p-4 ring-1 ring-slate-200">
                    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{semesterNumber}. Semester</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {semesterModules.length} Modul(e) · {semesterPassedEcts} bestandene ECTS
                          {semesterAverage > 0 && ` · Schnitt ${formatGrade(semesterAverage)}`}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                        {semesterAverage > 0 ? `Ø ${formatGrade(semesterAverage)}` : "Noch kein Schnitt"}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {semesterModules.map((module) => {
                        const finalGrade = getFinalGrade(module);
                        const effectiveStatus = getEffectiveStatus(module);
                        const totalAssessmentWeight = getTotalAssessmentWeight(module);
                        const isEditing = editingModules[module.id];
                        const weightProgress = Math.min(totalAssessmentWeight, 100);

                        return (
                          <article key={module.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                            {!isEditing ? (
                              <>
                                <div className="p-4 sm:p-5">
                                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusStyle(effectiveStatus)}`}>
                                          {getStatusLabel(effectiveStatus)}
                                        </span>
                                        {module.assessments.length > 0 && (
                                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-100">
                                            {module.assessments.length} Einzelleistung(en)
                                          </span>
                                        )}
                                      </div>

                                      <h4 className="truncate text-xl font-black tracking-tight sm:text-2xl">{module.name}</h4>

                                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">ECTS</p>
                                          <p className="mt-1 text-xl font-black">{formatCompactNumber(module.ects)}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Modulnote</p>
                                          <p className="mt-1 text-xl font-black">{finalGrade !== null ? formatGrade(finalGrade) : "—"}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Gewichtung</p>
                                          <p className="mt-1 text-xl font-black">{module.assessments.length > 0 ? `${totalAssessmentWeight}%` : "—"}</p>
                                        </div>
                                      </div>

                                      {module.assessments.length > 0 && (
                                        <div className="mt-4">
                                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
                                            <span>Einzelleistungen</span>
                                            <span>{totalAssessmentWeight}% / 100%</span>
                                          </div>
                                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                              className={`h-full rounded-full ${totalAssessmentWeight > 100 ? "bg-rose-500" : "bg-violet-600"}`}
                                              style={{ width: `${weightProgress}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 lg:justify-end">
                                      <button
                                        type="button"
                                        className="soft-button"
                                        onClick={() => startEditingModule(module)}
                                      >
                                        Bearbeiten
                                      </button>

                                      <button
                                        type="button"
                                        className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-100"
                                        onClick={() => deleteModule(module.id)}
                                      >
                                        Löschen
                                      </button>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="mt-5 flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-100 transition hover:bg-violet-50 hover:ring-violet-100"
                                    onClick={() => toggleAssessments(module.id)}
                                  >
                                    <div>
                                      <p className="font-black">Einzelleistungen</p>
                                      <p className="mt-0.5 text-sm text-slate-500">
                                        {module.assessments.length === 0
                                          ? "Aufklappen, um Klausur, Präsentation oder Projekt einzutragen."
                                          : `${module.assessments.length} Leistung(en) · ${totalAssessmentWeight}% eingetragen`}
                                      </p>
                                    </div>

                                    <span className="rounded-xl bg-white px-3 py-1 text-lg font-black text-slate-500 ring-1 ring-slate-200">
                                      {expandedModules[module.id] ? "−" : "+"}
                                    </span>
                                  </button>
                                </div>

                                {expandedModules[module.id] && (
                                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                                    {module.assessments.length === 0 && (
                                      <p className="mb-4 rounded-2xl bg-white p-3 text-sm text-slate-500 ring-1 ring-slate-200">
                                        Noch keine Einzelleistungen eingetragen.
                                      </p>
                                    )}

                                    <div className="mb-4 grid gap-2">
                                      {module.assessments.map((assessment) => (
                                        <div key={assessment.id} className="flex flex-col justify-between gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
                                          <div>
                                            <p className="font-black">{assessment.name}</p>
                                            <p className="mt-0.5 text-slate-500">
                                              {assessment.weight}% Gewichtung · Note {formatGrade(assessment.grade)}
                                            </p>
                                          </div>

                                          <button
                                            type="button"
                                            className="self-start rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100 sm:self-auto"
                                            onClick={() => deleteAssessment(module.id, assessment.id)}
                                          >
                                            Entfernen
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                                      <input
                                        className="field-input bg-white"
                                        placeholder="Leistung, z. B. Klausur"
                                        value={assessmentInputs[module.id]?.name ?? ""}
                                        onChange={(event) => updateAssessmentInput(module.id, "name", event.target.value)}
                                      />

                                      <input
                                        className="field-input bg-white"
                                        placeholder="Gewichtung %"
                                        inputMode="decimal"
                                        value={assessmentInputs[module.id]?.weight ?? ""}
                                        onChange={(event) => updateAssessmentInput(module.id, "weight", event.target.value)}
                                      />

                                      <input
                                        className="field-input bg-white"
                                        placeholder="Note"
                                        inputMode="decimal"
                                        value={assessmentInputs[module.id]?.grade ?? ""}
                                        onChange={(event) => updateAssessmentInput(module.id, "grade", event.target.value)}
                                      />

                                      <button
                                        type="button"
                                        className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                                        onClick={() => addAssessment(module.id)}
                                      >
                                        Hinzufügen
                                      </button>
                                    </div>

                                    {totalAssessmentWeight > 100 && (
                                      <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
                                        Achtung: Die Gewichtung liegt über 100%.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="bg-slate-50/80 p-4 sm:p-5">
                                <div className="mb-5 flex items-center justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-bold text-violet-700">Bearbeitung</p>
                                    <h4 className="text-2xl font-black tracking-tight">Modul bearbeiten</h4>
                                  </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <label className="block md:col-span-2">
                                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Modulname</span>
                                    <input
                                      className="field-input bg-white"
                                      placeholder="Modulname"
                                      value={editInputs[module.id]?.name ?? ""}
                                      onChange={(event) => updateEditInput(module.id, "name", event.target.value)}
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Semester</span>
                                    <input
                                      className="field-input bg-white"
                                      placeholder="Semester"
                                      inputMode="decimal"
                                      value={editInputs[module.id]?.semester ?? ""}
                                      onChange={(event) => updateEditInput(module.id, "semester", event.target.value)}
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-1.5 block text-sm font-bold text-slate-700">ECTS</span>
                                    <input
                                      className="field-input bg-white"
                                      placeholder="ECTS"
                                      inputMode="decimal"
                                      value={editInputs[module.id]?.ects ?? ""}
                                      onChange={(event) => updateEditInput(module.id, "ects", event.target.value)}
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Gesamtnote</span>
                                    <input
                                      className="field-input bg-white"
                                      placeholder="optional"
                                      inputMode="decimal"
                                      value={editInputs[module.id]?.grade ?? ""}
                                      onChange={(event) => updateEditInput(module.id, "grade", event.target.value)}
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Status</span>
                                    <select
                                      className="field-input bg-white"
                                      value={editInputs[module.id]?.status ?? "passed"}
                                      onChange={(event) => updateEditInput(module.id, "status", event.target.value as ModuleStatus)}
                                    >
                                      {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>

                                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                  <button
                                    type="button"
                                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                                    onClick={() => cancelEditingModule(module.id)}
                                  >
                                    Abbrechen
                                  </button>

                                  <button
                                    type="button"
                                    className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-800"
                                    onClick={() => saveEditedModule(module.id)}
                                  >
                                    Speichern
                                  </button>
                                </div>

                                {module.assessments.length > 0 && (
                                  <p className="mt-4 rounded-2xl bg-white p-3 text-sm text-slate-500 ring-1 ring-slate-200">
                                    Hinweis: Wenn Einzelleistungen eingetragen sind, wird die sichtbare Modulnote aus diesen Leistungen berechnet.
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

        <section className="overflow-hidden rounded-3xl bg-white/90 shadow-sm ring-1 ring-violet-100 backdrop-blur">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
            onClick={() => setIsToolsOpen((open) => !open)}
          >
            <div>
              <p className="text-sm font-bold text-violet-700">Backup & Export</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Daten sichern & übertragen</h2>
              <p className="mt-1 text-sm text-slate-500">JSON Backup, Import oder CSV für Excel.</p>
            </div>
            <span className="rounded-2xl bg-violet-50 px-4 py-2 text-2xl font-black text-violet-700 ring-1 ring-violet-100">
              {isToolsOpen ? "−" : "+"}
            </span>
          </button>

          {isToolsOpen && (
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
                Achtung: Beim Import wird deine aktuelle Modul-Liste durch die importierte Backup-Datei ersetzt.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
