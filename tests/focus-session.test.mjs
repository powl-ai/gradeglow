/* Run: node --test tests/focus-session.test.mjs (no extra dependencies). */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import Module from "node:module";
import { fileURLToPath } from "node:url";
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadTs(relativePath) {
  const file = path.resolve(testDirectory, "..", relativePath);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const compiled = new Module(file);
  compiled.filename = file;
  compiled.paths = Module._nodeModulePaths(path.dirname(file));
  compiled._compile(output, file);
  return compiled.exports;
}

const { createFocusSessionStore, getFocusElapsedMs, getFocusStorageKey, parseFocusSnapshot, LEGACY_FOCUS_KEY } = loadTs("src/lib/focusSession.ts");
const { migrateExams } = loadTs("src/lib/gradeglowExams.ts");
const { supportsFocusNotifications, requestFocusNotificationPermission, showFocusNotification, clearFocusNotifications } = loadTs("src/lib/focusNotifications.ts");
const { WebFocusLock } = loadTs("src/lib/focusLock.ts");
const { createNativeFocusLock } = loadTs("plugins/focus-lock/src/index.ts");
const input = { examId: "statistics", sessionId: null, title: "Statistik", subjectTitle: "Statistik", mode: "focus", goalMinutes: 10 };
const startTime = Date.parse("2026-10-09T18:00:00Z");
const minute = 60_000;

function fixture(uid = "user-a", storage) {
  const values = storage?.values ?? new Map();
  const port = storage ?? { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  let nextId = 0;
  const store = createFocusSessionStore(uid, () => `id-${++nextId}`);
  store.hydrate(port, startTime, true);
  return { store, port, values };
}

test("foreground time uses timestamps, not interval increments", () => {
  const { store } = fixture();
  const session = store.start(input, startTime);
  assert.equal(getFocusElapsedMs(session, startTime + 7 * minute), 7 * minute);
  store.tick(startTime + 30 * minute);
  const finished = store.getSnapshot().session;
  assert.equal(finished.status, "finished");
  assert.equal(finished.endedAt, startTime + 10 * minute);
  assert.equal(finished.focusedMs, 10 * minute);
});

test("pause, reboot and resume exclude manually paused time", () => {
  const { store, port } = fixture();
  store.start(input, startTime); store.pause(startTime + 2 * minute);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 50 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "paused");
  assert.equal(getFocusElapsedMs(restored.getSnapshot().session, startTime + 50 * minute), 2 * minute);
  restored.resume(startTime + 50 * minute);
  assert.equal(restored.getSnapshot().session.endsAt, startTime + 58 * minute);
  restored.tick(startTime + 70 * minute);
  assert.equal(restored.getSnapshot().session.endedAt, startTime + 58 * minute);
  assert.equal(restored.getSnapshot().session.focusedMs, 10 * minute);
});

test("kill without pagehide restores paused at last foreground checkpoint", () => {
  const { store, port } = fixture();
  store.start(input, startTime); store.heartbeat(startTime + minute);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 40 * minute, true);
  const s = restored.getSnapshot().session;
  assert.equal(s.status, "paused");
  assert.equal(s.subjectTitle, "Statistik");
  assert.equal(s.focusedMs, minute);
  assert.equal(s.awayMs, 39 * minute);
  assert.equal(s.awayCount, 1);
  assert.equal(getFocusElapsedMs(s, startTime + 80 * minute), minute);
  restored.returnToApp(startTime + 80 * minute);
  assert.equal(restored.getSnapshot().session.status, "paused");
});

test("protection is off by default but foreground-only timing is always active", () => {
  const { store } = fixture();
  store.start(input, startTime);
  assert.deepEqual(store.getSnapshot().settings, { protectionEnabled: false, notificationsEnabled: false, keepScreenAwake: true });
  assert.equal(store.leaveApp(startTime + minute), true);
  assert.equal(store.getSnapshot().session.status, "away");
  store.returnToApp(startTime + 3 * minute);
  const s = store.getSnapshot().session;
  assert.equal(s.focusedMs, minute);
  assert.equal(s.awayMs, 2 * minute);
  assert.equal(s.awayCount, 1);
  store.updateSettings({ notificationsEnabled: true }, startTime + 3 * minute);
  assert.equal(store.getSnapshot().settings.notificationsEnabled, false);
});

