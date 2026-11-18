// Quiz and quick check after a study block. Pure helpers, shared by the API route and the app.

export const QUIZ_LENGTH = 6;

export type QuizQuestion = { q: string; options: string[]; answer: number; why: string };

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Reads the model's answer. Returns null unless there are QUIZ_LENGTH well-formed questions. */
export const parseQuiz = (raw: string): QuizQuestion[] | null => {
  const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let data: unknown;
  try { data = JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
  const list = (data as { questions?: unknown })?.questions;
  if (!Array.isArray(list)) return null;
  const questions = list.flatMap((item): QuizQuestion[] => {
    const record = (item ?? {}) as Record<string, unknown>;
    const options = Array.isArray(record.options) ? record.options.map((option) => text(option, 200)) : [];
    const answer = Number(record.answer);
    const q = text(record.q, 400);
    if (!q || options.length !== 4 || options.some((option) => !option) || !Number.isInteger(answer) || answer < 0 || answer > 3) return [];
    return [{ q, options, answer, why: text(record.why, 300) }];
  });
  return questions.length >= QUIZ_LENGTH ? questions.slice(0, QUIZ_LENGTH) : null;
};

/** New topic percent: the latest result counts more than the old value, so one bad day does not erase everything. */
export const blendPct = (previous: number | undefined, result: number) =>
  Math.round(previous === undefined ? result : previous * 0.4 + result * 0.6);

/** Free alternative: three honest taps, no AI. Each answer is worth 0, 50 or 100. */
export const QUICK_CHECK: { q: string; options: [string, string, string] }[] = [
  { q: "Könntest du eine typische Klausuraufgabe dazu jetzt allein lösen?", options: ["Nein", "Mit Hilfe", "Ja"] },
  { q: "Kannst du die Kernidee in zwei Sätzen erklären?", options: ["Nein", "Ungefähr", "Ja"] },
  { q: "Wie viele Aufgaben dazu hast du schon selbst gerechnet?", options: ["Keine", "Ein paar", "Viele"] },
];
