import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "src/neu/model.ts");
const compiled = new Module(file);
compiled.filename = file;
compiled._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { constellationFor, litStars, examShort, examColor, CONSTELLATIONS } = compiled.exports;

test("every constellation edge points at an existing star", () => {
  for (const item of CONSTELLATIONS) for (const [a, b] of item.edges) {
    assert.ok(item.stars[a] && item.stars[b], `${item.name} ${a}-${b}`);
  }
});

test("the plan size picks the smallest constellation that fits, Orion for big plans", () => {
  assert.equal(constellationFor(4).name, "Kassiopeia");
  assert.equal(constellationFor(6).name, "Großer Wagen");
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