test("duplicate visibility/pagehide/blur and pageshow/focus events count once", () => {
  const { store } = fixture();
  store.start(input, startTime);
  assert.equal(store.leaveApp(startTime + minute), true);
  assert.equal(store.leaveApp(startTime + minute + 300), false);
  assert.equal(store.leaveApp(startTime + minute + 500), false);
  store.returnToApp(startTime + 3 * minute);
  store.returnToApp(startTime + 3 * minute + 200);
  const s = store.getSnapshot().session;
  assert.equal(s.awayCount, 1);
  assert.equal(s.absences.length, 1);
  assert.equal(s.awayMs, 2 * minute);
  assert.equal(store.getSnapshot().returnFeedback.durationMs, 2 * minute);
});

test("background longer than old deadline never completes or gains study time", () => {
  const { store } = fixture();
  store.start(input, startTime); store.leaveApp(startTime + minute);
  assert.equal(store.tick(startTime + 20 * minute), false);
  assert.equal(getFocusElapsedMs(store.getSnapshot().session, startTime + 20 * minute), minute);
  store.returnToApp(startTime + 40 * minute);
  const s = store.getSnapshot().session;
  assert.equal(s.status, "running"); assert.equal(s.focusedMs, minute);
  assert.equal(s.awayMs, 39 * minute); assert.equal(s.endsAt, startTime + 49 * minute);
  store.tick(startTime + 49 * minute);
  assert.equal(store.getSnapshot().session.focusedMs, 10 * minute);
});

test("kill while away restores paused and persists absence once", () => {
  const { store, port } = fixture();
  store.start(input, startTime); store.leaveApp(startTime + minute);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 3 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "paused");
  assert.equal(restored.getSnapshot().session.focusedMs, minute);
  assert.equal(restored.getSnapshot().session.awayMs, 2 * minute);
  const again = createFocusSessionStore("user-a");
  again.hydrate(port, startTime + 10 * minute, true);
  assert.equal(again.getSnapshot().session.awayCount, 1);
  assert.equal(again.getSnapshot().session.awayMs, 2 * minute);
});

test("screen-lock equivalent departure freezes learning until return", () => {
  const { store } = fixture();
  store.start(input, startTime); store.leaveApp(startTime + 2 * minute);
  store.heartbeat(startTime + 30 * minute);
  assert.equal(store.getSnapshot().session.focusedMs, 2 * minute);
  store.returnToApp(startTime + 30 * minute);
  store.finish(startTime + 32 * minute);
  assert.equal(store.getSnapshot().session.focusedMs, 4 * minute);
  assert.equal(store.getSnapshot().session.awayMs, 28 * minute);
});

for (const duration of [1, 9999, 10000, 10001, 60000, 134000]) {
  test(`grace boundary: ${duration} ms interruption`, () => {
    const { store } = fixture();
    store.start(input, startTime); store.leaveApp(startTime + minute);
    store.returnToApp(startTime + minute + duration);
    const s = store.getSnapshot().session, tolerated = duration <= 10000;
    assert.equal(s.focusedMs, minute + (tolerated ? duration : 0));
    assert.equal(s.awayMs, tolerated ? 0 : duration);
    assert.equal(s.awayCount, tolerated ? 0 : 1);
    assert.equal(store.getSnapshot().returnFeedback === null, tolerated);
  });
}

test("turning protection off during absence does not erase or credit it", () => {
  const { store } = fixture();
  store.updateSettings({ protectionEnabled: true, notificationsEnabled: true }, startTime);
  store.start(input, startTime); store.leaveApp(startTime + minute);
  store.updateSettings({ protectionEnabled: false }, startTime + 2 * minute);
  assert.equal(store.getSnapshot().session.awaySince, startTime + minute);
  store.returnToApp(startTime + 3 * minute);
  assert.equal(store.getSnapshot().session.focusedMs, minute);
  assert.equal(store.getSnapshot().session.awayMs, 2 * minute);
  assert.equal(store.getSnapshot().settings.notificationsEnabled, false);
});

