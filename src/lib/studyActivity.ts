import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { AppUser, GradeGlowProfile, PublicStudyActivity, StudyActivityStatus } from "../types";

const STUDY_ACTIVITY_COLLECTION = "studyActivityEvents";

const getPublicName = (user: AppUser, profile: GradeGlowProfile) =>
  profile.displayName || user.displayName || user.email || "GradeGlow User";

type PublishStudyActivityArgs = {
  user: AppUser;
  profile: GradeGlowProfile;
  status: StudyActivityStatus;
  title: string;
  examId: string;
  sessionId: string | null;
  durationMinutes?: number;
  startedAtIso?: string;
  completedAtIso?: string;
};

export const publishStudyActivity = async ({
  user,
  profile,
  status,
  title,
  examId,
  sessionId,
  durationMinutes = 0,
  startedAtIso = "",
  completedAtIso = "",
}: PublishStudyActivityArgs) => {
  if (!profile.studySharingEnabled || !isFirebaseConfigured || !db || user.provider !== "firebase") {
    return;
  }

  const nowIso = new Date().toISOString();
  const payload: PublicStudyActivity = {
    uid: user.uid,
    displayName: getPublicName(user, profile),
    avatarDataUrl: profile.avatarDataUrl || user.photoURL || "",
    status,
    title,
    examId,
    sessionId,
    durationMinutes: Math.max(0, Math.round(durationMinutes)),
    startedAtIso,
    completedAtIso,
    updatedAtIso: nowIso,
  };

  await setDoc(
    doc(db, STUDY_ACTIVITY_COLLECTION, user.uid),
    {
      ...payload,
      ownerUid: user.uid,
      updatedAt: serverTimestamp(),
      version: 1,
    },
    { merge: true },
  );
};
