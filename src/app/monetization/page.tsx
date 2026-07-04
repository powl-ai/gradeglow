"use client";

import AuthGate from "../../components/AuthGate";
import InternalToolGate from "../../components/InternalToolGate";
import MonetizationHubPage from "../../components/MonetizationHubPage";
import { useGradeGlowAccess } from "../../hooks/useGradeGlowAccess";
import type { AppUser } from "../../types";

function MonetizationRouteInner({ user, logout }: { user: AppUser; logout: () => Promise<void> }) {
  const { entitlement, accessSyncStatus } = useGradeGlowAccess(user);

  return (
    <InternalToolGate
      title="Monetarisierung"
      description="Checkout-Provider, Zahlungsstatus, Ads und Sponsor-Slots sind interne Vorbereitung und dürfen nicht in der normalen Nutzer-App landen."
      entitlement={entitlement}
      accessSyncStatus={accessSyncStatus}
    >
      <MonetizationHubPage user={user} onLogout={logout} />
    </InternalToolGate>
  );
}

export default function MonetizationRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <MonetizationRouteInner user={user} logout={logout} />}
    </AuthGate>
  );
}
