"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import type { AppUser, GradeGlowProfile, PublicStudyActivity } from "../types";

const FRIENDS_COLLECTION = "friends";
const STUDY_ACTIVITY_COLLECTION = "studyActivityEvents";

export type FriendActivityToastData = {
  uid: string;
  displayName: string;
  title: string;
  status: "started" | "completed" | "friend_added";
  durationMinutes: number;
  updatedAtIso: string;
};

const migrateActivity = (rawActivity: unknown): FriendActivityToastData | null => {
  if (typeof rawActivity !== "object" || rawActivity === null) return null;
  const record = rawActivity as Record<string, unknown>;
  const status = record.status === "started" || record.status === "completed" ? record.status : null;
  if (!status) return null;

  const uid = typeof record.uid === "string" ? record.uid : "";
  const updatedAtIso = typeof record.updatedAtIso === "string" ? record.updatedAtIso : "";
  if (!uid || !updatedAtIso) return null;

  return {
    uid,
    displayName:
      typeof record.displayName === "string" && record.displayName.trim()
        ? record.displayName.trim()
        : "Ein Freund",
    title: typeof record.title === "string" && record.title.trim() ? record.title.trim() : "Lernsession",
    status,
    durationMinutes:
      typeof record.durationMinutes === "number" && Number.isFinite(record.durationMinutes)
        ? Math.max(0, Math.round(record.durationMinutes))
        : 0,
    updatedAtIso,
  };
};

export function useFriendActivityToast(user: AppUser, profile: GradeGlowProfile) {
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [toast, setToast] = useState<FriendActivityToastData | null>(null);
  const seenActivityRef = useRef<Record<string, string>>({});
  const hasHydratedFriendListRef = useRef(false);
  const canUseFriendActivity =
    user.provider === "firebase" &&
    isFirebaseConfigured &&
    Boolean(db) &&
    profile.friendActivityNotificationsEnabled;

  useEffect(() => {
    if (!canUseFriendActivity || !db) {
      setFriendIds([]);
      hasHydratedFriendListRef.current = false;
      return undefined;
    }

    hasHydratedFriendListRef.current = false;

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, FRIENDS_COLLECTION),
      (snapshot) => {
        const ids = snapshot.docs
          .map((friendDoc) => friendDoc.id)
          .filter((id) => id && id !== user.uid);
        setFriendIds(ids);

        if (!hasHydratedFriendListRef.current) {
          hasHydratedFriendListRef.current = true;
          return;
        }

        const addedFriendChange = snapshot
          .docChanges()
          .find((change) => change.type === "added" && change.doc.id !== user.uid);

        if (!addedFriendChange) return;

        const data = addedFriendChange.doc.data() as Record<string, unknown>;
        const displayName =
          typeof data.displayNameSnapshot === "string" && data.displayNameSnapshot.trim()
            ? data.displayNameSnapshot.trim()
            : "Jemand";
        const addedAtIso =
          typeof data.addedAtIso === "string" && data.addedAtIso.trim()
            ? data.addedAtIso.trim()
            : new Date().toISOString();

        setToast({
          uid: addedFriendChange.doc.id,
          displayName,
          title: `${displayName} hat dich hinzugefügt`,
          status: "friend_added",
          durationMinutes: 0,
          updatedAtIso: addedAtIso,
        });
      },
      () => undefined,
    );

    return () => unsubscribe();
  }, [canUseFriendActivity, user.uid]);

  useEffect(() => {
    if (!canUseFriendActivity || !db || friendIds.length === 0) {
      return undefined;
    }

    const unsubscribes = friendIds.map((friendId) =>
      onSnapshot(
        doc(db!, STUDY_ACTIVITY_COLLECTION, friendId),
        (snapshot) => {
          if (!snapshot.exists()) return;
          const activity = migrateActivity(snapshot.data() as PublicStudyActivity);
          if (!activity) return;

          const previousEventKey = seenActivityRef.current[friendId];
          seenActivityRef.current[friendId] = activity.updatedAtIso;

          if (!previousEventKey || previousEventKey === activity.updatedAtIso) return;
          setToast(activity);
        },
        () => undefined,
      ),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [canUseFriendActivity, friendIds]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  return {
    toast,
    dismissToast: () => setToast(null),
  };
}
