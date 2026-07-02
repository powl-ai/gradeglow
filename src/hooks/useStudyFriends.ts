"use client";

import { FirebaseError } from "firebase/app";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import {
  getLastDoneStudyDateKey,
  getStudyStreakDays,
  getStudySubjectStats,
  getThisWeekDoneStudyMinutes,
  getThisWeekStudySubjectStats,
  getTotalDoneStudyMinutes,
} from "../lib/studyStats";
import type {
  AppUser,
  ExamPlanItem,
  GradeGlowProfile,
  PlanLimits,
  PublicStudyActivity,
  PublicStudyProfile,
} from "../types";

export type FriendListItem = PublicStudyProfile & {
  isMissing?: boolean;
};

export type StudyCircleDebugStatus = {
  canUseCloudSocial: boolean;
  sharingEnabled: boolean;
  publicProfilePublished: boolean;
  friendCodeIndexed: boolean;
  rulesAccessOk: boolean;
  isChecking: boolean;
  friendCode: string;
  detail: string;
  checkedAtIso: string;
};

export type StudyCircleListItem = {
  id: string;
  name: string;
  circleCode: string;
  ownerUid: string;
  weeklyGoalMinutes: number;
  createdAtIso: string;
  updatedAtIso: string;
  role?: "owner" | "member";
};

export type StudyCircleMemberProfile = FriendListItem & {
  role?: "owner" | "member";
  joinedAtIso?: string;
};

type FriendLookupResult = {
  uid: string | null;
  reason: "found" | "empty" | "not-found" | "code-without-uid";
};

const PUBLIC_PROFILES_COLLECTION = "publicStudyProfiles";
const FRIEND_CODES_COLLECTION = "studyFriendCodes";
const FRIENDS_COLLECTION = "friends";
const STUDY_ACTIVITY_COLLECTION = "studyActivityEvents";
const STUDY_CIRCLES_COLLECTION = "studyCircles";
const STUDY_CIRCLE_CODES_COLLECTION = "studyCircleCodes";

export const buildStudyFriendCode = (uid: string) => {
  const compactUid = uid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = compactUid.slice(0, 4).padEnd(4, "G");
  const suffix = compactUid.slice(-4).padStart(4, "0");
  return `GG-${prefix}-${suffix}`;
};

export const normalizeStudyFriendCode = (value: string) =>
  value
    .trim()
    .replace(/^code[:\s]*/i, "")
    .replace(/^friend[:\s]*/i, "")
    .replace(/\s+/g, "")
    .toUpperCase();

export const buildStudyCircleCode = (circleId: string) => {
  const compactId = circleId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = compactId.slice(0, 4).padEnd(4, "C");
  const suffix = compactId.slice(-4).padStart(4, "0");
  return `GC-${prefix}-${suffix}`;
};

export const normalizeStudyCircleCode = (value: string) =>
  value
    .trim()
    .replace(/^circle[:\s]*/i, "")
    .replace(/^clan[:\s]*/i, "")
    .replace(/^code[:\s]*/i, "")
    .replace(/\s+/g, "")
    .toUpperCase();

const nowIso = () => new Date().toISOString();

const getFriendErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "Keine Berechtigung. Bitte Firestore Rules deployen und danach erneut versuchen.";
    }

    if (error.code === "unavailable") {
      return "Firebase ist gerade nicht erreichbar. Bitte kurz später erneut versuchen.";
    }
  }

  return "Freund konnte nicht hinzugefügt werden. Prüfe Code, Sharing und Firebase Rules.";
};

const buildPublicProfile = (
  user: AppUser,
  profile: GradeGlowProfile,
  exams: ExamPlanItem[],
): PublicStudyProfile => {
  const topSubjects = profile.shareStudySubjects ? getStudySubjectStats(exams).slice(0, 5) : [];
  const thisWeekTopSubjects = profile.shareStudySubjects ? getThisWeekStudySubjectStats(exams).slice(0, 5) : [];
  const shouldShareStudyTime = profile.shareStudyTime;
  const shouldShareStreak = profile.shareStudyStreak;

  return {
    uid: user.uid,
    friendCode: buildStudyFriendCode(user.uid),
    displayName: profile.displayName || user.displayName || "GradeGlow User",
    degreeProgram: profile.degreeProgram,
    avatarDataUrl: getPublicImageSource(profile.avatarDataUrl || user.photoURL || ""),
    totalDoneMinutes: shouldShareStudyTime ? getTotalDoneStudyMinutes(exams) : 0,
    thisWeekDoneMinutes: shouldShareStudyTime ? getThisWeekDoneStudyMinutes(exams) : 0,
    topSubjects,
    thisWeekTopSubjects,
    studyStreakDays: shouldShareStreak ? getStudyStreakDays(exams) : 0,
    lastStudiedDateKey: shouldShareStreak ? getLastDoneStudyDateKey(exams) : "",
    shareStudyTime: shouldShareStudyTime,
    shareStudySubjects: profile.shareStudySubjects,
    shareStudyStreak: shouldShareStreak,
    updatedAtIso: nowIso(),
    badgeIds: ["beta-2026"],
  };
};

