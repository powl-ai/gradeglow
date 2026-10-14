"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import AuthGate from "../components/AuthGate";
import FocusSessionProvider from "../components/FocusSessionProvider";
import { useDocumentAppearance } from "../hooks/useDocumentAppearance";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowExams } from "../hooks/useGradeGlowExams";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import type { AppUser, ExamPlanItem, GradeGlowProfile, PlanLimits } from "../types";
import { ACCENTS, dateKey, streakDays } from "./model";
import { Icon } from "./Icons";
import Heute from "./Heute";
import Kalender from "./Kalender";
import Fokus from "./Fokus";
import Klausuren from "./Klausuren";
import ExamSheet from "./ExamSheet";
import SettingsSheet from "./SettingsSheet";
import "./neu.css";

export type Tab = "heute" | "kalender" | "fokus" | "klausuren";
const TABS: { id: Tab; label: string; icon: (on: boolean) => ReactNode }[] = [
  { id: "heute", label: "Heute", icon: Icon.home },
  { id: "kalender", label: "Kalender", icon: Icon.calendar },
  { id: "fokus", label: "Fokus", icon: Icon.timer },
  { id: "klausuren", label: "Klausuren", icon: Icon.book },
];

type Sheet = { kind: "settings" } | { kind: "exam"; examId: string | null } | null;

/** Shared by every screen. */
export type AppCtx = {
  user: AppUser;
  name: string;
  exams: ExamPlanItem[];
  setExams: Dispatch<SetStateAction<ExamPlanItem[]>>;
  loaded: boolean;
  today: string;
  streak: number;
  profile: GradeGlowProfile;
  saveProfile: (profile: GradeGlowProfile) => Promise<unknown>;
  limits: PlanLimits;
  logout: () => Promise<void>;
  go: (tab: Tab, focusSessionId?: string, examId?: string) => void;
  openSettings: () => void;
  openExam: (examId: string | null) => void;
  focusPick: { examId: string | null; sessionId: string | null };
  setFocusPick: (pick: { examId: string | null; sessionId: string | null }) => void;
  examId: string | null;
  setExamId: (id: string | null) => void;
};

export default function NeuApp({ fontClass }: { fontClass: string }) {
  return (
    <AuthGate>
      {({ user, logout }) => (
        <FocusSessionProvider key={user.uid} uid={user.uid}>
          <Shell user={user} logout={logout} fontClass={fontClass} />
        </FocusSessionProvider>
      )}
    </AuthGate>
  );
}

const readTab = (): Tab => {
  const hash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return TABS.some((tab) => tab.id === hash) ? (hash as Tab) : "heute";
};

function Shell({ user, logout, fontClass }: { user: AppUser; logout: () => Promise<void>; fontClass: string }) {
  const { exams, setExams, isLoaded } = useGradeGlowExams(user);
  const { profile, saveProfile, isProfileLoaded } = useGradeGlowProfile(user);
  const { limits } = useGradeGlowAccess(user);
  useDocumentAppearance(profile.themeMode, profile.activePageThemeId, isProfileLoaded);
  const [tab, setTab] = useState<Tab>("heute");
  const [sheet, setSheet] = useState<Sheet>(null);
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
    user, exams, setExams, loaded: isLoaded, today, profile, saveProfile, limits, logout,
    name: (profile.displayName || user.displayName || "").split(" ")[0],
    streak: streakDays(exams, today),
    go: (next, sessionId, nextExamId) => {
      if (sessionId !== undefined) setFocusPick({ examId: nextExamId ?? null, sessionId });
      if (next === "klausuren" && nextExamId) setExamId(nextExamId);
      window.history.replaceState(null, "", `#${next}`);
      setTab(next);
    },
    openSettings: () => setSheet({ kind: "settings" }),
    openExam: (id) => setSheet({ kind: "exam", examId: id }),
    focusPick, setFocusPick, examId, setExamId,
  }), [user, exams, setExams, isLoaded, today, profile, saveProfile, limits, logout, focusPick, examId]);

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
      {sheet?.kind === "settings" && <SettingsSheet ctx={ctx} onClose={() => setSheet(null)} />}
      {sheet?.kind === "exam" && <ExamSheet ctx={ctx} examId={sheet.examId} onClose={() => setSheet(null)} />}
    </div>
  );
}
