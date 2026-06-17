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
  plannedSemester?: number;
  sourceGroup?: string;
};

type ImportPreviewItem = DetectedStudyModule & {
  action: "new" | "update";
  existingModuleId?: string;
};

type TechnicalTrack =
  | "bau"
  | "chemie"
  | "elektrotechnik"
  | "iks"
  | "maschinenbau"
  | "verkehr"
  | "energie";

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

const technicalTrackOptions: { value: TechnicalTrack; label: string }[] = [
  { value: "maschinenbau", label: "Maschinenbau" },
  { value: "bau", label: "Bauingenieurwesen" },
  { value: "chemie", label: "Chemie & Verfahrenstechnik" },
  { value: "elektrotechnik", label: "Elektrotechnik" },
  { value: "iks", label: "Informations- & Kommunikationssysteme" },
  { value: "verkehr", label: "Verkehrswesen" },
  { value: "energie", label: "Energie & Ressourcen" },
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

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getAttemptRisk = (module: UniModule) => {
  const attempts = getAttemptCount(module);
  const maxAttempts = getMaxAttempts(module);

  if (module.isLocked || attempts >= maxAttempts) {
    return {
      label: `${attempts}/${maxAttempts} · kritisch`,
      className: "bg-rose-50 text-rose-700 ring-rose-100",
      text: "Kritisch: Bitte Prüfungsamt/Stupo prüfen, bevor du daraus finale Schlüsse ziehst.",
    };
  }

  if (attempts === maxAttempts - 1) {
    return {
      label: `${attempts}/${maxAttempts} · Achtung`,
      className: "bg-amber-50 text-amber-700 ring-amber-100",
      text: "Achtung: Der nächste Fehlversuch wäre kritisch.",
    };
  }

  if (attempts > 0) {
    return {
      label: `${attempts}/${maxAttempts} · unkritisch`,
      className: "bg-violet-50 text-violet-700 ring-violet-100",
      text: "Unkritisch, aber im Blick behalten.",
    };
  }

  return {
    label: `0/${maxAttempts} · okay`,
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
    .replace(/\b(?:s|semester)\s*\d{1,2}\b/gi, " ")
    .replace(/\[\s*s\s*\d{1,2}\s*\]/gi, " ")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:ects|lp|cp|credits?)\b/gi, " ")
    .replace(/\b(?:pflichtmodul|pflicht|wahlpflichtmodul|wahlpflicht|wahlmodul|freie wahl|pm|wp)\b/gi, " ")
    .replace(/\b(?:integrationsbereich|wirtschaftswissenschaften|ingenieurwissenschaften|modulgruppe)\b/gi, " ")
    .replace(/^[\s•\-–—_*|]+/, "")
    .replace(/^\d+(?:\.\d+)*[.)]?\s*/, "")
    .replace(/[|]+/g, " ")
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

const extractPlannedSemester = (line: string) => {
  const match = line.match(/(?:^|\b)(?:s|semester)\s*(\d{1,2})\b|\[\s*s\s*(\d{1,2})\s*\]/i);
  const parsed = toNumber(match?.[1] ?? match?.[2], 0);
  return parsed > 0 && parsed <= 20 ? parsed : undefined;
};

const isSemesterPart = (part: string) => {
  const normalized = normalizeText(part);
  return /^(s|semester)\s*\d{1,2}$/.test(normalized) || /^s\d{1,2}$/.test(normalized);
};

const isEctsPart = (part: string) =>
  /^\d+(?:[,.]\d+)?\s*(ects|lp|cp|credits?)?$/i.test(part.trim());

const isMetaPart = (part: string) => {
  const normalized = normalizeText(part);
  if (!normalized) return true;
  if (isSemesterPart(part) || isEctsPart(part)) return true;
  if (detectCategory(part) !== "unknown" && normalized.split(" ").length <= 3) return true;
  if (["ja", "nein", "s", "m", "p", "s m p", "benotung", "prufungsform"].includes(normalized)) return true;
  return false;
};

