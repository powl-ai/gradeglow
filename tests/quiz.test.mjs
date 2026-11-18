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
const { parseQuiz, blendPct, QUIZ_LENGTH, SAMPLE_QUIZ } = loadTs("src/lib/quiz.ts");

const question = (i) => ({ q: `Frage ${i}`, options: ["a", "b", "c", "d"], answer: i % 4, why: "weil" });

test("parseQuiz reads JSON even with text around it, and checks every question", () => {
  const ok = parseQuiz(`Hier: ${JSON.stringify({ questions: Array.from({ length: QUIZ_LENGTH }, (_, i) => question(i)) })} Ende`);
  assert.equal(ok.length, QUIZ_LENGTH);
  assert.equal(parseQuiz("kein json"), null);
  const broken = Array.from({ length: QUIZ_LENGTH }, (_, i) => question(i));
  broken[0] = { ...broken[0], answer: 7 };
  assert.equal(parseQuiz(JSON.stringify({ questions: broken })), null);
});

test("blendPct weighs the latest result more", () => {
  assert.equal(blendPct(undefined, 50), 50);
  assert.equal(blendPct(100, 0), 40);
  assert.equal(blendPct(20, 100), 68);
});

test("sample questions for preview links are valid", () => {
  assert.equal(parseQuiz(JSON.stringify({ questions: SAMPLE_QUIZ })).length, QUIZ_LENGTH);
});
