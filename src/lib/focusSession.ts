export type FocusStatus = "idle" | "running" | "paused" | "finished" | "abgebrochen";
export type FocusTimerMode = "focus" | "pomodoro" | "stopwatch";

export type FocusAbsence = { startedAt: number; endedAt: number; durationMs: number };
export type FocusSession = {
  id: string;
  status: Exclude<FocusStatus, "idle">;
  examId: string;
  sessionId: string | null;
  title: string;
  subjectTitle: string;
  mode: FocusTimerMode;
  goalMinutes: number;
  startedAt: number;
  endsAt: number | null;
  endedAt: number | null;
  runningSince: number | null;
  elapsedMs: number;
  lastSeenAt: number;
  awaySince: number | null;
  absences: FocusAbsence[];
  savedSessionId: string | null;
  rewardOnSave?: boolean;
};

export type FocusSettings = { protectionEnabled: boolean; notificationsEnabled: boolean };
export type FocusSnapshot = {
  ready: boolean;
  session: FocusSession | null;
  settings: FocusSettings;
  returnFeedback: FocusAbsence | null;
  storageAvailable: boolean;
};

type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type StartFocusSession = Pick<FocusSession, "examId" | "sessionId" | "title" | "subjectTitle" | "mode" | "goalMinutes" | "rewardOnSave">;
export const LONG_ABSENCE_MS = 2 * 60_000;
export const LEGACY_FOCUS_KEY = "gradeglow-active-study-timer-v1";
export const getFocusStorageKey = (uid: string) => `gradeglow-focus-session-v1-${uid}`;
const MAX_SESSION_MS = 300 * 60_000;
const initialSnapshot: FocusSnapshot = {
  ready: false, session: null,
  settings: { protectionEnabled: false, notificationsEnabled: false },
  returnFeedback: null, storageAvailable: true,
};

export const getFocusElapsedMs = (session: FocusSession | null, now: number) => {
  if (!session) return 0;
  const liveMs = session.status === "running" && session.runningSince !== null
    ? Math.max(0, Math.min(now, session.endsAt ?? now) - session.runningSince) : 0;
  return Math.min(session.goalMinutes * 60_000, Math.max(0, session.elapsedMs + liveMs));
};

const finiteTimestamp = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const nullableTimestamp = (value: unknown) => value === null || finiteTimestamp(value);

// Treat persisted data as untrusted: a broken timer must not crash the app.
export const parseFocusSnapshot = (raw: string | null): Pick<FocusSnapshot, "session" | "settings"> | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || typeof value.settings !== "object" || !value.settings) return null;
    const protectionEnabled = value.settings.protectionEnabled === true;
    const settings = { protectionEnabled, notificationsEnabled: protectionEnabled && value.settings.notificationsEnabled === true };
    const s = value.session;
    if (s === null) return { session: null, settings };
    if (!s || typeof s.id !== "string" || !s.id || typeof s.examId !== "string" || !s.examId
      || typeof s.title !== "string" || typeof s.subjectTitle !== "string"
      || !["running", "paused", "finished", "abgebrochen"].includes(s.status)
      || !["focus", "pomodoro", "stopwatch"].includes(s.mode)
      || !Number.isInteger(s.goalMinutes) || s.goalMinutes < 1 || s.goalMinutes > 300
      || !finiteTimestamp(s.startedAt) || !finiteTimestamp(s.lastSeenAt)
      || !nullableTimestamp(s.endsAt) || !nullableTimestamp(s.endedAt) || !nullableTimestamp(s.runningSince) || !nullableTimestamp(s.awaySince)
      || !finiteTimestamp(s.elapsedMs) || s.elapsedMs > MAX_SESSION_MS
      || (s.status === "running" && (s.runningSince === null || s.endsAt === null || s.endsAt < s.runningSince))
      || (s.status !== "running" && s.runningSince !== null)) return { session: null, settings };
    const absences: FocusAbsence[] = Array.isArray(s.absences) ? s.absences.filter((a: FocusAbsence) =>
      finiteTimestamp(a?.startedAt) && finiteTimestamp(a?.endedAt) && finiteTimestamp(a?.durationMs)
      && a.endedAt >= a.startedAt && a.durationMs === a.endedAt - a.startedAt).slice(-100) : [];
    return { settings, session: {
      id: s.id, status: s.status, examId: s.examId,
      sessionId: typeof s.sessionId === "string" ? s.sessionId : null,
      title: s.title, subjectTitle: s.subjectTitle, mode: s.mode, goalMinutes: s.goalMinutes,
      startedAt: s.startedAt, endsAt: s.endsAt, endedAt: s.endedAt, runningSince: s.runningSince,
      elapsedMs: s.elapsedMs, lastSeenAt: s.lastSeenAt,
      awaySince: protectionEnabled ? s.awaySince : null, absences,
      savedSessionId: typeof s.savedSessionId === "string" ? s.savedSessionId : null,
      rewardOnSave: s.rewardOnSave === true,
    } };
  } catch { return null; }
};

