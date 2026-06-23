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
  getStudySubjectStats,
  getThisWeekDoneStudyMinutes,
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

type FriendListItem = PublicStudyProfile & {
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

  return {
    uid: user.uid,
    displayName: profile.displayName || user.displayName || "GradeGlow User",
    degreeProgram: profile.degreeProgram,
    avatarDataUrl: profile.avatarDataUrl,
    totalDoneMinutes: getTotalDoneStudyMinutes(exams),
    thisWeekDoneMinutes: getThisWeekDoneStudyMinutes(exams),
    topSubjects,
    updatedAtIso: new Date().toISOString(),
  };
};

const migratePublicProfile = (
  uid: string,
  rawProfile: unknown,
): PublicStudyProfile | null => {
  if (typeof rawProfile !== "object" || rawProfile === null) return null;
  const record = rawProfile as Record<string, unknown>;
  const topSubjects = Array.isArray(record.topSubjects) ? record.topSubjects : [];

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
    topSubjects: topSubjects
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
      .filter((item): item is PublicStudyProfile["topSubjects"][number] => Boolean(item)),
    updatedAtIso: typeof record.updatedAtIso === "string" ? record.updatedAtIso : "",
  };
};

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
        version: 1,
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
        const ids = snapshot.docs.map((friendDoc) => friendDoc.id).filter(Boolean);
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
      return;
    }

    let isCancelled = false;

    void Promise.all(
      friendIds.map(async (friendId) => {
        const profileSnapshot = await getDoc(doc(db!, PUBLIC_PROFILES_COLLECTION, friendId));
        if (!profileSnapshot.exists()) {
          return {
            uid: friendId,
            displayName: "Profil nicht geteilt",
            degreeProgram: "Diese Person hat Study Circle deaktiviert.",
            avatarDataUrl: "",
            totalDoneMinutes: 0,
            thisWeekDoneMinutes: 0,
            topSubjects: [],
            updatedAtIso: "",
            isMissing: true,
          } satisfies FriendListItem;
        }

        return migratePublicProfile(friendId, profileSnapshot.data()) ?? {
          uid: friendId,
          displayName: "Profil konnte nicht gelesen werden",
          degreeProgram: "",
          avatarDataUrl: "",
          totalDoneMinutes: 0,
          thisWeekDoneMinutes: 0,
          topSubjects: [],
          updatedAtIso: "",
          isMissing: true,
        } satisfies FriendListItem;
      }),
    )
      .then((nextFriends) => {
        if (isCancelled) return;
        setFriends(nextFriends.sort((a, b) => b.thisWeekDoneMinutes - a.thisWeekDoneMinutes));
      })
      .catch(() => {
        if (!isCancelled) setMessage("Freundesprofile konnten nicht geladen werden.");
      });

    return () => {
      isCancelled = true;
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
        version: 1,
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
