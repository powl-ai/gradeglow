"use client";

import { FirebaseError } from "firebase/app";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
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
  PublicStudyProfile,
} from "../types";

export type FriendListItem = PublicStudyProfile & {
  isMissing?: boolean;
};

const PUBLIC_PROFILES_COLLECTION = "publicStudyProfiles";
const FRIEND_CODES_COLLECTION = "studyFriendCodes";
const FRIENDS_COLLECTION = "friends";

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
  const topSubjects = getStudySubjectStats(exams).slice(0, 5);
  const thisWeekTopSubjects = getThisWeekStudySubjectStats(exams).slice(0, 5);

  return {
    uid: user.uid,
    friendCode: buildStudyFriendCode(user.uid),
    displayName: profile.displayName || user.displayName || "GradeGlow User",
    degreeProgram: profile.degreeProgram,
    avatarDataUrl: profile.avatarDataUrl,
    totalDoneMinutes: getTotalDoneStudyMinutes(exams),
    thisWeekDoneMinutes: getThisWeekDoneStudyMinutes(exams),
    topSubjects,
    thisWeekTopSubjects,
    studyStreakDays: getStudyStreakDays(exams),
    lastStudiedDateKey: getLastDoneStudyDateKey(exams),
    updatedAtIso: new Date().toISOString(),
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

const migratePublicProfile = (
  uid: string,
  rawProfile: unknown,
): PublicStudyProfile | null => {
  if (typeof rawProfile !== "object" || rawProfile === null) return null;
  const record = rawProfile as Record<string, unknown>;
  const topSubjects = migrateSubjectStats(record.topSubjects);
  const thisWeekTopSubjects = migrateSubjectStats(record.thisWeekTopSubjects);

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
    avatarDataUrl:
      typeof record.avatarDataUrl === "string" && record.avatarDataUrl.startsWith("data:image/")
        ? record.avatarDataUrl
        : "",
    totalDoneMinutes:
      typeof record.totalDoneMinutes === "number" && Number.isFinite(record.totalDoneMinutes)
        ? record.totalDoneMinutes
        : 0,
    thisWeekDoneMinutes:
      typeof record.thisWeekDoneMinutes === "number" && Number.isFinite(record.thisWeekDoneMinutes)
        ? record.thisWeekDoneMinutes
        : 0,
    topSubjects,
    thisWeekTopSubjects: thisWeekTopSubjects.length > 0 ? thisWeekTopSubjects : topSubjects,
    studyStreakDays:
      typeof record.studyStreakDays === "number" && Number.isFinite(record.studyStreakDays)
        ? Math.max(0, Math.round(record.studyStreakDays))
        : 0,
    lastStudiedDateKey:
      typeof record.lastStudiedDateKey === "string" ? record.lastStudiedDateKey : "",
    updatedAtIso: typeof record.updatedAtIso === "string" ? record.updatedAtIso : "",
  };
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
  updatedAtIso: "",
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
};

export function useStudyFriends({ user, profile, exams, limits }: UseStudyFriendsArgs) {
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  const canUseCloudSocial =
    user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

  const ownFriendCode = useMemo(() => buildStudyFriendCode(user.uid), [user.uid]);
  const maxFriends = limits?.maxFriends ?? Number.POSITIVE_INFINITY;

  const ownPublicProfile = useMemo(
    () => buildPublicProfile(user, profile, exams),
    [exams, profile, user],
  );

  useEffect(() => {
    if (!canUseCloudSocial || !db) return;

    const profileRef = doc(db, PUBLIC_PROFILES_COLLECTION, user.uid);
    const codeRef = doc(db, FRIEND_CODES_COLLECTION, ownFriendCode);

    if (!profile.studySharingEnabled) {
      void Promise.allSettled([deleteDoc(profileRef), deleteDoc(codeRef)]).catch(() => undefined);
      setPublishMessage("");
      return;
    }

    void Promise.all([
      setDoc(
        profileRef,
        {
          ...ownPublicProfile,
          ownerUid: user.uid,
          updatedAt: serverTimestamp(),
          version: 3,
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
          version: 1,
        },
        { merge: true },
      ),
    ])
      .then(() => setPublishMessage("Study Circle Profil veröffentlicht."))
      .catch((error: unknown) => {
        if (error instanceof FirebaseError && error.code === "permission-denied") {
          setPublishMessage("Study Circle Profil konnte nicht veröffentlicht werden. Bitte Firestore Rules deployen.");
          return;
        }

        setPublishMessage("Study Circle Profil konnte gerade nicht veröffentlicht werden.");
      });
  }, [canUseCloudSocial, ownFriendCode, ownPublicProfile, profile.studySharingEnabled, user.uid]);

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

  const resolveFriendId = async (friendCode: string) => {
    if (!db) return null;

    const rawCode = friendCode.trim();
    const normalizedCode = normalizeStudyFriendCode(rawCode);

    if (!rawCode) return null;

    const codeSnapshot = await getDoc(doc(db, FRIEND_CODES_COLLECTION, normalizedCode));
    if (codeSnapshot.exists()) {
      const uid = codeSnapshot.data().uid;
      return typeof uid === "string" && uid.trim() ? uid.trim() : null;
    }

    const directProfileSnapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, rawCode));
    if (directProfileSnapshot.exists()) return rawCode;

    if (normalizedCode !== rawCode) {
      const normalizedProfileSnapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, normalizedCode));
      if (normalizedProfileSnapshot.exists()) return normalizedCode;
    }

    return null;
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
      const friendId = await resolveFriendId(rawCode);

      if (!friendId) {
        setMessage("Kein Profil für diesen Code gefunden. Deine Freundin muss Study Sharing aktivieren und die neue Firestore Rules müssen deployed sein.");
        return;
      }

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

      await setDoc(doc(db, "users", user.uid, FRIENDS_COLLECTION, friendId), {
        uid: friendId,
        friendCode: publicProfile.friendCode,
        displayNameSnapshot: publicProfile.displayName,
        addedAt: serverTimestamp(),
        version: 3,
      });
      setMessage(`${publicProfile.displayName} hinzugefügt.`);
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
      await deleteDoc(doc(db, "users", user.uid, FRIENDS_COLLECTION, friendId));
      setMessage("Freund entfernt.");
    } catch {
      setMessage("Freund konnte nicht entfernt werden.");
    } finally {
      setIsBusy(false);
    }
  };

  return {
    canUseCloudSocial,
    ownPublicProfile,
    friends,
    friendCode: ownFriendCode,
    legacyFriendCode: user.uid,
    publishMessage,
    message,
    isBusy,
    addFriend,
    removeFriend,
  };
}
