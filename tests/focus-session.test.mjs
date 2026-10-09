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

test("elapsed time uses timestamps even when no interval tick executes", () => {
  const { store } = fixture();
  const session = store.start(input, startTime);
  assert.equal(getFocusElapsedMs(session, startTime + 7 * minute), 7 * minute);
  store.tick(startTime + 30 * minute);
  const finished = store.getSnapshot().session;
  assert.equal(finished.status, "finished");
  assert.equal(finished.endedAt, startTime + 10 * minute);
  assert.equal(finished.elapsedMs, 10 * minute);
});

test("pause, reboot and resume exclude all paused time and adjust deadline", () => {
  const { store, port } = fixture();
  store.start(input, startTime);
  store.pause(startTime + 2 * minute);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 50 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "paused");
  assert.equal(getFocusElapsedMs(restored.getSnapshot().session, startTime + 50 * minute), 2 * minute);
  restored.resume(startTime + 50 * minute);
  assert.equal(restored.getSnapshot().session.endsAt, startTime + 58 * minute);
  restored.tick(startTime + 70 * minute);
  assert.equal(restored.getSnapshot().session.endedAt, startTime + 58 * minute);
  assert.equal(restored.getSnapshot().session.elapsedMs, 10 * minute);
});

test("running session and subject recover after app kill before expiry", () => {
  const { store, port } = fixture();
  store.start(input, startTime);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 4 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "running");
  assert.equal(restored.getSnapshot().session.subjectTitle, "Statistik");
  assert.equal(getFocusElapsedMs(restored.getSnapshot().session, startTime + 4 * minute), 4 * minute);
});

test("protection defaults off, with no background tracking or notification opt-in", () => {
  const { store } = fixture();
  store.start(input, startTime);
  assert.deepEqual(store.getSnapshot().settings, { protectionEnabled: false, notificationsEnabled: false });
  assert.equal(store.leaveApp(startTime + minute), false);
  store.returnToApp(startTime + 2 * minute);
  assert.equal(store.getSnapshot().returnFeedback, null);
  assert.equal(store.getSnapshot().session.absences.length, 0);
  store.updateSettings({ notificationsEnabled: true }, startTime + 2 * minute);
  assert.equal(store.getSnapshot().settings.notificationsEnabled, false);
});

test("visibilitychange plus pagehide count one absence, persisted over restart", () => {
  const { store, port } = fixture();
  store.updateSettings({ protectionEnabled: true, notificationsEnabled: true }, startTime);
  store.start(input, startTime);
  assert.equal(store.leaveApp(startTime + minute), true);
  assert.equal(store.leaveApp(startTime + minute + 300), false);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 3 * minute, true);
  assert.equal(restored.getSnapshot().session.absences.length, 1);
  assert.equal(restored.getSnapshot().returnFeedback.durationMs, 2 * minute);
  restored.returnToApp(startTime + 3 * minute + 200);
  assert.equal(restored.getSnapshot().session.absences.length, 1);
});

test("absence and completion after long background stop at the exact deadline", () => {
  const { store, port } = fixture();
  store.updateSettings({ protectionEnabled: true }, startTime);
  store.start(input, startTime);
  store.leaveApp(startTime + minute);
  store.tick(startTime + 20 * minute);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 40 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "finished");
  assert.equal(restored.getSnapshot().session.endedAt, startTime + 10 * minute);
  assert.equal(restored.getSnapshot().returnFeedback.durationMs, 9 * minute);
});

test("force kill without pagehide falls back to the last visible heartbeat", () => {
  const { store, port } = fixture();
  store.updateSettings({ protectionEnabled: true }, startTime);
  store.start(input, startTime);
  store.heartbeat(startTime + minute);
  const restored = createFocusSessionStore("user-a");
  restored.hydrate(port, startTime + 4 * minute, true);
  assert.equal(restored.getSnapshot().returnFeedback.startedAt, startTime + minute);
  assert.equal(restored.getSnapshot().returnFeedback.durationMs, 3 * minute);
});

