import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function loadTs(relativePath) {
  const file = path.resolve(root, relativePath);
  const compiled = new Module(file);
  compiled.filename = file;
  compiled.paths = Module._nodeModulePaths(path.dirname(file));
  compiled._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, file);
  return compiled.exports;
}
const { planTopicBlocks, getExamPlanStatus, getTodayBlocks, normalizeTopics } = loadTs("src/lib/examTopics.ts");

const topics = [
  { id: "a", name: "Matrizen", confidence: 3 },
  { id: "b", name: "Eigenwerte", confidence: 1 },
  { id: "c", name: "Reihen", confidence: 2 },
];
const topicCount = (blocks, id) => blocks.filter((block) => block.kind === "topic" && block.topic.id === id).length;

test("every topic gets a first pass, weakest first, then mock exam and final review", () => {
  const blocks = planTopicBlocks(topics, 10);
  assert.equal(blocks.length, 10);
  assert.deepEqual(blocks.slice(0, 3).map((block) => block.topic.id), ["b", "c", "a"]);
  assert.equal(blocks.at(-2).kind, "mock");
  assert.equal(blocks.at(-1).kind, "review");
  assert.ok(topicCount(blocks, "b") > topicCount(blocks, "a"), "weak topic gets more blocks than a strong one");
});

test("the same topic is never planned twice in a row", () => {
  const blocks = planTopicBlocks(topics, 14).filter((block) => block.kind === "topic");
  for (let index = 1; index < blocks.length; index += 1) {
    if (new Set(blocks.map((block) => block.topic.id)).size > 1 && blocks.slice(index).some((block) => block.topic.id !== blocks[index].topic.id)) {
      assert.notEqual(blocks[index].topic.id, blocks[index - 1].topic.id, `repeat at ${index}`);
    }
  }
});

test("too few blocks: only the weakest topics are planned", () => {
  const blocks = planTopicBlocks(topics, 2);
  assert.deepEqual(blocks.map((block) => block.topic.id), ["b", "c"]);
  assert.deepEqual(planTopicBlocks([], 5), []);
  assert.deepEqual(planTopicBlocks(topics, 0), []);
});

const session = (id, dateKey, extra = {}) => ({ id, examId: "e", title: id, dateKey, time: "", durationMinutes: 60, focus: "", notes: "", isDone: false, isHidden: false, isManual: false, ...extra });
const exam = (sessions, extra = {}) => ({ id: "e", title: "Mathe", moduleId: null, moduleName: "Mathe", examDate: "2026-11-05", examTime: "", kind: "exam", status: "learning", priority: "normal", notes: "", studyStartDays: 21, targetStudyMinutes: 0, dailyStudyLimitMinutes: 240, sessionGoalMinutes: 90, isHidden: false, studySessions: sessions, topics, ...extra });

test("plan status: missed blocks make you behind, done topics are counted", () => {
  const status = getExamPlanStatus(exam([
    session("s1", "2026-10-10", { isDone: true, topicId: "b" }),
    session("s2", "2026-10-11"),
    session("s3", "2026-10-14"),
  ]), "2026-10-12");
  assert.equal(status.state, "behind");
  assert.equal(status.overdueSessions.length, 1);
  assert.equal(status.topicsCovered, 1);
  assert.equal(status.topicsTotal, 3);
  assert.equal(status.daysUntil, 24);
  assert.equal(getExamPlanStatus(exam([session("s3", "2026-10-14")]), "2026-10-12").state, "on-track");
  assert.equal(getExamPlanStatus(exam([]), "2026-10-12").state, "no-plan");
});

test("today blocks: today first, then the most recent missed ones, never done or hidden", () => {
  const blocks = getTodayBlocks([exam([
    session("old", "2026-10-01"),
    session("missed", "2026-10-11"),
    session("today", "2026-10-12"),
    session("done", "2026-10-12", { isDone: true }),
    session("hidden", "2026-10-12", { isHidden: true }),
    session("future", "2026-10-13"),
  ])], "2026-10-12", 1);
  assert.deepEqual(blocks.map((block) => block.id), ["today", "missed"]);
  assert.equal(blocks[1].isOverdue, true);
});

test("normalizeTopics drops junk and clamps confidence", () => {
  assert.deepEqual(normalizeTopics([{ id: "x", name: "  Taylor ", confidence: 7 }, { name: "" }, null, "nope"]), [{ id: "x", name: "Taylor", confidence: 1 }]);
  assert.deepEqual(normalizeTopics(undefined), []);
});
