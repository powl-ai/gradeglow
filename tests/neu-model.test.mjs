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

// Etappe 2 ---------------------------------------------------------------------
const { monthCells, addMonths, examSlots, skyCollection } = load("src/neu/model.ts");
const { gradeSummary, effectiveStatus, finalGrade, gradeLabel, parseGrade, bySemester, scheduleByDay, validTimes } = load("src/neu/studium.ts");

test("month grid: whole weeks from Monday, neighbours flagged", () => {
  const nov = monthCells("2026-11-13"); // 1 Nov 2026 is a Sunday
  assert.equal(nov.length, 42);
  assert.equal(nov[0].key, "2026-10-26");
  assert.equal(nov[0].inMonth, false);
  assert.equal(nov[6].key, "2026-11-01");
  assert.equal(nov[6].inMonth, true);
  assert.equal(nov.filter((cell) => cell.inMonth).length, 30);
  const feb = monthCells("2027-02-10"); // 1 Feb 2027 is a Monday, 28 days
  assert.equal(feb.length, 28);
  assert.ok(feb.every((cell) => cell.inMonth));
  assert.equal(monthCells("2026-06-01").length, 35);
});

test("month steps clamp to the last day and cross years", () => {
  assert.equal(addMonths("2027-01-31", 1), "2027-02-28");
  assert.equal(addMonths("2026-12-15", 1), "2027-01-15");
  assert.equal(addMonths("2026-01-15", -1), "2025-12-15");
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
});

test("free limit counts only visible, open, upcoming exams", () => {
  const item = (patch = {}) => ({ isHidden: false, status: "planned", examDate: "2026-12-01", ...patch });
  const exams = [item(), item(), item({ isHidden: true }), item({ status: "done" }), item({ examDate: "2026-11-01" }), item({ examDate: "2026-11-13" })];
  const free = examSlots(exams, "2026-11-13", 5);
  assert.deepEqual([free.used, free.left, free.full, free.limited], [3, 2, false, true]);
  assert.equal(examSlots(exams, "2026-11-13", 3).full, true);
  const premium = examSlots(exams, "2026-11-13", Number.POSITIVE_INFINITY);
  assert.deepEqual([premium.full, premium.limited], [false, false]);
});

test("sky collection: finished plans first, exams without a plan are left out", () => {
  const block = (isDone, isHidden = false) => ({ isDone, isHidden });
  const base = { title: "", isHidden: false };
  const list = skyCollection([
    { ...base, id: "a", moduleName: "Mechanik", examDate: "2027-02-10", studySessions: [block(true), block(false), block(false), block(false)] },
    { ...base, id: "b", moduleName: "Mikro", examDate: "2026-07-20", studySessions: [block(true), block(true), block(true), block(true), block(false, true)] },
    { ...base, id: "c", moduleName: "Leer", examDate: "2027-03-01", studySessions: [] },
    { ...base, id: "d", moduleName: "Versteckt", examDate: "2027-03-01", isHidden: true, studySessions: [block(true)] },
  ]);
  assert.deepEqual(list.map((sky) => sky.examId), ["b", "a"]);
  assert.equal(list[0].complete, true);
  assert.equal(list[0].lit, list[0].constellation.stars.length);
  assert.equal(list[1].complete, false);
  assert.ok(list[1].lit < list[1].constellation.stars.length);
});

const mod = (patch = {}) => ({ name: "M", ects: 6, grade: null, semester: 1, status: "passed", assessments: [], ...patch });

test("grades: ECTS-weighted average of passed modules, ungraded passes count as ECTS only", () => {
  const summary = gradeSummary([
    mod({ ects: 12, grade: 1.7 }), mod({ ects: 6, grade: 3.0 }), mod({ status: "ungraded" }),
    mod({ status: "open" }), mod({ grade: 5.0 }), mod({ status: "open", grade: 2.0 }),
  ], 180);
  assert.equal(summary.gradedEcts, 18);
  assert.ok(Math.abs(summary.average - (12 * 1.7 + 6 * 3) / 18) < 1e-9);
  assert.equal(summary.earnedEcts, 24);
  assert.equal(summary.openEcts, 18);
  assert.ok(Math.abs(summary.progress - 24 / 180) < 1e-9);
});

