import type { ExamPlanItem, StudySessionItem, UniModule } from "../types";

export const DEMO_SOURCE = "GradeGlow Demo";
export const DEMO_EXAM_MARKER = "[GradeGlow Demo]";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createStudySession = ({
  examId,
  title,
  dateOffset,
  durationMinutes,
  focus,
  isDone = false,
}: {
  examId: string;
  title: string;
  dateOffset: number;
  durationMinutes: number;
  focus: string;
  isDone?: boolean;
}): StudySessionItem => ({
  id: createId(),
  examId,
  title,
  dateKey: getDateKey(addDays(new Date(), dateOffset)),
  time: "10:00",
  durationMinutes,
  focus,
  notes: isDone ? "Demo: erledigte Einheit für den Fortschritt." : "",
  isDone,
  isHidden: false,
  isManual: false,
});

export const createDemoGradeGlowData = () => {
  const analysisId = createId();
  const marketingId = createId();
  const accountingId = createId();
  const lawId = createId();
  const projectId = createId();

  const modules: UniModule[] = [
    {
      id: analysisId,
      name: "Analysis I und Lineare Algebra",
      ects: 12,
      grade: null,
      semester: 1,
      status: "open",
      assessments: [
        { id: createId(), name: "Übungstest", weight: 30, grade: 2.3 },
      ],
      category: "mandatory",
      plannedSemester: 1,
      attemptCount: 0,
      maxAttempts: 3,
      isLocked: false,
      stupoMatched: true,
      stupoSource: DEMO_SOURCE,
      notes: "Demo: schwere Klausur, früh mit Altaufgaben anfangen.",
      targetGrade: 2.0,
    },
    {
      id: marketingId,
      name: "Marketing",
      ects: 6,
      grade: 1.7,
      semester: 1,
      status: "passed",
      assessments: [],
      category: "mandatory",
      plannedSemester: 1,
      attemptCount: 0,
      maxAttempts: 3,
      isLocked: false,
      stupoMatched: true,
      stupoSource: DEMO_SOURCE,
      notes: "Demo: bestandenes Modul mit Note.",
      targetGrade: null,
    },
    {
      id: accountingId,
      name: "Buchführung und Bilanzierung",
      ects: 6,
      grade: null,
      semester: 2,
      status: "failed",
      assessments: [],
      category: "mandatory",
      plannedSemester: 2,
      attemptCount: 1,
      maxAttempts: 3,
      isLocked: false,
      stupoMatched: true,
      stupoSource: DEMO_SOURCE,
      notes: "Demo: einmal nicht bestanden, Wiederholung im Blick behalten.",
      targetGrade: 3.0,
    },
    {
      id: lawId,
      name: "Wirtschaftsrecht",
      ects: 5,
      grade: null,
      semester: 2,
      status: "open",
      assessments: [],
      category: "mandatory",
      plannedSemester: 2,
      attemptCount: 0,
      maxAttempts: 3,
      isLocked: false,
      stupoMatched: true,
      stupoSource: DEMO_SOURCE,
      notes: "Demo: Open-Book-Struktur und Gesetzesmarkierungen planen.",
      targetGrade: 2.7,
    },
    {
      id: projectId,
      name: "E-Business Projekt",
      ects: 8,
      grade: null,
      semester: 3,
      status: "ungraded",
      assessments: [],
      category: "electiveMandatory",
      plannedSemester: 3,
      attemptCount: 0,
      maxAttempts: 3,
      isLocked: false,
      stupoMatched: true,
      stupoSource: DEMO_SOURCE,
      notes: "Demo: unbenotetes Projektmodul für die Semesterplanung.",
      targetGrade: null,
    },
  ];

  const analysisExamId = createId();
  const lawExamId = createId();

  const exams: ExamPlanItem[] = [
    {
      id: analysisExamId,
      title: "Mathe Klausur",
      moduleId: analysisId,
      moduleName: "Analysis I und Lineare Algebra",
      examDate: getDateKey(addDays(new Date(), 24)),
      examTime: "09:00",
      kind: "exam",
      status: "learning",
      priority: "high",
      notes: `${DEMO_EXAM_MARKER} Fokus: Reihen, Matrizen, komplexe Zahlen und alte Klausuren.`,
      studyStartDays: 21,
      targetStudyMinutes: 1800,
      dailyStudyLimitMinutes: 240,
      sessionGoalMinutes: 120,
      isHidden: false,
      studySessions: [
        createStudySession({
          examId: analysisExamId,
          title: "Mathe Grundlagen wiederholen",
          dateOffset: 2,
          durationMinutes: 120,
          focus: "Definitionen, Standardaufgaben, Fehlerliste",
          isDone: true,
        }),
        createStudySession({
          examId: analysisExamId,
          title: "Altklausur Block 1",
          dateOffset: 5,
          durationMinutes: 150,
          focus: "Aufgaben unter Zeitdruck rechnen",
        }),
        createStudySession({
          examId: analysisExamId,
          title: "Schwächen gezielt schließen",
          dateOffset: 9,
          durationMinutes: 120,
          focus: "Komplexe Zahlen und Umkehrfunktionen",
        }),
      ],
    },
    {
      id: lawExamId,
      title: "Wirtschaftsrecht Open-Book",
      moduleId: lawId,
      moduleName: "Wirtschaftsrecht",
      examDate: getDateKey(addDays(new Date(), 38)),
      examTime: "14:00",
      kind: "exam",
      status: "planned",
      priority: "normal",
      notes: `${DEMO_EXAM_MARKER} Demo-Prüfung mit Lernplan und Notizen.`,
      studyStartDays: 14,
      targetStudyMinutes: 720,
      dailyStudyLimitMinutes: 180,
      sessionGoalMinutes: 90,
      isHidden: false,
      studySessions: [
        createStudySession({
          examId: lawExamId,
          title: "BGB-Struktur markieren",
          dateOffset: 18,
          durationMinutes: 90,
          focus: "Anspruchsgrundlagen und Schemata",
        }),
        createStudySession({
          examId: lawExamId,
          title: "Musterklausur lösen",
          dateOffset: 24,
          durationMinutes: 120,
          focus: "Gutachtenstil und Paragrafen finden",
        }),
      ],
    },
  ];

  return { modules, exams };
};