const migrateSubjectStats = (rawValue: unknown): PublicStudyProfile["topSubjects"] => {
  const rawSubjects = Array.isArray(rawValue) ? rawValue : [];

  return rawSubjects
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const subject = item as Record<string, unknown>;

      return {
        subjectId: typeof subject.subjectId === "string" ? subject.subjectId : crypto.randomUUID(),
        subjectName:
          typeof subject.subjectName === "string" && subject.subjectName.trim()
            ? subject.subjectName.trim()
            : "Unbenanntes Fach",
        moduleId: typeof subject.moduleId === "string" ? subject.moduleId : null,
        plannedMinutes:
          typeof subject.plannedMinutes === "number" && Number.isFinite(subject.plannedMinutes)
            ? subject.plannedMinutes
            : 0,
        doneMinutes:
          typeof subject.doneMinutes === "number" && Number.isFinite(subject.doneMinutes)
            ? subject.doneMinutes
            : 0,
        sessionCount:
          typeof subject.sessionCount === "number" && Number.isFinite(subject.sessionCount)
            ? subject.sessionCount
            : 0,
        lastStudiedAt: typeof subject.lastStudiedAt === "string" ? subject.lastStudiedAt : "",
      };
    })
    .filter((item): item is PublicStudyProfile["topSubjects"][number] => Boolean(item));
};

const getShareFlag = (value: unknown) => value !== false;

const getPublicImageSource = (value: unknown) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("data:image/") || trimmed.startsWith("https://") || trimmed.startsWith("http://")
    ? trimmed
    : "";
};

const normalizeBadgeIds = (value: unknown) => {
  const rawBadges = Array.isArray(value) ? value : [];
  const cleanedBadges = rawBadges
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(["beta-2026", ...cleanedBadges]));
};

const migratePublicProfile = (
  uid: string,
  rawProfile: unknown,
): PublicStudyProfile | null => {
  if (typeof rawProfile !== "object" || rawProfile === null) return null;
  const record = rawProfile as Record<string, unknown>;
  const topSubjects = migrateSubjectStats(record.topSubjects);
  const thisWeekTopSubjects = migrateSubjectStats(record.thisWeekTopSubjects);
  const shareStudyTime = getShareFlag(record.shareStudyTime);
  const shareStudySubjects = getShareFlag(record.shareStudySubjects);
  const shareStudyStreak = getShareFlag(record.shareStudyStreak);

  return {
    uid: typeof record.uid === "string" ? record.uid : uid,
    friendCode:
      typeof record.friendCode === "string" && record.friendCode.trim()
        ? record.friendCode.trim()
        : buildStudyFriendCode(uid),
    displayName:
      typeof record.displayName === "string" && record.displayName.trim()
        ? record.displayName.trim()
        : "GradeGlow User",
    degreeProgram: typeof record.degreeProgram === "string" ? record.degreeProgram : "",
    avatarDataUrl: getPublicImageSource(record.avatarDataUrl),
    totalDoneMinutes:
      shareStudyTime && typeof record.totalDoneMinutes === "number" && Number.isFinite(record.totalDoneMinutes)
        ? record.totalDoneMinutes
        : 0,
    thisWeekDoneMinutes:
      shareStudyTime && typeof record.thisWeekDoneMinutes === "number" && Number.isFinite(record.thisWeekDoneMinutes)
        ? record.thisWeekDoneMinutes
        : 0,
    topSubjects: shareStudySubjects ? topSubjects : [],
    thisWeekTopSubjects: shareStudySubjects
      ? thisWeekTopSubjects.length > 0
        ? thisWeekTopSubjects
        : topSubjects
      : [],
    studyStreakDays:
      shareStudyStreak && typeof record.studyStreakDays === "number" && Number.isFinite(record.studyStreakDays)
        ? Math.max(0, Math.round(record.studyStreakDays))
        : 0,
    lastStudiedDateKey:
      shareStudyStreak && typeof record.lastStudiedDateKey === "string" ? record.lastStudiedDateKey : "",
    shareStudyTime,
    shareStudySubjects,
    shareStudyStreak,
    updatedAtIso: typeof record.updatedAtIso === "string" ? record.updatedAtIso : "",
    badgeIds: normalizeBadgeIds(record.badgeIds),
  };
};


