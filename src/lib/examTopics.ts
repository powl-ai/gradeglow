import type { ExamPlanItem, ExamTopic, StudySessionItem, TopicConfidence } from "../types";

export const TOPIC_CONFIDENCE_OPTIONS: { value: TopicConfidence; label: string }[] = [
  { value: 1, label: "unsicher" },
  { value: 2, label: "geht so" },
  { value: 3, label: "sitzt" },
];

const createTopicId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `topic-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createTopic = (name: string, confidence: TopicConfidence = 1): ExamTopic => ({
  id: createTopicId(),
  name: name.trim(),
  confidence,
});

const asConfidence = (value: unknown): TopicConfidence =>
  value === 2 || value === 3 ? value : 1;

/** Accepts whatever came from storage and returns clean topics (never throws). */
export const normalizeTopics = (raw: unknown): ExamTopic[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim().slice(0, 80) : "";
    if (!name) return [];
    const id = typeof record.id === "string" && record.id && !seen.has(record.id) ? record.id : createTopicId();
    seen.add(id);
    return [{ id, name, confidence: asConfidence(record.confidence) }];
  });
};

/** How many blocks a topic deserves relative to others: weak topics get the most. */
export const getTopicWeight = (confidence: TopicConfidence) => (confidence === 1 ? 3 : confidence === 2 ? 2 : 1);

export type PlannedBlock =
  | { kind: "topic"; topic: ExamTopic; round: number }
  | { kind: "mock" }
  | { kind: "review" };

/**
 * Turns topics into an ordered list of `count` study blocks.
 * - The last block is a final review, the one before a mock exam (when there is room).
 * - Every topic gets one first pass (weakest first), extra blocks go to weak topics.
 * - Repeats are spread out so the same topic is not studied twice in a row.
 */
export const planTopicBlocks = (topics: ExamTopic[], count: number): PlannedBlock[] => {
  const total = Math.max(0, Math.floor(count));
  if (total === 0) return [];
  if (topics.length === 0) return [];

  const tail: PlannedBlock[] = [];
  if (total >= 3) tail.push({ kind: "review" });
  if (total >= Math.max(5, topics.length + 2)) tail.unshift({ kind: "mock" });
  const slots = total - tail.length;

  const byWeakness = [...topics].sort((a, b) => a.confidence - b.confidence);
  if (slots <= byWeakness.length) {
    return [...byWeakness.slice(0, slots).map((topic) => ({ kind: "topic" as const, topic, round: 1 })), ...tail];
  }

  // Largest-remainder distribution of the extra slots by weight.
  const extra = slots - byWeakness.length;
  const weightSum = byWeakness.reduce((sum, topic) => sum + getTopicWeight(topic.confidence), 0);
  const shares = byWeakness.map((topic) => (extra * getTopicWeight(topic.confidence)) / weightSum);
  const counts = shares.map((share) => 1 + Math.floor(share));
  let remaining = slots - counts.reduce((sum, value) => sum + value, 0);
  shares
    .map((share, index) => ({ index, rest: share - Math.floor(share) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index)
    .forEach(({ index }) => {
      if (remaining <= 0) return;
      counts[index] += 1;
      remaining -= 1;
    });

  // Round-robin: first pass over all topics, then repeats of the weaker ones.
  const blocks: PlannedBlock[] = [];
  const used = counts.map(() => 0);
  for (let round = 1; blocks.length < slots; round += 1) {
    byWeakness.forEach((topic, index) => {
      if (used[index] >= counts[index] || blocks.length >= slots) return;
      used[index] += 1;
      blocks.push({ kind: "topic", topic, round });
    });
  }
  return [...blocks, ...tail];
};

export const describePlannedBlock = (block: PlannedBlock, subject: string) => {
  if (block.kind === "mock") return { title: `Probeklausur · ${subject}`, focus: "Alte Klausur unter Zeitdruck, danach Fehler markieren" };
  if (block.kind === "review") return { title: `Finale Wiederholung · ${subject}`, focus: "Formeln, Definitionen, Fehlerliste – und früh schlafen" };
  return block.round === 1
    ? { title: block.topic.name, focus: block.topic.confidence === 3 ? "Kurz auffrischen und 2–3 Aufgaben rechnen" : "Verstehen: Skript/Folien, dann Beispielaufgaben" }
    : { title: `${block.topic.name} · Runde ${block.round}`, focus: "Aufgaben ohne Lösung rechnen, Lücken notieren" };
};

const isActive = (session: StudySessionItem) => !session.isHidden;

export type ExamPlanStatus = {
  daysUntil: number;
  totalSessions: number;
  doneSessions: number;
  overdueSessions: StudySessionItem[];
  topicsTotal: number;
  topicsCovered: number;
  state: "no-plan" | "on-track" | "behind" | "done";
};

/** Where the user stands for one exam: done vs. planned, missed blocks, covered topics. */
export const getExamPlanStatus = (exam: ExamPlanItem, todayKey: string): ExamPlanStatus => {
  const today = new Date(`${todayKey}T12:00:00`);
  const examDay = new Date(`${exam.examDate}T12:00:00`);
  const daysUntil = Math.round((examDay.getTime() - today.getTime()) / 86_400_000);
  const sessions = exam.studySessions.filter(isActive);
  const doneSessions = sessions.filter((session) => session.isDone);
  const overdueSessions = sessions.filter((session) => !session.isDone && session.dateKey < todayKey);
  const topics = exam.topics ?? [];
  const coveredIds = new Set(doneSessions.map((session) => session.topicId).filter(Boolean));
  const topicsCovered = topics.filter((topic) => coveredIds.has(topic.id)).length;

  let state: ExamPlanStatus["state"] = "on-track";
  if (exam.status === "done" || daysUntil < 0) state = "done";
  else if (sessions.length === 0) state = "no-plan";
  else if (overdueSessions.length > 0) state = "behind";

  return {
    daysUntil,
    totalSessions: sessions.length,
    doneSessions: doneSessions.length,
    overdueSessions,
    topicsTotal: topics.length,
    topicsCovered,
    state,
  };
};

export type TodayBlock = StudySessionItem & { subject: string; isOverdue: boolean };

/** Today's open blocks first, then up to `maxOverdue` missed ones (newest first). */
export const getTodayBlocks = (exams: ExamPlanItem[], todayKey: string, maxOverdue = 2): TodayBlock[] => {
  const all = exams
    .filter((exam) => !exam.isHidden && exam.status !== "done")
    .flatMap((exam) =>
      exam.studySessions
        .filter((session) => isActive(session) && !session.isDone && session.dateKey <= todayKey && exam.examDate >= todayKey)
        .map((session) => ({ ...session, subject: exam.moduleName || exam.title, isOverdue: session.dateKey < todayKey })),
    );
  const today = all.filter((block) => !block.isOverdue).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const overdue = all.filter((block) => block.isOverdue).sort((a, b) => b.dateKey.localeCompare(a.dateKey)).slice(0, maxOverdue);
  return [...today, ...overdue];
};
