"use client";

import { useMemo, useState } from "react";
import { formatStudyMinutes } from "../lib/studyStats";
import { formatLimit, planLabels } from "../lib/gradeglowAccess";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useStudyFriends } from "../hooks/useStudyFriends";
import type { AppUser, ExamPlanItem, GradeGlowProfile, PublicStudyProfile } from "../types";
import type { StudyCircleDebugStatus } from "../hooks/useStudyFriends";

type StudyFriendsPanelProps = {
  user: AppUser;
  profile: GradeGlowProfile;
  exams: ExamPlanItem[];
  saveProfile: (nextProfile: GradeGlowProfile) => Promise<void>;
  isProfileLoaded?: boolean;
};

type CircleRow = PublicStudyProfile & {
  isSelf?: boolean;
  isMissing?: boolean;
};

type ShareSettingKey = "shareStudyTime" | "shareStudySubjects" | "shareStudyStreak";

const getInitial = (label: string) => label.trim().charAt(0).toUpperCase() || "G";

const formatDateLabel = (dateKey: string) => {
  if (!dateKey) return "nicht geteilt";
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return "nicht geteilt";
  return `${day}.${month}.${year}`;
};

const formatDebugTime = (isoValue: string) => {
  if (!isoValue) return "noch nicht geprüft";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "gerade geprüft";
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
};

const formatSharedMinutes = (profile: PublicStudyProfile, minutes: number) =>
  profile.shareStudyTime ? formatStudyMinutes(minutes) : "verborgen";

const formatSharedStreak = (profile: PublicStudyProfile) =>
  profile.shareStudyStreak ? `${profile.studyStreakDays} Tag(e)` : "verborgen";

const Avatar = ({ image, label, size = "md" }: { image: string; label: string; size?: "md" | "lg" }) => {
  const sizeClassName = size === "lg" ? "h-14 w-14 rounded-3xl text-lg" : "h-12 w-12 rounded-2xl text-base";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt="Profilbild"
        className={`${sizeClassName} shrink-0 object-cover ring-1 ring-violet-100`}
      />
    );
  }

  return (
    <div className={`flex ${sizeClassName} shrink-0 items-center justify-center bg-gradient-to-br from-violet-100 to-fuchsia-100 font-black text-violet-800 ring-1 ring-violet-100`}>
      {getInitial(label)}
    </div>
  );
};