const migratePublicActivity = (rawActivity: unknown): PublicStudyActivity | null => {
  if (typeof rawActivity !== "object" || rawActivity === null) return null;
  const record = rawActivity as Record<string, unknown>;
  const status = record.status === "started" || record.status === "completed" ? record.status : null;
  if (!status) return null;

  return {
    uid: typeof record.uid === "string" ? record.uid : "",
    displayName:
      typeof record.displayName === "string" && record.displayName.trim()
        ? record.displayName.trim()
        : "GradeGlow Friend",
    avatarDataUrl: getPublicImageSource(record.avatarDataUrl),
    status,
    title: typeof record.title === "string" && record.title.trim() ? record.title.trim() : "Lernsession",
    examId: typeof record.examId === "string" ? record.examId : "",
    sessionId: typeof record.sessionId === "string" ? record.sessionId : null,
    durationMinutes:
      typeof record.durationMinutes === "number" && Number.isFinite(record.durationMinutes)
        ? Math.max(0, Math.round(record.durationMinutes))
        : 0,
    startedAtIso: typeof record.startedAtIso === "string" ? record.startedAtIso : "",
    completedAtIso: typeof record.completedAtIso === "string" ? record.completedAtIso : "",
    updatedAtIso: typeof record.updatedAtIso === "string" ? record.updatedAtIso : "",
  };
};

const safeIso = (value: unknown) => (typeof value === "string" ? value : "");

const migrateStudyCircle = (circleId: string, rawCircle: unknown): StudyCircleListItem | null => {
  if (typeof rawCircle !== "object" || rawCircle === null) return null;
  const record = rawCircle as Record<string, unknown>;
  const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : "Study Circle";
  const circleCode =
    typeof record.circleCode === "string" && record.circleCode.trim()
      ? record.circleCode.trim().toUpperCase()
      : buildStudyCircleCode(circleId);

  return {
    id: typeof record.id === "string" && record.id.trim() ? record.id.trim() : circleId,
    name,
    circleCode,
    ownerUid: typeof record.ownerUid === "string" ? record.ownerUid : "",
    weeklyGoalMinutes:
      typeof record.weeklyGoalMinutes === "number" && Number.isFinite(record.weeklyGoalMinutes)
        ? Math.max(0, Math.round(record.weeklyGoalMinutes))
        : 600,
    createdAtIso: safeIso(record.createdAtIso),
    updatedAtIso: safeIso(record.updatedAtIso),
  };
};

const notifyFriendActivity = (activity: PublicStudyActivity) => {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const body =
    activity.status === "started"
      ? `${activity.displayName} hat gerade eine Lernsession gestartet: ${activity.title}.`
      : `${activity.displayName} hat ${activity.durationMinutes > 0 ? `${activity.durationMinutes} min ` : ""}gelernt: ${activity.title}.`;

  new Notification(activity.status === "started" ? "Freund lernt gerade ✨" : "Freund hat gelernt ✅", {
    body,
    icon: "/icons/icon-192.png",
    tag: `gradeglow-friend-${activity.uid}-${activity.status}`,
  });
};

const buildMissingFriend = (friendId: string): FriendListItem => ({
  uid: friendId,
  friendCode: buildStudyFriendCode(friendId),
  displayName: "Profil nicht geteilt",
  degreeProgram: "Diese Person hat Study Circle deaktiviert.",
  avatarDataUrl: "",
  totalDoneMinutes: 0,
  thisWeekDoneMinutes: 0,
  topSubjects: [],
  thisWeekTopSubjects: [],
  studyStreakDays: 0,
  lastStudiedDateKey: "",
  shareStudyTime: false,
  shareStudySubjects: false,
  shareStudyStreak: false,
  updatedAtIso: "",
  badgeIds: [],
  isMissing: true,
});

const sortFriends = (friends: FriendListItem[]) =>
  [...friends].sort((a, b) => {
    const weekDiff = b.thisWeekDoneMinutes - a.thisWeekDoneMinutes;
    if (weekDiff !== 0) return weekDiff;
    return b.totalDoneMinutes - a.totalDoneMinutes;
  });

type UseStudyFriendsArgs = {
  user: AppUser;
  profile: GradeGlowProfile;
  exams: ExamPlanItem[];
  limits?: PlanLimits;
  profileReady?: boolean;
};

