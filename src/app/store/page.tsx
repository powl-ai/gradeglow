"use client";

import AuthGate from "../../components/AuthGate";
import AppStoreReadinessPage from "../../components/AppStoreReadinessPage";

export default function StoreReadinessRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <AppStoreReadinessPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
