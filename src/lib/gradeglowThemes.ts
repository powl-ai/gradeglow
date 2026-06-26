import type { CSSProperties } from "react";
import type { AccentColor, PageThemeId, ThemeMode } from "../types";

export type GradeGlowPageTheme = {
  id: PageThemeId;
  title: string;
  description: string;
  previewClassName: string;
  isPremium: boolean;
  defaultAccentColor: AccentColor;
};

export const PAGE_THEMES: GradeGlowPageTheme[] = [
  {
    id: "default",
    title: "Classic Glow",
    description: "Der normale helle GradeGlow-Look. Akzentfarben bleiben trotzdem kombinierbar.",

    previewClassName: "from-violet-100 via-fuchsia-100 to-pink-100",
    isPremium: false,
    defaultAccentColor: "violet",
  },
  {
    id: "theme-night-library",
    title: "Rose Bloom",
    description: "Weiches rosé Premium-Theme für die gesamte App – kombinierbar mit jeder Akzentfarbe.",

    previewClassName: "from-rose-100 via-pink-200 to-fuchsia-300",
    isPremium: true,
    defaultAccentColor: "rose",
  },
  {
    id: "theme-study-sunrise",
    title: "Study Sunrise",
    description: "Warmer Sunrise-Look für Karten, Hintergründe und Diagramme – Akzentfarbe frei wählbar.",

    previewClassName: "from-orange-100 via-pink-200 to-violet-200",
    isPremium: true,
    defaultAccentColor: "amber",
  },
  {
    id: "theme-lavender-haze",
    title: "Lavender Haze",
    description: "Ruhiges, helles Lila-Theme mit premium Study-Lounge-Gefühl.",

    previewClassName: "from-purple-100 via-violet-100 to-fuchsia-200",
    isPremium: true,
    defaultAccentColor: "violet",
  },
  {
    id: "theme-matcha-focus",
    title: "Matcha Focus",
    description: "Cleanes grünliches Fokus-Theme für ruhige Lernphasen.",

    previewClassName: "from-lime-100 via-emerald-100 to-teal-200",
    isPremium: true,
    defaultAccentColor: "emerald",
  },
  {
    id: "theme-ocean-mist",
    title: "Ocean Mist",
    description: "Frisches blaues Premium-Theme mit kühlem, klaren App-Look.",

    previewClassName: "from-sky-100 via-cyan-100 to-blue-200",
    isPremium: true,
    defaultAccentColor: "blue",
  },
  {
    id: "theme-mocha-latte",
    title: "Mocha Latte",
    description: "Warmes Coffeehouse-Theme mit beige/braunen Karten und ruhiger Oberfläche.",

    previewClassName: "from-stone-100 via-amber-100 to-orange-200",
    isPremium: true,
    defaultAccentColor: "amber",
  },
];

export const validPageThemeIds = PAGE_THEMES.map((theme) => theme.id);

export const getPageTheme = (themeId: string) =>
  PAGE_THEMES.find((theme) => theme.id === themeId) ?? PAGE_THEMES[0];

export const getEffectivePageThemeId = (themeId: PageThemeId, canUsePremiumThemes: boolean): PageThemeId => {
  const theme = getPageTheme(themeId);
  if (theme.isPremium && !canUsePremiumThemes) return "default";
  return theme.id;
};

export const getThemeClassName = (themeMode: ThemeMode) => {
  if (themeMode === "dark") return "gg-theme-dark";
  if (themeMode === "light") return "gg-theme-light";
  return "gg-theme-system";
};

export const getPageThemeStyle = (themeId: PageThemeId): CSSProperties => ({
  "--gg-selected-page-theme": themeId,
} as CSSProperties);
