"use client";

import AuthGate from "../../components/AuthGate";
import SettingsPage from "../../components/SettingsPage";

export default function SettingsRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <SettingsPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