export function createFocusSessionStore(uid: string, makeId = () => crypto.randomUUID()) {
  let snapshot = initialSnapshot;
  let storage: StoragePort | null = null;
  const key = getFocusStorageKey(uid);
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const commit = (next: FocusSnapshot, persist = true) => {
    snapshot = next;
    if (persist && storage) {
      try { storage.setItem(key, JSON.stringify({ version: 1, session: next.session, settings: next.settings })); }
      catch { snapshot = { ...next, storageAvailable: false }; }
    }
    notify();
  };

  const closeAbsence = (s: FocusSession, now: number) => {
    if (s.awaySince === null) return { session: s, absence: null };
    // Only absence during the running session counts, never time after expiry.
    const endedAt = Math.max(s.awaySince, Math.min(now, s.endsAt ?? now, s.endedAt ?? now));
    const absence = { startedAt: s.awaySince, endedAt, durationMs: endedAt - s.awaySince };
    return { session: { ...s, awaySince: null, absences: [...s.absences, absence].slice(-100) }, absence };
  };

  const tick = (now: number) => {
    const s = snapshot.session;
    if (s?.status !== "running" || s.endsAt === null || now < s.endsAt) return false;
    // The actual deadline is preserved even if iOS wakes us much later.
    commit({ ...snapshot, session: {
      ...s, status: "finished", elapsedMs: s.goalMinutes * 60_000,
      endedAt: s.endsAt, runningSince: null,
    } });
    return true;
  };

  const returnToApp = (now: number) => {
    const s = snapshot.session;
    if (s && s.awaySince !== null) {
      const { session, absence } = closeAbsence(s, now);
      commit({ ...snapshot, session: { ...session, lastSeenAt: now }, returnFeedback: absence });
    }
    tick(now);
  };

  return {
    key,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate(port: StoragePort | null, now: number, visible: boolean) {
      if (snapshot.ready) return;
      storage = port;
      let loaded: ReturnType<typeof parseFocusSnapshot> = null;
      let available = Boolean(port);
      try { loaded = parseFocusSnapshot(port?.getItem(key) ?? null); } catch { available = false; }
      let session = loaded?.session ?? null;
      const settings = loaded?.settings ?? initialSnapshot.settings;
      // pagehide is not guaranteed on force-kill. The last visible heartbeat
      // supplies an approximate departure time, without changing timer accuracy.
      if (session?.status === "running" && settings.protectionEnabled && session.awaySince === null) {
        session = { ...session, awaySince: session.lastSeenAt };
      }
      commit({ ...initialSnapshot, ready: true, session, settings, storageAvailable: available }, false);
      if (visible) returnToApp(now); else tick(now);
    },
    sync(raw: string | null, now: number) {
      const loaded = parseFocusSnapshot(raw);
      commit({ ...snapshot, session: loaded?.session ?? null, settings: loaded?.settings ?? initialSnapshot.settings, returnFeedback: null }, false);
      tick(now);
    },
    migrateLegacy(allowedExamIds: string[], now: number) {
      if (!snapshot.ready || snapshot.session || !storage) return;
      try {
        const raw = storage.getItem(LEGACY_FOCUS_KEY);
        if (!raw) return;
        const old = JSON.parse(raw);
        if (!allowedExamIds.includes(old?.examId) || !finiteTimestamp(old.startedAt)) return;
        const goalMinutes = Math.min(300, Math.max(1, Math.round(Number(old.goalMinutes) || 90)));
        commit({ ...snapshot, session: {
          id: makeId(), status: "running", examId: old.examId,
          sessionId: typeof old.sessionId === "string" ? old.sessionId : null,
          title: typeof old.title === "string" ? old.title : "Lernsession",
          subjectTitle: typeof old.title === "string" ? old.title : "Lernsession",
          mode: ["focus", "pomodoro", "stopwatch"].includes(old.mode) ? old.mode : "focus",
          goalMinutes, startedAt: old.startedAt, endsAt: old.startedAt + goalMinutes * 60_000,
          endedAt: null, runningSince: old.startedAt, elapsedMs: 0, lastSeenAt: now,
          awaySince: null, absences: [], savedSessionId: null, rewardOnSave: Boolean(old.sessionId),
        } });
        if (snapshot.storageAvailable) storage.removeItem(LEGACY_FOCUS_KEY);
        tick(now);
      } catch { /* Ignore legacy data that cannot be read or migrated. */ }
    },
    start(input: StartFocusSession, now: number) {
      const current = snapshot.session;
      if (!snapshot.ready || !input.examId || (current && (["running", "paused"].includes(current.status) || (current.status === "finished" && !current.savedSessionId)))) return null;
      const goalMinutes = Math.min(300, Math.max(1, Math.round(input.goalMinutes) || 30));
      const session: FocusSession = {
        ...input, id: makeId(), status: "running", goalMinutes,
        startedAt: now, endsAt: now + goalMinutes * 60_000, endedAt: null,
        runningSince: now, elapsedMs: 0, lastSeenAt: now, awaySince: null, absences: [], savedSessionId: null,
      };
      commit({ ...snapshot, session, returnFeedback: null });
      return session;
    },
    pause(now: number) {
      tick(now);
      const s = snapshot.session;
      if (s?.status !== "running") return;
      const elapsedMs = getFocusElapsedMs(s, now);
      const { session } = closeAbsence(s, now);
      commit({ ...snapshot, session: { ...session, status: "paused", runningSince: null, endsAt: null, elapsedMs, lastSeenAt: now }, returnFeedback: null });
    },
    resume(now: number) {
      const s = snapshot.session;
      if (s?.status !== "paused") return;
      commit({ ...snapshot, session: { ...s, status: "running", runningSince: now, endsAt: now + s.goalMinutes * 60_000 - s.elapsedMs, lastSeenAt: now }, returnFeedback: null });
    },
    finish(now: number) {
      tick(now);
      const s = snapshot.session;
      if (!s || !["running", "paused"].includes(s.status)) return s;
      const elapsedMs = getFocusElapsedMs(s, now);
      const { session } = closeAbsence(s, now);
      const finished: FocusSession = { ...session, status: "finished", elapsedMs, endedAt: now, runningSince: null };
      commit({ ...snapshot, session: finished });
      return finished;
    },
    abort(now: number) {
      tick(now);
      const s = snapshot.session;
      if (!s || s.savedSessionId || s.status === "abgebrochen") return;
      const { session } = closeAbsence(s, now);
      commit({ ...snapshot, session: { ...session, status: "abgebrochen", elapsedMs: getFocusElapsedMs(s, now), endedAt: now, runningSince: null }, returnFeedback: null });
    },
    markSaved(id: string, savedSessionId: string) {
      const s = snapshot.session;
      if (s?.id !== id || s.status !== "finished") return;
      commit({ ...snapshot, session: { ...s, savedSessionId } });
    },
    updateSettings(patch: Partial<FocusSettings>, now: number) {
      const settings = { ...snapshot.settings, ...patch };
      if (!settings.protectionEnabled) settings.notificationsEnabled = false;
      const s = snapshot.session;
      commit({ ...snapshot, settings, session: s ? { ...s, lastSeenAt: now, awaySince: settings.protectionEnabled ? s.awaySince : null } : s, returnFeedback: settings.protectionEnabled ? snapshot.returnFeedback : null });
      tick(now);
    },
    leaveApp(now: number) {
      tick(now);
      const s = snapshot.session;
      if (s?.status !== "running" || !snapshot.settings.protectionEnabled || s.awaySince !== null) return false;
      commit({ ...snapshot, session: { ...s, awaySince: now, lastSeenAt: now }, returnFeedback: null });
      return true;
    },
    returnToApp,
    tick,
    heartbeat(now: number) {
      tick(now);
      const s = snapshot.session;
      if (s?.status === "running" && s.awaySince === null && now - s.lastSeenAt >= 15_000) {
        commit({ ...snapshot, session: { ...s, lastSeenAt: now } });
      }
    },
    dismissFeedback() { commit({ ...snapshot, returnFeedback: null }, false); },
  };
}

export type FocusSessionStore = ReturnType<typeof createFocusSessionStore>;
