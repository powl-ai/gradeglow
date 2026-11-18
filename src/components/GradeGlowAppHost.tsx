"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import AuthGate from "./AuthGate";
import GradeGlowApp from "./GradeGlowApp";
import MobileAppHeader from "./MobileAppHeader";
import FocusSessionProvider from "./FocusSessionProvider";
import type { DashboardPage } from "./GradeGlowDashboard";

const dashboardRoutes: Record<string, DashboardPage> = {
  "/alt": "overview",
  "/profile": "profile",
  "/insights": "insights",
  "/friends": "friends",
  "/exams": "exams",
  "/timer": "timer",
  "/planning": "planning",
  "/schedule": "schedule",
  "/modules": "modules",
  "/backup": "backup",
};

const accountRoutes = new Set([
  ...Object.keys(dashboardRoutes), "/settings", "/premium", "/feedback",
  "/admin", "/diagnostics", "/launch", "/store", "/native", "/monetization",
]);

// Mounted in the root layout: changing the URL changes the view, while
// authentication and the main dashboard's live data remain mounted.
export default function GradeGlowAppHost({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scrollPositions = useRef(new Map<string, number>());
  const currentPath = useRef(pathname);
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // iOS home-screen apps can report a CSS viewport (vh/lvh, inset:0) that does not
    // match the area actually shown, which pushed the tab bar off-screen. innerHeight
    // is the real visible height, so the shell is sized from it.
    const root = document.documentElement;
    // As a home-screen app, iOS sometimes reports innerHeight too small right after launch,
    // which left a gap under the tab bar. There the app always covers the whole screen.
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
      || window.matchMedia("(display-mode: standalone)").matches;
    const sync = () => {
      const screenHeight = window.innerWidth > window.innerHeight ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
      const height = standalone ? Math.max(window.innerHeight, screenHeight) : window.innerHeight;
      root.style.setProperty("--gg-app-height", `${height}px`);
    };
    sync();
    const later = [window.setTimeout(sync, 300), window.setTimeout(sync, 1200)];
    const events = ["resize", "orientationchange", "pageshow"] as const;
    events.forEach((name) => window.addEventListener(name, sync));
    document.addEventListener("visibilitychange", sync);
    return () => {
      later.forEach((id) => window.clearTimeout(id));
      events.forEach((name) => window.removeEventListener(name, sync));
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  useEffect(() => {
    const record = (event: Event) => {
      const main = shell.current?.querySelector("main");
      if (main && event.target === main) scrollPositions.current.set(currentPath.current, main.scrollTop);
    };
    document.addEventListener("scroll", record, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", record, true);
  }, []);
  useLayoutEffect(() => {
    currentPath.current = pathname;
    // Our persistent view is outside Next's changing page node, so it owns
    // scroll restoration too. New tabs start at the top; returning tabs remember.
    if (!window.location.hash) shell.current?.querySelector("main")?.scrollTo({ top: scrollPositions.current.get(pathname) ?? 0, behavior: "instant" });
  }, [pathname]);
  const page = dashboardRoutes[pathname];
  if (!accountRoutes.has(pathname)) return children;

  return (
    <AuthGate>
      {({ user }) => <FocusSessionProvider key={user.uid} uid={user.uid}><div ref={shell} className="gg-native-layout"><MobileAppHeader pathname={pathname} />{page ? <GradeGlowApp page={page} /> : children}</div></FocusSessionProvider>}
    </AuthGate>
  );
}
