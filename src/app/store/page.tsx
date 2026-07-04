"use client";

import AuthGate from "../../components/AuthGate";
import AppStoreReadinessPage from "../../components/AppStoreReadinessPage";
import BetaToolGate from "../../components/BetaToolGate";

export default function StoreReadinessRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => (
        <BetaToolGate
          user={user}
          title="Store Readiness"
          description="Store-Listing, Screenshots und App-Review-Vorbereitung sind interne Beta-Werkzeuge und werden normalen Nutzern nicht angezeigt."
        >
          <AppStoreReadinessPage user={user} onLogout={logout} />
        </BetaToolGate>
      )}
    </AuthGate>
  );
}
