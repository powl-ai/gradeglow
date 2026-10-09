export type FocusStatus = "idle" | "running" | "away" | "paused" | "finished" | "abgebrochen";
export type FocusTimerMode = "focus" | "pomodoro" | "stopwatch";
export const AWAY_GRACE_MS = 10_000;
export const LONG_ABSENCE_MS = 60_000;
export const HEARTBEAT_MS = 5_000;
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
  focusedMs: number;
  awayMs: number;
  awayCount: number;
  lastSeenAt: number;
  awaySince: number | null;
  absences: FocusAbsence[];
  savedSessionId: string | null;
  rewardOnSave?: boolean;
};
export type FocusSettings = { protectionEnabled: boolean; notificationsEnabled: boolean; keepScreenAwake: boolean };
export type FocusSnapshot = {
  ready: boolean;
  session: FocusSession | null;
  settings: FocusSettings;
  returnFeedback: FocusAbsence | null;
  storageAvailable: boolean;
};
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type StartFocusSession = Pick<FocusSession, "examId" | "sessionId" | "title" | "subjectTitle" | "mode" | "goalMinutes" | "rewardOnSave">;
export const LEGACY_FOCUS_KEY = "gradeglow-active-study-timer-v1";
// Retain the account-scoped key; version 2 migrates existing timers in place.
export const getFocusStorageKey = (uid: string) => `gradeglow-focus-session-v1-${uid}`;
const MAX_SESSION_MS = 300 * 60_000;
const initialSnapshot: FocusSnapshot = {
  ready: false, session: null,
  settings: { protectionEnabled: false, notificationsEnabled: false, keepScreenAwake: true },
  returnFeedback: null, storageAvailable: true,
};
export const getFocusElapsedMs = (session: FocusSession | null, now: number) => {
  if (!session) return 0;
  const liveMs = session.status === "running" && session.runningSince !== null
    ? Math.max(0, Math.min(now, session.endsAt ?? now) - session.runningSince) : 0;
  return Math.min(session.goalMinutes * 60_000, Math.max(0, session.focusedMs + liveMs));
};
const finiteTimestamp = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const nullableTimestamp = (value: unknown) => value === null || finiteTimestamp(value);

// Untrusted storage, including version 1. Never infer study time from a reload gap.
export const parseFocusSnapshot = (raw: string | null): Pick<FocusSnapshot, "session" | "settings"> | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (![1, 2].includes(value?.version) || !value.settings || typeof value.settings !== "object") return null;
    const protectionEnabled = value.settings.protectionEnabled === true;
    const settings = {
      protectionEnabled, notificationsEnabled: protectionEnabled && value.settings.notificationsEnabled === true,
      keepScreenAwake: value.settings.keepScreenAwake !== false,
    };
    const s = value.session;
    if (s === null) return { session: null, settings };
    const focused = value.version === 2 ? s?.focusedMs : s?.elapsedMs;
    if (!s || typeof s.id !== "string" || !s.id || typeof s.examId !== "string" || !s.examId
      || typeof s.title !== "string" || typeof s.subjectTitle !== "string"
      || !["running", "away", "paused", "finished", "abgebrochen"].includes(s.status)
      || !["focus", "pomodoro", "stopwatch"].includes(s.mode)
      || !Number.isInteger(s.goalMinutes) || s.goalMinutes < 1 || s.goalMinutes > 300
      || !finiteTimestamp(s.startedAt) || !finiteTimestamp(s.lastSeenAt)
      || !nullableTimestamp(s.endsAt) || !nullableTimestamp(s.endedAt) || !nullableTimestamp(s.runningSince) || !nullableTimestamp(s.awaySince)
      || !finiteTimestamp(focused) || focused > MAX_SESSION_MS
      || (value.version === 2 && (!finiteTimestamp(s.awayMs) || !Number.isSafeInteger(s.awayCount) || s.awayCount < 0))
      || (s.status === "running" && (s.runningSince === null || s.endsAt === null || s.endsAt < s.runningSince))
      || (s.status !== "running" && s.runningSince !== null)
      || (s.status === "away" && s.awaySince === null)) return { session: null, settings };
    const absences: FocusAbsence[] = Array.isArray(s.absences) ? s.absences.filter((a: FocusAbsence) =>
      finiteTimestamp(a?.startedAt) && finiteTimestamp(a?.endedAt) && finiteTimestamp(a?.durationMs)
      && a.endedAt >= a.startedAt && a.durationMs === a.endedAt - a.startedAt).slice(-100) : [];
    const oldAwayMs = absences.reduce((sum, a) => sum + (a.durationMs > AWAY_GRACE_MS ? a.durationMs : 0), 0);
    // Old running timers only have a last-visible heartbeat, not a focused checkpoint.
    const oldLive = value.version === 1 && s.status === "running" && s.runningSince !== null
      ? Math.max(0, Math.min(s.lastSeenAt, s.awaySince ?? s.lastSeenAt, s.endsAt) - s.runningSince) : 0;
    return { settings, session: {
      id: s.id, status: s.status, examId: s.examId, sessionId: typeof s.sessionId === "string" ? s.sessionId : null,
      title: s.title, subjectTitle: s.subjectTitle, mode: s.mode, goalMinutes: s.goalMinutes,
      startedAt: s.startedAt, endsAt: s.endsAt, endedAt: s.endedAt, runningSince: s.runningSince,
      focusedMs: Math.min(s.goalMinutes * 60_000, value.version === 2 ? focused : Math.max(0, focused + oldLive - oldAwayMs)),
      awayMs: value.version === 2 ? s.awayMs : oldAwayMs,
      awayCount: value.version === 2 ? s.awayCount : absences.filter(a => a.durationMs > AWAY_GRACE_MS).length,
      lastSeenAt: s.lastSeenAt, awaySince: s.awaySince, absences,
      savedSessionId: typeof s.savedSessionId === "string" ? s.savedSessionId : null, rewardOnSave: s.rewardOnSave === true,
    } };
  } catch { return null; }
};

