"use client";

import AuthGate from "../../components/AuthGate";
import PremiumBoundariesPage from "../../components/PremiumBoundariesPage";

export default function PremiumRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <PremiumBoundariesPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