test("manually paused sessions never auto-resume after returning", () => {
  const { store } = fixture();
  store.start(input, startTime); store.pause(startTime + minute);
  assert.equal(store.leaveApp(startTime + 2 * minute), false);
  store.returnToApp(startTime + 3 * minute);
  assert.equal(store.getSnapshot().session.status, "paused");
  assert.equal(store.getSnapshot().session.awayMs, 0);
  store.resume(startTime + 3 * minute);
  assert.equal(store.getSnapshot().session.endsAt, startTime + 12 * minute);
});

test("cannot start or resume while hidden", () => {
  const { store } = fixture();
  store.leaveApp(startTime); assert.equal(store.start(input, startTime), null);
  store.returnToApp(startTime); store.start(input, startTime); store.pause(startTime + minute);
  store.leaveApp(startTime + minute); store.resume(startTime + 2 * minute);
  assert.equal(store.getSnapshot().session.status, "paused");
});

test("cannot overwrite active/away/paused or unsaved completed session", () => {
  const { store, port } = fixture();
  store.start(input, startTime); assert.equal(store.start(input, startTime + minute), null);
  store.leaveApp(startTime + minute); assert.equal(store.start(input, startTime + 2 * minute), null);
  store.returnToApp(startTime + 2 * minute); store.pause(startTime + 3 * minute);
  assert.equal(store.start(input, startTime + 3 * minute), null);
  store.finish(startTime + 4 * minute); assert.equal(store.start(input, startTime + 4 * minute), null);
  store.abort(startTime + 4 * minute);
  const restored = createFocusSessionStore("user-a", () => "next-id");
  restored.hydrate(port, startTime + 5 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "abgebrochen");
  assert.ok(restored.start(input, startTime + 5 * minute));
});

test("saved focused/away metrics stay frozen and planner reward flag survives", () => {
  const { store, port } = fixture();
  const session = store.start({ ...input, sessionId: "planned-block", rewardOnSave: true }, startTime);
  store.leaveApp(startTime + minute); store.returnToApp(startTime + 3 * minute);
  store.finish(startTime + 4 * minute); store.markSaved(session.id, "planned-block");
  const restored = createFocusSessionStore("user-a", () => "next-id");
  restored.hydrate(port, startTime + 15 * minute, true);
  const s = restored.getSnapshot().session;
  assert.equal(s.savedSessionId, "planned-block"); assert.equal(s.rewardOnSave, true);
  assert.equal(getFocusElapsedMs(s, startTime + 15 * minute), 2 * minute);
  assert.equal(s.awayMs, 2 * minute); assert.equal(s.awayCount, 1);
  assert.ok(restored.start(input, startTime + 15 * minute));
});

test("finishing and aborting while away exclude the absence", () => {
  for (const action of ["finish", "abort"]) {
    const { store } = fixture();
    store.start(input, startTime); store.leaveApp(startTime + minute);
    store[action](startTime + 4 * minute);
    assert.equal(store.getSnapshot().session.focusedMs, minute);
    assert.equal(store.getSnapshot().session.awayMs, 3 * minute);
  }
});

test("grace cannot exceed the goal and completes only on return", () => {
  const { store } = fixture();
  store.start({ ...input, goalMinutes: 1 }, startTime);
  store.leaveApp(startTime + 55000); store.tick(startTime + 61000);
  assert.equal(store.getSnapshot().session.status, "away");
  store.returnToApp(startTime + 62000);
  assert.equal(store.getSnapshot().session.status, "finished");
  assert.equal(store.getSnapshot().session.focusedMs, minute);
});

