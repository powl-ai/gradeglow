"use client";

import { useLayoutEffect } from "react";
import { applyDocumentAppearance } from "../lib/appearance";
import type { PageThemeId, ThemeMode } from "../types";

export function useDocumentAppearance(themeMode: ThemeMode, pageTheme: PageThemeId, ready: boolean) {
  useLayoutEffect(() => {
    if (!ready) return;
    const update = () => applyDocumentAppearance({ themeMode, pageTheme });
    update();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [themeMode, pageTheme, ready]);
}
