"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { ModuleCategory, UniModule } from "../types";

type StudyPlanningPanelProps = {
  modules: UniModule[];
  setModules: Dispatch<SetStateAction<UniModule[]>>;
};

type DetectedStudyModule = {
  name: string;
  ects: number;
  category: ModuleCategory;
};

const categoryOptions: { value: ModuleCategory; label: string; pill: string }[] = [
  { value: "mandatory", label: "Pflichtmodul", pill: "bg-violet-50 text-violet-700 ring-violet-100" },
  {
    value: "electiveMandatory",
    label: "Wahlpflicht",
    pill: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
  },
  { value: "elective", label: "Wahlmodul", pill: "bg-sky-50 text-sky-700 ring-sky-100" },
  { value: "unknown", label: "Noch offen", pill: "bg-slate-50 text-slate-600 ring-slate-200" },
];

const defaultMaxAttempts = 3;
const suspiciousLineParts = [
  "§",
  "prüfungsordnung",
  "studienordnung",
  "modulhandbuch",
  "anlage",
  "seite",
  "semesterwochenstunden",
  "leistungspunkte insgesamt",
  "gesamtumfang",
  "abschlussarbeit",
  "kolloquium",
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toNumber = (value: string | number | undefined, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getCategoryLabel = (category: ModuleCategory | undefined) =>
  categoryOptions.find((option) => option.value === (category ?? "unknown"))?.label ?? "Noch offen";

const getCategoryPill = (category: ModuleCategory | undefined) =>
  categoryOptions.find((option) => option.value === (category ?? "unknown"))?.pill ??
  "bg-slate-50 text-slate-600 ring-slate-200";

const getAttemptCount = (module: UniModule) => module.attemptCount ?? 0;

const getMaxAttempts = (module: UniModule) => module.maxAttempts ?? defaultMaxAttempts;

const getPlannedSemester = (module: UniModule) => module.plannedSemester ?? module.semester;

const getAttemptRisk = (module: UniModule) => {
  const attempts = getAttemptCount(module);
  const maxAttempts = getMaxAttempts(module);

  if (module.isLocked || attempts >= maxAttempts) {
    return {
      label: "kritisch",
      className: "bg-rose-50 text-rose-700 ring-rose-100",
      text: "Maximale Fehlversuche erreicht. Bitte sofort offiziell prüfen.",
    };
  }

  if (attempts === maxAttempts - 1) {
    return {
      label: "letzter Versuch",
      className: "bg-amber-50 text-amber-700 ring-amber-100",
      text: "Nächster Fehlversuch wäre kritisch.",
    };
  }

  if (attempts > 0) {
    return {
      label: "im Wiederholungsversuch",
      className: "bg-violet-50 text-violet-700 ring-violet-100",
      text: "Versuche im Blick behalten.",
    };
  }

  return {
    label: "okay",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    text: "Noch kein Fehlversuch eingetragen.",
  };
};

const detectCategory = (line: string): ModuleCategory => {
  const normalized = normalizeText(line);

  if (
    normalized.includes("wahlpflicht") ||
    normalized.includes("wp modul") ||
    normalized.includes("wp bereich") ||
    normalized.includes("pflichtwahl")
  ) {
    return "electiveMandatory";
  }

  if (
    normalized.includes("freie wahl") ||
    normalized.includes("wahlmodul") ||
    normalized.includes("wahlbereich") ||
    normalized.includes("optional")
  ) {
    return "elective";
  }

  if (normalized.includes("pflicht") || normalized.includes("pm ")) {
    return "mandatory";
  }

  return "unknown";
};

const cleanDetectedName = (line: string) => {
  return line
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:ects|lp|cp|credits?)\b/gi, " ")
    .replace(/\b(?:pflichtmodul|pflicht|wahlpflichtmodul|wahlpflicht|wahlmodul|freie wahl|pm|wp)\b/gi, " ")
    .replace(/^[\s•\-–—_*]+/, "")
    .replace(/^\d+(?:\.\d+)*[.)]?\s*/, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[|;:,\-–—]+$/g, "")
    .trim();
};

const extractEcts = (line: string) => {
  const explicitMatch = line.match(/(\d+(?:[,.]\d+)?)\s*(?:ects|lp|cp|credits?)\b/i);
  if (explicitMatch?.[1]) return toNumber(explicitMatch[1], 0);

  const tableMatch = line.match(/(?:^|\s)(\d+(?:[,.]\d+)?)(?:\s*)$/);
  if (tableMatch?.[1]) {
    const parsed = toNumber(tableMatch[1], 0);
    if (parsed > 0 && parsed <= 30) return parsed;
  }

  return 0;
};

