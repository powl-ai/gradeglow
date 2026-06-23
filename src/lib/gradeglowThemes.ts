import type { CSSProperties } from "react";
import type { PageThemeId } from "../types";

export type GradeGlowPageTheme = {
  id: PageThemeId;
  title: string;
  description: string;
  previewClassName: string;
  isPremium: boolean;
};

export const PAGE_THEMES: GradeGlowPageTheme[] = [
  {
    id: "default",
    title: "Classic Glow",
    description: "Der normale helle GradeGlow-Look.",
    previewClassName: "from-violet-100 via-fuchsia-100 to-pink-100",
    isPremium: false,
  },
  {
    id: "theme-night-library",
    title: "Night Library",
    description: "Dunkle Library-Farben für die gesamte App, inklusive Karten und Diagramme.",
    previewClassName: "from-slate-950 via-indigo-950 to-violet-900",
    isPremium: true,
  },
  {
    id: "theme-study-sunrise",
    title: "Study Sunrise",
    description: "Warmer Sunrise-Look für die gesamte App, inklusive Karten und Diagramme.",
    previewClassName: "from-orange-100 via-pink-200 to-violet-200",
    isPremium: true,
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

export const getPageThemeStyle = (themeId: PageThemeId): CSSProperties => ({
  "--gg-selected-page-theme": themeId,
} as CSSProperties);
