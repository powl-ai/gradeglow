"use client";

import AuthGate from "./AuthGate";
import GradeGlowDashboard from "./GradeGlowDashboard";
import ClientDiagnosticsLogger from "./ClientDiagnosticsLogger";
import type { DashboardPage } from "./GradeGlowDashboard";

type GradeGlowAppProps = {
  page?: DashboardPage;
};

export default function GradeGlowApp({ page = "overview" }: GradeGlowAppProps) {
  return (
    <AuthGate>
      {({ user, logout }) => (
        <ClientDiagnosticsLogger user={user}>
          <GradeGlowDashboard user={user} onLogout={logout} page={page} />
        </ClientDiagnosticsLogger>
      )}
    </AuthGate>
  );
}
