import type { LogoAppearance, PageThemeId, ThemeMode } from "../types";

export const APPEARANCE_KEY = "gradeglow-appearance-v1";
export const LOGO_APPEARANCES: { value: LogoAppearance; label: string }[] = [
  { value: "auto", label: "Automatisch" },
  { value: "light", label: "Hell" },
  { value: "dark", label: "Dunkel" },
  { value: "rose", label: "Rosé" },
];

const backgrounds: Record<PageThemeId, [string, string]> = {
  default: ["#f4fbf7", "#070817"],
  "theme-night-library": ["#fff1f7", "#160711"],
  "theme-study-sunrise": ["#fff7ed", "#180d08"],
  "theme-lavender-haze": ["#f8f3ff", "#0f0a1f"],
  "theme-matcha-focus": ["#f0fdf4", "#05110b"],
  "theme-ocean-mist": ["#eff6ff", "#03111d"],
  "theme-mocha-latte": ["#fdf8f0", "#140d08"],
};

export type Appearance = { themeMode: ThemeMode; pageTheme: PageThemeId };

export const readCachedAppearance = (): Appearance => {
  try {
    const saved = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || "{}");
    return {
      themeMode: saved.themeMode === "dark" || saved.themeMode === "light" ? saved.themeMode : "system",
      pageTheme: Object.hasOwn(backgrounds, saved.pageTheme) ? saved.pageTheme : "default",
    };
  } catch { return { themeMode: "system", pageTheme: "default" }; }
};

export const applyDocumentAppearance = (appearance: Appearance) => {
  const dark = appearance.themeMode === "dark" || (appearance.themeMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const background = backgrounds[appearance.pageTheme]?.[dark ? 1 : 0] ?? backgrounds.default[dark ? 1 : 0];
  const root = document.documentElement;
  root.dataset.colorMode = dark ? "dark" : "light";
  root.style.setProperty("--gg-document-bg", background);
  root.style.setProperty("--background", background);
  root.style.setProperty("--foreground", dark ? "#f8fafc" : "#10261c");
  root.style.colorScheme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
  try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)); } catch { /* Memory-only appearance still works. */ }
};

// This runs in <head> before React or account data loads. It reads appearance
// only, never credentials or study data, and tolerates unavailable storage.
export const APPEARANCE_BOOTSTRAP_SCRIPT = `(function(){var a={};try{a=JSON.parse(localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)})||"{}")}catch(e){}var d=a.themeMode==="dark"||(a.themeMode!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var p=${JSON.stringify(backgrounds)};var b=Object.prototype.hasOwnProperty.call(p,a.pageTheme)?p[a.pageTheme]:p.default;var r=document.documentElement;r.dataset.colorMode=d?"dark":"light";r.style.setProperty("--gg-document-bg",b[d?1:0]);r.style.setProperty("--background",b[d?1:0]);r.style.setProperty("--foreground",d?"#f8fafc":"#10261c");r.style.colorScheme=d?"dark":"light";})()`;
