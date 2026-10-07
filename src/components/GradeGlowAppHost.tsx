"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import AuthGate from "./AuthGate";
import GradeGlowApp from "./GradeGlowApp";
import MobileAppHeader from "./MobileAppHeader";
import type { DashboardPage } from "./GradeGlowDashboard";

const dashboardRoutes: Record<string, DashboardPage> = {
  "/": "overview",
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
  useEffect(() => {
    const record = () => scrollPositions.current.set(currentPath.current, window.scrollY);
    window.addEventListener("scroll", record, { passive: true });
    return () => window.removeEventListener("scroll", record);
  }, []);
  useLayoutEffect(() => {
    currentPath.current = pathname;
    // Our persistent view is outside Next's changing page node, so it owns
    // scroll restoration too. New tabs start at the top; returning tabs remember.
    if (!window.location.hash) window.scrollTo({ top: scrollPositions.current.get(pathname) ?? 0, behavior: "instant" });
  }, [pathname]);
  const page = dashboardRoutes[pathname];
  if (!accountRoutes.has(pathname)) return children;

  return (
    <AuthGate>
      {() => <><MobileAppHeader pathname={pathname} />{page ? <GradeGlowApp page={page} /> : children}</>}
    </AuthGate>
  );
}
