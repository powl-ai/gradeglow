"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GLOW_COSMETICS,
  STREAK_BADGES,
  getAvatarFrameWrapperClassName,
  getBestStudyStreak,
  getCurrentStudyStreak,
  getDoneStudyDayKeys,
  getLatestStudyCompletedAt,
  getNextStudyReminderAt,
  getPageThemePreviewClassName,
  getProfileBannerClassName,
  STUDY_SESSION_REWARD_MINUTES,
  STUDY_SESSION_REWARD_POINTS_PER_STEP,
  normalizePurchasedCosmetics,
  ownsCosmetic,
} from "../lib/glowRewards";
import type { AccentColor, ExamPlanItem, GradeGlowProfile, PageThemeId, PlanLimits } from "../types";

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

const formatReminderDateTime = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const canUseNotifications = () => typeof window !== "undefined" && "Notification" in window;

const getLatestStudyDateKey = (latestStudyAt: Date | null) => (latestStudyAt ? getDateKey(latestStudyAt) : "");

const isValidAccentColor = (value: string): value is AccentColor =>
  ["violet", "pink", "blue", "emerald", "amber", "cyan", "rose"].includes(value);

const hasCosmeticAccess = (profile: GradeGlowProfile, cosmeticId: string, limits: PlanLimits) =>
  limits.premiumThemes || ownsCosmetic(profile, cosmeticId);

type GlowRewardsPanelProps = {
  profile: GradeGlowProfile;
  exams: ExamPlanItem[];
  saveProfile: (profile: GradeGlowProfile) => Promise<void>;
  limits: PlanLimits;
  planLabel: string;
};

