import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
function loadTs(relativePath, overrides = null) {
  const file = path.resolve(root, relativePath);
  if (!overrides && cache.has(file)) return cache.get(file);
  const compiled = new Module(file);
  compiled.filename = file;
  compiled.paths = Module._nodeModulePaths(path.dirname(file));
  const originalRequire = compiled.require.bind(compiled);
  compiled.require = (id) => {
    if (overrides?.[id]) return overrides[id];
    if (id.startsWith(".")) {
      const candidate = path.resolve(path.dirname(file), id);
      for (const suffix of [".ts", ".tsx"]) if (fs.existsSync(candidate + suffix)) return loadTs(path.relative(root, candidate + suffix));
    }
    return originalRequire(id);
  };
  compiled._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, file);
  if (!overrides) cache.set(file, compiled.exports);
  return compiled.exports;
}
const { initialTimelineMinute, shouldShowHourLabel, localDateKey } = loadTs("src/lib/calendarLayout.ts");
const { getSessionStudyMinutes, getTotalDoneStudyMinutes, formatStudyMinutesExact } = loadTs("src/lib/studyStats.ts");

test("calendar initial scroll clamps today to 06–18, other days honor early/late appointments", () => {
  assert.equal(initialTimelineMinute(true, 120), 360);
  assert.equal(initialTimelineMinute(true, 750), 690);
  assert.equal(initialTimelineMinute(true, 1289), 1080);
  assert.equal(initialTimelineMinute(false, 750), 360);
  assert.equal(initialTimelineMinute(false, 750, 180), 180);
  assert.equal(initialTimelineMinute(false, 750, 1320), 1320);
});
test("hour label collision hides within 14 pixels only, not yesterday", () => {
  assert.equal(shouldShowHourLabel(22, 21 * 60 + 29, true), true);
  assert.equal(shouldShowHourLabel(22, 21 * 60 + 45, true), false);
  assert.equal(shouldShowHourLabel(22, 22 * 60, true), false);
  assert.equal(shouldShowHourLabel(22, 22 * 60, false), true);
});
test("statistics always prefer exact focusedMs, legacy/manual durations still work", () => {
  const s = { durationMinutes: 99, focusedMs: 134000, isDone: true, isHidden: false };
  assert.equal(getSessionStudyMinutes(s), 134000 / 60000);
  assert.equal(getTotalDoneStudyMinutes([{ studySessions: [s] }]), 134000 / 60000);
  assert.equal(getSessionStudyMinutes({ durationMinutes: 45 }), 45);
  assert.equal(getSessionStudyMinutes({ durationMinutes: 99, focusedMs: 0 }), 0);
  assert.equal(formatStudyMinutesExact(134000 / 60000), "2 min 14 s");
  assert.equal(formatStudyMinutesExact(20000 / 60000), "20 s");
});
test("week SVG renders all seven labels and exactly one persistent value label", () => {
  const LearningTrend = loadTs("src/components/LearningTrend.tsx").default;
  const session = { dateKey: localDateKey(new Date()), isDone: true, isHidden: false, durationMinutes: 99, focusedMs: 134000 };
  const markup = renderToStaticMarkup(React.createElement(LearningTrend, { exams: [{ studySessions: [session] }], thisWeekMinutes: 134000 / 60000, lastWeekMinutes: 0 }));
  for (const label of ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]) assert.match(markup, new RegExp(`>${label}</text>`));
  assert.equal((markup.match(/class="gg-trend-value"/g) || []).length, 1);
  assert.equal((markup.match(/class="gg-trend-tooltip"/g) || []).length, 0);
  assert.equal((markup.match(/class="gg-trend-bar/g) || []).length, 7);
});
test("ECTS is an 88px SVG circle, never conic or masked, with only percent inside", () => {
  const Ring = loadTs("src/components/EctsProgressRing.tsx").default;
  const markup = renderToStaticMarkup(React.createElement(Ring, { percent: 8 }));
  assert.match(markup, /width="88" height="88" viewBox="0 0 88 88"/);
  assert.match(markup, /stroke-width="10" stroke-linecap="round"/);
  assert.match(markup, /stroke-dashoffset=/);
  assert.match(markup, /rotate\(-90 44 44\)/);
  assert.match(markup, />8 %<\/text>/);
  assert.doesNotMatch(markup, /conic-gradient|mask|ECTS|Schnitt/);
});
test("completed today still carries today + done classes and an interior checkmark", () => {
  const Home = loadTs("src/components/StudyHomeFeed.tsx").default;
  const markup = renderToStaticMarkup(React.createElement(Home, {
    name: "Test", exams: [{ studySessions: [{ dateKey: localDateKey(new Date()), isDone: true, isHidden: false }], examDate: "2000-01-01" }],
    passedEcts: 14, targetEcts: 180, average: 1.7, streak: 1, weekMinutes: 2, timerRunning: false,
  }));
  assert.match(markup, /class="is-today is-done"[^]*?<strong>✓<\/strong>/);
  const css = fs.readFileSync(path.join(root, "src/app/mobile-ui.css"), "utf8");
  assert.match(css, /\.is-today\.is-done strong \{ border: 2px solid var\(--gg-ui-accent\)/);
});

// Exercise the actual Provider lifecycle with browser events and a mocked
// WakeLock port. These are integration tests, not real iOS rendering tests.
async function providerHarness(run, options = {}) {
  let effect, cleanup, clock = 1000000;
  const releases = [], requests = [];
  const fakeReact = {
    createContext: () => ({ Provider: "test-context" }),
    useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
    useEffect: (callback) => { effect = callback; },
  };
  const document = new EventTarget(); document.visibilityState = "visible";
  const window = new EventTarget();
  const values = new Map();
  window.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  window.setInterval = () => 1; window.clearInterval = () => {};
  const navigator = { wakeLock: { request: async kind => {
    requests.push(kind);
    if (options.rejectWakeLock) throw Error("unavailable");
    const sentinel = new EventTarget(); sentinel.released = false;
    sentinel.release = async () => { sentinel.released = true; releases.push(kind); sentinel.dispatchEvent(new Event("release")); };
    return sentinel;
  } } };
  const originals = Object.fromEntries(["document", "window", "navigator"].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const originalNow = Date.now;
  try {
    for (const [name, value] of Object.entries({ document, window, navigator })) Object.defineProperty(globalThis, name, { value, configurable: true });
    Date.now = () => clock;
    const Provider = loadTs("src/components/FocusSessionProvider.tsx", { react: fakeReact }).default;
    const element = Provider({ uid: "lifecycle", children: null });
    cleanup = effect();
    await run({ store: element.props.value.store, document, window, requests, releases,
      advance: ms => { clock += ms; }, now: () => clock,
      emit: (target, name) => target.dispatchEvent(new Event(name)),
      flush: async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); },
    });
  } finally {
    cleanup?.(); Date.now = originalNow;
    for (const name of Object.keys(originals)) {
      if (originals[name]) Object.defineProperty(globalThis, name, originals[name]);
      else delete globalThis[name];
    }
  }
}
const input = { examId: "statistics", sessionId: null, title: "Statistik", subjectTitle: "Statistik", mode: "focus", goalMinutes: 10 };
test("real provider handles Safari event order, resumes automatically and excludes 2:14", async () => {
  await providerHarness(async h => {
    h.store.start(input, h.now()); await h.flush();
    assert.deepEqual(h.requests, ["screen"]);
    h.advance(60000); h.emit(h.window, "blur");
    h.document.visibilityState = "hidden"; h.emit(h.document, "visibilitychange"); h.emit(h.window, "pagehide");
    assert.equal(h.store.getSnapshot().session.status, "away");
    h.advance(134000); h.emit(h.window, "focus");
    assert.equal(h.store.getSnapshot().session.status, "away");
    h.document.visibilityState = "visible"; h.emit(h.window, "pageshow"); h.emit(h.document, "visibilitychange");
    const s = h.store.getSnapshot().session;
    assert.equal(s.status, "running"); assert.equal(s.focusedMs, 60000); assert.equal(s.awayMs, 134000); assert.equal(s.awayCount, 1);
    await h.flush(); assert.equal(h.requests.length, 2); assert.equal(h.releases.length, 1);
  });
});
test("wake lock releases on pause/setting-off/finish and reacquires on resume", async () => {
  await providerHarness(async h => {
    h.store.start(input, h.now()); await h.flush();
    h.advance(60000); h.store.pause(h.now()); await h.flush(); assert.equal(h.releases.length, 1);
    h.store.resume(h.now()); await h.flush(); assert.equal(h.requests.length, 2);
    h.store.updateSettings({ keepScreenAwake: false }, h.now()); await h.flush(); assert.equal(h.releases.length, 2);
    h.store.updateSettings({ keepScreenAwake: true }, h.now()); await h.flush(); assert.equal(h.requests.length, 3);
    h.store.finish(h.now()); await h.flush(); assert.equal(h.releases.length, 3);
  });
});
test("wake-lock rejection is silently ignored and timing keeps working", async () => {
  await providerHarness(async h => {
    h.store.start(input, h.now()); await h.flush();
    h.advance(60000); h.store.finish(h.now());
    assert.equal(h.store.getSnapshot().session.focusedMs, 60000);
  }, { rejectWakeLock: true });
});
test("focus/blur alone handles visible Safari without a visibilitychange event", async () => {
  await providerHarness(async h => {
    h.store.start(input, h.now()); h.advance(60000); h.emit(h.window, "blur");
    h.advance(30000); h.emit(h.window, "focus");
    assert.equal(h.store.getSnapshot().session.focusedMs, 60000);
    assert.equal(h.store.getSnapshot().session.awayMs, 30000);
  });
});