export function useStudyFriends({ user, profile, exams, limits, profileReady = true }: UseStudyFriendsArgs) {
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [circles, setCircles] = useState<StudyCircleListItem[]>([]);
  const [activeCircleId, setActiveCircleId] = useState("");
  const [activeCircle, setActiveCircle] = useState<StudyCircleListItem | null>(null);
  const [circleMemberMeta, setCircleMemberMeta] = useState<{ uid: string; role: "owner" | "member"; joinedAtIso: string }[]>([]);
  const [circleMembers, setCircleMembers] = useState<StudyCircleMemberProfile[]>([]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const seenActivityEventRef = useRef<Record<string, string>>({});
  const [debugStatus, setDebugStatus] = useState<StudyCircleDebugStatus>(() => ({
    canUseCloudSocial: false,
    sharingEnabled: false,
    publicProfilePublished: false,
    friendCodeIndexed: false,
    rulesAccessOk: false,
    isChecking: false,
    friendCode: "",
    detail: "Study Circle wird vorbereitet.",
    checkedAtIso: "",
  }));

  const canUseCloudSocial =
    user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

  const ownFriendCode = useMemo(() => buildStudyFriendCode(user.uid), [user.uid]);
  const maxFriends = limits?.maxFriends ?? Number.POSITIVE_INFINITY;
  const effectiveActiveCircleId = activeCircleId || circles[0]?.id || "";

  const ownPublicProfile = useMemo(
    () => buildPublicProfile(user, profile, exams),
    [exams, profile, user],
  );

  useEffect(() => {
    if (!profileReady) {
      setPublishMessage("Profil wird geladen…");
      setDebugStatus({
        canUseCloudSocial,
        sharingEnabled: false,
        publicProfilePublished: false,
        friendCodeIndexed: false,
        rulesAccessOk: false,
        isChecking: true,
        friendCode: ownFriendCode,
        detail: "Study Circle wartet auf das geladene Cloud-Profil, damit kein leeres Profil veröffentlicht oder gelöscht wird.",
        checkedAtIso: nowIso(),
      });
      return;
    }

    if (!canUseCloudSocial || !db) {
      setPublishMessage("");
      setDebugStatus({
        canUseCloudSocial: false,
        sharingEnabled: profile.studySharingEnabled,
        publicProfilePublished: false,
        friendCodeIndexed: false,
        rulesAccessOk: false,
        isChecking: false,
        friendCode: ownFriendCode,
        detail: "Cloud-Social ist nicht aktiv. Nutze einen Firebase-Login und prüfe die Firebase-Konfiguration.",
        checkedAtIso: nowIso(),
      });
      return;
    }

    const profileRef = doc(db, PUBLIC_PROFILES_COLLECTION, user.uid);
    const codeRef = doc(db, FRIEND_CODES_COLLECTION, ownFriendCode);

    if (!profile.studySharingEnabled) {
      void Promise.allSettled([deleteDoc(profileRef), deleteDoc(codeRef)]).finally(() => {
        setPublishMessage("");
        setDebugStatus({
          canUseCloudSocial: true,
          sharingEnabled: false,
          publicProfilePublished: false,
          friendCodeIndexed: false,
          rulesAccessOk: true,
          isChecking: false,
          friendCode: ownFriendCode,
          detail: "Sharing ist aus. Dein öffentliches Profil und dein Code werden entfernt.",
          checkedAtIso: nowIso(),
        });
      });
      return;
    }

    let didCancel = false;

    setDebugStatus((current) => ({
      ...current,
      canUseCloudSocial: true,
      sharingEnabled: true,
      isChecking: true,
      friendCode: ownFriendCode,
      detail: "Profil und Freundescode werden veröffentlicht und geprüft…",
      checkedAtIso: nowIso(),
    }));

    void Promise.all([
      setDoc(
        profileRef,
        {
          ...ownPublicProfile,
          ownerUid: user.uid,
          updatedAt: serverTimestamp(),
          version: 4,
        },
        { merge: true },
      ),
      setDoc(
        codeRef,
        {
          uid: user.uid,
          friendCode: ownFriendCode,
          normalizedCode: ownFriendCode,
          displayNameSnapshot: ownPublicProfile.displayName,
          ownerUid: user.uid,
          updatedAt: serverTimestamp(),
          version: 2,
        },
        { merge: true },
      ),
    ])
      .then(async () => {
        const [profileSnapshot, codeSnapshot] = await Promise.all([
          getDoc(profileRef),
          getDoc(codeRef),
        ]);
        if (didCancel) return;

        const codeData = codeSnapshot.exists() ? codeSnapshot.data() : null;
        const friendCodeIndexed =
          codeSnapshot.exists() &&
          codeData?.uid === user.uid &&
          codeData?.normalizedCode === ownFriendCode;
        const publicProfilePublished = profileSnapshot.exists();
        const allOk = publicProfilePublished && friendCodeIndexed;

        setPublishMessage(allOk ? "Study Circle Profil veröffentlicht." : "Study Circle teilweise veröffentlicht — Status prüfen.");
        setDebugStatus({
          canUseCloudSocial: true,
          sharingEnabled: true,
          publicProfilePublished,
          friendCodeIndexed,
          rulesAccessOk: true,
          isChecking: false,
          friendCode: ownFriendCode,
          detail: allOk
            ? "Alles bereit. Andere können dich mit deinem Code hinzufügen."
            : "Profil oder Code konnten gelesen, aber nicht vollständig bestätigt werden.",
          checkedAtIso: nowIso(),
        });
      })
      .catch((error: unknown) => {
        if (didCancel) return;

        const isPermissionError = error instanceof FirebaseError && error.code === "permission-denied";
        setPublishMessage(
          isPermissionError
            ? "Study Circle Profil konnte nicht veröffentlicht werden. Bitte Firestore Rules deployen."
            : "Study Circle Profil konnte gerade nicht veröffentlicht werden.",
        );
        setDebugStatus({
          canUseCloudSocial: true,
          sharingEnabled: true,
          publicProfilePublished: false,
          friendCodeIndexed: false,
          rulesAccessOk: !isPermissionError,
          isChecking: false,
          friendCode: ownFriendCode,
          detail: isPermissionError
            ? "Firestore Rules blockieren Profil oder Code. Deploye die aktuellen Rules erneut."
            : "Firebase war erreichbar, aber die Veröffentlichung konnte nicht abgeschlossen werden.",
          checkedAtIso: nowIso(),
        });
      });

    return () => {
      didCancel = true;
    };
  }, [canUseCloudSocial, ownFriendCode, ownPublicProfile, profile.studySharingEnabled, profileReady, user.uid]);

  useEffect(() => {
    if (!canUseCloudSocial || !db) {
      setFriendIds([]);
      setFriends([]);
      return undefined;
    }

    const friendsRef = collection(db, "users", user.uid, FRIENDS_COLLECTION);
    const unsubscribe = onSnapshot(
      friendsRef,
      (snapshot) => {
        const ids = snapshot.docs
          .map((friendDoc) => friendDoc.id)
          .filter((id) => id && id !== user.uid);
        setFriendIds(ids);
      },
      (error) => {
        if (error instanceof FirebaseError && error.code === "permission-denied") {
          setMessage("Freundeliste konnte nicht geladen werden. Bitte neue Firestore Rules deployen.");
          return;
        }

        setMessage("Freundeliste konnte nicht geladen werden.");
      },
    );

    return () => unsubscribe();
  }, [canUseCloudSocial, user.uid]);

  useEffect(() => {
    if (!canUseCloudSocial || !db || friendIds.length === 0) {
      setFriends([]);
      return undefined;
    }

    setFriends([]);

    const unsubscribes = friendIds.map((friendId) =>
      onSnapshot(
        doc(db!, PUBLIC_PROFILES_COLLECTION, friendId),
        (profileSnapshot) => {
          const nextFriend = profileSnapshot.exists()
            ? migratePublicProfile(friendId, profileSnapshot.data()) ?? buildMissingFriend(friendId)
            : buildMissingFriend(friendId);

          setFriends((currentFriends) =>
            sortFriends([
              ...currentFriends.filter((friend) => friend.uid !== friendId),
              nextFriend,
            ]),
          );
        },
        () => {
          setMessage("Ein Freundesprofil konnte nicht geladen werden.");
        },
      ),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [canUseCloudSocial, friendIds]);

  useEffect(() => {
    if (!canUseCloudSocial || !db) {
      setCircles([]);
      setActiveCircle(null);
      setCircleMembers([]);
      return undefined;
    }

    const membershipsRef = collection(db, "users", user.uid, STUDY_CIRCLES_COLLECTION);
    const unsubscribe = onSnapshot(
      membershipsRef,
      (snapshot) => {
        const nextCircles = snapshot.docs
          .map((circleDoc) => {
            const data = circleDoc.data();
            const circle = migrateStudyCircle(circleDoc.id, {
              ...data,
              id: data.circleId || circleDoc.id,
            });
            return circle
              ? {
                  ...circle,
                  role: data.role === "owner" ? ("owner" as const) : ("member" as const),
                }
              : null;
          })
          .filter((circle): circle is StudyCircleListItem & { role: "owner" | "member" } => Boolean(circle))
          .sort((a, b) => a.name.localeCompare(b.name, "de"));

        setCircles(nextCircles);
        setActiveCircleId((current) => current || nextCircles[0]?.id || "");
      },
      (error) => {
        if (error instanceof FirebaseError && error.code === "permission-denied") {
          setMessage("Circles konnten nicht geladen werden. Bitte neue Firestore Rules deployen.");
          return;
        }

        setMessage("Circles konnten nicht geladen werden.");
      },
    );

    return () => unsubscribe();
  }, [canUseCloudSocial, user.uid]);

  useEffect(() => {
    if (!canUseCloudSocial || !db || !effectiveActiveCircleId) {
      setActiveCircle(null);
      setCircleMemberMeta([]);
      setCircleMembers([]);
      return undefined;
    }

    const circleRef = doc(db, STUDY_CIRCLES_COLLECTION, effectiveActiveCircleId);
    const membersRef = collection(db, STUDY_CIRCLES_COLLECTION, effectiveActiveCircleId, "members");

    const unsubscribeCircle = onSnapshot(
      circleRef,
      (circleSnapshot) => {
        const nextCircle = circleSnapshot.exists()
          ? migrateStudyCircle(effectiveActiveCircleId, circleSnapshot.data())
          : circles.find((circle) => circle.id === effectiveActiveCircleId) ?? null;
        setActiveCircle(nextCircle);
      },
      () => setMessage("Circle-Daten konnten nicht geladen werden."),
    );

    const unsubscribeMembers = onSnapshot(
      membersRef,
      (snapshot) => {
        const nextMeta = snapshot.docs
          .map((memberDoc) => {
            const data = memberDoc.data();
            const uid = typeof data.uid === "string" && data.uid.trim() ? data.uid.trim() : memberDoc.id;
            if (!uid) return null;
            return {
              uid,
              role: data.role === "owner" ? "owner" as const : "member" as const,
              joinedAtIso: typeof data.joinedAtIso === "string" ? data.joinedAtIso : "",
            };
          })
          .filter((member): member is { uid: string; role: "owner" | "member"; joinedAtIso: string } => Boolean(member));

        setCircleMemberMeta(nextMeta);
      },
      () => setMessage("Circle-Mitglieder konnten nicht geladen werden."),
    );

    return () => {
      unsubscribeCircle();
      unsubscribeMembers();
    };
  }, [canUseCloudSocial, circles, effectiveActiveCircleId]);

  useEffect(() => {
    if (!canUseCloudSocial || !db || circleMemberMeta.length === 0) {
      setCircleMembers([]);
      return undefined;
    }

    setCircleMembers((currentMembers) =>
      currentMembers.filter((member) => circleMemberMeta.some((meta) => meta.uid === member.uid)),
    );

    const unsubscribes = circleMemberMeta.map((meta) =>
      onSnapshot(
        doc(db!, PUBLIC_PROFILES_COLLECTION, meta.uid),
        (profileSnapshot) => {
          const nextMember = profileSnapshot.exists()
            ? migratePublicProfile(meta.uid, profileSnapshot.data()) ?? buildMissingFriend(meta.uid)
            : buildMissingFriend(meta.uid);

          setCircleMembers((currentMembers) =>
            sortFriends([
              ...currentMembers.filter((member) => member.uid !== meta.uid),
              { ...nextMember, role: meta.role, joinedAtIso: meta.joinedAtIso },
            ]) as StudyCircleMemberProfile[],
          );
        },
        () => undefined,
      ),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [canUseCloudSocial, circleMemberMeta]);

  useEffect(() => {
    if (!canUseCloudSocial || !db || friendIds.length === 0 || !profile.friendActivityNotificationsEnabled) {
      return undefined;
    }

    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return undefined;
    }

    const unsubscribes = friendIds.map((friendId) =>
      onSnapshot(
        doc(db!, STUDY_ACTIVITY_COLLECTION, friendId),
        (activitySnapshot) => {
          if (!activitySnapshot.exists()) return;
          const activity = migratePublicActivity(activitySnapshot.data());
          if (!activity?.updatedAtIso) return;

          const previousEventKey = seenActivityEventRef.current[friendId];
          seenActivityEventRef.current[friendId] = activity.updatedAtIso;

          if (!previousEventKey || previousEventKey === activity.updatedAtIso) return;

          notifyFriendActivity(activity);
        },
        () => undefined,
      ),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [canUseCloudSocial, friendIds, profile.friendActivityNotificationsEnabled]);

  const resolveFriendId = async (friendCode: string): Promise<FriendLookupResult> => {
    if (!db) return { uid: null, reason: "not-found" };

    const rawCode = friendCode.trim();
    const normalizedCode = normalizeStudyFriendCode(rawCode);

    if (!rawCode) return { uid: null, reason: "empty" };

    const codeSnapshot = await getDoc(doc(db, FRIEND_CODES_COLLECTION, normalizedCode));
    if (codeSnapshot.exists()) {
      const uid = codeSnapshot.data().uid;
      return typeof uid === "string" && uid.trim()
        ? { uid: uid.trim(), reason: "found" }
        : { uid: null, reason: "code-without-uid" };
    }

    const directProfileSnapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, rawCode));
    if (directProfileSnapshot.exists()) return { uid: rawCode, reason: "found" };

    if (normalizedCode !== rawCode) {
      const normalizedProfileSnapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, normalizedCode));
      if (normalizedProfileSnapshot.exists()) return { uid: normalizedCode, reason: "found" };
    }

    return { uid: null, reason: "not-found" };
  };

  const addFriend = async (friendCode: string) => {
    if (!canUseCloudSocial || !db) {
      setMessage("Study Circle funktioniert aktuell nur mit Firebase-Login.");
      return;
    }

    const rawCode = friendCode.trim();
    const normalizedCode = normalizeStudyFriendCode(rawCode);
    if (!rawCode) {
      setMessage("Füge zuerst einen Freundescode ein.");
      return;
    }

    if (rawCode === user.uid || normalizedCode === ownFriendCode) {
      setMessage("Das ist dein eigener Code.");
      return;
    }

    if (Number.isFinite(maxFriends) && friendIds.length >= maxFriends) {
      setMessage(`Free-Limit erreicht: Du kannst aktuell maximal ${maxFriends} Freunde hinzufügen. Premium ist vorbereitet und kann manuell freigeschaltet werden.`);
      return;
    }

    setIsBusy(true);
    setMessage("");

    try {
      const lookup = await resolveFriendId(rawCode);

      if (!lookup.uid) {
        if (lookup.reason === "code-without-uid") {
          setMessage("Code-Dokument gefunden, aber ohne gültige UID. Sharing bei der anderen Person einmal aus- und wieder einschalten.");
          return;
        }

        setMessage("Kein öffentliches Study-Circle-Profil für diesen Code gefunden. Prüfe: Sharing bei der anderen Person aktiv, neuer GG-Code kopiert und aktuelle Firestore Rules deployed.");
        return;
      }

      const friendId = lookup.uid;

      if (friendId === user.uid) {
        setMessage("Das ist dein eigener Code.");
        return;
      }

      if (friendIds.includes(friendId)) {
        setMessage("Diese Person ist schon in deinem Study Circle.");
        return;
      }

      const profileSnapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, friendId));
      if (!profileSnapshot.exists()) {
        setMessage("Code gefunden, aber das Study-Circle-Profil ist nicht öffentlich. Die andere Person muss Sharing aktivieren.");
        return;
      }

      const publicProfile = migratePublicProfile(friendId, profileSnapshot.data());
      if (!publicProfile) {
        setMessage("Profil gefunden, aber Datenformat ist ungültig. Bitte Sharing bei der anderen Person einmal deaktivieren und wieder aktivieren.");
        return;
      }

      const batch = writeBatch(db);
      const ownFriendRef = doc(db, "users", user.uid, FRIENDS_COLLECTION, friendId);
      const reciprocalFriendRef = doc(db, "users", friendId, FRIENDS_COLLECTION, user.uid);

      batch.set(ownFriendRef, {
        uid: friendId,
        friendCode: publicProfile.friendCode,
        displayNameSnapshot: publicProfile.displayName,
        addedAt: serverTimestamp(),
        mutualWith: user.uid,
        source: "friend_code",
        version: 5,
      });
      batch.set(reciprocalFriendRef, {
        uid: user.uid,
        friendCode: ownFriendCode,
        displayNameSnapshot: ownPublicProfile.displayName,
        addedAt: serverTimestamp(),
        mutualWith: friendId,
        source: "reciprocal_friend_code",
        version: 5,
      });

      await batch.commit();
      setMessage(`${publicProfile.displayName} hinzugefügt. Ihr seid jetzt gegenseitig befreundet.`);
    } catch (error) {
      setMessage(getFriendErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!canUseCloudSocial || !db) return;

    setIsBusy(true);
    setMessage("");

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "users", user.uid, FRIENDS_COLLECTION, friendId));
      batch.delete(doc(db, "users", friendId, FRIENDS_COLLECTION, user.uid));
      await batch.commit();
      setMessage("Freundschaft entfernt.");
    } catch {
      setMessage("Freund konnte nicht entfernt werden.");
    } finally {
      setIsBusy(false);
    }
  };

  const createCircle = async (circleName: string) => {
    if (!canUseCloudSocial || !db) {
      setMessage("Circles funktionieren aktuell nur mit Firebase-Login.");
      return;
    }

    const name = circleName.trim() || `${ownPublicProfile.displayName}s Study Circle`;
    setIsBusy(true);
    setMessage("");

    try {
      const circleRef = doc(collection(db, STUDY_CIRCLES_COLLECTION));
      const circleCode = buildStudyCircleCode(circleRef.id);
      const circleCodeRef = doc(db, STUDY_CIRCLE_CODES_COLLECTION, circleCode);
      const memberRef = doc(db, STUDY_CIRCLES_COLLECTION, circleRef.id, "members", user.uid);
      const ownMembershipRef = doc(db, "users", user.uid, STUDY_CIRCLES_COLLECTION, circleRef.id);
      const batch = writeBatch(db);
      const baseCircleData = {
        id: circleRef.id,
        name,
        circleCode,
        normalizedCode: circleCode,
        ownerUid: user.uid,
        weeklyGoalMinutes: 600,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAtIso: nowIso(),
        updatedAtIso: nowIso(),
        version: 1,
      };

      batch.set(circleRef, baseCircleData);
      batch.set(circleCodeRef, {
        circleId: circleRef.id,
        circleCode,
        normalizedCode: circleCode,
        circleNameSnapshot: name,
        ownerUid: user.uid,
        updatedAt: serverTimestamp(),
        version: 1,
      });
      batch.set(memberRef, {
        uid: user.uid,
        role: "owner",
        displayNameSnapshot: ownPublicProfile.displayName,
        joinedAt: serverTimestamp(),
        joinedAtIso: nowIso(),
        version: 1,
      });
      batch.set(ownMembershipRef, {
        ...baseCircleData,
        circleId: circleRef.id,
        role: "owner",
        joinedAt: serverTimestamp(),
        joinedAtIso: nowIso(),
      });

      await batch.commit();
      setActiveCircleId(circleRef.id);
      setMessage(`${name} erstellt. Teile den Circle-Code mit deiner Lerngruppe.`);
    } catch (error) {
      setMessage(getFriendErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const joinCircle = async (circleCodeInput: string) => {
    if (!canUseCloudSocial || !db) {
      setMessage("Circles funktionieren aktuell nur mit Firebase-Login.");
      return;
    }

    const normalizedCode = normalizeStudyCircleCode(circleCodeInput);
    if (!normalizedCode) {
      setMessage("Füge zuerst einen Circle-Code ein.");
      return;
    }

    setIsBusy(true);
    setMessage("");

    try {
      const codeSnapshot = await getDoc(doc(db, STUDY_CIRCLE_CODES_COLLECTION, normalizedCode));
      if (!codeSnapshot.exists()) {
        setMessage("Kein Circle für diesen Code gefunden.");
        return;
      }

      const codeData = codeSnapshot.data();
      const circleId = typeof codeData.circleId === "string" ? codeData.circleId : "";
      if (!circleId) {
        setMessage("Circle-Code gefunden, aber ohne gültige Circle-ID.");
        return;
      }

      if (circles.some((circle) => circle.id === circleId)) {
        setActiveCircleId(circleId);
        setMessage("Du bist bereits in diesem Circle.");
        return;
      }

      const circleSnapshot = await getDoc(doc(db, STUDY_CIRCLES_COLLECTION, circleId));
      const circle = circleSnapshot.exists() ? migrateStudyCircle(circleId, circleSnapshot.data()) : null;
      if (!circle) {
        setMessage("Circle konnte nicht geladen werden.");
        return;
      }

      const batch = writeBatch(db);
      batch.set(doc(db, STUDY_CIRCLES_COLLECTION, circleId, "members", user.uid), {
        uid: user.uid,
        role: "member",
        displayNameSnapshot: ownPublicProfile.displayName,
        joinedAt: serverTimestamp(),
        joinedAtIso: nowIso(),
        version: 1,
      });
      batch.set(doc(db, "users", user.uid, STUDY_CIRCLES_COLLECTION, circleId), {
        ...circle,
        circleId,
        role: "member",
        joinedAt: serverTimestamp(),
        joinedAtIso: nowIso(),
      });

      await batch.commit();
      setActiveCircleId(circleId);
      setMessage(`Du bist ${circle.name} beigetreten.`);
    } catch (error) {
      setMessage(getFriendErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const updateCircleWeeklyGoal = async (circleId: string, weeklyGoalMinutes: number) => {
    if (!canUseCloudSocial || !db || !circleId) return;

    if (activeCircle?.ownerUid !== user.uid) {
      setMessage("Nur der Circle-Owner kann das Wochenziel ändern.");
      return;
    }

    const normalizedGoal = Math.max(30, Math.min(6000, Math.round(weeklyGoalMinutes)));

    setIsBusy(true);
    setMessage("");

    try {
      await updateDoc(doc(db, STUDY_CIRCLES_COLLECTION, circleId), {
        weeklyGoalMinutes: normalizedGoal,
        updatedAt: serverTimestamp(),
        updatedAtIso: nowIso(),
      });
      setMessage(`Wochenziel auf ${normalizedGoal} Minuten gesetzt.`);
    } catch (error) {
      setMessage(getFriendErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const leaveCircle = async (circleId: string) => {
    if (!canUseCloudSocial || !db || !circleId) return;

    setIsBusy(true);
    setMessage("");

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, STUDY_CIRCLES_COLLECTION, circleId, "members", user.uid));
      batch.delete(doc(db, "users", user.uid, STUDY_CIRCLES_COLLECTION, circleId));
      await batch.commit();
      setActiveCircleId("");
      setMessage("Circle verlassen.");
    } catch {
      setMessage("Circle konnte nicht verlassen werden.");
    } finally {
      setIsBusy(false);
    }
  };

  return {
    canUseCloudSocial,
    ownPublicProfile,
    friends,
    friendIds,
    circles,
    activeCircleId: effectiveActiveCircleId,
    activeCircle,
    circleMembers,
    friendCode: ownFriendCode,
    legacyFriendCode: user.uid,
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
  };
}
