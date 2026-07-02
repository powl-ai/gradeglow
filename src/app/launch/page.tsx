"use client";

import AuthGate from "../../components/AuthGate";
import ClientDiagnosticsLogger from "../../components/ClientDiagnosticsLogger";
import LaunchReadinessCenter from "../../components/LaunchReadinessCenter";
import { useGradeGlowAccess } from "../../hooks/useGradeGlowAccess";
import { useGradeGlowExams } from "../../hooks/useGradeGlowExams";
import { useGradeGlowModules } from "../../hooks/useGradeGlowModules";
import { useGradeGlowProfile } from "../../hooks/useGradeGlowProfile";
import { useGradeGlowSchedule } from "../../hooks/useGradeGlowSchedule";
import type { AppUser } from "../../types";

function LaunchRouteInner({ user, logout }: { user: AppUser; logout: () => Promise<void> }) {
  const { modules, isLoaded: modulesLoaded, syncMessage: modulesSyncMessage } = useGradeGlowModules(user);
  const { exams, isLoaded: examsLoaded, syncMessage: examsSyncMessage } = useGradeGlowExams(user);
  const { isLoaded: scheduleLoaded, syncMessage: scheduleSyncMessage } = useGradeGlowSchedule(user);
  const { profile, isProfileLoaded } = useGradeGlowProfile(user);
  const { entitlement } = useGradeGlowAccess(user);

  const cloudMessages = [
    modulesSyncMessage,
    examsSyncMessage,
    scheduleSyncMessage,
    scheduleLoaded ? "Stundenplan geladen" : "Stundenplan lädt",
  ].filter(Boolean);

  return (
    <ClientDiagnosticsLogger user={user}>
      <LaunchReadinessCenter
        user={user}
        onLogout={logout}
        profile={profile}
        modules={modules}
        exams={exams}
        entitlement={entitlement}
        cloudMessages={cloudMessages}
        isProfileLoaded={isProfileLoaded}
        modulesLoaded={modulesLoaded}
        examsLoaded={examsLoaded}
      />
    </ClientDiagnosticsLogger>
  );
}

export default function LaunchRoute() {
  return <AuthGate>{({ user, logout }) => <LaunchRouteInner user={user} logout={logout} />}</AuthGate>;
}
