"use client";

import AuthGate from "../../components/AuthGate";
import NativeAppReadinessPage from "../../components/NativeAppReadinessPage";

export default function NativeReadinessRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <NativeAppReadinessPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
