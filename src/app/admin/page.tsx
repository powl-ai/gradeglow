"use client";

import AuthGate from "../../components/AuthGate";
import AdminBetaPage from "../../components/AdminBetaPage";

export default function AdminRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <AdminBetaPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
