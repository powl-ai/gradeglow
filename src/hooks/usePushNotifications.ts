"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import {
  deleteCurrentFcmToken,
  getNotificationPermission,
  isPushEnvironmentSupported,
  listenForForegroundMessages,
  requestAndSaveFcmToken,
  type PushRegistrationResult,
} from "../lib/firebaseMessaging";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  migrateNotificationSettings,
} from "../lib/notificationSettings";
import type {
  AppUser,
  GradeGlowNotification,
  GradeGlowNotificationSettings,
  NotificationKind,
} from "../types";

export type PushSetupStatus =
  | "checking"
  | "ready"
  | "unsupported"
  | "not-configured"
  | "missing-vapid-key"
  | "permission-denied"
  | "active"
  | "error";

const NOTIFICATION_SETTINGS_COLLECTION = "notificationSettings";
const NOTIFICATIONS_COLLECTION = "notifications";
const SETTINGS_DOCUMENT_ID = "main";

const getStringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const asNotificationKind = (value: unknown): NotificationKind => {
  if (
    value === "friend_activity" ||
    value === "study_reminder" ||
    value === "exam_reminder" ||
    value === "streak_reminder" ||
    value === "system"
  ) {
    return value;
  }

  return "system";
};

const migrateNotification = (id: string, rawValue: unknown): GradeGlowNotification | null => {
  if (typeof rawValue !== "object" || rawValue === null) return null;
  const record = rawValue as Record<string, unknown>;
  const title = getStringValue(record.title);
  const body = getStringValue(record.body);
  const createdAtIso = getStringValue(record.createdAtIso);

  if (!title || !createdAtIso) return null;

  return {
    id,
    kind: asNotificationKind(record.kind),
    title,
    body,
    url: getStringValue(record.url) || "/",
    actorUid: getStringValue(record.actorUid),
    actorName: getStringValue(record.actorName),
    createdAtIso,
    readAtIso: getStringValue(record.readAtIso),
    sourceEventId: getStringValue(record.sourceEventId),
  };
};

const getRegistrationMessage = (result: PushRegistrationResult) => {
  if (result.ok) return "Push-Benachrichtigungen sind aktiv.";

  switch (result.reason) {
    case "unsupported":
      return "Dieser Browser unterstützt Web-Push hier nicht. In-App-Hinweise bleiben aktiv.";
    case "not-configured":
      return "Firebase ist noch nicht vollständig konfiguriert.";
    case "missing-vapid-key":
      return "Der Web-Push-Schlüssel fehlt noch. Trage NEXT_PUBLIC_FIREBASE_VAPID_KEY ein.";
    case "permission-denied":
      return "Benachrichtigungen wurden im Browser blockiert. Erlaube sie in den Website-Einstellungen.";
    case "token-error":
      return "Push-Token konnte nicht erstellt werden. Prüfe Firebase Messaging und HTTPS.";
  }
};

