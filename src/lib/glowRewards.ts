import type { AccentColor, ExamPlanItem, GradeGlowProfile, PageThemeId } from "../types";

export type GlowCosmeticKind = "accent" | "avatarFrame" | "profileBanner" | "pageTheme";

export type GlowCosmeticItem = {
  id: string;
  kind: GlowCosmeticKind;
  title: string;
  description: string;
  cost: number;
  previewClassName: string;
  accentColor?: AccentColor;
  pageThemeId?: PageThemeId;
  premiumOnly?: boolean;
};

export type StreakBadge = {
  id: string;
  label: string;
  emoji: string;
  threshold: number;
  description: string;
};

export const GLOW_COSMETICS: GlowCosmeticItem[] = [
  {
    id: "accent-cyan",
    kind: "accent",
    title: "Cyan Glow",
    description: "Schaltet eine kühle Cyan-Akzentfarbe frei.",
    cost: 80,
    previewClassName: "from-cyan-400 to-sky-600",
    accentColor: "cyan",
  },
  {
    id: "accent-rose",
    kind: "accent",
    title: "Rose Glow",
    description: "Schaltet eine weichere Rose-Akzentfarbe frei.",
    cost: 80,
    previewClassName: "from-rose-400 to-pink-600",
    accentColor: "rose",
  },

  {
    id: "theme-night-library",
    kind: "pageTheme",
    title: "Rose Bloom Theme",
    description: "Premium: färbt die komplette App weich, rosé und deutlich anders als Dark Mode ein.",
    cost: 220,
    previewClassName: "from-rose-100 via-pink-200 to-fuchsia-300",
    pageThemeId: "theme-night-library",
    premiumOnly: true,
  },
  {
    id: "theme-study-sunrise",
    kind: "pageTheme",
    title: "Study Sunrise Theme",
    description: "Premium: färbt die komplette App warm, hell und sunrise-like ein.",
    cost: 220,
    previewClassName: "from-orange-100 via-pink-200 to-violet-300",
    pageThemeId: "theme-study-sunrise",
    premiumOnly: true,
  },
  {
    id: "theme-lavender-haze",
    kind: "pageTheme",
    title: "Lavender Haze Theme",
    description: "Premium: helles Lila-Theme, kombinierbar mit jeder Akzentfarbe.",
    cost: 220,
    previewClassName: "from-purple-100 via-violet-100 to-fuchsia-200",
    pageThemeId: "theme-lavender-haze",
    premiumOnly: true,
  },
  {
    id: "theme-matcha-focus",
    kind: "pageTheme",
    title: "Matcha Focus Theme",
    description: "Premium: ruhiges grünes Fokus-Theme mit weichen Karten.",
    cost: 220,
    previewClassName: "from-lime-100 via-emerald-100 to-teal-200",
    pageThemeId: "theme-matcha-focus",
    premiumOnly: true,
  },
  {
    id: "theme-ocean-mist",
    kind: "pageTheme",
    title: "Ocean Mist Theme",
    description: "Premium: frisches blaues Theme für einen klaren Study-Look.",
    cost: 220,
    previewClassName: "from-sky-100 via-cyan-100 to-blue-200",
    pageThemeId: "theme-ocean-mist",
    premiumOnly: true,
  },
  {
    id: "theme-mocha-latte",
    kind: "pageTheme",
    title: "Mocha Latte Theme",
    description: "Premium: warmes Coffeehouse-Theme in Beige und Braun.",
    cost: 220,
    previewClassName: "from-stone-100 via-amber-100 to-orange-200",
    pageThemeId: "theme-mocha-latte",
    premiumOnly: true,
  },
  {
    id: "frame-aurora",
    kind: "avatarFrame",
    title: "Aurora Frame",
    description: "Farbige Umrandung für dein Profilbild.",
    cost: 120,
    previewClassName: "from-violet-500 via-fuchsia-400 to-cyan-400",
  },
  {
    id: "frame-gold",
    kind: "avatarFrame",
    title: "Gold Frame",
    description: "Goldene Profilbild-Umrandung für hohe Streaks.",
    cost: 160,
    previewClassName: "from-amber-300 via-yellow-400 to-orange-500",
  },
  {
    id: "banner-night",
    kind: "profileBanner",
    title: "Rose Bloom",
    description: "Rosaner Profilbanner mit weichem Glow-Effekt.",
    cost: 140,
    previewClassName: "from-rose-200 via-pink-300 to-fuchsia-400",
  },
  {
    id: "banner-sunrise",
    kind: "profileBanner",
    title: "Study Sunrise",
    description: "Warmer Banner für dein Profil.",
    cost: 140,
    previewClassName: "from-orange-200 via-pink-300 to-violet-400",
  },
];

export const STREAK_BADGES: StreakBadge[] = [
  { id: "streak-3", label: "3 Tage", emoji: "🌱", threshold: 3, description: "Erste Lernroutine aufgebaut." },
  { id: "streak-7", label: "7 Tage", emoji: "🔥", threshold: 7, description: "Eine Woche Study-Streak." },
  { id: "streak-14", label: "14 Tage", emoji: "💎", threshold: 14, description: "Zwei Wochen konsequent gelernt." },
  { id: "streak-30", label: "30 Tage", emoji: "👑", threshold: 30, description: "Ein voller Monat Lernroutine." },
  { id: "streak-60", label: "60 Tage", emoji: "🚀", threshold: 60, description: "Langfristige Routine gesichert." },
];

export const normalizePurchasedCosmetics = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

export const STUDY_SESSION_REWARD_MINUTES = 10;
export const STUDY_SESSION_REWARD_POINTS_PER_STEP = 1;
export const STUDY_SESSION_REWARD_MAX_POINTS = 30;

