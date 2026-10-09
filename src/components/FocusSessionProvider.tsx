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
    try { storage = window.localStorage; } catch { /* Use memory if storage is unavailable. */ }
    store.hydrate(storage, Date.now(), document.visibilityState === "visible");
    const canNotify = (id: string, kind: "away" | "finished") => {
      const latest = store.getSnapshot();
      return latest.settings.notificationsEnabled && latest.session?.id === id
        && document.visibilityState === "hidden"
        && (kind === "finished" ? latest.session.status === "finished" : latest.session.status === "running" && latest.session.awaySince !== null);
    };
    const refresh = () => {
      const timestamp = Date.now();
      const finished = store.tick(timestamp);
      const snapshot = store.getSnapshot();
      if (finished && document.visibilityState === "hidden" && snapshot.settings.notificationsEnabled && snapshot.session) {
        const id = snapshot.session.id;
        void showFocusNotification(id, "finished", () => canNotify(id, "finished"));
      }
      if (document.visibilityState === "visible") store.heartbeat(timestamp);
      setNow(timestamp);
    };
    const leave = () => {
      const departed = store.leaveApp(Date.now());
      const snapshot = store.getSnapshot();
      if (departed && snapshot.settings.notificationsEnabled && snapshot.session) {
        const id = snapshot.session.id;
        void showFocusNotification(id, "away", () => canNotify(id, "away"));
      }
    };
    const returnToApp = () => {
      store.returnToApp(Date.now());
      const session = store.getSnapshot().session;
      if (session) void clearFocusNotifications(session.id);
      refresh();
    };
    const onVisibility = () => document.visibilityState === "hidden" ? leave() : returnToApp();
    const onStorage = (event: StorageEvent) => {
      if (event.key === store.key || event.key === null) {
        store.sync(event.key === null ? null : event.newValue, Date.now());
        refresh();
      }
    };
    let notificationsEnabled = store.getSnapshot().settings.notificationsEnabled;
    const unsubscribe = store.subscribe(() => {
      const latest = store.getSnapshot();
      if (notificationsEnabled && !latest.settings.notificationsEnabled && latest.session) {
        void clearFocusNotifications(latest.session.id);
      }
      notificationsEnabled = latest.settings.notificationsEnabled;
    });
    refresh();
    // This interval repaints timestamps. It never increments the timer itself.
    const interval = window.setInterval(refresh, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", returnToApp);
    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", returnToApp);
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
  const hasSession = Boolean(session && !session.savedSessionId && ["running", "paused", "finished"].includes(status));
  const elapsedMs = getFocusElapsedMs(session, now);
  const mood: MascotMood = status === "finished" ? "celebrate" : status === "paused" ? "sleepy"
    : status === "running" && snapshot.returnFeedback
      ? snapshot.returnFeedback.durationMs >= LONG_ABSENCE_MS ? "panic" : "neutral"
      : status === "running" ? "happy" : "neutral";
  return { ...snapshot, store, now, status, hasSession, elapsedMs, elapsedSeconds: Math.floor(elapsedMs / 1000), mood };
}
