"use client";

import AuthGate from "../../components/AuthGate";
import MonetizationHubPage from "../../components/MonetizationHubPage";

export default function MonetizationRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <MonetizationHubPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