export function createFocusSessionStore(uid: string, makeId = () => crypto.randomUUID()) {
  let snapshot = initialSnapshot;
  let storage: StoragePort | null = null;
  let foreground = false;
  const key = getFocusStorageKey(uid);
  const listeners = new Set<() => void>();
  const commit = (next: FocusSnapshot, persist = true) => {
    snapshot = next;
    if (persist && storage) {
      try { storage.setItem(key, JSON.stringify({ version: 2, session: next.session, settings: next.settings })); }
      catch { snapshot = { ...next, storageAvailable: false }; }
    }
    listeners.forEach(listener => listener());
  };
  const closeAbsence = (s: FocusSession, now: number, graceAllowed = true) => {
    if (s.awaySince === null) return { session: s, absence: null };
    const endedAt = Math.max(s.awaySince, now);
    const absence = { startedAt: s.awaySince, endedAt, durationMs: endedAt - s.awaySince };
    // A brief interruption is tolerated in full. Longer absences get ZERO credit,
    // including their first 10 seconds. Counters contain excluded absences only.
    const tolerated = graceAllowed && absence.durationMs <= AWAY_GRACE_MS;
    return { session: {
      ...s, awaySince: null,
      focusedMs: Math.min(s.goalMinutes * 60_000, s.focusedMs + (tolerated ? absence.durationMs : 0)),
      awayMs: s.awayMs + (tolerated ? 0 : absence.durationMs),
      awayCount: s.awayCount + (!tolerated && absence.durationMs > 0 ? 1 : 0),
      absences: [...s.absences, absence].slice(-100),
    }, absence };
  };
  const tick = (now: number) => {
    const s = snapshot.session;
    if (!foreground || s?.status !== "running" || s.endsAt === null || now < s.endsAt) return false;
    commit({ ...snapshot, session: { ...s, status: "finished", focusedMs: s.goalMinutes * 60_000,
      endedAt: s.endsAt, runningSince: null, endsAt: null, lastSeenAt: now } });
    return true;
  };
  const restorePaused = (s: FocusSession | null, now: number) => {
    if (!s || !["running", "away"].includes(s.status)) return s;
    // Persisted focusedMs is the last known foreground checkpoint. The unknown
    // reload interval is not study time, even if iOS never dispatched pagehide.
    const lost = s.status === "away" ? s : { ...s, awaySince: s.lastSeenAt };
    const { session } = closeAbsence(lost, now, false);
    return { ...session, status: "paused" as const, runningSince: null, endsAt: null, lastSeenAt: now };
  };
  return {
    key, getSnapshot: () => snapshot, getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate(port: StoragePort | null, now: number, visible: boolean) {
      if (snapshot.ready) return;
      storage = port; foreground = visible;
      let loaded: ReturnType<typeof parseFocusSnapshot> = null;
      let available = Boolean(port);
      try { loaded = parseFocusSnapshot(port?.getItem(key) ?? null); } catch { available = false; }
      commit({ ...initialSnapshot, ready: true, session: restorePaused(loaded?.session ?? null, now),
        settings: loaded?.settings ?? initialSnapshot.settings, storageAvailable: available });
    },
    sync(raw: string | null, now: number) {
      const loaded = parseFocusSnapshot(raw);
      // Another tab must not run a second independent foreground clock.
      commit({ ...snapshot, session: restorePaused(loaded?.session ?? null, now),
        settings: loaded?.settings ?? initialSnapshot.settings, returnFeedback: null }, false);
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
          id: makeId(), status: "paused", examId: old.examId, sessionId: typeof old.sessionId === "string" ? old.sessionId : null,
          title: typeof old.title === "string" ? old.title : "Lernsession",
          subjectTitle: typeof old.title === "string" ? old.title : "Lernsession",
          mode: ["focus", "pomodoro", "stopwatch"].includes(old.mode) ? old.mode : "focus",
          goalMinutes, startedAt: old.startedAt, endsAt: null, endedAt: null, runningSince: null,
          focusedMs: 0, awayMs: 0, awayCount: 0, lastSeenAt: now, awaySince: null, absences: [],
          savedSessionId: null, rewardOnSave: Boolean(old.sessionId),
        } });
        if (snapshot.storageAvailable) storage.removeItem(LEGACY_FOCUS_KEY);
      } catch { /* Ignore unreadable legacy data. */ }
    },
    start(input: StartFocusSession, now: number) {
      const current = snapshot.session;
      if (!snapshot.ready || !foreground || !input.examId || (current && (["running", "away", "paused"].includes(current.status) || (current.status === "finished" && !current.savedSessionId)))) return null;
      const goalMinutes = Math.min(300, Math.max(1, Math.round(input.goalMinutes) || 30));
      const session: FocusSession = {
        ...input, id: makeId(), status: "running", goalMinutes, startedAt: now, endsAt: now + goalMinutes * 60_000,
        endedAt: null, runningSince: now, focusedMs: 0, awayMs: 0, awayCount: 0,
        lastSeenAt: now, awaySince: null, absences: [], savedSessionId: null,
      };
      commit({ ...snapshot, session, returnFeedback: null }); return session;
    },
    pause(now: number) {
      tick(now);
      const s = snapshot.session;
      if (!s || !["running", "away"].includes(s.status)) return;
      const { session } = closeAbsence({ ...s, focusedMs: getFocusElapsedMs(s, now) }, now);
      commit({ ...snapshot, session: { ...session, status: "paused", runningSince: null, endsAt: null, lastSeenAt: now }, returnFeedback: null });
    },
    resume(now: number) {
      const s = snapshot.session;
      if (!foreground || s?.status !== "paused") return;
      commit({ ...snapshot, session: { ...s, status: "running", runningSince: now,
        endsAt: now + s.goalMinutes * 60_000 - s.focusedMs, lastSeenAt: now }, returnFeedback: null });
      tick(now);
    },
    finish(now: number) {
      tick(now);
      const s = snapshot.session;
      if (!s || !["running", "away", "paused"].includes(s.status)) return s;
      const { session } = closeAbsence({ ...s, focusedMs: getFocusElapsedMs(s, now) }, now);
      const finished: FocusSession = { ...session, status: "finished", endedAt: now, runningSince: null, endsAt: null, lastSeenAt: now };
      commit({ ...snapshot, session: finished }); return finished;
    },
    abort(now: number) {
      const s = snapshot.session;
      if (!s || s.savedSessionId || s.status === "abgebrochen") return;
      const { session } = closeAbsence({ ...s, focusedMs: getFocusElapsedMs(s, now) }, now);
      commit({ ...snapshot, session: { ...session, status: "abgebrochen", endedAt: now, runningSince: null, endsAt: null, lastSeenAt: now }, returnFeedback: null });
    },
    markSaved(id: string, savedSessionId: string) {
      const s = snapshot.session;
      if (s?.id === id && s.status === "finished") commit({ ...snapshot, session: { ...s, savedSessionId } });
    },
    updateSettings(patch: Partial<FocusSettings>, now: number) {
      const settings = { ...snapshot.settings, ...patch };
      if (!settings.protectionEnabled) settings.notificationsEnabled = false;
      // Do not touch timing or awaySince when the optional protection is toggled.
      commit({ ...snapshot, settings }); tick(now);
    },
    leaveApp(now: number) {
      tick(now); foreground = false;
      const s = snapshot.session;
      if (s?.status !== "running") return false;
      commit({ ...snapshot, session: { ...s, status: "away", focusedMs: getFocusElapsedMs(s, now),
        runningSince: null, endsAt: null, awaySince: now, lastSeenAt: now }, returnFeedback: null });
      return true;
    },
    returnToApp(now: number) {
      foreground = true;
      const s = snapshot.session;
      if (s?.status !== "away") return;
      const { session, absence } = closeAbsence(s, now);
      commit({ ...snapshot, session: { ...session, status: "running", runningSince: now,
        endsAt: now + session.goalMinutes * 60_000 - session.focusedMs, lastSeenAt: now },
        returnFeedback: absence && absence.durationMs > AWAY_GRACE_MS ? absence : null });
      tick(now);
    },
    tick,
    heartbeat(now: number) {
      tick(now);
      const s = snapshot.session;
      if (foreground && s?.status === "running" && now - s.lastSeenAt >= HEARTBEAT_MS) {
        commit({ ...snapshot, session: { ...s, focusedMs: getFocusElapsedMs(s, now), runningSince: now, lastSeenAt: now } });
      }
    },
    dismissFeedback() { commit({ ...snapshot, returnFeedback: null }, false); },
  };
}
export type FocusSessionStore = ReturnType<typeof createFocusSessionStore>;