test("paused sessions do not collect absence; turning protection off cancels tracking", () => {
  const { store } = fixture();
  store.updateSettings({ protectionEnabled: true, notificationsEnabled: true }, startTime);
  store.start(input, startTime);
  store.pause(startTime + minute);
  assert.equal(store.leaveApp(startTime + 2 * minute), false);
  store.resume(startTime + 3 * minute);
  store.leaveApp(startTime + 4 * minute);
  store.updateSettings({ protectionEnabled: false }, startTime + 5 * minute);
  store.returnToApp(startTime + 6 * minute);
  assert.equal(store.getSnapshot().session.awaySince, null);
  assert.equal(store.getSnapshot().returnFeedback, null);
  assert.equal(store.getSnapshot().settings.notificationsEnabled, false);
});

test("cannot overwrite an active/paused or unsaved completed session; abort is persistent", () => {
  const { store, port } = fixture();
  store.start(input, startTime);
  assert.equal(store.start(input, startTime + minute), null);
  store.pause(startTime + minute);
  assert.equal(store.start(input, startTime + minute), null);
  store.finish(startTime + 2 * minute);
  assert.equal(store.start(input, startTime + 2 * minute), null);
  store.abort(startTime + 2 * minute);
  const restored = createFocusSessionStore("user-a", () => "next-id");
  restored.hydrate(port, startTime + 3 * minute, true);
  assert.equal(restored.getSnapshot().session.status, "abgebrochen");
  assert.ok(restored.start(input, startTime + 3 * minute));
});

test("completion/save stays frozen, preserves planner rewards and permits next session", () => {
  const { store, port } = fixture();
  const session = store.start({ ...input, sessionId: "planned-block", rewardOnSave: true }, startTime);
  store.finish(startTime + 3 * minute);
  store.markSaved(session.id, "planned-block");
  const restored = createFocusSessionStore("user-a", () => "next-id");
  restored.hydrate(port, startTime + 15 * minute, true);
  assert.equal(restored.getSnapshot().session.savedSessionId, "planned-block");
  assert.equal(restored.getSnapshot().session.rewardOnSave, true);
  assert.equal(getFocusElapsedMs(restored.getSnapshot().session, startTime + 15 * minute), 3 * minute);
  assert.ok(restored.start(input, startTime + 15 * minute));
});

test("timer data is isolated by account", () => {
  const { store, port } = fixture("user-a");
  store.start(input, startTime);
  const other = fixture("user-b", port).store;
  assert.equal(other.getSnapshot().session, null);
  assert.notEqual(getFocusStorageKey("user-a"), getFocusStorageKey("user-b"));
});

test("legacy timer migrates only for an existing exam and honors its old deadline", () => {
  const { store, values } = fixture();
  values.set(LEGACY_FOCUS_KEY, JSON.stringify({ examId: "statistics", sessionId: "planned", title: "Statistik", startedAt: startTime, mode: "focus", goalMinutes: 10 }));
  store.migrateLegacy(["other-exam"], startTime + minute);
  assert.equal(store.getSnapshot().session, null);
  store.migrateLegacy(["statistics"], startTime + 15 * minute);
  assert.equal(store.getSnapshot().session.status, "finished");
  assert.equal(store.getSnapshot().session.endedAt, startTime + 10 * minute);
  assert.equal(values.has(LEGACY_FOCUS_KEY), false);
});

test("broken storage is handled safely and storage failure is visible", () => {
  assert.equal(parseFocusSnapshot("broken-json"), null);
  const { store } = fixture("unavailable", { getItem: () => { throw Error("blocked"); }, setItem: () => { throw Error("full"); }, removeItem: () => {} });
  assert.equal(store.getSnapshot().storageAvailable, false);
  assert.ok(store.start(input, startTime));
  store.tick(startTime + 11 * minute);
  assert.equal(store.getSnapshot().session.status, "finished");
});

test("short recorded sessions retain exact minutes after exam reload", () => {
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