test("grades: empty list and missing target stay sane", () => {
  const summary = gradeSummary([], 0);
  assert.equal(summary.average, null);
  assert.equal(summary.targetEcts, 180);
  assert.equal(summary.progress, 0);
  assert.equal(gradeSummary([mod({ ects: 400, grade: 1 })], 180).progress, 1);
});

test("grades: partial assessments and failed grades", () => {
  const parts = mod({ grade: null, status: "open", assessments: [{ id: "1", name: "a", weight: 50, grade: 1.0 }, { id: "2", name: "b", weight: 50, grade: 3.0 }] });
  assert.equal(finalGrade(parts), 2);
  assert.equal(effectiveStatus(parts), "passed");
  assert.equal(effectiveStatus(mod({ grade: 4.3 })), "failed");
  assert.equal(effectiveStatus(mod({ grade: 4.0 })), "passed");
  assert.equal(effectiveStatus(mod({ status: "open" })), "open");
});

test("grade text: German comma in, comma out, nonsense rejected", () => {
  assert.equal(gradeLabel(1.7), "1,7");
  assert.equal(gradeLabel(2.3333, 2), "2,33");
  assert.equal(gradeLabel(null), "–");
  assert.equal(parseGrade("1,7"), 1.7);
  assert.equal(parseGrade(" 2.3 "), 2.3);
  assert.equal(parseGrade(""), null);
  assert.equal(parseGrade("0,7"), undefined);
  assert.equal(parseGrade("sehr gut"), undefined);
});

test("modules group by semester in order", () => {
  const groups = bySemester([mod({ name: "Mikro", semester: 3 }), mod({ name: "Mechanik", semester: 1 }), mod({ name: "Analysis", semester: 1 })]);
  assert.deepEqual(groups.map((group) => group.semester), [1, 3]);
  assert.deepEqual(groups[0].items.map((item) => item.name), ["Analysis", "Mechanik"]);
});

test("timetable: Monday first, Sunday last, by start time, hidden and empty days dropped", () => {
  const entry = (title, weekday, startTime, isHidden = false) => ({ title, weekday, startTime, isHidden });
  const days = scheduleByDay([entry("So", 0, "10:00"), entry("Spät", 1, "14:00"), entry("Früh", 1, "08:15"), entry("Weg", 3, "10:00", true)]);
  assert.deepEqual(days.map((day) => day.label), ["Montag", "Sonntag"]);
  assert.deepEqual(days[0].items.map((item) => item.title), ["Früh", "Spät"]);
});

test("timetable times: end after start, empty allowed", () => {
  assert.equal(validTimes("10:15", "11:45"), true);
  assert.equal(validTimes("", ""), true);
  assert.equal(validTimes("12:00", "10:00"), false);
  assert.equal(validTimes("25:00", ""), false);
});

test("module form: new module, failed grade counts an attempt, edits keep the rest", () => {
  const { applyModuleInput } = load("src/neu/studium.ts");
  const fresh = applyModuleInput({ name: " Mechanik ", ects: 9, semester: 2, status: "passed", grade: 2.3 }, null, () => "id1");
  assert.deepEqual([fresh.id, fresh.name, fresh.ects, fresh.grade, fresh.status, fresh.attemptCount, fresh.plannedSemester, fresh.isLocked], ["id1", "Mechanik", 9, 2.3, "passed", 0, 2, false]);
  const failed = applyModuleInput({ name: "Mechanik", ects: 9, semester: 2, status: "passed", grade: 5 }, fresh);
  assert.deepEqual([failed.id, failed.status, failed.attemptCount, failed.isLocked], ["id1", "failed", 1, false]);
  const again = applyModuleInput({ name: "Mechanik", ects: 9, semester: 2, status: "failed", grade: 5 }, failed);
  assert.equal(again.attemptCount, 1);
  const kept = applyModuleInput({ name: "Mechanik", ects: 9, semester: 3, status: "open", grade: null }, { ...fresh, notes: "n", targetGrade: 2, category: "mandatory" });
  assert.deepEqual([kept.notes, kept.targetGrade, kept.category, kept.semester, kept.grade], ["n", 2, "mandatory", 3, null]);
  const parts = { ...fresh, grade: null, assessments: [{ id: "1", name: "a", weight: 100, grade: 1.3 }] };
  assert.equal(applyModuleInput({ name: "M", ects: 9, semester: 2, status: "open", grade: 4.7 }, parts).grade, null);
});
