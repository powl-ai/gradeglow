"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import AuthGate from "../components/AuthGate";
import FocusSessionProvider from "../components/FocusSessionProvider";
import { useDocumentAppearance } from "../hooks/useDocumentAppearance";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { getPlanLimits } from "../lib/gradeglowAccess";
import { getTestPremium, onTestPremiumChange } from "./testPremium";
import { useGradeGlowExams } from "../hooks/useGradeGlowExams";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import type { AppUser, ExamPlanItem, GradeGlowProfile, PlanLimits } from "../types";
import { ACCENTS, HERO_BUTTON, dateKey, streakDays } from "./model";
import { Icon } from "./Icons";
import Heute from "./Heute";
import Kalender from "./Kalender";
import Fokus from "./Fokus";
import Klausuren from "./Klausuren";
import Profil from "./Profil";
import ExamSheet from "./ExamSheet";
import SettingsSheet from "./SettingsSheet";
import QuizSheet from "./QuizSheet";
import "./neu.css";

/** Screens. "profil" is reached from the Heute header and has no slot in the tab bar. */
export type Tab = "heute" | "kalender" | "fokus" | "klausuren" | "profil";
const TABS: { id: Tab; label: string; icon: (on: boolean) => ReactNode }[] = [
  { id: "heute", label: "Heute", icon: Icon.home },
  { id: "kalender", label: "Kalender", icon: Icon.calendar },
  { id: "fokus", label: "Fokus", icon: Icon.timer },
  { id: "klausuren", label: "Klausuren", icon: Icon.book },
];

type Sheet = { kind: "settings" } | { kind: "exam"; examId: string | null } | { kind: "quiz"; examId: string; topicId: string } | null;

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
  /** Premium only through the preview test switch, not the account. */
  testPremium: boolean;
  logout: () => Promise<void>;
  go: (tab: Tab, focusSessionId?: string, examId?: string) => void;
  openSettings: () => void;
  openExam: (examId: string | null) => void;
  /** Quiz (premium) or quick check (free) on one topic; sets its percent. */
  openQuiz: (examId: string, topicId: string) => void;
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
  return hash === "profil" || TABS.some((tab) => tab.id === hash) ? (hash as Tab) : "heute";
};

function Shell({ user, logout, fontClass }: { user: AppUser; logout: () => Promise<void>; fontClass: string }) {
  const { exams, setExams, isLoaded } = useGradeGlowExams(user);
  const { profile, saveProfile, isProfileLoaded } = useGradeGlowProfile(user);
  const access = useGradeGlowAccess(user);
  // Preview links only: premium test access (5 taps on the plan tag in Profil).
  const [testPremium, setTestPremiumState] = useState(false);
  useEffect(() => { setTestPremiumState(getTestPremium()); return onTestPremiumChange(() => setTestPremiumState(getTestPremium())); }, []);
  const limits = useMemo(() => (testPremium && !access.limits.premiumThemes ? getPlanLimits("premium") : access.limits), [testPremium, access.limits]);
  useDocumentAppearance(profile.themeMode, profile.activePageThemeId, isProfileLoaded);
  const [tab, setTab] = useState<Tab>("heute");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [focusPick, setFocusPick] = useState<AppCtx["focusPick"]>({ examId: null, sessionId: null });
  const [examId, setExamId] = useState<string | null>(null);
  const [today, setToday] = useState(() => dateKey(new Date()));
  // The profile loads modules and timetable on first visit and then stays mounted,
  // so a pending cloud save is not cut off by switching tabs.
  const [profilSeen, setProfilSeen] = useState(false);
  useEffect(() => { if (tab === "profil") setProfilSeen(true); }, [tab]);

  // Status bar colour = app ground (light/dark as chosen in the app, not only the system).
  useEffect(() => {
    if (!isProfileLoaded) return;
    const dark = document.documentElement.dataset.colorMode === "dark";
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", dark ? "#0e0f12" : "#eceef1"));
  }, [isProfileLoaded, profile.themeMode]);

  // Swipe-back cannot be blocked in iOS home-screen apps. Instead nothing adds browser history:
  // tabs use replaceState, legal texts open as sheets, switching to /alt replaces the page.
  useEffect(() => {
    setTab(readTab());
    const onHash = () => setTab(readTab());
    const tick = window.setInterval(() => setToday(dateKey(new Date())), 60_000);
    window.addEventListener("hashchange", onHash);
    return () => { window.removeEventListener("hashchange", onHash); window.clearInterval(tick); };
  }, []);

  const ctx: AppCtx = useMemo(() => ({
    user, exams, setExams, loaded: isLoaded, today, profile, saveProfile, limits, testPremium, logout,
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
    openQuiz: (id, topicId) => setSheet({ kind: "quiz", examId: id, topicId }),
    focusPick, setFocusPick, examId, setExamId,
  }), [user, exams, setExams, isLoaded, today, profile, saveProfile, limits, testPremium, logout, focusPick, examId]);

  const accent = ACCENTS[profile.accentColor] ?? ACCENTS.violet;
  const [heroBtn, heroBtnInk] = HERO_BUTTON[profile.accentColor] ?? ["#fff", accent];
  const waitTitle = tab === "heute" ? "GradeGlow" : TABS.find((item) => item.id === tab)?.label ?? "GradeGlow";

  return (
    <div className={`gn ${fontClass}`} style={{ "--accent": accent, "--hero-btn": heroBtn, "--hero-btn-ink": heroBtnInk } as CSSProperties}>
      {tab === "profil" ? null : !isLoaded ? (
        // Until the exams are there, no screen may claim "noch keine Klausur".
        <div className="gn-scroll" aria-busy="true">
          <header className="gn-top"><h1>{waitTitle}</h1></header>
          <p className="gn-wait">Deine Klausuren werden geladen.</p>
        </div>
      ) : (
        <>
          {tab === "heute" && <Heute ctx={ctx} />}
          {tab === "kalender" && <Kalender ctx={ctx} />}
          {tab === "fokus" && <Fokus ctx={ctx} />}
          {tab === "klausuren" && <Klausuren ctx={ctx} />}
        </>
      )}
      {(tab === "profil" || profilSeen) && <Profil ctx={ctx} hidden={tab !== "profil"} />}
      <nav className="gn-tabs" aria-label="Navigation">
        {TABS.map((item) => (
          <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined} onClick={() => ctx.go(item.id)}>
            {item.icon(tab === item.id)}{item.label}
          </button>
        ))}
      </nav>
      {sheet?.kind === "settings" && <SettingsSheet ctx={ctx} onClose={() => setSheet(null)} />}
      {sheet?.kind === "exam" && <ExamSheet ctx={ctx} examId={sheet.examId} onClose={() => setSheet(null)} />}
      {sheet?.kind === "quiz" && <QuizSheet ctx={ctx} examId={sheet.examId} topicId={sheet.topicId} onClose={() => setSheet(null)} />}
    </div>
  );
}
