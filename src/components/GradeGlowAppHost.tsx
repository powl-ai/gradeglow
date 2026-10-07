"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AuthGate from "./AuthGate";
import GradeGlowApp from "./GradeGlowApp";
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
  const page = dashboardRoutes[pathname];
  if (!accountRoutes.has(pathname)) return children;

  return (
    <AuthGate>
      {() => page ? <GradeGlowApp page={page} /> : children}
    </AuthGate>
  );
}
