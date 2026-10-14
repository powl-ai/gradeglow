"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import AuthGate from "../components/AuthGate";
import FocusSessionProvider from "../components/FocusSessionProvider";
import { useGradeGlowExams } from "../hooks/useGradeGlowExams";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import type { AppUser, ExamPlanItem } from "../types";
import { ACCENTS, dateKey } from "./model";
import { Icon } from "./Icons";
import Heute from "./Heute";
import Kalender from "./Kalender";
import Fokus from "./Fokus";
import Klausuren from "./Klausuren";
import "./neu.css";

export type Tab = "heute" | "kalender" | "fokus" | "klausuren";
const TABS: { id: Tab; label: string; icon: (on: boolean) => ReactNode }[] = [
  { id: "heute", label: "Heute", icon: Icon.home },
  { id: "kalender", label: "Kalender", icon: Icon.calendar },
  { id: "fokus", label: "Fokus", icon: Icon.timer },
  { id: "klausuren", label: "Klausuren", icon: Icon.book },
];

/** Shared by every screen. */
export type AppCtx = {
  user: AppUser;
  name: string;
  exams: ExamPlanItem[];
  setExams: Dispatch<SetStateAction<ExamPlanItem[]>>;
  loaded: boolean;
  today: string;
  streak: number;
  go: (tab: Tab, focusSessionId?: string, examId?: string) => void;
  focusPick: { examId: string | null; sessionId: string | null };
  setFocusPick: (pick: { examId: string | null; sessionId: string | null }) => void;
  examId: string | null;
  setExamId: (id: string | null) => void;
};

export default function NeuApp({ fontClass }: { fontClass: string }) {
  return (
    <AuthGate>
      {({ user }) => (
        <FocusSessionProvider key={user.uid} uid={user.uid}>
          <Shell user={user} fontClass={fontClass} />
        </FocusSessionProvider>
      )}
    </AuthGate>
  );
}

const readTab = (): Tab => {
  const hash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return TABS.some((tab) => tab.id === hash) ? (hash as Tab) : "heute";
};

function Shell({ user, fontClass }: { user: AppUser; fontClass: string }) {
  const { exams, setExams, isLoaded } = useGradeGlowExams(user);
  const { profile } = useGradeGlowProfile(user);
  const [tab, setTab] = useState<Tab>("heute");
  const [focusPick, setFocusPick] = useState<AppCtx["focusPick"]>({ examId: null, sessionId: null });
  const [examId, setExamId] = useState<string | null>(null);
  const [today, setToday] = useState(() => dateKey(new Date()));

  useEffect(() => {
    setTab(readTab());
    const onHash = () => setTab(readTab());
    const tick = window.setInterval(() => setToday(dateKey(new Date())), 60_000);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); window.clearInterval(tick); };
  }, []);

  const ctx: AppCtx = useMemo(() => ({
    user, exams, setExams, loaded: isLoaded, today,
    name: (profile.displayName || user.displayName || "").split(" ")[0],
    streak: profile.currentStudyStreakDays || 0,
    go: (next, sessionId, nextExamId) => {
      if (sessionId !== undefined) setFocusPick({ examId: nextExamId ?? null, sessionId });
      if (next === "klausuren" && nextExamId) setExamId(nextExamId);
      window.history.replaceState(null, "", `#${next}`);
      setTab(next);
    },
    focusPick, setFocusPick, examId, setExamId,
  }), [user, exams, setExams, isLoaded, today, profile.displayName, profile.currentStudyStreakDays, focusPick, examId]);

  const accent = ACCENTS[profile.accentColor] ?? ACCENTS.violet;

  return (
    <div className={`gn ${fontClass}`} style={{ "--accent": accent } as CSSProperties}>
      {tab === "heute" && <Heute ctx={ctx} />}
      {tab === "kalender" && <Kalender ctx={ctx} />}
      {tab === "fokus" && <Fokus ctx={ctx} />}
      {tab === "klausuren" && <Klausuren ctx={ctx} />}
      <nav className="gn-tabs" aria-label="Navigation">
        {TABS.map((item) => (
          <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined} onClick={() => ctx.go(item.id)}>
            {item.icon(tab === item.id)}{item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
