import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { GRADEGLOW_APP_VERSION } from "./appVersion";
import type {
  AppUser,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
  GradeGlowFeedback,
} from "../types";

export const FEEDBACK_APP_VERSION = GRADEGLOW_APP_VERSION;

export type NewFeedbackInput = {
  type: FeedbackType;
  priority?: FeedbackPriority;
  subject: string;
  message: string;
  page: string;
  ownerName?: string;
};

const validFeedbackTypes: FeedbackType[] = ["bug", "feedback", "feature_request", "delete_request", "beta_note"];
const validFeedbackStatuses: FeedbackStatus[] = ["open", "reviewing", "planned", "done", "closed"];
const validFeedbackPriorities: FeedbackPriority[] = ["low", "normal", "high"];

const getStringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getFeedbackType = (value: unknown): FeedbackType =>
  validFeedbackTypes.includes(value as FeedbackType) ? (value as FeedbackType) : "feedback";

const getFeedbackStatus = (value: unknown): FeedbackStatus =>
  validFeedbackStatuses.includes(value as FeedbackStatus) ? (value as FeedbackStatus) : "open";

const getFeedbackPriority = (value: unknown): FeedbackPriority =>
  validFeedbackPriorities.includes(value as FeedbackPriority) ? (value as FeedbackPriority) : "normal";

const normalizeFeedback = (id: string, rawValue: DocumentData): GradeGlowFeedback => ({
  id,
  ownerUid: getStringValue(rawValue.ownerUid),
  ownerEmail: getStringValue(rawValue.ownerEmail),
  ownerName: getStringValue(rawValue.ownerName),
  type: getFeedbackType(rawValue.type),
  status: getFeedbackStatus(rawValue.status),
  priority: getFeedbackPriority(rawValue.priority),
  subject: getStringValue(rawValue.subject) || "Ohne Betreff",
  message: getStringValue(rawValue.message),
  page: getStringValue(rawValue.page),
  userAgent: getStringValue(rawValue.userAgent),
  appVersion: getStringValue(rawValue.appVersion) || FEEDBACK_APP_VERSION,
  createdAtIso: getStringValue(rawValue.createdAtIso),
  updatedAtIso: getStringValue(rawValue.updatedAtIso),
  adminNote: getStringValue(rawValue.adminNote),
});

export async function submitGradeGlowFeedback(user: AppUser, input: NewFeedbackInput) {
  if (!db || !isFirebaseConfigured) {
    throw new Error("firebase-not-configured");
  }

  const nowIso = new Date().toISOString();
  const cleanedSubject = input.subject.trim();
  const cleanedMessage = input.message.trim();

  if (!cleanedSubject || cleanedSubject.length < 3) {
    throw new Error("subject-too-short");
  }

  if (!cleanedMessage || cleanedMessage.length < 10) {
    throw new Error("message-too-short");
  }

  const docRef = await addDoc(collection(db, "feedback"), {
    ownerUid: user.uid,
    ownerEmail: user.email ?? "",
    ownerName: input.ownerName?.trim() || user.displayName || user.email || "GradeGlow User",
    type: input.type,
    status: "open",
    priority: input.priority ?? "normal",
    subject: cleanedSubject.slice(0, 120),
    message: cleanedMessage.slice(0, 5000),
    page: input.page.trim().slice(0, 200),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    appVersion: FEEDBACK_APP_VERSION,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    adminNote: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getMyFeedback(user: AppUser) {
  if (!db || !isFirebaseConfigured) return [];

  // Keep this query index-free for beta testers. Combining ownerUid + orderBy can
  // require a composite Firestore index, which made users think their own feedback
  // disappeared even though admins could already see it.
  const feedbackQuery = query(
    collection(db, "feedback"),
    where("ownerUid", "==", user.uid),
  );
  const snapshot = await getDocs(feedbackQuery);
  return snapshot.docs
    .map((item) => normalizeFeedback(item.id, item.data()))
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export async function getRecentFeedbackForAdmin() {
  if (!db || !isFirebaseConfigured) return [];

  const feedbackQuery = query(collection(db, "feedback"), orderBy("createdAtIso", "desc"));
  const snapshot = await getDocs(feedbackQuery);
  return snapshot.docs.map((item) => normalizeFeedback(item.id, item.data())).slice(0, 100);
}

export async function updateFeedbackStatusForAdmin(
  feedbackId: string,
  status: FeedbackStatus,
  adminNote: string,
) {
  if (!db || !isFirebaseConfigured) throw new Error("firebase-not-configured");

  await updateDoc(doc(db, "feedback", feedbackId), {
    status,
    adminNote: adminNote.trim().slice(0, 2000),
    updatedAtIso: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}

export async function getFeedbackById(feedbackId: string) {
  if (!db || !isFirebaseConfigured) return null;
  const snapshot = await getDoc(doc(db, "feedback", feedbackId));
  return snapshot.exists() ? normalizeFeedback(snapshot.id, snapshot.data()) : null;
}

export async function createDeleteRequest(user: AppUser, reason: string) {
  return submitGradeGlowFeedback(user, {
    type: "delete_request",
    priority: "high",
    subject: "Datenlöschung angefragt",
    message: reason || "Der Nutzer bittet um Unterstützung bei Datenlöschung oder Account-Löschung.",
    page: typeof window !== "undefined" ? window.location.pathname : "/settings",
  });
}

export async function saveAdminAnnouncement(title: string, message: string) {
  if (!db || !isFirebaseConfigured) throw new Error("firebase-not-configured");
  await setDoc(
    doc(db, "appConfig", "beta"),
    {
      title: title.trim().slice(0, 120),
      message: message.trim().slice(0, 2000),
      updatedAtIso: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
