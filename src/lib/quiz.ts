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

/** Free alternative: five honest taps, no AI. Each answer is worth 0, 50 or 100. */
export const QUICK_CHECK: { q: string; options: [string, string, string] }[] = [
  { q: "Könntest du eine typische Klausuraufgabe dazu jetzt allein lösen?", options: ["Nein", "Mit Hilfe", "Ja"] },
  { q: "Kannst du die Kernidee in zwei Sätzen erklären?", options: ["Nein", "Ungefähr", "Ja"] },
  { q: "Wie viele Aufgaben dazu hast du schon selbst gerechnet?", options: ["Keine", "Ein paar", "Viele"] },
  { q: "Wie oft musstest du heute ins Skript oder in die Lösung schauen?", options: ["Ständig", "Ab und zu", "Kaum"] },
  { q: "Erkennst du bei einer neuen Aufgabe, welcher Ansatz passt?", options: ["Nein", "Manchmal", "Meistens"] },
];

/** Fixed questions for preview links without an API key, so the whole flow can be tested for free. */
export const SAMPLE_QUIZ: QuizQuestion[] = [
  { q: "Welche Eigenwerte hat die Matrix A = [[2, 0], [0, 3]]?", options: ["0 und 5", "2 und 3", "5 und 6", "1 und 6"], answer: 1,
    why: "Bei einer Diagonalmatrix stehen die Eigenwerte auf der Diagonalen." },
  { q: "Wie lautet das charakteristische Polynom von A = [[1, 2], [2, 1]]?", options: ["λ^2 + 2λ − 3", "λ^2 − 3", "λ^2 − 2λ − 3", "λ^2 − 2λ + 5"], answer: 2,
    why: "det(A − λI) = (1 − λ)^2 − 4 = λ^2 − 2λ − 3, also Eigenwerte 3 und −1." },
  { q: "λ ist ein Eigenwert von A. Welcher Wert ist dann sicher ein Eigenwert von A^2?", options: ["2λ", "λ + 2", "sqrt(λ)", "λ^2"], answer: 3,
    why: "Aus Av = λv folgt A^2 v = A(λv) = λ^2 v." },
  { q: "Die Summe aller Eigenwerte einer Matrix (mit Vielfachheit) ist gleich …", options: ["der Spur", "der Determinante", "dem Rang", "der Anzahl der Zeilen"], answer: 0,
    why: "Die Spur ist die Summe, die Determinante das Produkt der Eigenwerte." },
  { q: "Eine 3×3-Matrix A hat die Eigenwerte 1, 2 und 0. Ist A invertierbar?", options: ["Ja, weil sie drei verschiedene Eigenwerte hat", "Nein, weil 0 ein Eigenwert ist", "Ja, weil 1 ein Eigenwert ist", "Das kann man nicht sagen"], answer: 1,
    why: "det(A) ist das Produkt der Eigenwerte, hier 0. Also ist A nicht invertierbar." },
  { q: "Wann ist eine n×n-Matrix sicher diagonalisierbar?", options: ["Wenn ihre Determinante nicht 0 ist", "Wenn alle Einträge positiv sind", "Wenn sie n verschiedene Eigenwerte hat", "Wenn sie eine obere Dreiecksmatrix ist"], answer: 2,
    why: "n verschiedene Eigenwerte liefern n linear unabhängige Eigenvektoren." },
];
