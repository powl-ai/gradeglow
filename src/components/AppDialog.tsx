"use client";

import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import { readCachedAppearance } from "../lib/appearance";
import type { GradeGlowProfile } from "../types";

let openDialogCount = 0;
let originalBodyOverflow = "";

// The browser's top layer keeps dialogs above portals such as the mobile dock.
// It also handles focus containment, Escape, and restoring the previous focus.
export default function AppDialog({ children, onClose, label, profile, className = "" }: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  profile?: GradeGlowProfile;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cached = readCachedAppearance();
  const theme = profile?.themeMode ?? cached.themeMode;
  const pageTheme = profile?.activePageThemeId ?? cached.pageTheme;
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openDialogCount === 0) originalBodyOverflow = document.body.style.overflow;
    openDialogCount += 1;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      openDialogCount -= 1;
      if (openDialogCount === 0) document.body.style.overflow = originalBodyOverflow;
    };
  }, []);

  return (
    <dialog ref={dialogRef} aria-label={label}
      className={`gg-app-dialog gg-themed ${getThemeClassName(theme)} ${className}`}
      data-accent={profile?.accentColor ?? "violet"} data-page-theme={pageTheme}
      style={getPageThemeStyle(pageTheme)}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="gg-dialog-panel">{children}</div>
    </dialog>
  );
}