export const normalizeRewardedStudySessionIds = (ids: string[]) =>
  Array.from(new Set(ids.filter(Boolean)));

export const getStudySessionRewardPoints = (durationMinutes: number) => {
  const safeDuration = Math.max(0, Math.round(Number(durationMinutes) || 0));
  if (safeDuration < STUDY_SESSION_REWARD_MINUTES) return 0;
  return Math.min(
    STUDY_SESSION_REWARD_MAX_POINTS,
    Math.floor(safeDuration / STUDY_SESSION_REWARD_MINUTES) * STUDY_SESSION_REWARD_POINTS_PER_STEP,
  );
};

export const ownsCosmetic = (profile: GradeGlowProfile, cosmeticId: string) =>
  normalizePurchasedCosmetics(profile.purchasedCosmeticIds).includes(cosmeticId);

export const getAvatarFrameClassName = (frameId: string) => {
  switch (frameId) {
    case "frame-aurora":
      return "ring-2 ring-fuchsia-300 shadow-lg shadow-fuchsia-300/30";
    case "frame-gold":
      return "ring-2 ring-amber-300 shadow-lg shadow-amber-300/30";
    default:
      return "";
  }
};

export const getAvatarFrameWrapperClassName = (frameId: string) => {
  switch (frameId) {
    case "frame-aurora":
      return "bg-gradient-to-br from-violet-500 via-fuchsia-400 to-cyan-400 p-0.5";
    case "frame-gold":
      return "bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 p-0.5";
    default:
      return "";
  }
};

export const getProfileBannerClassName = (bannerId: string) => {
  switch (bannerId) {
    case "banner-night":
      return "bg-gradient-to-br from-rose-200 via-pink-300 to-fuchsia-400 text-slate-950";
    case "banner-sunrise":
      return "bg-gradient-to-br from-orange-200 via-pink-300 to-violet-400 text-slate-950";
    default:
      return "bg-slate-950";
  }
};


export const getPageThemePreviewClassName = (themeId: string) => {
  switch (themeId) {
    case "theme-night-library":
      return "bg-gradient-to-br from-rose-100 via-pink-200 to-fuchsia-300 text-slate-950";
    case "theme-study-sunrise":
      return "bg-gradient-to-br from-orange-100 via-pink-200 to-violet-300 text-slate-950";
    case "theme-lavender-haze":
      return "bg-gradient-to-br from-purple-100 via-violet-100 to-fuchsia-200 text-slate-950";
    case "theme-matcha-focus":
      return "bg-gradient-to-br from-lime-100 via-emerald-100 to-teal-200 text-slate-950";
    case "theme-ocean-mist":
      return "bg-gradient-to-br from-sky-100 via-cyan-100 to-blue-200 text-slate-950";
    case "theme-mocha-latte":
      return "bg-gradient-to-br from-stone-100 via-amber-100 to-orange-200 text-slate-950";
    default:
      return "bg-gradient-to-br from-violet-100 via-fuchsia-100 to-pink-100 text-slate-950";
  }
};

const toDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

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

const createSessionDate = (dateKey: string, time: string) => {
  const date = toDate(dateKey);
  if (!date) return null;
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(Number.isFinite(hours) ? hours : 19, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
};

export const getDoneStudyDayKeys = (exams: ExamPlanItem[]) =>
  Array.from(
    new Set(
      exams.flatMap((exam) => exam.studySessions.filter((session) => session.isDone).map((session) => session.dateKey)),
    ),
  ).sort();

export const getBestStudyStreak = (dayKeys: string[]) => {
  if (dayKeys.length === 0) return 0;
  let best = 1;
  let current = 1;

  for (let index = 1; index < dayKeys.length; index += 1) {
    const previous = toDate(dayKeys[index - 1]);
    const next = toDate(dayKeys[index]);
    if (!previous || !next) continue;

    if (getDateKey(addDays(previous, 1)) === getDateKey(next)) {
      current += 1;
      best = Math.max(best, current);
    } else if (dayKeys[index - 1] !== dayKeys[index]) {
      current = 1;
    }
  }

  return best;
};

export const getCurrentStudyStreak = (dayKeys: string[], now = new Date()) => {
  const dayKeySet = new Set(dayKeys);
  const todayKey = getDateKey(now);
  let cursor = dayKeySet.has(todayKey) ? new Date(now) : addDays(now, -1);
  let streak = 0;

  while (dayKeySet.has(getDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export const getLatestStudyCompletedAt = (exams: ExamPlanItem[]) => {
  const dates = exams.flatMap((exam) =>
    exam.studySessions
      .filter((session) => session.isDone)
      .map((session) => {
        if (session.completedAtIso) {
          const completedAt = new Date(session.completedAtIso);
          if (!Number.isNaN(completedAt.getTime())) return completedAt;
        }
        return createSessionDate(session.dateKey, session.time);
      })
      .filter((date): date is Date => Boolean(date)),
  );

  if (dates.length === 0) return null;
  return dates.reduce((latest, date) => (date.getTime() > latest.getTime() ? date : latest), dates[0]);
};

export const getNextStudyReminderAt = (latestStudyAt: Date | null, now = new Date()) => {
  const todayAt19 = new Date(now);
  todayAt19.setHours(19, 0, 0, 0);

  if (!latestStudyAt) return todayAt19;

  const after24Hours = new Date(latestStudyAt.getTime() + 24 * 60 * 60 * 1000);
  const isDueToday = getDateKey(after24Hours) === getDateKey(now);
  return isDueToday && after24Hours.getTime() > todayAt19.getTime() ? todayAt19 : after24Hours;
};
