"use client";

import { useEffect, useMemo, useState } from "react";
import { formatStudyMinutes } from "../lib/studyStats";
import { formatLimit, planLabels } from "../lib/gradeglowAccess";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useStudyFriends } from "../hooks/useStudyFriends";
import type {
  AppUser,
  ExamPlanItem,
  GradeGlowProfile,
  PublicStudyProfile,
} from "../types";
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
  role?: "owner" | "member";
  joinedAtIso?: string;
};

type ShareSettingKey =
  "shareStudyTime" | "shareStudySubjects" | "shareStudyStreak";

const getInitial = (label: string) =>
  label.trim().charAt(0).toUpperCase() || "G";

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
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatSharedMinutes = (profile: PublicStudyProfile, minutes: number) =>
  profile.shareStudyTime ? formatStudyMinutes(minutes) : "verborgen";

const formatSharedStreak = (profile: PublicStudyProfile) =>
  profile.shareStudyStreak ? `${profile.studyStreakDays} Tag(e)` : "verborgen";

const Avatar = ({
  image,
  label,
  size = "md",
}: {
  image: string;
  label: string;
  size?: "md" | "lg";
}) => {
  const sizeClassName =
    size === "lg"
      ? "h-14 w-14 rounded-3xl text-lg"
      : "h-12 w-12 rounded-2xl text-base";

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
    <div
      className={`flex ${sizeClassName} shrink-0 items-center justify-center bg-gradient-to-br from-violet-100 to-fuchsia-100 font-black text-violet-800 ring-1 ring-violet-100`}
    >
      {getInitial(label)}
    </div>
  );
};

const badgeMeta: Record<string, { label: string; description: string }> = {
  "beta-2026": {
    label: "Beta 2026",
    description: "Schon seit der Beta dabei",
  },
};

