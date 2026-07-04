"use client";

import AuthGate from "../../components/AuthGate";
import BetaToolGate from "../../components/BetaToolGate";
import NativeAppReadinessPage from "../../components/NativeAppReadinessPage";

export default function NativeReadinessRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => (
        <BetaToolGate
          user={user}
          title="Native App Prep"
          description="Capacitor, TestFlight und native App-Vorbereitung sind interne Beta-Werkzeuge und gehören nicht in die normale Nutzer-App."
        >
          <NativeAppReadinessPage user={user} onLogout={logout} />
        </BetaToolGate>
      )}
    </AuthGate>
  );
}
