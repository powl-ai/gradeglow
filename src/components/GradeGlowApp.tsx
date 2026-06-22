"use client";

import AuthGate from "./AuthGate";
import GradeGlowDashboard from "./GradeGlowDashboard";
import type { DashboardPage } from "./GradeGlowDashboard";

type GradeGlowAppProps = {
  page?: DashboardPage;
};

export default function GradeGlowApp({ page = "overview" }: GradeGlowAppProps) {
  return (
    <AuthGate>
      {({ user, logout }) => (
        <GradeGlowDashboard user={user} onLogout={logout} page={page} />
      )}
    </AuthGate>
  );
}