const extractNameFromLine = (line: string) => {
  if (!line.includes("|")) return cleanDetectedName(line);

  const parts = line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const categoryIndex = parts.findIndex((part) => {
    const normalized = normalizeText(part);
    return detectCategory(part) !== "unknown" && normalized.split(" ").length <= 3;
  });

  // GradeGlow/ChatGPT-Zielformat:
  // S1 | Pflichtmodul | Modulname | 6 ECTS | Bereich
  if (categoryIndex >= 0 && parts[categoryIndex + 1] && !isMetaPart(parts[categoryIndex + 1])) {
    return cleanDetectedName(parts[categoryIndex + 1]);
  }

  const ectsIndex = parts.findIndex((part) => isEctsPart(part));
  if (ectsIndex > 0) {
    const beforeEcts = [...parts.slice(0, ectsIndex)]
      .reverse()
      .find((part) => !isMetaPart(part));

    if (beforeEcts) return cleanDetectedName(beforeEcts);
  }

  const nameCandidates = parts.filter((part) => !isMetaPart(part));
  const longestCandidate = nameCandidates.sort((a, b) => b.length - a.length)[0] ?? line;
  return cleanDetectedName(longestCandidate);
};

const namesLookSimilar = (left: string, right: string) => {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;

  const keepSignificantWord = (word: string) =>
    word.length > 2 || /^[ivx]+$/.test(word) || /^\d+$/.test(word);
  const leftWords = normalizedLeft.split(" ").filter(keepSignificantWord);
  const rightWords = normalizedRight.split(" ").filter(keepSignificantWord);

  if (leftWords.length === 0 || rightWords.length === 0) return false;

  const sharedWords = leftWords.filter((word) => rightWords.includes(word)).length;
  const overlap = sharedWords / Math.max(leftWords.length, rightWords.length);

  return overlap >= 0.72 && Math.abs(normalizedLeft.length - normalizedRight.length) <= 18;
};

const findMatchingModule = (modules: UniModule[], detectedModule: DetectedStudyModule) =>
  modules.find((module) => namesLookSimilar(module.name, detectedModule.name));

const getImportSourceLabel = (uploadedFileName: string, detectedModule: DetectedStudyModule) =>
  uploadedFileName || detectedModule.sourceGroup || "StuPo-Textimport";

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
    const plannedSemester = extractPlannedSemester(line);
    const name = extractNameFromLine(line);
    const normalizedName = normalizeText(name);

    if (name.length < 4 || name.length > 100) return;
    if (normalizedName.split(" ").length > 10) return;
    if (!ects && category === "unknown") return;
    if (/^\d+$/.test(normalizedName)) return;
    if (normalizedName.includes("entsprechend der semesterweise veroffentlichten")) return;

    const existing = moduleMap.get(normalizedName);
    if (existing) {
      moduleMap.set(normalizedName, {
        name: existing.name,
        ects: existing.ects || ects,
        category: existing.category !== "unknown" ? existing.category : category,
        plannedSemester: existing.plannedSemester ?? plannedSemester,
        sourceGroup: existing.sourceGroup,
      });
      return;
    }

    moduleMap.set(normalizedName, {
      name,
      ects,
      category,
      plannedSemester,
    });
  });

  return [...moduleMap.values()].slice(0, 120);
};