export default function GlowRewardsPanel({ profile, exams, saveProfile, limits, planLabel }: GlowRewardsPanelProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewCosmeticId, setPreviewCosmeticId] = useState<string | null>(null);

  const todayKey = getDateKey(new Date());
  const yesterdayKey = getDateKey(addDays(new Date(), -1));
  const hasClaimedToday = profile.dailyLoginLastClaimDateKey === todayKey;
  const loginStreak = profile.dailyLoginLastClaimDateKey === yesterdayKey || hasClaimedToday ? profile.dailyLoginStreak : 0;

  const doneStudyDayKeys = useMemo(() => getDoneStudyDayKeys(exams), [exams]);
  const latestStudyAt = useMemo(() => getLatestStudyCompletedAt(exams), [exams]);
  const currentStudyStreak = useMemo(() => getCurrentStudyStreak(doneStudyDayKeys), [doneStudyDayKeys]);
  const bestStudyStreak = useMemo(() => getBestStudyStreak(doneStudyDayKeys), [doneStudyDayKeys]);
  const maxStudyStreak = Math.max(profile.maxStudyStreakDays, bestStudyStreak);
  const latestStudyDateKey = getLatestStudyDateKey(latestStudyAt);
  const nextReminderAt = getNextStudyReminderAt(latestStudyAt);
  const previewCosmetic = GLOW_COSMETICS.find((item) => item.id === previewCosmeticId) ?? null;
  const previewFrameId = previewCosmetic?.kind === "avatarFrame" ? previewCosmetic.id : profile.activeAvatarFrameId;
  const previewBannerId = previewCosmetic?.kind === "profileBanner" ? previewCosmetic.id : profile.activeProfileBannerId;
  const previewAccent = previewCosmetic?.kind === "accent" && previewCosmetic.accentColor ? previewCosmetic.accentColor : profile.accentColor;
  const previewPageThemeId = previewCosmetic?.kind === "pageTheme" && previewCosmetic.pageThemeId ? previewCosmetic.pageThemeId : profile.activePageThemeId;
  const activeBannerClassName = getProfileBannerClassName(profile.activeProfileBannerId);
  const activeFrameWrapperClassName = getAvatarFrameWrapperClassName(profile.activeAvatarFrameId);
  const previewBannerClassName = getProfileBannerClassName(previewBannerId);
  const previewFrameWrapperClassName = getAvatarFrameWrapperClassName(previewFrameId);
  const previewPageThemeClassName = getPageThemePreviewClassName(previewPageThemeId);
  const previewInitial = (profile.displayName.trim()[0] || "G").toUpperCase();

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
    const latestStudyIso = latestStudyAt?.toISOString() ?? "";
    const shouldUpdateStudyStats =
      profile.currentStudyStreakDays !== currentStudyStreak ||
      profile.maxStudyStreakDays < bestStudyStreak ||
      profile.lastStudyDateKey !== latestStudyDateKey ||
      (latestStudyIso && profile.lastStudyCompletedAtIso !== latestStudyIso);

    if (!shouldUpdateStudyStats) return;

    void saveProfile({
      ...profile,
      currentStudyStreakDays: currentStudyStreak,
      maxStudyStreakDays: Math.max(profile.maxStudyStreakDays, bestStudyStreak),
      lastStudyDateKey: latestStudyDateKey,
      lastStudyCompletedAtIso: latestStudyIso || profile.lastStudyCompletedAtIso,
    }).catch(() => undefined);
  }, [bestStudyStreak, currentStudyStreak, latestStudyAt, latestStudyDateKey, profile, saveProfile]);

  useEffect(() => {
    if (!canUseNotifications()) return undefined;
    if (!profile.studyReminderNotificationsEnabled || Notification.permission !== "granted") return undefined;
    if (todayDoneMinutes > 0) return undefined;

    const maybeSendReminder = () => {
      const now = new Date();
      const dueAt = getNextStudyReminderAt(latestStudyAt, now);
      if (now.getTime() < dueAt.getTime()) return;

      const storageKey = `gradeglow-study-reminder-sent-${getDateKey(dueAt)}`;
      if (localStorage.getItem(storageKey) === "true") return;

      new Notification("GradeGlow Lernstreak ✨", {
        body: "Du hast heute noch nicht gelernt. Lerne 20 min, um deinen Streak aufrechtzuerhalten.",
        icon: "/icons/icon-192.png",
        tag: "gradeglow-daily-study-reminder",
      });
      localStorage.setItem(storageKey, "true");
    };

    maybeSendReminder();
    const interval = window.setInterval(maybeSendReminder, 60_000);
    return () => window.clearInterval(interval);
  }, [latestStudyAt, profile.studyReminderNotificationsEnabled, todayDoneMinutes]);

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
      body: "Reminder laufen 24h nach dem letzten Lerneintrag, spätestens aber um 19:00 Uhr, solange die PWA/Website Notifications auslösen darf.",
      icon: "/icons/icon-192.png",
      tag: "gradeglow-notification-test",
    });
    setMessage("Notifications aktiviert. Zuverlässige Pushes bei komplett geschlossener App brauchen später Firebase Cloud Messaging.");
  };

  const toggleNotification = async (key: "studyReminderNotificationsEnabled" | "friendActivityNotificationsEnabled") => {
    setMessage("");
    await saveProfile({ ...profile, [key]: !profile[key] });
  };

  const redeemOrEquipCosmetic = async (cosmeticId: string) => {
    const cosmetic = GLOW_COSMETICS.find((item) => item.id === cosmeticId);
    if (!cosmetic) return;

    setIsSaving(true);
    setMessage("");

    const purchasedIds = normalizePurchasedCosmetics(profile.purchasedCosmeticIds);
    const alreadyOwned = purchasedIds.includes(cosmetic.id) || limits.premiumThemes;

    if (cosmetic.premiumOnly && !limits.premiumThemes) {
      setMessage(`${cosmetic.title} ist ein Premium-Theme. Dein aktueller Plan: ${planLabel}.`);
      setIsSaving(false);
      return;
    }

    if (!alreadyOwned && profile.glowPoints < cosmetic.cost) {
      setMessage(`Noch nicht genug Glow Points. Für ${cosmetic.title} brauchst du ${cosmetic.cost} Punkte.`);
      setIsSaving(false);
      return;
    }

    try {
      await saveProfile({
        ...profile,
        glowPoints: alreadyOwned ? profile.glowPoints : profile.glowPoints - cosmetic.cost,
        purchasedCosmeticIds: purchasedIds.includes(cosmetic.id) || limits.premiumThemes ? purchasedIds : [...purchasedIds, cosmetic.id],
        accentColor:
          cosmetic.kind === "accent" && cosmetic.accentColor && isValidAccentColor(cosmetic.accentColor)
            ? cosmetic.accentColor
            : profile.accentColor,
        activeAvatarFrameId: cosmetic.kind === "avatarFrame" ? cosmetic.id : profile.activeAvatarFrameId,
        activeProfileBannerId: cosmetic.kind === "profileBanner" ? cosmetic.id : profile.activeProfileBannerId,
        activePageThemeId:
          cosmetic.kind === "pageTheme" && cosmetic.pageThemeId
            ? (cosmetic.pageThemeId as PageThemeId)
            : profile.activePageThemeId,
      });
      setPreviewCosmeticId(null);
      setMessage(alreadyOwned ? `${cosmetic.title} aktiviert.` : `${cosmetic.title} freigeschaltet und aktiviert.`);
    } catch {
      setMessage("Kosmetik konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  };

  const unlockedBadgeCount = STREAK_BADGES.filter((badge) => maxStudyStreak >= badge.threshold).length;

  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className={`overflow-hidden rounded-3xl ${activeBannerClassName} text-white shadow-2xl shadow-violet-950/10 ring-1 ring-white/10`}>
        <div className="relative p-5 sm:p-6">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-bold text-fuchsia-100">Daily Glow</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Login, Streaks & Abzeichen</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Sammle täglich Glow Points, halte deine Lernroutine und schalte dauerhafte Max-Streak-Abzeichen frei. Nach erfolgreich gespeicherten Lernsessions werden Glow Points automatisch gutgeschrieben.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-5">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-white/70">Glow Points</p>
                <p className="mt-1 text-2xl font-black">{profile.glowPoints}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-white/70">Session Rewards</p>
                <p className="mt-1 text-2xl font-black">{profile.totalStudySessionRewards}</p>
                <p className="mt-1 text-[0.68rem] font-bold text-white/60">{STUDY_SESSION_REWARD_POINTS_PER_STEP} GP pro {STUDY_SESSION_REWARD_MINUTES} min</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-white/70">Daily Login</p>
                <p className="mt-1 text-2xl font-black">{loginStreak}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-white/70">Study Streak</p>
                <p className="mt-1 text-2xl font-black">{currentStudyStreak}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-xs text-white/70">Max Streak</p>
                <p className="mt-1 text-2xl font-black">{maxStudyStreak}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {STREAK_BADGES.map((badge) => {
                const isUnlocked = maxStudyStreak >= badge.threshold;
                return (
                  <span
                    key={badge.id}
                    className={`rounded-2xl px-3 py-2 text-xs font-black ring-1 ${isUnlocked ? "bg-white text-slate-950 ring-white" : "bg-white/10 text-white/50 ring-white/10"}`}
                    title={badge.description}
                  >
                    {badge.emoji} {badge.label}
                  </span>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                onClick={claimDailyReward}
                disabled={hasClaimedToday || isSaving}
              >
                {hasClaimedToday ? "Reward heute abgeholt" : isSaving ? "Speichere…" : "Daily Glow abholen"}
              </button>
              <p className="text-xs font-bold text-white/70">
                {unlockedBadgeCount}/{STREAK_BADGES.length} Abzeichen · heute gelernt: {formatMinutes(todayDoneMinutes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Push & Reminder v1</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Streak-Reminder vorbereiten</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Die Erinnerung wird 24h nach deinem letzten Lerneintrag fällig, aber am jeweiligen Tag spätestens um 19:00 Uhr. Freundesmeldungen funktionieren, wenn die App läuft und Notifications erlaubt sind.
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
            <div className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
              Nächster Reminder
              <p className="mt-2 text-lg font-black text-slate-950">{formatReminderDateTime(nextReminderAt)}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Fallback spätestens 19:00 Uhr, falls 24h später wäre.</p>
            </div>
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
        </div>

        <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Glow Shop</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Kosmetik mit Punkten freischalten</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Teste Farben, Banner, Profilbild-Frames und komplette App-Themes zuerst in der Vorschau. Premium/Admin nutzt alle aktuellen Shop-Looks ohne GP-Kauf; Free kann sie freischalten.</p>
            </div>
            <span className="self-start rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 ring-1 ring-violet-100">{limits.premiumThemes ? `${planLabel} · Shop frei` : `${profile.glowPoints} Punkte`}</span>
          </div>

          <div className={`mt-5 overflow-hidden rounded-3xl p-4 shadow-lg shadow-violet-950/10 ring-1 ring-slate-900/10 ${previewCosmetic?.kind === "pageTheme" ? previewPageThemeClassName : `${previewBannerClassName} text-white`}`}>
            <div className="flex items-center gap-3">
              <div className={previewFrameWrapperClassName ? `${previewFrameWrapperClassName} shrink-0 rounded-[1.35rem]` : "shrink-0"}>
                {profile.avatarDataUrl ? (
                  <div className="h-14 w-14 rounded-2xl bg-cover bg-center ring-1 ring-white/20" style={{ backgroundImage: `url(${profile.avatarDataUrl})` }} />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/20">{previewInitial}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Shop Preview</p>
                <p className="truncate text-xl font-black">{profile.displayName || "GradeGlow Profil"}</p>
                <p className="text-sm font-semibold text-white/75">
                  {previewCosmetic ? `${previewCosmetic.title} in Vorschau · noch nicht gekauft` : "Wähle ein Item aus und teste den Look vor dem Kauf."}
                </p>
              </div>
              <span className={`hidden rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${previewAccent === "cyan" ? "bg-cyan-300 text-slate-950" : previewAccent === "rose" ? "bg-rose-300 text-slate-950" : "bg-white text-slate-950"}`}>Accent: {previewAccent}</span>
            </div>
            {previewCosmetic && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-45" onClick={() => void redeemOrEquipCosmetic(previewCosmetic.id)} disabled={isSaving}>
                  {hasCosmeticAccess(profile, previewCosmetic.id, limits) ? "Aktivieren" : `${previewCosmetic.cost} GP einlösen`}
                </button>
                <button type="button" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10" onClick={() => setPreviewCosmeticId(null)}>
                  Vorschau schließen
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {GLOW_COSMETICS.map((item) => {
              const owned = hasCosmeticAccess(profile, item.id, limits);
              const isActive =
                (item.kind === "accent" && item.accentColor === profile.accentColor) ||
                (item.kind === "avatarFrame" && item.id === profile.activeAvatarFrameId) ||
                (item.kind === "profileBanner" && item.id === profile.activeProfileBannerId) ||
                (item.kind === "pageTheme" && item.pageThemeId === profile.activePageThemeId);
              const isPreviewing = previewCosmeticId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl p-3 ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-900" : isPreviewing ? "bg-violet-50 text-slate-950 ring-violet-200" : "bg-slate-50 text-slate-950 ring-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.previewClassName} ${item.kind === "avatarFrame" ? activeFrameWrapperClassName : ""}`}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-sm font-black text-slate-950">
                        {item.kind === "accent" ? "Aa" : item.kind === "avatarFrame" ? "G" : item.kind === "pageTheme" ? "UI" : "▣"}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-black">{item.title}</span>
                      <span className={`mt-0.5 block text-xs font-semibold leading-5 ${isActive ? "text-slate-300" : "text-slate-500"}`}>{item.description}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${isActive ? "bg-white text-slate-950" : owned ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
                      {isActive ? "aktiv" : owned ? "gekauft" : `${item.cost} GP`}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200" onClick={() => setPreviewCosmeticId(item.id)}>
                      Vorschau
                    </button>
                    <button type="button" className="rounded-2xl bg-violet-700 px-3 py-2 text-xs font-black text-white disabled:opacity-45" onClick={() => void redeemOrEquipCosmetic(item.id)} disabled={isSaving || (item.premiumOnly && !limits.premiumThemes)}>
                      {isActive ? "Aktiv" : owned ? "Nutzen" : "Kaufen"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {message && <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">{message}</p>}
      </div>
    </section>
  );
}