test("timer data and settings are isolated by account", () => {
  const { store, port } = fixture("user-a");
  store.start(input, startTime); store.updateSettings({ keepScreenAwake: false }, startTime);
  const other = fixture("user-b", port).store;
  assert.equal(other.getSnapshot().session, null);
  assert.equal(other.getSnapshot().settings.keepScreenAwake, true);
  assert.notEqual(getFocusStorageKey("user-a"), getFocusStorageKey("user-b"));
});

test("legacy timer requires an existing exam and never invents foreground time", () => {
  const { store, values } = fixture();
  values.set(LEGACY_FOCUS_KEY, JSON.stringify({ examId: "statistics", sessionId: "planned", title: "Statistik", startedAt: startTime, mode: "focus", goalMinutes: 10 }));
  store.migrateLegacy(["other-exam"], startTime + minute);
  assert.equal(store.getSnapshot().session, null);
  store.migrateLegacy(["statistics"], startTime + 15 * minute);
  assert.equal(store.getSnapshot().session.status, "paused");
  assert.equal(store.getSnapshot().session.focusedMs, 0);
  assert.equal(values.has(LEGACY_FOCUS_KEY), false);
});

test("version 1 migrates to checkpointed paused state, without reload credit", () => {
  const { store, port, values } = fixture();
  store.start(input, startTime);
  const old = { ...store.getSnapshot().session, elapsedMs: 0, lastSeenAt: startTime + minute };
  delete old.focusedMs; delete old.awayMs; delete old.awayCount;
  values.set(store.key, JSON.stringify({ version: 1, session: old, settings: { protectionEnabled: false, notificationsEnabled: false } }));
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 20 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "paused");
  assert.equal(restored.getSnapshot().session.focusedMs, minute);
  assert.equal(JSON.parse(values.get(store.key)).version, 2);
});

test("storage failure and malformed data cannot crash the timer", () => {
  assert.equal(parseFocusSnapshot("broken-json"), null);
  const { store } = fixture("unavailable", { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("full"); }, removeItem: () => {} });
  assert.equal(store.getSnapshot().storageAvailable, false);
  assert.ok(store.start(input, startTime)); store.tick(startTime + 11 * minute);
  assert.equal(store.getSnapshot().session.status, "finished");
  const session = store.getSnapshot().session;
  for (const focusedMs of [-1, "1000", null, 999999999]) {
    assert.equal(parseFocusSnapshot(JSON.stringify({ version: 2, session: { ...session, focusedMs }, settings: store.getSnapshot().settings })).session, null);
  }
});

test("exact focused milliseconds and absence metrics survive exam reload", () => {
  const exams = migrateExams([{ id: "statistics", title: "Statistik", examDate: "2026-10-25", studySessions: [{ id: "focus-id", examId: "statistics", title: "Kurz gelernt", dateKey: "2026-10-09", durationMinutes: 99, focusedMs: 134000, awayMs: 180000, awayCount: 2, isDone: true, startedAtIso: "2026-10-09T18:00:00Z", completedAtIso: "2026-10-09T18:10:00Z" }] }]);
  const s = exams[0].studySessions[0];
  assert.equal(s.durationMinutes, 134000 / minute); assert.equal(s.focusedMs, 134000);
  assert.equal(s.awayMs, 180000); assert.equal(s.awayCount, 2);
});

test("short legacy/manual study records remain supported", () => {
  const exams = migrateExams([{ id: "statistics", title: "Statistik", examDate: "2026-10-25", studySessions: [{ id: "focus-id", examId: "statistics", title: "Kurz gelernt", dateKey: "2026-10-09", durationMinutes: 2, isDone: true, startedAtIso: "2026-10-09T18:00:00Z", completedAtIso: "2026-10-09T18:02:00Z" }] }]);
  assert.equal(exams[0].studySessions[0].durationMinutes, 2);
});