const getLoadLabel = (ects: number) => {
  if (ects <= 0) return { label: "leer", className: "bg-slate-50 text-slate-600 ring-slate-200" };
  if (ects <= 15) return { label: "entspannt", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" };
  if (ects <= 24) return { label: "normal", className: "bg-violet-50 text-violet-700 ring-violet-100" };
  if (ects <= 30) return { label: "intensiv", className: "bg-amber-50 text-amber-700 ring-amber-100" };
  return { label: "sehr voll", className: "bg-rose-50 text-rose-700 ring-rose-100" };
};

const m = (
  semester: number,
  category: ModuleCategory,
  name: string,
  ects: number,
  sourceGroup: string
): DetectedStudyModule => ({
  plannedSemester: semester,
  category,
  name,
  ects,
  sourceGroup,
});

const wiIngBaseModules: DetectedStudyModule[] = [
  m(1, "mandatory", "Analysis I und Lineare Algebra für Ingenieurwissenschaften", 12, "Integrationsbereich"),
  m(1, "mandatory", "Einführung in die Informatik", 6, "Integrationsbereich"),
  m(1, "mandatory", "Mikroökonomik", 4, "Wirtschaftswissenschaften"),
  m(2, "mandatory", "Analysis II für Ingenieurwissenschaften", 9, "Integrationsbereich"),
  m(2, "mandatory", "Bilanzierung und Kostenrechnung", 6, "Wirtschaftswissenschaften"),
  m(2, "mandatory", "Makroökonomik", 4, "Wirtschaftswissenschaften"),
  m(3, "mandatory", "Statistik I für Wirtschaftswissenschaften", 6, "Integrationsbereich"),
  m(3, "mandatory", "Marketing und Produktionsmanagement", 6, "Wirtschaftswissenschaften"),
  m(3, "mandatory", "Wirtschaftspolitik", 4, "Wirtschaftswissenschaften"),
  m(4, "mandatory", "Operations Research - Grundlagen", 6, "Integrationsbereich"),
  m(4, "mandatory", "Organisation und Innovationsmanagement", 6, "Wirtschaftswissenschaften"),
  m(5, "mandatory", "Investition und Finanzierung", 6, "Wirtschaftswissenschaften"),
  m(5, "electiveMandatory", "Wahlpflicht Wirtschaftswissenschaften", 12, "Wirtschaftswissenschaften"),
  m(6, "electiveMandatory", "Wahlpflicht Integration", 9, "Integrationsbereich"),
  m(6, "electiveMandatory", "Informationssysteme und Datenanalyse oder Statistik II", 6, "Integrationsbereich"),
  m(6, "mandatory", "Wirtschaftsprivatrecht", 6, "Wirtschaftswissenschaften"),
  m(6, "elective", "Wahlbereich", 6, "Wahlbereich"),
  m(6, "mandatory", "Bachelorarbeit", 12, "Bachelorarbeit"),
];

const wiIngTechnicalModules: Record<TechnicalTrack, DetectedStudyModule[]> = {
  bau: [
    m(1, "mandatory", "Statik und elementare Festigkeitslehre", 9, "Bauingenieurwesen"),
    m(2, "mandatory", "Baustoffe und Bauchemie I", 6, "Bauingenieurwesen"),
    m(3, "mandatory", "Baustatik I", 6, "Bauingenieurwesen"),
    m(3, "mandatory", "Bauwirtschaft I", 6, "Bauingenieurwesen"),
    m(4, "mandatory", "Baubetrieb I", 3, "Bauingenieurwesen"),
    m(4, "mandatory", "Grundlagen der Bauphysik", 6, "Bauingenieurwesen"),
    m(5, "electiveMandatory", "Wahlpflichtmodule Bauingenieurwesen", 18, "Bauingenieurwesen"),
  ],
  chemie: [
    m(1, "mandatory", "Einführung in die Allgemeine und Anorganische Chemie", 6, "Chemie und Verfahrenstechnik"),
    m(2, "mandatory", "Grundlagen der Physikalischen Chemie (Wi.-Ing.)", 6, "Chemie und Verfahrenstechnik"),
    m(4, "mandatory", "Technische Wärmelehre", 9, "Chemie und Verfahrenstechnik"),
    m(4, "mandatory", "Technische Chemie", 18, "Chemie und Verfahrenstechnik"),
    m(5, "electiveMandatory", "Wahlpflichtmodule Chemie und Verfahrenstechnik", 15, "Chemie und Verfahrenstechnik"),
  ],
  elektrotechnik: [
    m(1, "mandatory", "Grundlagen der Elektrotechnik", 9, "Elektrotechnik"),
    m(2, "mandatory", "Einführung in die Informatik - Vertiefung", 6, "Elektrotechnik"),
    m(2, "mandatory", "Elektrische Netzwerke", 6, "Elektrotechnik"),
    m(4, "mandatory", "Integraltransformationen und partielle Differentialgleichungen für Ingenieurwissenschaften", 6, "Elektrotechnik"),
    m(5, "electiveMandatory", "Wahlpflichtmodule Elektrotechnik", 27, "Elektrotechnik"),
  ],
  iks: [
    m(2, "mandatory", "Einführung in die Informatik - Vertiefung", 6, "Informations- und Kommunikationssysteme"),
    m(3, "mandatory", "Anwendungssysteme", 6, "Informations- und Kommunikationssysteme"),
    m(3, "mandatory", "Rechnerorganisation", 6, "Informations- und Kommunikationssysteme"),
    m(4, "mandatory", "Rechnernetze und verteilte Systeme", 6, "Informations- und Kommunikationssysteme"),
    m(4, "mandatory", "Systemprogrammierung", 6, "Informations- und Kommunikationssysteme"),
    m(5, "electiveMandatory", "Wahlpflichtmodule Informations- und Kommunikationssysteme", 24, "Informations- und Kommunikationssysteme"),
  ],
  maschinenbau: [
    m(1, "mandatory", "Mechanik E", 9, "Maschinenbau"),
    m(2, "mandatory", "Grundlagen der Elektrotechnik (Service)", 6, "Maschinenbau"),
    m(2, "mandatory", "Konstruktion I", 6, "Maschinenbau"),
    m(2, "mandatory", "Werkstoffkunde", 6, "Maschinenbau"),
    m(4, "mandatory", "Technische Wärmelehre", 9, "Maschinenbau"),
    m(4, "mandatory", "Fabrikbetrieb und industrielle Informationstechnik", 6, "Maschinenbau"),
    m(5, "electiveMandatory", "Wahlpflichtmodule Maschinenbau", 12, "Maschinenbau"),
  ],
  verkehr: [
    m(1, "mandatory", "Mechanik E", 9, "Verkehrswesen"),
    m(2, "mandatory", "Einführung in das Verkehrswesen", 6, "Verkehrswesen"),
    m(2, "mandatory", "Konstruktion I", 6, "Verkehrswesen"),
    m(2, "mandatory", "Werkstoffkunde", 6, "Verkehrswesen"),
    m(4, "mandatory", "Technische Wärmelehre", 9, "Verkehrswesen"),
    m(5, "electiveMandatory", "Wahlpflichtmodule Verkehrswesen", 18, "Verkehrswesen"),
  ],
  energie: [
    m(1, "mandatory", "Energie und Ressourcen - Einführung", 6, "Energie und Ressourcen"),
    m(1, "mandatory", "Mechanik E", 9, "Energie und Ressourcen"),
    m(2, "mandatory", "Grundlagen der Elektrotechnik (Service)", 6, "Energie und Ressourcen"),
    m(2, "mandatory", "Konstruktion und Werkstoffe", 6, "Energie und Ressourcen"),
    m(4, "mandatory", "Technische Wärmelehre", 9, "Energie und Ressourcen"),
    m(5, "electiveMandatory", "Wahlpflichtmodule Energie und Ressourcen", 18, "Energie und Ressourcen"),
  ],
};

const getWiIngTemplateModules = (track: TechnicalTrack) => [
  ...wiIngBaseModules,
  ...wiIngTechnicalModules[track],
];

const createTemplateText = (modulesToImport: DetectedStudyModule[]) =>
  modulesToImport
    .map(
      (module) =>
        `S${module.plannedSemester ?? 1} | ${getCategoryLabel(module.category)} | ${module.name} | ${module.ects} ECTS | ${module.sourceGroup ?? "StuPo"}`
    )
    .join("\n");

const createExternalAiPrompt = (trackLabel: string) => `Du bist ein präziser Parser für Studien- und Prüfungsordnungen.

Aufgabe:
Analysiere die hochgeladene Studien- und Prüfungsordnung / StuPo als PDF und extrahiere den Modulplan für Bachelor Wirtschaftsingenieurwesen, technische Studienrichtung: ${trackLabel}.

Gib ausschließlich kopierbare Zeilen zurück. Keine Erklärung, keine Tabelle in Markdown, keine Bulletpoints außerhalb der Zeilen.

Zielformat je Zeile:
S<Semester> | <Pflichtmodul/Wahlpflicht/Wahlmodul> | <Modulname> | <ECTS> ECTS | <Bereich>

Regeln:
- Nutze den exemplarischen Studienverlaufsplan, wenn daraus ein Semester erkennbar ist.
- Nutze die Modulliste, wenn daraus ECTS, Pflicht/Wahlpflicht/Wahlbereich oder Bereich erkennbar sind.
- Wenn ein Wahlpflichtbereich keine einzelnen Module nennt, erstelle eine Sammelzeile, z. B. "S5 | Wahlpflicht | Wahlpflichtmodule Maschinenbau | 12 ECTS | Maschinenbau".
- Nimm nur echte Module oder echte Wahlpflicht-/Wahlbereiche auf.
- Entferne Seitenzahlen, Paragraphen, Überschriften, Prüfungsform-Kürzel und Hinweise.
- Wenn ein Modul über mehrere Semester verteilt ist, nutze das Semester, in dem der größere ECTS-Anteil liegt.
- Bei Unsicherheit lieber eine saubere Sammelzeile als erfundene Einzelmodule.

Beispielausgabe:
S1 | Pflichtmodul | Analysis I und Lineare Algebra für Ingenieurwissenschaften | 12 ECTS | Integrationsbereich
S2 | Pflichtmodul | Bilanzierung und Kostenrechnung | 6 ECTS | Wirtschaftswissenschaften
S5 | Wahlpflicht | Wahlpflichtmodule Maschinenbau | 12 ECTS | Maschinenbau`;


const looksLikeWiIngStupo = (fileName: string) => {
  const normalized = normalizeText(fileName);
  return (
    normalized.includes("stupo") ||
    normalized.includes("stu po") ||
    normalized.includes("wiing") ||
    normalized.includes("wirtschaftsingenieur")
  );
};

export default function StudyPlanningPanel({ modules, setModules }: StudyPlanningPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stupoText, setStupoText] = useState("");
  const [stupoMessage, setStupoMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [targetSemester, setTargetSemester] = useState("1");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedMoveSemester, setSelectedMoveSemester] = useState("2");
  const [selectedAttemptModuleId, setSelectedAttemptModuleId] = useState("");
  const [technicalTrack, setTechnicalTrack] = useState<TechnicalTrack>("maschinenbau");
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false);

  const planEditableModules = useMemo(
    () =>
      [...modules].sort((a, b) => {
        const semesterDiff = getPlannedSemester(a) - getPlannedSemester(b);
        if (semesterDiff !== 0) return semesterDiff;
        return a.name.localeCompare(b.name);
      }),
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

  const selectedTrackLabel =
    technicalTrackOptions.find((option) => option.value === technicalTrack)?.label ?? "deine technische Studienrichtung";

  const aiPrompt = useMemo(() => createExternalAiPrompt(selectedTrackLabel), [selectedTrackLabel]);

  const detectedModules = useMemo(() => parseStudyPlanText(stupoText), [stupoText]);

  const importPreview = useMemo<ImportPreviewItem[]>(
    () =>
      detectedModules.map((detectedModule) => {
        const existingModule = findMatchingModule(modules, detectedModule);
        return {
          ...detectedModule,
          action: existingModule ? "update" : "new",
          existingModuleId: existingModule?.id,
        };
      }),
    [detectedModules, modules]
  );

  const previewStats = useMemo(
    () => ({
      newCount: importPreview.filter((module) => module.action === "new").length,
      updateCount: importPreview.filter((module) => module.action === "update").length,
    }),
    [importPreview]
  );

  const attemptModules = useMemo(
    () =>
      [...modules]
        .filter((module) => getAttemptCount(module) > 0 || module.status === "failed" || module.isLocked)
        .sort((a, b) => getAttemptCount(b) - getAttemptCount(a) || a.name.localeCompare(b.name)),
    [modules]
  );

  const copyAiPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setCopiedAiPrompt(true);
      window.setTimeout(() => setCopiedAiPrompt(false), 1800);
    } catch {
      setStupoMessage("Prompt konnte nicht automatisch kopiert werden. Du kannst ihn im Textfeld darunter manuell markieren und kopieren.");
    }
  };

  const loadWiIngTemplate = (sourceLabel = "TU Berlin WiIng 2015/2019 StuPo-Vorlage") => {
    const templateModules = getWiIngTemplateModules(technicalTrack);
    const trackLabel = technicalTrackOptions.find((option) => option.value === technicalTrack)?.label ?? "Studienrichtung";

    setStupoText(createTemplateText(templateModules));
    setUploadedFileName(sourceLabel);
    setStupoMessage(
      `Saubere Vorlage geladen: ${templateModules.length} Einträge für Wirtschaftsingenieurwesen mit Studienrichtung ${trackLabel}. Bitte kurz prüfen, weil StuPos und Änderungssatzungen je Prüfungsstand abweichen können.`
    );
  };

  const handleStupoFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setStupoMessage("");

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      if (looksLikeWiIngStupo(file.name)) {
        loadWiIngTemplate(file.name);
        setStupoMessage(
          "PDF erkannt. Ich lese PDFs nicht mehr als Rohtext ein, damit kein Zeichenmüll entsteht. Für diese TU-Berlin-WiIng-StuPo wurde stattdessen eine saubere Vorlage geladen. Bitte Studienrichtung prüfen und dann übernehmen."
        );
      } else {
        setStupoText("");
        setStupoMessage(
          "PDF erkannt. Direktes Rohtext-Auslesen wurde deaktiviert, weil dabei Zeichenmüll entsteht. Kopiere den relevanten Modulplan aus der PDF hier hinein oder nutze eine TXT/CSV-Liste."
        );
      }

      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setStupoText(content);
      setStupoMessage(`Datei geladen: ${file.name}`);
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const importDetectedModules = () => {
    if (detectedModules.length === 0) {
      setStupoMessage(
        "Ich konnte noch keine sauberen Modulzeilen erkennen. Nutze die Vorlage oder lass dir den PDF-Modulplan mit dem Prompt oben ins Zielformat bringen."
      );
      return;
    }

    const fallbackSemester = Math.max(1, Math.round(toNumber(targetSemester, 1)));
    let addedCount = 0;
    let matchedCount = 0;

    setModules((currentModules) => {
      const nextModules = [...currentModules];

      detectedModules.forEach((detectedModule) => {
        const existingModule = findMatchingModule(nextModules, detectedModule);
        const existingIndex = existingModule
          ? nextModules.findIndex((module) => module.id === existingModule.id)
          : -1;
        const plannedSemester = detectedModule.plannedSemester ?? fallbackSemester;
        const sourceLabel = getImportSourceLabel(uploadedFileName, detectedModule);

        if (existingIndex >= 0) {
          matchedCount += 1;
          const moduleToUpdate = nextModules[existingIndex];
          const hasCustomPlanning =
            getPlannedSemester(moduleToUpdate) !== (moduleToUpdate.semester || plannedSemester);

          nextModules[existingIndex] = {
            ...moduleToUpdate,
            ects: detectedModule.ects > 0 ? detectedModule.ects : moduleToUpdate.ects,
            category:
              detectedModule.category !== "unknown"
                ? detectedModule.category
                : moduleToUpdate.category,
            semester: detectedModule.plannedSemester ?? moduleToUpdate.semester,
            plannedSemester: hasCustomPlanning ? getPlannedSemester(moduleToUpdate) : plannedSemester,
            stupoMatched: true,
            stupoSource: sourceLabel,
          };
          return;
        }

        addedCount += 1;
        nextModules.push({
          id: createId(),
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
          stupoSource: sourceLabel,
        });
      });

      return nextModules;
    });

    setStupoMessage(
      `Module übernommen: ${addedCount} neu angelegt, ${matchedCount} vorhandene aktualisiert. Doppelte Namen wurden vermieden.`
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

  const shiftModuleSemester = (moduleId: string, delta: number) => {
    updateModule(moduleId, (module) => ({
      ...module,
      plannedSemester: Math.max(1, getPlannedSemester(module) + delta),
    }));
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

  const addSelectedFailedAttempt = () => {
    if (!selectedAttemptModuleId) return;
    addFailedAttempt(selectedAttemptModuleId);
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
              <h2 className="mt-1 text-2xl font-black tracking-tight">Pflicht- & Wahlmodule sauber importieren</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Der PDF-Upload wird nicht als magische Erkennung verkauft: Nutze entweder die TU-Berlin-WiIng-Vorlage oder lass deine PDF extern mit dem Prompt unten in ein sauberes Zeilenformat bringen.
              </p>
            </div>

            <button
              type="button"
              className="soft-button shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              Datei auswählen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.csv,.json,.pdf,text/plain,text/csv,application/json,application/pdf"
              onChange={handleStupoFile}
            />
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            {[
              "1. Prompt kopieren",
              "2. PDF extern hochladen",
              "3. Ergebnis einfügen",
              "4. Vorschau prüfen & übernehmen",
            ].map((step) => (
              <div key={step} className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                {step}
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800 ring-1 ring-amber-100">
            PDFs werden absichtlich nicht roh als Browser-Text ausgewertet, weil dabei schnell Zeichenmüll entsteht. Für deine TU-Berlin-WiIng-StuPo kannst du die Vorlage laden; für andere StuPos nimm den externen ChatGPT-Prompt und füge das Ergebnis hier ein.
          </div>

          <div className="mb-4 grid gap-3 rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="mb-1.5 block text-sm font-bold text-violet-900">TU-Berlin-WiIng-Vorlage: technische Studienrichtung</span>
              <select
                className="field-input bg-white"
                value={technicalTrack}
                onChange={(event) => setTechnicalTrack(event.target.value as TechnicalTrack)}
              >
                {technicalTrackOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-800"
              onClick={() => loadWiIngTemplate()}
            >
              Vorlage laden
            </button>
          </div>

          <div className="mb-4 rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black text-violet-200">Externe KI-Hilfe ohne API-Key</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Kopiere den Prompt, lade deine StuPo in einem neuen Chat hoch und füge die zurückgegebenen Zeilen anschließend hier ein.
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50"
                onClick={copyAiPrompt}
              >
                {copiedAiPrompt ? "kopiert" : "Prompt kopieren"}
              </button>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-bold text-violet-200">Prompt anzeigen</summary>
              <textarea
                className="mt-3 min-h-48 w-full resize-y rounded-2xl border border-white/10 bg-white/10 p-3 text-xs leading-5 text-slate-100 outline-none"
                value={aiPrompt}
                readOnly
              />
            </details>
          </div>

          <textarea
            className="field-input min-h-44 resize-y"
            placeholder={"Beispiel:\nS1 | Pflichtmodul | Statistik I | 6 ECTS | Integrationsbereich\nS5 | Wahlpflicht | Marketing-Vertiefung | 6 ECTS | Wirtschaftswissenschaften\nS6 | Wahlmodul | Nachhaltigkeit | 3 ECTS | Wahlbereich"}
            value={stupoText}
            onChange={(event) => setStupoText(event.target.value)}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Fallback nur falls kein S1/S2/S3 erkannt wurde</span>
              <input
                className="field-input bg-white"
                inputMode="numeric"
                value={targetSemester}
                onChange={(event) => setTargetSemester(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
              onClick={importDetectedModules}
              disabled={detectedModules.length === 0}
            >
              Module übernehmen
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black text-slate-700">Import-Vorschau</p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {detectedModules.length > 0
                    ? `${detectedModules.length} erkannt · ${previewStats.newCount} neu · ${previewStats.updateCount} Update(s)`
                    : "Noch keine sauberen Modulzeilen erkannt"}
                </p>
              </div>
              {uploadedFileName && <p className="text-xs font-bold text-slate-400">Quelle: {uploadedFileName}</p>}
            </div>

            {importPreview.length > 0 ? (
              <div className="mt-4 grid max-h-96 gap-3 overflow-y-auto pr-1">
                {importPreview.map((module) => (
                  <article
                    key={`${module.name}-${module.ects}-${module.plannedSemester ?? "x"}`}
                    className="rounded-2xl bg-white p-3 ring-1 ring-slate-200"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${getCategoryPill(module.category)}`}>
                            {getCategoryLabel(module.category)}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${module.action === "new" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-sky-50 text-sky-700 ring-sky-100"}`}>
                            {module.action === "new" ? "neu" : "aktualisiert vorhandenes Modul"}
                          </span>
                        </div>
                        <h3 className="mt-2 font-black text-slate-950">{module.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {module.ects || "?"} ECTS · {module.plannedSemester ? `Semester ${module.plannedSemester}` : `Fallback-Semester ${targetSemester}`}
                          {module.sourceGroup ? ` · ${module.sourceGroup}` : ""}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Lade die Vorlage oder füge Zeilen im Format <span className="font-bold">S1 | Pflichtmodul | Modulname | 6 ECTS | Bereich</span> ein. Dann erscheint hier vor dem Übernehmen eine echte Vorschau.
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

          <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-[1fr_auto] md:items-center">
            <select
              className="field-input bg-white"
              value={selectedAttemptModuleId}
              onChange={(event) => setSelectedAttemptModuleId(event.target.value)}
            >
              <option value="">Modul für Fehlversuch auswählen</option>
              {planEditableModules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name} · {getAttemptCount(module)}/{getMaxAttempts(module)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
              onClick={addSelectedFailedAttempt}
              disabled={!selectedAttemptModuleId}
            >
              Fehlversuch +1
            </button>
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
              Plane unabhängig vom ursprünglichen Fachsemester, wann du ein Modul wirklich belegen willst. Bestehende und importierte Module sind hier gemeinsam sichtbar.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_8rem_auto]">
            <select
              className="field-input bg-white"
              value={selectedModuleId}
              onChange={(event) => setSelectedModuleId(event.target.value)}
            >
              <option value="">Modul auswählen</option>
              {planEditableModules.map((module) => (
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

          <div className="mt-5 grid max-h-[32rem] gap-3 overflow-y-auto pr-1">
            {planEditableModules.map((module) => (
              <div key={module.id} className="grid gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-[1fr_8rem_11rem_auto] md:items-center">
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

                <div className="flex gap-2 md:justify-end">
                  <button type="button" className="soft-button px-3 py-2" onClick={() => shiftModuleSemester(module.id, -1)}>
                    −1
                  </button>
                  <button type="button" className="soft-button px-3 py-2" onClick={() => shiftModuleSemester(module.id, 1)}>
                    +1
                  </button>
                </div>
              </div>
            ))}

            {planEditableModules.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                Noch keine Module vorhanden.
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
                    <div className="mt-3 grid gap-2">
                      {plannedModules.map((module) => (
                        <div key={module.id} className="flex flex-col justify-between gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-black text-slate-950">{module.name}</p>
                            <p className="mt-0.5 text-xs font-bold text-slate-400">{module.ects} ECTS · {getCategoryLabel(module.category)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" className="soft-button px-3 py-2" onClick={() => shiftModuleSemester(module.id, -1)}>
                              −1
                            </button>
                            <button type="button" className="soft-button px-3 py-2" onClick={() => shiftModuleSemester(module.id, 1)}>
                              nächstes Semester
                            </button>
                          </div>
                        </div>
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
