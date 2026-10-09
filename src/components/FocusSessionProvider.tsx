"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createFocusSessionStore, getFocusElapsedMs, LONG_ABSENCE_MS } from "../lib/focusSession";
import type { FocusSessionStore } from "../lib/focusSession";
import { clearFocusNotifications, showFocusNotification } from "../lib/focusNotifications";
import type { MascotMood } from "./Mascot";
const FocusContext = createContext<{ store: FocusSessionStore; now: number } | null>(null);

export default function FocusSessionProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [store] = useState(() => createFocusSessionStore(uid));
  const [now, setNow] = useState(0);
  useEffect(() => {
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* Memory-only fallback. */ }
    let focused = true, pagePresent = true, active = true;
    let wakeLock: WakeLockSentinel | null = null, requestingWakeLock = false;
    let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
    const visible = () => pagePresent && focused && document.visibilityState === "visible";
    const shouldHoldLock = () => active && visible() && store.getSnapshot().session?.status === "running" && store.getSnapshot().settings.keepScreenAwake;
    const releaseWakeLock = () => {
      const lock = wakeLock; wakeLock = null;
      if (lock && !lock.released) void lock.release().catch(() => undefined);
    };
    const updateWakeLock = () => {
      if (!shouldHoldLock()) { releaseWakeLock(); return; }
      if (!navigator.wakeLock || wakeLock || requestingWakeLock) return;
      requestingWakeLock = true;
      void navigator.wakeLock.request("screen").then(lock => {
        if (!shouldHoldLock()) { void lock.release().catch(() => undefined); return; }
        wakeLock = lock;
        lock.addEventListener("release", () => { if (wakeLock === lock) wakeLock = null; });
      }).catch(() => undefined).finally(() => { requestingWakeLock = false; });
    };
    store.hydrate(storage, Date.now(), visible());
    const canNotify = (id: string) => {
      const latest = store.getSnapshot();
      return latest.settings.notificationsEnabled && latest.session?.id === id
        && !visible() && latest.session.status === "away";
    };
    const leave = () => {
      const departed = store.leaveApp(Date.now());
      releaseWakeLock();
      const snapshot = store.getSnapshot();
      if (departed && snapshot.settings.notificationsEnabled && snapshot.session) {
        const id = snapshot.session.id;
        void showFocusNotification(id, "away", () => canNotify(id));
      }
      setNow(Date.now());
    };
    const refresh = () => {
      const timestamp = Date.now();
      // Never expire a countdown in the background before processing departure.
      if (!visible()) leave();
      else { store.tick(timestamp); store.heartbeat(timestamp); }
      setNow(timestamp);
    };
    const returnToApp = () => {
      if (!visible()) return;
      store.returnToApp(Date.now());
      const snapshot = store.getSnapshot();
      if (snapshot.session) void clearFocusNotifications(snapshot.session.id);
      if (snapshot.returnFeedback) {
        if (feedbackTimeout) clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => store.dismissFeedback(), 8000);
      }
      updateWakeLock();
      refresh();
    };
    // iOS Safari may dispatch only a subset, in varying order. Store transitions
    // are idempotent; manual pause is never auto-resumed by any of these events.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") leave();
      else { focused = true; returnToApp(); }
    };
    const onBlur = () => { focused = false; leave(); };
    const onFocus = () => { focused = true; returnToApp(); };
    const onPageHide = () => { pagePresent = false; leave(); };
    const onPageShow = () => { pagePresent = true; focused = true; returnToApp(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === store.key || event.key === null) {
        store.sync(event.key === null ? null : event.newValue, Date.now());
        refresh();
      }
    };
    let notificationsEnabled = store.getSnapshot().settings.notificationsEnabled;
    const unsubscribe = store.subscribe(() => {
      const latest = store.getSnapshot();
      if (notificationsEnabled && !latest.settings.notificationsEnabled && latest.session) void clearFocusNotifications(latest.session.id);
      notificationsEnabled = latest.settings.notificationsEnabled;
      updateWakeLock();
    });
    refresh(); updateWakeLock();
    // Repaint only. Timing uses timestamp segments, never interval counters.
    const interval = window.setInterval(refresh, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false; releaseWakeLock(); unsubscribe();
      window.clearInterval(interval);
      if (feedbackTimeout) clearTimeout(feedbackTimeout);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("storage", onStorage);
    };
  }, [store]);
  return <FocusContext.Provider value={{ store, now }}>{children}</FocusContext.Provider>;
}

export function useFocusSession() {
  const context = useContext(FocusContext);
  if (!context) throw new Error("useFocusSession requires FocusSessionProvider");
  const { store, now } = context;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const session = snapshot.session;
  const status = session?.status ?? "idle";
  const hasSession = Boolean(session && !session.savedSessionId && ["running", "away", "paused", "finished"].includes(status));
  const elapsedMs = getFocusElapsedMs(session, now);
  const awayDurationMs = session?.awaySince !== null && session?.awaySince !== undefined ? Math.max(0, now - session.awaySince) : 0;
  const mood: MascotMood = status === "finished" ? "celebrate" : status === "away"
    ? awayDurationMs > LONG_ABSENCE_MS ? "panic" : "sleepy"
    : status === "paused" ? "sleepy" : status === "running" ? "happy" : "neutral";
  return { ...snapshot, store, now, status, hasSession, elapsedMs, focusedMs: elapsedMs,
    awayDurationMs, elapsedSeconds: Math.floor(elapsedMs / 1000), mood };
}