const BadgeList = ({ badgeIds, compact = false }: { badgeIds: string[]; compact?: boolean }) => {
  const visibleBadges = badgeIds.map((id) => badgeMeta[id]).filter(Boolean);
  if (visibleBadges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleBadges.map((badge) => (
        <span
          key={badge.label}
          title={badge.description}
          className={`inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 font-black text-violet-700 ring-1 ring-violet-100 ${compact ? "text-[0.62rem]" : "text-xs"}`}
        >
          <span aria-hidden="true">★</span>
          {badge.label}
        </span>
      ))}
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

  const visibleSubjects =
    profile.thisWeekTopSubjects.length > 0
      ? profile.thisWeekTopSubjects
      : profile.topSubjects;
  const maxMinutes = Math.max(
    ...visibleSubjects.map((subject) => subject.doneMinutes),
    1,
  );

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
        <div
          key={subject.subjectId}
          className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"
        >
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="truncate font-black text-slate-700">
              {subject.subjectName}
            </p>
            <p className="shrink-0 font-black text-slate-950">
              {formatStudyMinutes(subject.doneMinutes)}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
            <div
              className="h-full rounded-full gg-chart-fill"
              style={{
                width: `${Math.min((subject.doneMinutes / maxMinutes) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const LeaderboardCard = ({ row, rank, onOpen }: { row: CircleRow; rank: number; onOpen: () => void }) => (
  <button
    type="button"
    className="flex min-w-0 items-center gap-3 rounded-3xl bg-white/10 p-4 text-left ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
    onClick={onOpen}
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
      #{rank}
    </div>
    <Avatar image={row.avatarDataUrl} label={row.displayName} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-sm font-black text-white">
          {row.displayName}
        </p>
        {row.isSelf && (
          <span className="rounded-full bg-violet-50 px-2 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-violet-700 ring-1 ring-violet-100">
            Du
          </span>
        )}
      </div>
      <p className="truncate text-xs font-semibold text-white/75">
        {row.degreeProgram || "Kein Studiengang sichtbar"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <BadgeList badgeIds={row.badgeIds} compact />
        <span className="rounded-full bg-white/10 px-2 py-1 text-[0.62rem] font-black text-white/75 ring-1 ring-white/10">
          Profil öffnen
        </span>
      </div>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-xs font-semibold text-white/70">diese Woche</p>
      <p className="text-base font-black text-white">
        {formatSharedMinutes(row, row.thisWeekDoneMinutes)}
      </p>
    </div>
  </button>
);

const StatusDot = ({
  label,
  ok,
  muted = false,
}: {
  label: string;
  ok: boolean;
  muted?: boolean;
}) => {
  const className = muted
    ? "bg-slate-100 text-slate-500 ring-slate-200"
    : ok
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : "bg-amber-50 text-amber-800 ring-amber-100";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-black ring-1 ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${muted ? "bg-slate-400" : ok ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {label}
    </span>
  );
};

const StudyCircleStatusCard = ({
  status,
}: {
  status: StudyCircleDebugStatus;
}) => (
  <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Debug Status
        </p>
        <p className="mt-1 text-sm font-bold leading-5 text-slate-600">
          {status.detail}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-[0.68rem] font-black text-slate-500 ring-1 ring-slate-200">
        {status.isChecking ? "prüft…" : formatDebugTime(status.checkedAtIso)}
      </span>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <StatusDot label="Firebase Login" ok={status.canUseCloudSocial} />
      <StatusDot
        label="Sharing aktiv"
        ok={status.sharingEnabled}
        muted={!status.sharingEnabled}
      />
      <StatusDot
        label="Profil veröffentlicht"
        ok={status.publicProfilePublished}
        muted={!status.sharingEnabled}
      />
      <StatusDot
        label="Code indexiert"
        ok={status.friendCodeIndexed}
        muted={!status.sharingEnabled}
      />
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
    className={`study-privacy-toggle rounded-2xl p-3 text-left ring-1 transition disabled:opacity-60 ${checked ? "bg-violet-50 ring-violet-100" : "bg-white ring-slate-200"}`}
    onClick={onToggle}
    disabled={disabled}
  >
    <span className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="study-privacy-title block text-sm font-black text-slate-800">
          {title}
        </span>
        <span className="study-privacy-description mt-1 block text-xs font-semibold leading-5 text-slate-500">
          {description}
        </span>
      </span>
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-violet-700" : "bg-slate-300"}`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </span>
  </button>
);

const PublicProfileModal = ({
  profile,
  isSelf,
  isFriend,
  isBusy,
  onClose,
  onAddFriend,
  onRemoveFriend,
  removeLabel,
}: {
  profile: CircleRow;
  isSelf: boolean;
  isFriend: boolean;
  isBusy: boolean;
  onClose: () => void;
  onAddFriend: () => void;
  onRemoveFriend: () => void;
  removeLabel: string;
}) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true">
    <article className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 text-slate-950 shadow-2xl ring-1 ring-slate-200 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar image={profile.avatarDataUrl} label={profile.displayName} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-2xl font-black tracking-tight">{profile.displayName}</h3>
              {isSelf && <span className="rounded-full bg-violet-50 px-2 py-1 text-[0.65rem] font-black text-violet-700 ring-1 ring-violet-100">Du</span>}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">{profile.degreeProgram || "Kein Studiengang sichtbar"}</p>
            <div className="mt-2"><BadgeList badgeIds={profile.badgeIds} /></div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">Schließen</button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Diese Woche</p>
          <p className="mt-1 text-2xl font-black">{formatSharedMinutes(profile, profile.thisWeekDoneMinutes)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Gesamt</p>
          <p className="mt-1 text-2xl font-black">{formatSharedMinutes(profile, profile.totalDoneMinutes)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Streak</p>
          <p className="mt-1 text-2xl font-black">{formatSharedStreak(profile)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="mb-3 text-sm font-black text-slate-700">Geteilte Lernfächer</p>
        {profile.isMissing ? (
          <p className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 ring-1 ring-amber-100">Dieses Profil ist aktuell nicht öffentlich geteilt.</p>
        ) : (
          <SubjectBars profile={profile} />
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {!isSelf && !isFriend && !profile.isMissing && (
          <button type="button" disabled={isBusy} onClick={onAddFriend} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-800 disabled:opacity-50">Als Freund hinzufügen</button>
        )}
        {!isSelf && isFriend && (
          <button type="button" disabled={isBusy} onClick={onRemoveFriend} className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100 disabled:opacity-50">{removeLabel}</button>
        )}
      </div>
    </article>
  </div>
);

export default function StudyFriendsPanel({
  user,
  profile,
  exams,
  saveProfile,
  isProfileLoaded = true,
}: StudyFriendsPanelProps) {
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [circleNameInput, setCircleNameInput] = useState("");
  const [circleJoinCodeInput, setCircleJoinCodeInput] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [goalInput, setGoalInput] = useState("600");
  const [selectedProfile, setSelectedProfile] = useState<CircleRow | null>(null);
  const [pendingRemovalUid, setPendingRemovalUid] = useState<string | null>(null);
  const [isSavingSharing, setIsSavingSharing] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const { entitlement, limits, accessSyncMessage } = useGradeGlowAccess(user);

  const {
    canUseCloudSocial,
    ownPublicProfile,
    friends,
    friendIds,
    circles,
    activeCircleId,
    activeCircle,
    circleMembers,
    friendCode,
    legacyFriendCode,
    debugStatus,
    publishMessage,
    message,
    isBusy,
    addFriend,
    removeFriend,
    setActiveCircleId,
    createCircle,
    joinCircle,
    updateCircleWeeklyGoal,
    leaveCircle,
  } = useStudyFriends({
    user,
    profile,
    exams,
    limits,
    profileReady: isProfileLoaded,
  });

  const leaderboardRows = useMemo<CircleRow[]>(() => {
    return [{ ...ownPublicProfile, isSelf: true }, ...friends].sort((a, b) => {
      const weekDiff = b.thisWeekDoneMinutes - a.thisWeekDoneMinutes;
      if (weekDiff !== 0) return weekDiff;
      return b.totalDoneMinutes - a.totalDoneMinutes;
    });
  }, [friends, ownPublicProfile]);

  const circleLeaderboardRows = useMemo<CircleRow[]>(() => {
    const rows = circleMembers.length > 0 ? circleMembers : [{ ...ownPublicProfile, isSelf: true }];
    return rows
      .map((row) => ({ ...row, isSelf: row.uid === user.uid }))
      .sort((a, b) => {
        const weekDiff = b.thisWeekDoneMinutes - a.thisWeekDoneMinutes;
        if (weekDiff !== 0) return weekDiff;
        return b.totalDoneMinutes - a.totalDoneMinutes;
      });
  }, [circleMembers, ownPublicProfile, user.uid]);

  const gameRows = activeCircle ? circleLeaderboardRows : leaderboardRows;

  const isActiveCircleOwner = activeCircle?.ownerUid === user.uid;

  useEffect(() => {
    if (!activeCircle) return;
    setGoalInput(String(activeCircle.weeklyGoalMinutes || 600));
  }, [activeCircle]);

  const filteredFriends = useMemo(() => {
    const normalizedSearch = friendSearch.trim().toLowerCase();
    if (!normalizedSearch) return friends;

    return friends.filter((friend) =>
      `${friend.displayName} ${friend.degreeProgram}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [friendSearch, friends]);

  const sharedCircleWeekMinutes = gameRows.reduce(
    (sum, row) => sum + (row.shareStudyTime ? row.thisWeekDoneMinutes : 0),
    0,
  );
  const ownWeekMinutes = ownPublicProfile.shareStudyTime
    ? ownPublicProfile.thisWeekDoneMinutes
    : 0;
  const circleGoalMinutes = activeCircle?.weeklyGoalMinutes || Math.max(180, gameRows.length * 120);
  const circleGoalProgress = Math.min(
    100,
    Math.round((sharedCircleWeekMinutes / circleGoalMinutes) * 100),
  );
  const focusQuestMinutes = 150;
  const focusQuestProgress = Math.min(
    100,
    Math.round((ownWeekMinutes / focusQuestMinutes) * 100),
  );
  const nextRival = gameRows.find(
    (row) =>
      !row.isSelf &&
      row.shareStudyTime &&
      row.thisWeekDoneMinutes >= ownWeekMinutes,
  );
  const rivalGapMinutes = nextRival
    ? Math.max(0, nextRival.thisWeekDoneMinutes - ownWeekMinutes + 25)
    : 0;

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

  const handleCreateCircle = async () => {
    if (!isProfileLoaded) return;
    await createCircle(circleNameInput);
    setCircleNameInput("");
  };

  const handleJoinCircle = async () => {
    if (!isProfileLoaded) return;
    await joinCircle(circleJoinCodeInput);
    setCircleJoinCodeInput("");
  };

  const handleAddSelectedProfileAsFriend = async () => {
    if (!selectedProfile || selectedProfile.isSelf || selectedProfile.isMissing) return;
    await addFriend(selectedProfile.friendCode || selectedProfile.uid);
    setSelectedProfile((current) => current ? { ...current } : current);
  };

  const handleRemoveSelectedProfileFriend = async () => {
    if (!selectedProfile || selectedProfile.isSelf) return;
    if (pendingRemovalUid !== selectedProfile.uid) {
      setPendingRemovalUid(selectedProfile.uid);
      return;
    }
    await removeFriend(selectedProfile.uid);
    setPendingRemovalUid(null);
    setSelectedProfile(null);
  };

  const handleRemoveFriendWithConfirm = async (friendUid: string) => {
    if (pendingRemovalUid !== friendUid) {
      setPendingRemovalUid(friendUid);
      return;
    }
    await removeFriend(friendUid);
    setPendingRemovalUid(null);
  };

  const handleUpdateCircleGoal = async () => {
    if (!activeCircle) return;
    const parsedGoal = Number(goalInput.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) return;
    await updateCircleWeeklyGoal(activeCircle.id, parsedGoal);
  };

  const copyCircleCode = async () => {
    if (!activeCircle?.circleCode) return;
    setCopyMessage("");
    try {
      await navigator.clipboard.writeText(activeCircle.circleCode);
      setCopyMessage("Circle-Code kopiert.");
    } catch {
      setCopyMessage("Kopieren nicht möglich — Circle-Code manuell markieren.");
    }
  };

  const copyCircleInvite = async () => {
    if (!activeCircle?.circleCode) return;
    setCopyMessage("");
    const inviteText = `Hey, tritt meinem GradeGlow Study Circle „${activeCircle.name}“ bei. Circle-Code: ${activeCircle.circleCode}`;
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopyMessage("Einladung kopiert.");
    } catch {
      setCopyMessage("Einladung konnte nicht kopiert werden — Code manuell markieren.");
    }
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
            Füge Freunde per Code hinzu und vergleiche Lernzeit, Top-Fächer und
            Wochenfortschritt. Geteilt werden nur freiwillige Lernstatistiken —
            keine Noten, keine Module, keine privaten Notizen.
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
            {profile.studySharingEnabled
              ? "Sharing aktiv"
              : "Sharing aktivieren"}
          </button>
        </div>
      </div>

      {!canUseCloudSocial && (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800 ring-1 ring-amber-100">
          Study Circle braucht einen Firebase-Login, damit Freunde dich über die
          Cloud finden können. Lokale Accounts bleiben privat auf diesem Gerät.
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-slate-950 p-4 text-white ring-1 ring-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <Avatar
              image={profile.avatarDataUrl || user.photoURL || ""}
              label={ownPublicProfile.displayName}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black">
                {ownPublicProfile.displayName}
              </p>
              <p className="truncate text-sm font-semibold text-slate-300">
                {ownPublicProfile.degreeProgram || "Studiengang nicht gesetzt"}
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-200">
                {profile.studySharingEnabled
                  ? "öffentlich für eingeloggte GradeGlow-User sichtbar"
                  : "privat — Sharing ist deaktiviert"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Diese Woche</p>
              <p className="mt-1 text-2xl font-black">
                {formatSharedMinutes(
                  ownPublicProfile,
                  ownPublicProfile.thisWeekDoneMinutes,
                )}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Gesamt</p>
              <p className="mt-1 text-2xl font-black">
                {formatSharedMinutes(
                  ownPublicProfile,
                  ownPublicProfile.totalDoneMinutes,
                )}
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
            <p className="mt-2 text-lg font-black tracking-wide text-white">
              {friendCode}
            </p>
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
                {copyMessage ||
                  publishMessage ||
                  "Teile den Code nur mit Leuten, die dich hinzufügen dürfen."}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                  Study Circle v2
                </p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-white">
                  Dein Clan für Lernwochen
                </h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                  Erstelle einen Circle für deine Lerngruppe oder tritt per Code bei.
                  Wer deinem Circle beitritt, kann beim gemeinsamen Wochenziel mitlernen.
                </p>
              </div>
              {activeCircle && (
                <button
                  type="button"
                  className="shrink-0 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-black text-rose-100 ring-1 ring-white/10 transition hover:bg-rose-500/20 disabled:opacity-50"
                  onClick={() => void leaveCircle(activeCircle.id)}
                  disabled={isBusy}
                >
                  Circle verlassen
                </button>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Aktiver Circle
              </p>
              {circles.length > 0 ? (
                <>
                  <select
                    className="field-input mt-3 border-white/10 bg-white text-slate-950"
                    value={activeCircleId}
                    onChange={(event) => setActiveCircleId(event.target.value)}
                  >
                    {circles.map((circle) => (
                      <option key={circle.id} value={circle.id}>
                        {circle.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 rounded-2xl bg-white p-3 text-slate-950 ring-1 ring-white/20">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black">
                            {activeCircle?.name || "Study Circle"}
                          </p>
                          {activeCircle?.role && (
                            <span className="rounded-full bg-violet-50 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-violet-700 ring-1 ring-violet-100">
                              {activeCircle.role === "owner" ? "Owner" : "Member"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {circleMembers.length} Mitglied(er) · Wochenziel {formatStudyMinutes(circleGoalMinutes)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-800"
                          onClick={copyCircleCode}
                        >
                          Code kopieren
                        </button>
                        <button
                          type="button"
                          className="rounded-2xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100 transition hover:bg-violet-100"
                          onClick={copyCircleInvite}
                        >
                          Einladung kopieren
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 break-all rounded-2xl bg-violet-50 p-3 text-sm font-black tracking-wide text-violet-700 ring-1 ring-violet-100">
                      {activeCircle?.circleCode}
                    </p>

                    {isActiveCircleOwner && (
                      <form
                        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleUpdateCircleGoal();
                        }}
                      >
                        <label className="block">
                          <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            Wochenziel in Minuten
                          </span>
                          <input
                            className="field-input bg-slate-50"
                            inputMode="numeric"
                            value={goalInput}
                            onChange={(event) => setGoalInput(event.target.value)}
                          />
                        </label>
                        <button
                          type="submit"
                          className="self-end rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-violet-800 disabled:opacity-50"
                          disabled={!isProfileLoaded || isBusy || !goalInput.trim()}
                        >
                          Ziel speichern
                        </button>
                      </form>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm font-bold leading-5 text-slate-300 ring-1 ring-white/10">
                  Noch kein Clan aktiv. Erstelle einen Circle oder tritt per Code einer Lerngruppe bei.
                </p>
              )}
            </div>

          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
          <div className="mb-4">
            <p className="text-sm font-bold text-violet-700">Codes & Einladungen</p>
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Freunde oder Circle hinzufügen
            </h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Ein Code reicht: Freundschaften werden gegenseitig angelegt, Circles bündeln die Wochenmissionen.
            </p>
          </div>

          <form className="grid gap-3 lg:grid-cols-[1fr_auto]" onSubmit={(event) => { event.preventDefault(); void handleAddFriend(); }}>
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
              type="submit"
              className="self-end rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:opacity-50"
              disabled={
                !isProfileLoaded ||
                !canUseCloudSocial ||
                isBusy ||
                !friendCodeInput.trim()
              }
            >
              Hinzufügen
            </button>
          </form>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <form
              className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"
              onSubmit={(event) => { event.preventDefault(); void handleCreateCircle(); }}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-500">
                Neuen Circle erstellen
              </p>
              <label className="mt-3 block">
                <span className="sr-only">Circle-Name</span>
                <input
                  className="field-input bg-slate-50"
                  placeholder="z. B. BWL Lerncrew"
                  value={circleNameInput}
                  onChange={(event) => setCircleNameInput(event.target.value)}
                />
              </label>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                Leeres Feld nutzt automatisch deinen Namen.
              </p>
              <button
                type="submit"
                className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:opacity-50"
                disabled={!isProfileLoaded || !canUseCloudSocial || isBusy}
              >
                Circle erstellen
              </button>
            </form>

            <form
              className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"
              onSubmit={(event) => { event.preventDefault(); void handleJoinCircle(); }}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-500">
                Per Circle-Code beitreten
              </p>
              <label className="mt-3 block">
                <span className="sr-only">Circle-Code</span>
                <input
                  className="field-input bg-slate-50"
                  placeholder="GC-ABCD-1234"
                  value={circleJoinCodeInput}
                  onChange={(event) => setCircleJoinCodeInput(event.target.value)}
                />
              </label>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                Nach dem Beitritt erscheint der Circle links als aktiver Clan.
              </p>
              <button
                type="submit"
                className="mt-3 w-full rounded-2xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:opacity-50"
                disabled={!isProfileLoaded || !canUseCloudSocial || isBusy || !circleJoinCodeInput.trim()}
              >
                Beitreten
              </button>
            </form>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-500">Freunde</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {friends.length}
              </p>
              <p className="mt-1 text-[0.68rem] font-bold text-slate-400">
                Limit: {formatLimit(limits.maxFriends)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-500">
                Circle diese Woche
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {formatStudyMinutes(sharedCircleWeekMinutes)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-500">Dein Rang</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                #
                {Math.max(
                  leaderboardRows.findIndex((row) => row.isSelf) + 1,
                  1,
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-500">
                  Circle Game
                </p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                  Wochenmissionen
                </h3>
              </div>
              <span className="self-start rounded-full bg-violet-50 px-3 py-1 text-[0.68rem] font-black text-violet-700 ring-1 ring-violet-100">
                Beta
              </span>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-100">
                <p className="text-xs font-black text-violet-700">
                  Circle-Ziel
                </p>
                <p className="mt-1 text-sm font-bold text-violet-950">
                  {formatStudyMinutes(circleGoalMinutes)} gemeinsam
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-violet-100">
                  <div
                    className="h-full rounded-full bg-violet-600"
                    style={{ width: `${circleGoalProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-violet-700">
                  {circleGoalProgress}% geschafft
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                <p className="text-xs font-black text-emerald-700">
                  Deine Quest
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-950">
                  {formatStudyMinutes(focusQuestMinutes)} Fokus diese Woche
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${focusQuestProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-emerald-700">
                  {formatStudyMinutes(ownWeekMinutes)} erledigt
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
                <p className="text-xs font-black text-amber-700">Mini-Duell</p>
                <p className="mt-1 text-sm font-bold text-amber-950">
                  {nextRival
                    ? `${formatStudyMinutes(rivalGapMinutes)} bis vor ${nextRival.displayName}`
                    : "Du führst gerade oder es gibt kein sichtbares Duell."}
                </p>
                <p className="mt-3 text-xs font-bold leading-5 text-amber-700">
                  Nur Lernzeit zählt. Noten bleiben privat.
                </p>
              </div>
            </div>
          </div>

          {activeCircle && circleLeaderboardRows.length > 0 && (
            <div className="mt-4 rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-500">
                    Mitglieder
                  </p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                    Wer gerade im Circle ist
                  </h3>
                </div>
                <span className="self-start rounded-full bg-slate-50 px-3 py-1 text-[0.68rem] font-black text-slate-500 ring-1 ring-slate-200">
                  {circleLeaderboardRows.length} Mitglied(er)
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {circleLeaderboardRows.map((member) => (
                  <button
                    type="button"
                    key={`member-${member.uid}`}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:ring-violet-100"
                    onClick={() => setSelectedProfile(member)}
                  >
                    <Avatar image={member.avatarDataUrl} label={member.displayName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-950">
                          {member.displayName}
                        </p>
                        {member.isSelf && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[0.62rem] font-black text-violet-700 ring-1 ring-violet-100">
                            Du
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs font-bold text-slate-500">
                        {member.role === "owner" ? "Owner" : "Member"} · {formatSharedMinutes(member, member.thisWeekDoneMinutes)} diese Woche
                      </p>
                      <div className="mt-2"><BadgeList badgeIds={member.badgeIds} compact /></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(message || copyMessage || publishMessage) && (
            <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              {message || copyMessage || publishMessage}
            </p>
          )}

          <details className="mt-4 rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200">
            <summary className="cursor-pointer text-sm font-black text-slate-700">
              Technischer Study-Circle-Status
            </summary>
            <StudyCircleStatusCard status={debugStatus} />
          </details>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">
              Benachrichtigungen
            </p>
            <h3 className="text-xl font-black tracking-tight">
              Freunde lernen gerade
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Wenn diese Option aktiv ist, zeigt GradeGlow oben in der App eine
              kurze Nachricht, sobald ein Freund eine Lernsession startet oder
              abschließt.
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
            disabled={
              !isProfileLoaded || !canUseCloudSocial || isSavingNotifications
            }
          >
            {profile.friendActivityNotificationsEnabled
              ? "Popups aktiv"
              : "Popups aktivieren"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <div className="mb-4">
          <p className="text-sm font-bold text-violet-700">Privacy Controls</p>
          <h3 className="text-xl font-black tracking-tight">
            Was andere sehen dürfen
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Diese Optionen ändern nur dein öffentliches Study-Circle-Profil.
            Private Module, Noten und Notizen bleiben sowieso unsichtbar.
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
            <h3 className="text-xl font-black tracking-tight">
              {activeCircle ? `${activeCircle.name}: Wochenrang` : "Wer hat diese Woche gelernt?"}
            </h3>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            {activeCircle ? "Circle-Mitglieder · sortiert nach geteilter Lernzeit" : "sortiert nach geteilter Lernzeit"}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {(activeCircle ? circleLeaderboardRows : leaderboardRows).map((row, index) => (
            <LeaderboardCard
              key={`${row.uid}-${row.isSelf ? "self" : "friend"}`}
              row={row}
              rank={index + 1}
              onOpen={() => setSelectedProfile(row)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">Freundesprofile</p>
            <h3 className="text-xl font-black tracking-tight">
              Lernfokus deiner Freunde
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Du siehst pro Person die freigegebenen Top-Fächer aus dieser
              Woche. Wenn diese Woche nichts da ist, zeigt GradeGlow die
              bisherigen Top-Fächer.
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
            Noch keine Freunde hinzugefügt. Sobald jemand Study Circle aktiviert
            und dir den Code gibt, siehst du hier freigegebene Lernzeit und
            Top-Fächer.
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold leading-6 text-slate-500">
            Für diese Suche wurde kein Freund gefunden.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredFriends.map((friend) => (
              <article
                key={friend.uid}
                className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    image={friend.avatarDataUrl}
                    label={friend.displayName}
                    size="lg"
                  />
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
                          zuletzt gelernt:{" "}
                          {formatDateLabel(friend.lastStudiedDateKey)}
                        </p>
                        <div className="mt-2"><BadgeList badgeIds={friend.badgeIds} compact /></div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-black text-violet-700 ring-1 ring-violet-100 transition hover:bg-violet-50 disabled:opacity-50"
                          onClick={() => { setPendingRemovalUid(null); setSelectedProfile(friend); }}
                          disabled={isBusy}
                        >
                          Profil
                        </button>
                        <button
                          type="button"
                          className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-100 disabled:opacity-50"
                          onClick={() => void handleRemoveFriendWithConfirm(friend.uid)}
                          disabled={isBusy}
                        >
                          {pendingRemovalUid === friend.uid ? "Wirklich?" : "Entfernen"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-violet-600">
                          Woche
                        </p>
                        <p className="text-lg font-black text-slate-950">
                          {formatSharedMinutes(
                            friend,
                            friend.thisWeekDoneMinutes,
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-slate-500">
                          Gesamt
                        </p>
                        <p className="text-lg font-black text-slate-950">
                          {formatSharedMinutes(friend, friend.totalDoneMinutes)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-slate-500">
                          Streak
                        </p>
                        <p className="text-lg font-black text-slate-950">
                          {formatSharedStreak(friend)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {friend.isMissing ? (
                        <p className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 ring-1 ring-amber-100">
                          Dieses Profil ist aktuell nicht öffentlich geteilt. Du
                          kannst die Person in deiner Liste behalten oder
                          entfernen.
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

      {selectedProfile && (
        <PublicProfileModal
          profile={selectedProfile}
          isSelf={selectedProfile.uid === user.uid}
          isFriend={friendIds.includes(selectedProfile.uid)}
          isBusy={isBusy}
          onClose={() => { setSelectedProfile(null); setPendingRemovalUid(null); }}
          onAddFriend={() => void handleAddSelectedProfileAsFriend()}
          onRemoveFriend={() => void handleRemoveSelectedProfileFriend()}
          removeLabel={pendingRemovalUid === selectedProfile?.uid ? "Wirklich entfernen" : "Freund entfernen"}
        />
      )}
    </section>
  );
}
