import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { db, firebaseApp, isFirebaseConfigured } from "./firebase";

const FCM_SERVICE_WORKER_URL = "/firebase-messaging-sw.js";
const FCM_SERVICE_WORKER_SCOPE = "/firebase-cloud-messaging-push-scope";

const getVapidKey = () => process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() ?? "";

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: "unsupported" | "not-configured" | "missing-vapid-key" | "permission-denied" | "token-error" };

export const isPushEnvironmentSupported = async () => {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  return isSupported().catch(() => false);
};

export const getNotificationPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  return Notification.permission;
};

export const registerFcmServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  const existingRegistration = await navigator.serviceWorker.getRegistration(FCM_SERVICE_WORKER_SCOPE);
  if (existingRegistration) {
    existingRegistration.update().catch(() => undefined);
    return existingRegistration;
  }

  return navigator.serviceWorker.register(FCM_SERVICE_WORKER_URL, {
    scope: FCM_SERVICE_WORKER_SCOPE,
  });
};

export const getCurrentFcmToken = async () => {
  if (!isFirebaseConfigured || !firebaseApp) return null;
  if (!(await isPushEnvironmentSupported())) return null;

  const vapidKey = getVapidKey();
  if (!vapidKey) return null;

  const serviceWorkerRegistration = await registerFcmServiceWorker();
  if (!serviceWorkerRegistration) return null;

  const messaging = getMessaging(firebaseApp);
  return getToken(messaging, { vapidKey, serviceWorkerRegistration });
};

export const createTokenDocumentId = (token: string) =>
  token.replace(/\//g, "_").replace(/\s/g, "_").slice(0, 1400);

export const saveFcmToken = async (uid: string, token: string) => {
  if (!db) return;

  const tokenRef = doc(db, "users", uid, "notificationTokens", createTokenDocumentId(token));
  await setDoc(
    tokenRef,
    {
      uid,
      token,
      permission: getNotificationPermission(),
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      updatedAtIso: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
    },
    { merge: true },
  );
};

export const requestAndSaveFcmToken = async (uid: string): Promise<PushRegistrationResult> => {
  if (!isFirebaseConfigured || !firebaseApp || !db) return { ok: false, reason: "not-configured" };
  if (!(await isPushEnvironmentSupported())) return { ok: false, reason: "unsupported" };

  const vapidKey = getVapidKey();
  if (!vapidKey) return { ok: false, reason: "missing-vapid-key" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "permission-denied" };

  try {
    const serviceWorkerRegistration = await registerFcmServiceWorker();
    if (!serviceWorkerRegistration) return { ok: false, reason: "unsupported" };

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration });
    if (!token) return { ok: false, reason: "token-error" };

    await saveFcmToken(uid, token);
    return { ok: true, token };
  } catch {
    return { ok: false, reason: "token-error" };
  }
};

export const deleteCurrentFcmToken = async (uid: string) => {
  if (!isFirebaseConfigured || !firebaseApp || !db) return;
  if (!(await isPushEnvironmentSupported())) return;

  const token = await getCurrentFcmToken().catch(() => null);
  if (!token) return;

  const messaging = getMessaging(firebaseApp);
  await deleteToken(messaging).catch(() => undefined);
  await deleteDoc(doc(db, "users", uid, "notificationTokens", createTokenDocumentId(token))).catch(() => undefined);
};

export const listenForForegroundMessages = async (
  callback: (payload: MessagePayload) => void,
) => {
  if (!isFirebaseConfigured || !firebaseApp) return () => undefined;
  if (!(await isPushEnvironmentSupported())) return () => undefined;

  const messaging = getMessaging(firebaseApp);
  return onMessage(messaging, callback);
};
