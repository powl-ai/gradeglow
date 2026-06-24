"use client";

import AuthGate from "../../components/AuthGate";
import FeedbackPage from "../../components/FeedbackPage";

export default function FeedbackRoute() {
  return (
    <AuthGate>
      {({ user, logout }) => <FeedbackPage user={user} onLogout={logout} />}
    </AuthGate>
  );
}
