import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const compiled = new Module(file);
  compiled.filename = file;
  cache.set(file, compiled);
  compiled.require = (id) => load(path.relative(root, path.resolve(path.dirname(file), id)) + ".ts");
  compiled._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
  return compiled.exports;
}
const { constellationFor, litStars, examShort, examColor, streakDays, CONSTELLATIONS } = load("src/neu/model.ts");
const { planSessions, replan, pickStudyDays } = load("src/neu/plan.ts");

test("every constellation edge points at an existing star", () => {
  for (const item of CONSTELLATIONS) for (const [a, b] of item.edges) {
    assert.ok(item.stars[a] && item.stars[b], `${item.name} ${a}-${b}`);
  }
});

test("the plan size picks the constellation with the closest number of stars", () => {
  assert.equal(constellationFor(4).name, "Kassiopeia");
  assert.equal(constellationFor(6).name, "Großer Wagen");
  assert.equal(constellationFor(15).name, "Skorpion");
  assert.equal(constellationFor(18).name, "Orion");
  assert.equal(constellationFor(40).name, "Orion");
});

test("all stars light only when every block is done", () => {
  const wagen = constellationFor(6);
  assert.equal(litStars(wagen, 0, 6), 0);
  assert.equal(litStars(wagen, 5, 6), 5);
  assert.equal(litStars(wagen, 6, 6), 7);
  const orion = constellationFor(36);
  assert.equal(litStars(orion, 18, 36), 9);
  assert.equal(litStars(orion, 35, 36), 17);
  assert.equal(litStars(orion, 36, 36), 18);
  assert.equal(litStars(orion, 0, 0), 0);
});

test("short exam names stay readable", () => {
  assert.equal(examShort({ title: "", moduleName: "Wirtschaftsrecht" }), "Wirtschaftsrecht");
  assert.equal(examShort({ title: "", moduleName: "Analysis I und Lineare Algebra" }), "Analysis");
  assert.equal(examShort({ title: "Mechanik", moduleName: "" }), "Mechanik");
});

test("exam colours: custom hex wins, otherwise a stable palette slot", () => {
  const all = [{ id: "a" }, { id: "b" }];
  assert.equal(examColor({ id: "b", color: "#123456" }, all), "#123456");
  assert.equal(examColor({ id: "b" }, all), examColor({ id: "b" }, all));
  assert.notEqual(examColor({ id: "a" }, all), examColor({ id: "b" }, all));
});

const exam = (patch = {}) => ({
  id: "e1", title: "Klausur Mathe", moduleId: null, moduleName: "Mathe", examDate: "2026-11-07", examTime: "", kind: "exam",
  status: "planned", priority: "normal", notes: "", studyStartDays: 21, targetStudyMinutes: 0, dailyStudyLimitMinutes: 120,
  sessionGoalMinutes: 60, isHidden: false, studySessions: [], topics: [], ...patch,
});
let n = 0;
const makeId = () => `s${n++}`;

test("plan: blocks sit before the exam, never on Sundays, within the daily limit", () => {
  const sessions = planSessions(exam(), { today: "2026-10-14", makeId });
  assert.ok(sessions.length > 5);
  for (const s of sessions) {
    assert.ok(s.dateKey >= "2026-10-17" && s.dateKey < "2026-11-07", s.dateKey);
    assert.notEqual(new Date(`${s.dateKey}T12:00:00`).getDay(), 0);
  }
  const perDay = new Map();
  sessions.forEach((s) => perDay.set(s.dateKey, (perDay.get(s.dateKey) ?? 0) + s.durationMinutes));
  assert.ok([...perDay.values()].every((minutes) => minutes <= 120));
});

test("plan: topics become block titles, weak topics first, final review last", () => {
  const topics = [{ id: "t1", name: "Eigenwerte", confidence: 1 }, { id: "t2", name: "LGS", confidence: 3 }];
  const sessions = planSessions(exam({ topics }), { today: "2026-10-14", makeId });
  assert.equal(sessions[0].title, "Eigenwerte");
  assert.match(sessions.at(-1).title, /Finale Wiederholung/);
});

test("plan: nothing for exams today or in the past", () => {
  assert.equal(planSessions(exam({ examDate: "2026-10-14" }), { today: "2026-10-14", makeId }).length, 0);
});

test("replan keeps done and hand-made blocks", () => {
  const done = { id: "d", examId: "e1", title: "x", dateKey: "2026-10-13", time: "", durationMinutes: 60, focus: "", notes: "", isDone: true, isHidden: false, isManual: false };
  const manual = { ...done, id: "m", dateKey: "2026-10-20", isDone: false, isManual: true };
  const result = replan(exam({ studySessions: [done, manual] }), [], "2026-10-14");
  assert.ok(result.some((s) => s.id === "d") && result.some((s) => s.id === "m"));
  assert.ok(result.length > 2);
});

test("streak survives until today is over", () => {
  const done = (dateKey) => ({ dateKey, isDone: true, isHidden: false });
  const exams = [{ studySessions: [done("2026-10-13"), done("2026-10-14")] }];
  assert.equal(streakDays(exams, "2026-10-15"), 2);
  assert.equal(streakDays(exams, "2026-10-14"), 2);
  assert.equal(streakDays(exams, "2026-10-16"), 0);
});

test("study days per week: evenly spread, the day before the exam always included", () => {
  const days = Array.from({ length: 18 }, (_, i) => `d${String(i).padStart(2, "0")}`);
  assert.equal(pickStudyDays(days, 6).length, 18);
  const four = pickStudyDays(days, 4);
  assert.equal(four.length, 12);
  assert.equal(four.at(-1), "d17");
  assert.equal(pickStudyDays(days, 3).length, 9);
});

test("plan with 4 study days a week has fewer, not denser, days", () => {
  const six = planSessions(exam(), { today: "2026-10-14", makeId, daysPerWeek: 6 });
  const four = planSessions(exam(), { today: "2026-10-14", makeId, daysPerWeek: 4 });
  const daysOf = (list) => new Set(list.map((s) => s.dateKey)).size;
  assert.ok(daysOf(four) < daysOf(six));
  assert.ok(four.length < six.length);
});

test("many rounds of one topic become exercise blocks instead of 'Runde 12'", () => {
  const sessions = planSessions(exam({ topics: [{ id: "t", name: "Hub", confidence: 2 }] }), { today: "2026-10-14", makeId });
  assert.ok(sessions.every((s) => !/Runde (\d{2}|[3-9])/.test(s.title)));
});
