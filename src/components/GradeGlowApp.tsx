"use client";

import DemoAccessBar from "./DemoAccessBar";
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
      {({ user, logout, startRegistration }) => (
        <ClientDiagnosticsLogger user={user}>
          <GradeGlowDashboard key={user.uid} user={user} onLogout={logout} page={page} demoControls={user.provider === "demo" ? <DemoAccessBar onRegister={startRegistration} onExit={logout} /> : undefined} />
        </ClientDiagnosticsLogger>
      )}
    </AuthGate>
  );
}
