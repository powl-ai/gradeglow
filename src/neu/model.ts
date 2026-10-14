import type { AccentColor, ExamPlanItem } from "../types";

// Pure helpers for the new app (/neu). No React, no Firebase: easy to test.

export const ACCENTS: Record<AccentColor, string> = {
  violet: "#6d3af0", pink: "#db2777", blue: "#2563eb", emerald: "#0f9f6e",
  amber: "#d97706", cyan: "#0891b2", rose: "#e11d48",
};

/** Default colour per exam (by position) until the user picks one (premium). */
const EXAM_PALETTE = ["#6d3af0", "#f08a24", "#1f9d8a", "#e0457b", "#2f7cf6", "#b8860b"];
export const examColor = (exam: Pick<ExamPlanItem, "id">, all: Pick<ExamPlanItem, "id">[]) => {
  const custom = (exam as { color?: unknown }).color;
  if (typeof custom === "string" && /^#[0-9a-f]{6}$/i.test(custom)) return custom;
  const index = Math.max(0, all.findIndex((item) => item.id === exam.id));
  return EXAM_PALETTE[index % EXAM_PALETTE.length];
};

/** Short label for chips and captions: the full name if short, else its first word. */
export const examShort = (exam: Pick<ExamPlanItem, "title" | "moduleName">) => {
  const name = (exam.moduleName || exam.title || "Klausur").trim();
  if (name.length <= 16) return name;
  const first = name.split(/\s+/)[0];
  return first.length <= 14 ? first : `${first.slice(0, 13)}…`;
};

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const timeOf = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
export const fromKey = (key: string) => new Date(`${key}T12:00:00`);
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const mondayOf = (date: Date) => addDays(date, -((date.getDay() + 6) % 7));
export const daysBetween = (fromDateKey: string, toDateKey: string) =>
  Math.round((fromKey(toDateKey).getTime() - fromKey(fromDateKey).getTime()) / 86_400_000);

export const minutesLabel = (minutes: number) => {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60), m = total % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
};

export const dayLabel = (key: string, todayKey: string) => {
  const diff = daysBetween(todayKey, key);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Morgen";
  if (diff === -1) return "Gestern";
  return fromKey(key).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
};

// Constellations -------------------------------------------------------------
// Stick figures of real constellations in a 366 × 260 box. Star order is the
// order in which finished blocks light them; `m` is relative brightness.

export type Star = { x: number; y: number; m: number; tint?: string };
export type Constellation = { id: string; name: string; stars: Star[]; edges: [number, number][] };

export const CONSTELLATIONS: Constellation[] = [
  { id: "cas", name: "Kassiopeia", stars: [
    { x: 40, y: 140, m: 1.1 }, { x: 112, y: 86, m: 1.3 }, { x: 182, y: 140, m: 1.4 }, { x: 252, y: 70, m: 1.2 }, { x: 322, y: 118, m: 1 },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { id: "uma", name: "Großer Wagen", stars: [
    { x: 56, y: 70, m: 1.3 }, { x: 118, y: 62, m: 1.4 }, { x: 172, y: 86, m: 1.2 }, { x: 214, y: 112, m: 1 },
    { x: 222, y: 176, m: 1.3 }, { x: 306, y: 186, m: 1.4 }, { x: 314, y: 120, m: 1.2 },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { id: "cyg", name: "Schwan", stars: [
    { x: 183, y: 28, m: 1.6 }, { x: 183, y: 112, m: 1.3 }, { x: 120, y: 98, m: 1.1 }, { x: 246, y: 128, m: 1.1 },
    { x: 183, y: 172, m: 0.9 }, { x: 56, y: 80, m: 0.9 }, { x: 310, y: 150, m: 0.9 }, { x: 183, y: 244, m: 1.2, tint: "#ffd9a8" },
  ], edges: [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 7]] },
  { id: "leo", name: "Löwe", stars: [
    { x: 80, y: 196, m: 1.6, tint: "#dfe8ff" }, { x: 100, y: 146, m: 1 }, { x: 130, y: 108, m: 1.3 }, { x: 116, y: 72, m: 0.9 },
    { x: 150, y: 50, m: 0.9 }, { x: 186, y: 62, m: 1 }, { x: 250, y: 122, m: 1.2 }, { x: 256, y: 178, m: 1 }, { x: 330, y: 152, m: 1.3 },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 0], [6, 8], [7, 8]] },
  { id: "ori", name: "Orion", stars: [
    { x: 160, y: 170, m: 1.2 }, { x: 182, y: 164, m: 1.3 }, { x: 204, y: 158, m: 1.1 },
    { x: 128, y: 96, m: 1.8, tint: "#ffd2a8" }, { x: 228, y: 108, m: 1.3 }, { x: 180, y: 66, m: 0.9 },
    { x: 144, y: 252, m: 1.2 }, { x: 240, y: 242, m: 1.8, tint: "#d6e4ff" },
    { x: 178, y: 196, m: 0.8 }, { x: 176, y: 214, m: 0.9 },
    { x: 106, y: 70, m: 0.8 }, { x: 88, y: 42, m: 0.8 }, { x: 102, y: 20, m: 0.7 },
    { x: 266, y: 62, m: 0.7 }, { x: 278, y: 86, m: 0.8 }, { x: 282, y: 112, m: 0.8 }, { x: 278, y: 138, m: 0.7 }, { x: 266, y: 160, m: 0.7 },
  ], edges: [[5, 3], [5, 4], [3, 0], [4, 2], [0, 1], [1, 2], [0, 6], [2, 7], [1, 8], [8, 9], [3, 10], [10, 11], [11, 12], [4, 15], [13, 14], [14, 15], [15, 16], [16, 17]] },
];

/** The smallest constellation that has a star for every block (Orion for big plans). */
export const constellationFor = (blockCount: number) =>
  CONSTELLATIONS.find((item) => item.stars.length >= blockCount) ?? CONSTELLATIONS[CONSTELLATIONS.length - 1];

/** How many stars are lit when `done` of `total` blocks are finished. */
export const litStars = (constellation: Constellation, done: number, total: number) => {
  if (total <= 0) return 0;
  const stars = constellation.stars.length;
  if (done >= total) return stars;
  return Math.min(stars - 1, Math.floor((done / total) * stars));
};