export function usePushNotifications(user: AppUser) {
  const canUseCloud = user.provider === "firebase" && isFirebaseConfigured && Boolean(db);
  const settingsRef = useMemo(() => {
    if (!canUseCloud || !db) return null;
    return doc(db, "users", user.uid, NOTIFICATION_SETTINGS_COLLECTION, SETTINGS_DOCUMENT_ID);
  }, [canUseCloud, user.uid]);

  const [settings, setSettings] = useState<GradeGlowNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notifications, setNotifications] = useState<GradeGlowNotification[]>([]);
  const [setupStatus, setSetupStatus] = useState<PushSetupStatus>("checking");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [message, setMessage] = useState("");
  const [foregroundMessage, setForegroundMessage] = useState<GradeGlowNotification | null>(null);

  useEffect(() => {
    let didCancel = false;

    const check = async () => {
      setPermission(getNotificationPermission());

      if (!canUseCloud) {
        setSetupStatus("not-configured");
        return;
      }

      const supported = await isPushEnvironmentSupported();
      if (didCancel) return;

      if (!supported) {
        setSetupStatus("unsupported");
        return;
      }

      const nextPermission = getNotificationPermission();
      setPermission(nextPermission);
      setSetupStatus(nextPermission === "granted" && settings.pushNotificationsEnabled ? "active" : "ready");
    };

    void check();

    return () => {
      didCancel = true;
    };
  }, [canUseCloud, settings.pushNotificationsEnabled]);

  useEffect(() => {
    if (!settingsRef) {
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        const nextSettings = snapshot.exists()
          ? migrateNotificationSettings(snapshot.data())
          : DEFAULT_NOTIFICATION_SETTINGS;
        setSettings(nextSettings);
      },
      () => {
        setMessage("Benachrichtigungseinstellungen konnten nicht geladen werden.");
      },
    );

    return () => unsubscribe();
  }, [settingsRef]);

  useEffect(() => {
    if (!canUseCloud || !db) {
      setNotifications([]);
      return undefined;
    }

    const notificationsRef = collection(db, "users", user.uid, NOTIFICATIONS_COLLECTION);
    const unsubscribe = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const nextNotifications = snapshot.docs
          .map((notificationDoc) => migrateNotification(notificationDoc.id, notificationDoc.data()))
          .filter((item): item is GradeGlowNotification => Boolean(item))
          .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
          .slice(0, 25);
        setNotifications(nextNotifications);
      },
      () => {
        setMessage("Benachrichtigungshistorie konnte nicht geladen werden.");
      },
    );

    return () => unsubscribe();
  }, [canUseCloud, user.uid]);

  useEffect(() => {
    if (!foregroundMessage) return undefined;
    const timeout = window.setTimeout(() => setForegroundMessage(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [foregroundMessage]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let didCancel = false;

    const attachListener = async () => {
      if (!canUseCloud || !settings.pushNotificationsEnabled) return;

      unsubscribe = await listenForForegroundMessages((payload) => {
        if (didCancel) return;
        const data = payload.data ?? {};
        setForegroundMessage({
          id: data.notificationId || crypto.randomUUID(),
          kind: asNotificationKind(data.kind),
          title: data.title || payload.notification?.title || "GradeGlow",
          body: data.body || payload.notification?.body || "Neue Benachrichtigung",
          url: data.url || "/",
          actorUid: data.actorUid || "",
          actorName: data.actorName || "",
          createdAtIso: data.createdAtIso || new Date().toISOString(),
          readAtIso: "",
          sourceEventId: data.sourceEventId || "",
        });
      });
    };

    void attachListener();

    return () => {
      didCancel = true;
      unsubscribe?.();
    };
  }, [canUseCloud, settings.pushNotificationsEnabled]);

  const updateSettings = useCallback(
    async (partialSettings: Partial<GradeGlowNotificationSettings>) => {
      if (!settingsRef) return;

      const nextSettings: GradeGlowNotificationSettings = {
        ...settings,
        ...partialSettings,
        updatedAtIso: new Date().toISOString(),
      };

      setSettings(nextSettings);
      await setDoc(
        settingsRef,
        {
          ...nextSettings,
          ownerUid: user.uid,
          updatedAt: serverTimestamp(),
          version: 1,
        },
        { merge: true },
      );
    },
    [settings, settingsRef, user.uid],
  );

  const enablePush = useCallback(async () => {
    setMessage("");
    const result = await requestAndSaveFcmToken(user.uid);
    setMessage(getRegistrationMessage(result));

    if (result.ok) {
      setPermission("granted");
      setSetupStatus("active");
      await updateSettings({ pushNotificationsEnabled: true, friendActivityPushEnabled: true });
      return true;
    }

    if (result.reason === "missing-vapid-key") setSetupStatus("missing-vapid-key");
    else if (result.reason === "permission-denied") setSetupStatus("permission-denied");
    else if (result.reason === "unsupported") setSetupStatus("unsupported");
    else setSetupStatus("error");

    return false;
  }, [updateSettings, user.uid]);

  const disablePush = useCallback(async () => {
    setMessage("");
    await updateSettings({ pushNotificationsEnabled: false });
    await deleteCurrentFcmToken(user.uid);
    setSetupStatus("ready");
    setMessage("Push-Benachrichtigungen für dieses Gerät wurden deaktiviert.");
  }, [updateSettings, user.uid]);

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      if (!canUseCloud || !db) return;
      await updateDoc(doc(db, "users", user.uid, NOTIFICATIONS_COLLECTION, notificationId), {
        readAtIso: new Date().toISOString(),
        readAt: serverTimestamp(),
      }).catch(() => undefined);
    },
    [canUseCloud, user.uid],
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!canUseCloud || !db) return;
      await deleteDoc(doc(db, "users", user.uid, NOTIFICATIONS_COLLECTION, notificationId)).catch(() => undefined);
    },
    [canUseCloud, user.uid],
  );

  return {
    canUseCloud,
    settings,
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAtIso).length,
    setupStatus,
    permission,
    message,
    foregroundMessage,
    clearForegroundMessage: () => setForegroundMessage(null),
    enablePush,
    disablePush,
    updateSettings,
    markNotificationAsRead,
    deleteNotification,
  };
}
