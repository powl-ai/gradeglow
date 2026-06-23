"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExamPlanItem, GradeGlowProfile } from "../types";

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

const canUseNotifications = () => typeof window !== "undefined" && "Notification" in window;

type GlowRewardsPanelProps = {
  profile: GradeGlowProfile;
  exams: ExamPlanItem[];
  saveProfile: (profile: GradeGlowProfile) => Promise<void>;
};

export default function GlowRewardsPanel({ profile, exams, saveProfile }: GlowRewardsPanelProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const todayKey = getDateKey(new Date());
  const yesterdayKey = getDateKey(addDays(new Date(), -1));
  const hasClaimedToday = profile.dailyLoginLastClaimDateKey === todayKey;
  const loginStreak = profile.dailyLoginLastClaimDateKey === yesterdayKey || hasClaimedToday ? profile.dailyLoginStreak : 0;

  const todayDoneMinutes = useMemo(
    () =>
      exams.reduce(
        (sum, exam) =>
          sum +
          exam.studySessions
            .filter((session) => session.isDone && session.dateKey === todayKey)
            .reduce((sessionSum, session) => sessionSum + session.durationMinutes, 0),
        0,
      ),
    [exams, todayKey],
  );

  useEffect(() => {
    if (canUseNotifications()) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!canUseNotifications()) return;
    if (!profile.studyReminderNotificationsEnabled || Notification.permission !== "granted") return;
    if (todayDoneMinutes > 0) return;

    const [rawHour, rawMinute] = profile.studyReminderTime.split(":").map(Number);
    const reminderMinutes = (Number.isFinite(rawHour) ? rawHour : 19) * 60 + (Number.isFinite(rawMinute) ? rawMinute : 0);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes < reminderMinutes) return;

    const storageKey = `gradeglow-study-reminder-sent-${todayKey}`;
    if (localStorage.getItem(storageKey) === "true") return;

    new Notification("GradeGlow Lernstreak ✨", {
      body: "Du hast heute noch nicht gelernt. Lerne 20 min, um deinen Streak aufrechtzuerhalten.",
      icon: "/icons/icon-192.png",
      tag: "gradeglow-daily-study-reminder",
    });
    localStorage.setItem(storageKey, "true");
  }, [profile.studyReminderNotificationsEnabled, profile.studyReminderTime, todayDoneMinutes, todayKey]);

  const claimDailyReward = async () => {
    if (hasClaimedToday) return;

    setIsSaving(true);
    setMessage("");

    const nextStreak = profile.dailyLoginLastClaimDateKey === yesterdayKey ? profile.dailyLoginStreak + 1 : 1;
    const streakBonus = Math.min(25, Math.max(0, nextStreak - 1) * 2);
    const earnedPoints = 10 + streakBonus;

    try {
      await saveProfile({
        ...profile,
        glowPoints: profile.glowPoints + earnedPoints,
        dailyLoginStreak: nextStreak,
        dailyLoginLastClaimDateKey: todayKey,
      });
      setMessage(`+${earnedPoints} Glow Points gesammelt. Daily Streak: ${nextStreak} Tag${nextStreak === 1 ? "" : "e"}.`);
    } catch {
      setMessage("Reward konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestNotifications = async () => {
    setMessage("");

    if (!canUseNotifications()) {
      setMessage("Dieses Gerät oder dieser Browser unterstützt Notifications hier gerade nicht.");
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);

    if (nextPermission !== "granted") {
      setMessage("Notifications sind noch nicht erlaubt. Du kannst sie später in den Browser-/iOS-Einstellungen aktivieren.");
      return;
    }

    await saveProfile({
      ...profile,
      studyReminderNotificationsEnabled: true,
      friendActivityNotificationsEnabled: true,
    });

    new Notification("GradeGlow Notifications aktiv ✨", {
      body: "Reminder und Study-Circle-Aktivitäten können jetzt angezeigt werden, solange die PWA/Website Benachrichtigungen auslösen darf.",
      icon: "/icons/icon-192.png",
      tag: "gradeglow-notification-test",
    });
    setMessage("Notifications aktiviert. Echte Hintergrund-Pushes werden später mit Firebase Cloud Messaging ergänzt.");
  };

  const toggleNotification = async (key: "studyReminderNotificationsEnabled" | "friendActivityNotificationsEnabled") => {
    setMessage("");
    await saveProfile({ ...profile, [key]: !profile[key] });
  };

  const updateReminderTime = async (value: string) => {
    await saveProfile({ ...profile, studyReminderTime: value });
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-violet-950/10 ring-1 ring-white/10">
        <div className="relative p-5 sm:p-6">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-bold text-fuchsia-200">Daily Glow</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Login belohnen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Sammle jeden Tag Glow Points. Wenn du morgen wiederkommst, steigt dein Daily-Streak und du bekommst einen kleinen Bonus.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-slate-300">Glow Points</p>
                <p className="mt-1 text-2xl font-black">{profile.glowPoints}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-slate-300">Daily Streak</p>
                <p className="mt-1 text-2xl font-black">{loginStreak}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-slate-300">Heute gelernt</p>
                <p className="mt-1 text-2xl font-black">{formatMinutes(todayDoneMinutes)}</p>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              onClick={claimDailyReward}
              disabled={hasClaimedToday || isSaving}
            >
              {hasClaimedToday ? "Reward heute abgeholt" : isSaving ? "Speichere…" : "Daily Glow abholen"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">Push & Reminder v1</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Lern-Notifications vorbereiten</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Reminder funktionieren über Browser-/PWA-Notifications. Freundesmeldungen erscheinen, wenn die App läuft und ein Freund eine Session startet oder beendet. Vollständige Hintergrund-Pushes kommen später über Firebase Cloud Messaging.
            </p>
          </div>
          <span className="self-start rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200">
            {canUseNotifications() ? `Status: ${permission}` : "nicht unterstützt"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5" onClick={requestNotifications}>
            Notifications erlauben / testen
          </button>
          <label className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
            Reminder-Zeit
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              type="time"
              value={profile.studyReminderTime}
              onChange={(event) => void updateReminderTime(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={`rounded-2xl px-4 py-3 text-left text-sm font-black ring-1 transition hover:-translate-y-0.5 ${profile.studyReminderNotificationsEnabled ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-50 text-slate-600 ring-slate-200"}`}
            onClick={() => void toggleNotification("studyReminderNotificationsEnabled")}
          >
            {profile.studyReminderNotificationsEnabled ? "✓" : "○"} „Heute noch nicht gelernt“-Reminder
          </button>
          <button
            type="button"
            className={`rounded-2xl px-4 py-3 text-left text-sm font-black ring-1 transition hover:-translate-y-0.5 ${profile.friendActivityNotificationsEnabled ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-50 text-slate-600 ring-slate-200"}`}
            onClick={() => void toggleNotification("friendActivityNotificationsEnabled")}
          >
            {profile.friendActivityNotificationsEnabled ? "✓" : "○"} Freund startet/beendet Lernsession
          </button>
        </div>

        {message && <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">{message}</p>}
      </div>
    </section>
  );
}