const SubjectBars = ({ profile }: { profile: PublicStudyProfile }) => {
  if (!profile.shareStudySubjects) {
    return (
      <p className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200">
        Top-Fächer werden von dieser Person nicht geteilt.
      </p>
    );
  }

  const visibleSubjects = profile.thisWeekTopSubjects.length > 0
    ? profile.thisWeekTopSubjects
    : profile.topSubjects;
  const maxMinutes = Math.max(...visibleSubjects.map((subject) => subject.doneMinutes), 1);

  if (visibleSubjects.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200">
        Noch keine erledigten Lernblöcke sichtbar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visibleSubjects.slice(0, 4).map((subject) => (
        <div key={subject.subjectId} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="truncate font-black text-slate-700">{subject.subjectName}</p>
            <p className="shrink-0 font-black text-slate-950">
              {formatStudyMinutes(subject.doneMinutes)}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <div
              className="h-full rounded-full gg-chart-fill"
              style={{ width: `${Math.min((subject.doneMinutes / maxMinutes) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const LeaderboardCard = ({ row, rank }: { row: CircleRow; rank: number }) => (
  <div className="flex min-w-0 items-center gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
      #{rank}
    </div>
    <Avatar image={row.avatarDataUrl} label={row.displayName} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm font-black text-slate-950">{row.displayName}</p>
        {row.isSelf && (
          <span className="rounded-full bg-violet-50 px-2 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-violet-700 ring-1 ring-violet-100">
            Du
          </span>
        )}
      </div>
      <p className="truncate text-xs font-semibold text-slate-500">
        {row.degreeProgram || "Kein Studiengang sichtbar"}
      </p>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-xs font-semibold text-slate-500">diese Woche</p>
      <p className="text-base font-black text-slate-950">{formatSharedMinutes(row, row.thisWeekDoneMinutes)}</p>
    </div>
  </div>
);

const StatusDot = ({ label, ok, muted = false }: { label: string; ok: boolean; muted?: boolean }) => {
  const className = muted
    ? "bg-slate-100 text-slate-500 ring-slate-200"
    : ok
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : "bg-amber-50 text-amber-800 ring-amber-100";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-black ring-1 ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${muted ? "bg-slate-400" : ok ? "bg-emerald-500" : "bg-amber-500"}`} />
      {label}
    </span>
  );
};

const StudyCircleStatusCard = ({ status }: { status: StudyCircleDebugStatus }) => (
  <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Debug Status</p>
        <p className="mt-1 text-sm font-bold leading-5 text-slate-600">{status.detail}</p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-[0.68rem] font-black text-slate-500 ring-1 ring-slate-200">
        {status.isChecking ? "prüft…" : formatDebugTime(status.checkedAtIso)}
      </span>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <StatusDot label="Firebase Login" ok={status.canUseCloudSocial} />
      <StatusDot label="Sharing aktiv" ok={status.sharingEnabled} muted={!status.sharingEnabled} />
      <StatusDot label="Profil veröffentlicht" ok={status.publicProfilePublished} muted={!status.sharingEnabled} />
      <StatusDot label="Code indexiert" ok={status.friendCodeIndexed} muted={!status.sharingEnabled} />
      <StatusDot label="Rules Zugriff" ok={status.rulesAccessOk} />
    </div>
    <p className="mt-3 break-all rounded-2xl bg-slate-50 p-3 text-[0.7rem] font-bold leading-5 text-slate-500 ring-1 ring-slate-200">
      Aktueller Code: {status.friendCode || "noch nicht verfügbar"}
    </p>
  </div>
);

const PrivacyToggle = ({
  title,
  description,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    className={`rounded-2xl p-3 text-left ring-1 transition disabled:opacity-60 ${checked ? "bg-violet-50 ring-violet-100" : "bg-white ring-slate-200"}`}
    onClick={onToggle}
    disabled={disabled}
  >
    <span className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-800">{title}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{description}</span>
      </span>
      <span className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-violet-700" : "bg-slate-300"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </span>
  </button>
);

export default function StudyFriendsPanel({
  user,
  profile,
  exams,
  saveProfile,
  isProfileLoaded = true,
}: StudyFriendsPanelProps) {
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [isSavingSharing, setIsSavingSharing] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const { entitlement, limits, accessSyncMessage } = useGradeGlowAccess(user);

  const {
    canUseCloudSocial,
    ownPublicProfile,
    friends,
    friendCode,
    legacyFriendCode,
    debugStatus,
    publishMessage,
    message,
    isBusy,
    addFriend,
    removeFriend,
  } = useStudyFriends({ user, profile, exams, limits, profileReady: isProfileLoaded });

  const leaderboardRows = useMemo<CircleRow[]>(() => {
    return [
      { ...ownPublicProfile, isSelf: true },
      ...friends,
    ].sort((a, b) => {
      const weekDiff = b.thisWeekDoneMinutes - a.thisWeekDoneMinutes;
      if (weekDiff !== 0) return weekDiff;
      return b.totalDoneMinutes - a.totalDoneMinutes;
    });
  }, [friends, ownPublicProfile]);

  const filteredFriends = useMemo(() => {
    const normalizedSearch = friendSearch.trim().toLowerCase();
    if (!normalizedSearch) return friends;

    return friends.filter((friend) =>
      `${friend.displayName} ${friend.degreeProgram}`.toLowerCase().includes(normalizedSearch),
    );
  }, [friendSearch, friends]);

  const sharedCircleWeekMinutes = leaderboardRows.reduce(
    (sum, row) => sum + (row.shareStudyTime ? row.thisWeekDoneMinutes : 0),
    0,
  );

  const toggleSharing = async () => {
    if (!isProfileLoaded) return;
    setIsSavingSharing(true);
    try {
      await saveProfile({
        ...profile,
        studySharingEnabled: !profile.studySharingEnabled,
      });
    } finally {
      setIsSavingSharing(false);
    }
  };

  const updateShareSetting = async (key: ShareSettingKey) => {
    if (!isProfileLoaded) return;
    setIsSavingPrivacy(true);
    try {
      await saveProfile({
        ...profile,
        [key]: !profile[key],
      });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const toggleFriendActivityNotifications = async () => {
    if (!isProfileLoaded) return;
    const shouldEnable = !profile.friendActivityNotificationsEnabled;
    setIsSavingNotifications(true);

    try {
      if (
        shouldEnable &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        await Notification.requestPermission();
      }

      await saveProfile({
        ...profile,
        friendActivityNotificationsEnabled: shouldEnable,
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleAddFriend = async () => {
    if (!isProfileLoaded) return;
    await addFriend(friendCodeInput);
    setFriendCodeInput("");
  };

  const copyFriendCode = async () => {
    setCopyMessage("");
    try {
      await navigator.clipboard.writeText(friendCode);
      setCopyMessage("Code kopiert.");
    } catch {
      setCopyMessage("Kopieren nicht möglich — Code manuell markieren.");
    }
  };

  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold text-violet-700">Study Circle</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            Freunde & Lernvergleich
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Füge Freunde per Code hinzu und vergleiche Lernzeit, Top-Fächer und Wochenfortschritt. Geteilt werden nur freiwillige Lernstatistiken — keine Noten, keine Module, keine privaten Notizen.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 ring-1 ring-violet-100">
            {planLabels[entitlement.plan]} · {accessSyncMessage}
          </span>
          <button
            type="button"
            className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 transition hover:-translate-y-0.5 disabled:opacity-50 ${
              profile.studySharingEnabled
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100"
                : "bg-slate-950 text-white ring-slate-900 hover:bg-violet-800"
            }`}
            onClick={toggleSharing}
            disabled={!isProfileLoaded || !canUseCloudSocial || isSavingSharing}
          >
            {profile.studySharingEnabled ? "Sharing aktiv" : "Sharing aktivieren"}
          </button>
        </div>
      </div>

      {!canUseCloudSocial && (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800 ring-1 ring-amber-100">
          Study Circle braucht einen Firebase-Login, damit Freunde dich über die Cloud finden können. Lokale Accounts bleiben privat auf diesem Gerät.
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-slate-950 p-4 text-white ring-1 ring-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <Avatar image={profile.avatarDataUrl || user.photoURL || ""} label={ownPublicProfile.displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black">{ownPublicProfile.displayName}</p>
              <p className="truncate text-sm font-semibold text-slate-300">
                {ownPublicProfile.degreeProgram || "Studiengang nicht gesetzt"}
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-200">
                {profile.studySharingEnabled ? "öffentlich für eingeloggte GradeGlow-User sichtbar" : "privat — Sharing ist deaktiviert"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Diese Woche</p>
              <p className="mt-1 text-2xl font-black">
                {formatSharedMinutes(ownPublicProfile, ownPublicProfile.thisWeekDoneMinutes)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Gesamt</p>
              <p className="mt-1 text-2xl font-black">
                {formatSharedMinutes(ownPublicProfile, ownPublicProfile.totalDoneMinutes)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Streak</p>
              <p className="mt-1 text-2xl font-black">
                {formatSharedStreak(ownPublicProfile)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Dein Freundescode
            </p>
            <p className="mt-2 text-lg font-black tracking-wide text-white">{friendCode}</p>
            <p className="mt-1 break-all text-[0.7rem] font-semibold leading-5 text-slate-500">
              Legacy-UID: {legacyFriendCode}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50"
                onClick={copyFriendCode}
              >
                Code kopieren
              </button>
              <p className="flex items-center text-xs font-semibold leading-5 text-slate-400">
                {copyMessage || publishMessage || "Teile den Code nur mit Leuten, die dich hinzufügen dürfen."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">
                Freundescode einfügen
              </span>
              <input
                className="field-input bg-white"
                placeholder="GG-ABCD-1234 oder Legacy-UID"
                value={friendCodeInput}
                onChange={(event) => setFriendCodeInput(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="self-end rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:opacity-50"
              onClick={handleAddFriend}
              disabled={!isProfileLoaded || !canUseCloudSocial || isBusy || !friendCodeInput.trim()}
            >
              Hinzufügen
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-500">Freunde</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{friends.length}</p>
              <p className="mt-1 text-[0.68rem] font-bold text-slate-400">Limit: {formatLimit(limits.maxFriends)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-500">Circle diese Woche</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {formatStudyMinutes(sharedCircleWeekMinutes)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-500">Dein Rang</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                #{Math.max(leaderboardRows.findIndex((row) => row.isSelf) + 1, 1)}
              </p>
            </div>
          </div>

          {(message || copyMessage || publishMessage) && (
            <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              {message || copyMessage || publishMessage}
            </p>
          )}

          <StudyCircleStatusCard status={debugStatus} />
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">Benachrichtigungen</p>
            <h3 className="text-xl font-black tracking-tight">Freunde lernen gerade</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Wenn diese Option aktiv ist, zeigt GradeGlow oben in der App eine kurze Nachricht, sobald ein Freund eine Lernsession startet oder abschließt.
            </p>
          </div>
          <button
            type="button"
            className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black ring-1 transition hover:-translate-y-0.5 disabled:opacity-50 ${
              profile.friendActivityNotificationsEnabled
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-slate-950 text-white ring-slate-900"
            }`}
            onClick={() => void toggleFriendActivityNotifications()}
            disabled={!isProfileLoaded || !canUseCloudSocial || isSavingNotifications}
          >
            {profile.friendActivityNotificationsEnabled ? "Popups aktiv" : "Popups aktivieren"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <div className="mb-4">
          <p className="text-sm font-bold text-violet-700">Privacy Controls</p>
          <h3 className="text-xl font-black tracking-tight">Was andere sehen dürfen</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Diese Optionen ändern nur dein öffentliches Study-Circle-Profil. Private Module, Noten und Notizen bleiben sowieso unsichtbar.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <PrivacyToggle
            title="Lernzeit teilen"
            description="Woche, Gesamtzeit und Leaderboard-Werte."
            checked={profile.shareStudyTime}
            disabled={!isProfileLoaded || isSavingPrivacy}
            onToggle={() => void updateShareSetting("shareStudyTime")}
          />
          <PrivacyToggle
            title="Fächer teilen"
            description="Top-Fächer und Fokusbereiche, aber keine Noten."
            checked={profile.shareStudySubjects}
            disabled={!isProfileLoaded || isSavingPrivacy}
            onToggle={() => void updateShareSetting("shareStudySubjects")}
          />
          <PrivacyToggle
            title="Streak teilen"
            description="Lernstreak und zuletzt gelernter Tag."
            checked={profile.shareStudyStreak}
            disabled={!isProfileLoaded || isSavingPrivacy}
            onToggle={() => void updateShareSetting("shareStudyStreak")}
          />
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-slate-950 p-4 text-white ring-1 ring-slate-900 sm:p-5">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-fuchsia-200">Leaderboard</p>
            <h3 className="text-xl font-black tracking-tight">Wer hat diese Woche gelernt?</h3>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            sortiert nach geteilter Lernzeit
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {leaderboardRows.map((row, index) => (
            <LeaderboardCard key={`${row.uid}-${row.isSelf ? "self" : "friend"}`} row={row} rank={index + 1} />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">Freundesprofile</p>
            <h3 className="text-xl font-black tracking-tight">Lernfokus deiner Freunde</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Du siehst pro Person die freigegebenen Top-Fächer aus dieser Woche. Wenn diese Woche nichts da ist, zeigt GradeGlow die bisherigen Top-Fächer.
            </p>
          </div>
          <label className="block w-full lg:max-w-sm">
            <span className="sr-only">Freunde suchen</span>
            <input
              className="field-input bg-white"
              placeholder="Freunde suchen…"
              value={friendSearch}
              onChange={(event) => setFriendSearch(event.target.value)}
            />
          </label>
        </div>

        {friends.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/70 p-8 text-center text-sm font-semibold leading-6 text-violet-700">
            Noch keine Freunde hinzugefügt. Sobald jemand Study Circle aktiviert und dir den Code gibt, siehst du hier freigegebene Lernzeit und Top-Fächer.
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold leading-6 text-slate-500">
            Für diese Suche wurde kein Freund gefunden.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredFriends.map((friend) => (
              <article key={friend.uid} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <Avatar image={friend.avatarDataUrl} label={friend.displayName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-slate-950">
                          {friend.displayName}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {friend.degreeProgram || "Kein Studiengang sichtbar"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          zuletzt gelernt: {formatDateLabel(friend.lastStudiedDateKey)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-100 disabled:opacity-50"
                        onClick={() => void removeFriend(friend.uid)}
                        disabled={isBusy}
                      >
                        Entfernen
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-violet-600">Woche</p>
                        <p className="text-lg font-black text-slate-950">
                          {formatSharedMinutes(friend, friend.thisWeekDoneMinutes)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Gesamt</p>
                        <p className="text-lg font-black text-slate-950">
                          {formatSharedMinutes(friend, friend.totalDoneMinutes)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Streak</p>
                        <p className="text-lg font-black text-slate-950">
                          {formatSharedStreak(friend)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {friend.isMissing ? (
                        <p className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 ring-1 ring-amber-100">
                          Dieses Profil ist aktuell nicht öffentlich geteilt. Du kannst die Person in deiner Liste behalten oder entfernen.
                        </p>
                      ) : (
                        <SubjectBars profile={friend} />
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