async function inBrowserStub(options, callback) {
  const calls = { requests: 0, notifications: [], closed: 0 };
  const registration = {
    active: {},
    showNotification: async (title, details) => calls.notifications.push({ title, ...details }),
    getNotifications: async () => [{ close: () => { calls.closed += 1; } }],
  };
  const notification = {
    permission: options.permission ?? "default",
    requestPermission: async () => { calls.requests += 1; return options.permission ?? "granted"; },
  };
  class Registration { showNotification() {} }
  const values = {
    window: { isSecureContext: options.secure !== false, Notification: notification, ServiceWorkerRegistration: Registration, matchMedia: () => ({ matches: options.installed === true }) },
    Notification: notification,
    ServiceWorkerRegistration: Registration,
    navigator: { userAgent: options.iOS ? "iPhone" : "Desktop", platform: options.iOS ? "iPhone" : "Linux", maxTouchPoints: options.iOS ? 5 : 0, serviceWorker: { getRegistration: async () => options.registration === false ? undefined : registration } },
  };
  const originals = Object.fromEntries(Object.keys(values).map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.entries(values).forEach(([name, value]) => Object.defineProperty(globalThis, name, { value, configurable: true }));
  try { await callback(calls); }
  finally {
    Object.keys(values).forEach((name) => {
      if (originals[name]) Object.defineProperty(globalThis, name, originals[name]);
      else delete globalThis[name];
    });
  }
}

test("notifications require a secure context and an installed iPhone web app", async () => {
  await inBrowserStub({ secure: false }, async (calls) => {
    assert.equal(supportsFocusNotifications(), false);
    assert.equal(await requestFocusNotificationPermission(), false);
    assert.equal(calls.requests, 0);
  });
  await inBrowserStub({ iOS: true, installed: false }, async (calls) => {
    assert.equal(supportsFocusNotifications(), false);
    assert.equal(await requestFocusNotificationPermission(), false);
    assert.equal(calls.requests, 0);
  });
});

test("no notification or permission request occurs without the explicit opt-in call", async () => {
  await inBrowserStub({ permission: "default", iOS: true, installed: true }, async (calls) => {
    assert.equal(supportsFocusNotifications(), true);
    await showFocusNotification("session-a", "away");
    assert.equal(calls.requests, 0);
    assert.equal(calls.notifications.length, 0);
  });
  await inBrowserStub({ permission: "denied" }, async (calls) => {
    assert.equal(await requestFocusNotificationPermission(), false);
    await showFocusNotification("session-a", "finished");
    assert.equal(calls.notifications.length, 0);
  });
});

test("granted notifications target focus; absent service worker is a safe fallback", async () => {
  await inBrowserStub({ permission: "granted" }, async (calls) => {
    assert.equal(await requestFocusNotificationPermission(), true);
    await showFocusNotification("session-a", "away");
    assert.equal(calls.notifications[0].data.url, "/timer");
    assert.equal(calls.notifications[0].tag, "gradeglow-focus-session-a");
    await clearFocusNotifications("session-a");
    assert.equal(calls.closed, 1);
  });
  await inBrowserStub({ permission: "granted", registration: false }, async (calls) => {
    await showFocusNotification("session-a", "away");
    assert.equal(calls.notifications.length, 0);
  });
});

test("turning opt-in off or returning before async delivery cancels the notification", async () => {
  await inBrowserStub({ permission: "granted" }, async (calls) => {
    await showFocusNotification("session-a", "away", () => false);
    assert.equal(calls.notifications.length, 0);
  });
});

test("web FocusLock never claims support or authorization; native bridge uses ISO dates", async () => {
  const web = new WebFocusLock();
  assert.equal(await web.isSupported(), false);
  assert.equal(await web.requestAuthorization(), "denied");
  const selection = await web.getSelectedApps();
  assert.deepEqual(selection, { applicationTokens: [], categoryTokens: [], webDomainTokens: [] });
  await web.start(selection, new Date(startTime));
  await web.stop();
  let received;
  const native = createNativeFocusLock({ isSupported: async () => ({ supported: true }), requestAuthorization: async () => ({ status: "granted" }), getSelectedApps: async () => selection, start: async (value) => { received = value; }, stop: async () => {} });
  await native.start(selection, new Date(startTime));
  assert.equal(received.untilIso, "2026-10-09T18:00:00.000Z");
});
