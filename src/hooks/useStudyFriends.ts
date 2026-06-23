"use client";

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
  PublicStudyProfile,
} from "../types";

type UseStudyFriendsArgs = {
  user: AppUser;
  profile: GradeGlowProfile;
  exams: ExamPlanItem[];
};

export type FriendListItem = PublicStudyProfile & {
  isMissing?: boolean;
};

const PUBLIC_PROFILES_COLLECTION = "publicStudyProfiles";
const FRIENDS_COLLECTION = "friends";

const buildPublicProfile = (
  user: AppUser,
  profile: GradeGlowProfile,
  exams: ExamPlanItem[],
): PublicStudyProfile => {
  const topSubjects = getStudySubjectStats(exams).slice(0, 5);
  const thisWeekTopSubjects = getThisWeekStudySubjectStats(exams).slice(0, 5);

  return {
    uid: user.uid,
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

export function useStudyFriends({ user, profile, exams }: UseStudyFriendsArgs) {
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const canUseCloudSocial =
    user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

  const ownPublicProfile = useMemo(
    () => buildPublicProfile(user, profile, exams),
    [exams, profile, user],
  );

  useEffect(() => {
    if (!canUseCloudSocial || !db) return;

    const profileRef = doc(db, PUBLIC_PROFILES_COLLECTION, user.uid);

    if (!profile.studySharingEnabled) {
      void deleteDoc(profileRef).catch(() => undefined);
      return;
    }

    void setDoc(
      profileRef,
      {
        ...ownPublicProfile,
        ownerUid: user.uid,
        updatedAt: serverTimestamp(),
        version: 2,
      },
      { merge: true },
    ).catch(() => undefined);
  }, [canUseCloudSocial, ownPublicProfile, profile.studySharingEnabled, user.uid]);

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
      () => {
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

  const addFriend = async (friendCode: string) => {
    if (!canUseCloudSocial || !db) {
      setMessage("Study Circle funktioniert aktuell nur mit Firebase-Login.");
      return;
    }

    const friendId = friendCode.trim();
    if (!friendId) {
      setMessage("Füge zuerst einen Freundescode ein.");
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

    setIsBusy(true);
    setMessage("");

    try {
      const profileSnapshot = await getDoc(doc(db, PUBLIC_PROFILES_COLLECTION, friendId));
      if (!profileSnapshot.exists()) {
        setMessage("Kein öffentliches Study-Circle-Profil für diesen Code gefunden.");
        return;
      }

      const publicProfile = migratePublicProfile(friendId, profileSnapshot.data());
      await setDoc(doc(db, "users", user.uid, FRIENDS_COLLECTION, friendId), {
        uid: friendId,
        displayNameSnapshot: publicProfile?.displayName ?? "GradeGlow User",
        addedAt: serverTimestamp(),
        version: 2,
      });
      setMessage("Freund hinzugefügt.");
    } catch {
      setMessage("Freund konnte nicht hinzugefügt werden.");
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
    friendCode: user.uid,
    message,
    isBusy,
    addFriend,
    removeFriend,
  };
}
