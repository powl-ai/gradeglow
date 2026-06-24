"use client";

import AuthGate from "../../components/AuthGate";
import DiagnosticsPage from "../../components/DiagnosticsPage";

export default function DiagnosticsRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <DiagnosticsPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