const parseStudyPlanText = (text: string): DetectedStudyModule[] => {
  const moduleMap = new Map<string, DetectedStudyModule>();

  const lines = text
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    const normalizedLine = normalizeText(line);
    if (normalizedLine.length < 4) return;
    if (suspiciousLineParts.some((part) => normalizedLine.includes(normalizeText(part)))) return;

    const ects = extractEcts(line);
    const category = detectCategory(line);
    const name = cleanDetectedName(line);
    const normalizedName = normalizeText(name);

    if (name.length < 4 || name.length > 90) return;
    if (normalizedName.split(" ").length > 8) return;
    if (!ects && category === "unknown") return;
    if (/^\d+$/.test(normalizedName)) return;

    const existing = moduleMap.get(normalizedName);
    if (existing) {
      moduleMap.set(normalizedName, {
        name: existing.name,
        ects: existing.ects || ects,
        category: existing.category !== "unknown" ? existing.category : category,
      });
      return;
    }

    moduleMap.set(normalizedName, {
      name,
      ects,
      category,
    });
  });

  return [...moduleMap.values()].slice(0, 80);
};

const getLoadLabel = (ects: number) => {
  if (ects <= 0) return { label: "leer", className: "bg-slate-50 text-slate-600 ring-slate-200" };
  if (ects <= 15) return { label: "entspannt", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" };
  if (ects <= 24) return { label: "normal", className: "bg-violet-50 text-violet-700 ring-violet-100" };
  if (ects <= 30) return { label: "intensiv", className: "bg-amber-50 text-amber-700 ring-amber-100" };
  return { label: "sehr voll", className: "bg-rose-50 text-rose-700 ring-rose-100" };
};

export default function StudyPlanningPanel({ modules, setModules }: StudyPlanningPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stupoText, setStupoText] = useState("");
  const [stupoMessage, setStupoMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [targetSemester, setTargetSemester] = useState("1");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedMoveSemester, setSelectedMoveSemester] = useState("2");

  const openOrFailedModules = useMemo(
    () =>
      [...modules]
        .filter((module) => module.status === "open" || module.status === "failed")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [modules]
  );

  const semesterGroups = useMemo(() => {
    return [...modules]
      .sort((a, b) => {
        const semesterDiff = getPlannedSemester(a) - getPlannedSemester(b);
        if (semesterDiff !== 0) return semesterDiff;
        return a.name.localeCompare(b.name);
      })
      .reduce<Record<number, UniModule[]>>((groups, module) => {
        const semester = getPlannedSemester(module);
        if (!groups[semester]) groups[semester] = [];
        groups[semester].push(module);
        return groups;
      }, {});
  }, [modules]);

  const semesterNumbers = Object.keys(semesterGroups)
    .map(Number)
    .sort((a, b) => a - b);

  const detectedModules = useMemo(() => parseStudyPlanText(stupoText), [stupoText]);

  const attemptModules = useMemo(
    () =>
      [...modules]
        .filter((module) => getAttemptCount(module) > 0 || module.status === "failed" || module.isLocked)
        .sort((a, b) => getAttemptCount(b) - getAttemptCount(a) || a.name.localeCompare(b.name)),
    [modules]
  );

  const handleStupoFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setStupoMessage("");

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");

      if (file.name.toLowerCase().endsWith(".pdf")) {
        setStupoText(content);
        setStupoMessage(
          "PDF wurde geladen. Browser können PDF-Text nicht immer sauber auslesen. Falls kaum Module erkannt werden, kopiere den Text aus der StuPo hier in das Textfeld."
        );
        return;
      }

      setStupoText(content);
      setStupoMessage(`Datei geladen: ${file.name}`);
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const importDetectedModules = () => {
    if (detectedModules.length === 0) {
      setStupoMessage("Ich konnte noch keine Modulzeilen erkennen. Am besten StuPo-Text oder eine CSV/TXT-Liste einfügen.");
      return;
    }

    const plannedSemester = Math.max(1, Math.round(toNumber(targetSemester, 1)));
    let addedCount = 0;
    let matchedCount = 0;

    setModules((currentModules) => {
      const nextModules = [...currentModules];

      detectedModules.forEach((detectedModule) => {
        const normalizedDetectedName = normalizeText(detectedModule.name);
        const existingIndex = nextModules.findIndex((module) => {
          const normalizedModuleName = normalizeText(module.name);
          return (
            normalizedModuleName === normalizedDetectedName ||
            normalizedModuleName.includes(normalizedDetectedName) ||
            normalizedDetectedName.includes(normalizedModuleName)
          );
        });

        if (existingIndex >= 0) {
          matchedCount += 1;
          const existingModule = nextModules[existingIndex];
          nextModules[existingIndex] = {
            ...existingModule,
            ects: existingModule.ects > 0 ? existingModule.ects : detectedModule.ects,
            category:
              existingModule.category && existingModule.category !== "unknown"
                ? existingModule.category
                : detectedModule.category,
            plannedSemester: existingModule.plannedSemester ?? existingModule.semester,
            stupoMatched: true,
            stupoSource: uploadedFileName || "StuPo-Textimport",
          };
          return;
        }

        addedCount += 1;
        nextModules.push({
          id: crypto.randomUUID(),
          name: detectedModule.name,
          ects: detectedModule.ects,
          grade: null,
          semester: plannedSemester,
          plannedSemester,
          status: "open",
          assessments: [],
          category: detectedModule.category,
          attemptCount: 0,
          maxAttempts: defaultMaxAttempts,
          isLocked: false,
          stupoMatched: true,
          stupoSource: uploadedFileName || "StuPo-Textimport",
        });
      });

      return nextModules;
    });

    setStupoMessage(
      `StuPo-Abgleich fertig: ${addedCount} Modul(e) neu angelegt, ${matchedCount} vorhandene Modul(e) markiert.`
    );
  };

  const updateModule = (moduleId: string, updater: (module: UniModule) => UniModule) => {
    setModules((currentModules) =>
      currentModules.map((module) => (module.id === moduleId ? updater(module) : module))
    );
  };

  const moveSelectedModule = () => {
    if (!selectedModuleId) return;
    const nextSemester = Math.max(1, Math.round(toNumber(selectedMoveSemester, 1)));
    updateModule(selectedModuleId, (module) => ({ ...module, plannedSemester: nextSemester }));
  };

  const updateModuleSemester = (moduleId: string, value: string) => {
    const nextSemester = Math.max(1, Math.round(toNumber(value, 1)));
    updateModule(moduleId, (module) => ({ ...module, plannedSemester: nextSemester }));
  };

  const updateModuleCategory = (moduleId: string, value: ModuleCategory) => {
    updateModule(moduleId, (module) => ({ ...module, category: value }));
  };

  const addFailedAttempt = (moduleId: string) => {
    updateModule(moduleId, (module) => {
      const maxAttempts = getMaxAttempts(module);
      const nextAttemptCount = Math.min(getAttemptCount(module) + 1, maxAttempts);
      return {
        ...module,
        status: "failed",
        attemptCount: nextAttemptCount,
        maxAttempts,
        isLocked: nextAttemptCount >= maxAttempts,
      };
    });
  };

  const removeFailedAttempt = (moduleId: string) => {
    updateModule(moduleId, (module) => {
      const nextAttemptCount = Math.max(getAttemptCount(module) - 1, 0);
      return {
        ...module,
        attemptCount: nextAttemptCount,
        isLocked: false,
        status: nextAttemptCount === 0 && module.status === "failed" ? "open" : module.status,
      };
    });
  };

  const markModulePassed = (moduleId: string) => {
    updateModule(moduleId, (module) => ({ ...module, status: "passed", isLocked: false }));
  };

  const resetAttempts = (moduleId: string) => {
    updateModule(moduleId, (module) => ({
      ...module,
      attemptCount: 0,
      maxAttempts: getMaxAttempts(module),
      isLocked: false,
      status: module.status === "failed" ? "open" : module.status,
    }));
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-bold text-violet-700">StuPo-Assistent</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Pflicht- & Wahlmodule erkennen</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Lade eine TXT/CSV-Liste hoch oder kopiere Text aus deiner Studien- und Prüfungsordnung hier hinein.
                GradeGlow erkennt Modulnamen, ECTS und grobe Modularten heuristisch.
              </p>
            </div>

            <button
              type="button"
              className="soft-button shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              StuPo hochladen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.csv,.json,.pdf,text/plain,text/csv,application/json,application/pdf"
              onChange={handleStupoFile}
            />
          </div>

          <textarea
            className="field-input min-h-44 resize-y"
            placeholder={"Beispiel:\nPflichtmodul Statistik 6 ECTS\nWahlpflichtmodul Marketing 5 ECTS\nFreie Wahl: Nachhaltigkeit 3 ECTS"}
            value={stupoText}
            onChange={(event) => setStupoText(event.target.value)}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Neue erkannte Module planen in Semester</span>
              <input
                className="field-input bg-white"
                inputMode="numeric"
                value={targetSemester}
                onChange={(event) => setTargetSemester(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              onClick={importDetectedModules}
            >
              Erkennung übernehmen
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <p className="text-sm font-black text-slate-700">
                Erkannte Module: {detectedModules.length}
              </p>
              {uploadedFileName && <p className="text-xs font-bold text-slate-400">Datei: {uploadedFileName}</p>}
            </div>

            {detectedModules.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {detectedModules.slice(0, 14).map((module) => (
                  <span
                    key={`${module.name}-${module.ects}`}
                    className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getCategoryPill(module.category)}`}
                  >
                    {module.name} {module.ects ? `· ${module.ects} ECTS` : ""}
                  </span>
                ))}
                {detectedModules.length > 14 && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                    +{detectedModules.length - 14} weitere
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Noch nichts erkannt. Für den ersten Test reicht auch eine einfache Liste mit „Modulname 6 ECTS“ pro Zeile.
              </p>
            )}
          </div>

          {stupoMessage && (
            <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700 ring-1 ring-violet-100">
              {stupoMessage}
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-bold text-violet-700">Versuchsübersicht</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Fehlversuche & Drittversuch-Warnung</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Trage Fehlversuche ein, damit GradeGlow dich vor kritischen Modulen warnt. Das ist eine Planungswarnung und ersetzt keine offizielle Prüfungsamtsauskunft.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800 ring-1 ring-amber-100">
            Wichtig: Regeln zu Drittversuch, endgültigem Nichtbestehen und Studiengangwechsel unterscheiden sich je Hochschule, StuPo und Moduläquivalenz. GradeGlow markiert Risiken, entscheidet aber nichts rechtlich verbindlich.
          </div>

          {attemptModules.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              Noch keine Fehlversuche eingetragen.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {attemptModules.map((module) => {
                const risk = getAttemptRisk(module);
                const attempts = getAttemptCount(module);
                const maxAttempts = getMaxAttempts(module);

                return (
                  <article key={module.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">{module.name}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${risk.className}`}>
                            {risk.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {attempts} / {maxAttempts} Fehlversuche · {risk.text}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="soft-button" onClick={() => removeFailedAttempt(module.id)}>
                          −1
                        </button>
                        <button type="button" className="soft-button" onClick={() => addFailedAttempt(module.id)}>
                          Fehlversuch +1
                        </button>
                        <button type="button" className="soft-button" onClick={() => markModulePassed(module.id)}>
                          bestanden
                        </button>
                        <button type="button" className="soft-button" onClick={() => resetAttempts(module.id)}>
                          reset
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-bold text-violet-700">Semesterplanung</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Module ins nächste Semester schieben</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Plane unabhängig vom ursprünglichen Fachsemester, wann du ein offenes Modul wirklich belegen willst.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_8rem_auto]">
            <select
              className="field-input bg-white"
              value={selectedModuleId}
              onChange={(event) => setSelectedModuleId(event.target.value)}
            >
              <option value="">Modul auswählen</option>
              {openOrFailedModules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>

            <input
              className="field-input bg-white"
              inputMode="numeric"
              value={selectedMoveSemester}
              onChange={(event) => setSelectedMoveSemester(event.target.value)}
            />

            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              onClick={moveSelectedModule}
            >
              verschieben
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {openOrFailedModules.slice(0, 8).map((module) => (
              <div key={module.id} className="grid gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-[1fr_7rem_11rem] md:items-center">
                <div>
                  <p className="font-black text-slate-950">{module.name}</p>
                  <p className="text-sm text-slate-500">{module.ects} ECTS · geplant in Semester {getPlannedSemester(module)}</p>
                </div>

                <input
                  className="field-input bg-white py-2"
                  inputMode="numeric"
                  value={String(getPlannedSemester(module))}
                  onChange={(event) => updateModuleSemester(module.id, event.target.value)}
                />

                <select
                  className="field-input bg-white py-2"
                  value={module.category ?? "unknown"}
                  onChange={(event) => updateModuleCategory(module.id, event.target.value as ModuleCategory)}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {openOrFailedModules.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                Keine offenen Module vorhanden.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-bold text-violet-700">Plan-Auslastung</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">ECTS je geplantem Semester</h2>
          </div>

          {semesterNumbers.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              Noch keine Module geplant.
            </p>
          ) : (
            <div className="grid gap-3">
              {semesterNumbers.map((semesterNumber) => {
                const plannedModules = semesterGroups[semesterNumber] ?? [];
                const ects = plannedModules.reduce((sum, module) => sum + module.ects, 0);
                const load = getLoadLabel(ects);

                return (
                  <article key={semesterNumber} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-slate-950">Semester {semesterNumber}</h3>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${load.className}`}>
                        {ects} ECTS · {load.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plannedModules.map((module) => (
                        <span key={module.id} className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getCategoryPill(module.category)}`}>
                          {module.name} · {getCategoryLabel(module.category)}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
