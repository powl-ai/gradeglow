"use client";

import AuthGate from "./AuthGate";
import GradeGlowDashboard from "./GradeGlowDashboard";

export default function GradeGlowApp() {
  return (
    <AuthGate>
      {({ user, logout }) => (
        <GradeGlowDashboard user={user} onLogout={logout} />
      )}
    </AuthGate>
  );
}
