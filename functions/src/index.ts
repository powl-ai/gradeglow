import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

const FRIENDS_COLLECTION_GROUP = "friends";
const NOTIFICATION_SETTINGS_COLLECTION = "notificationSettings";
const NOTIFICATION_TOKENS_COLLECTION = "notificationTokens";
const NOTIFICATIONS_COLLECTION = "notifications";
const SETTINGS_DOCUMENT_ID = "main";
const REGION = "europe-west3";
const MAX_MULTICAST_TOKENS = 500;

const invalidTokenErrorCodes = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

type StudyActivityStatus = "started" | "completed";

type StudyActivity = {
  uid: string;
  displayName: string;
  status: StudyActivityStatus;
  title: string;
  sessionId: string | null;
  durationMinutes: number;
  updatedAtIso: string;
};

type NotificationSettings = {
  pushNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  friendActivityPushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

type TokenRecord = {
  token: string;
};

const getStringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getNumberValue = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

const migrateActivity = (rawValue: FirebaseFirestore.DocumentData | undefined): StudyActivity | null => {
  if (!rawValue) return null;
  const status = rawValue.status === "started" || rawValue.status === "completed" ? rawValue.status : null;
  const uid = getStringValue(rawValue.uid);
  const updatedAtIso = getStringValue(rawValue.updatedAtIso);

  if (!status || !uid || !updatedAtIso) return null;

  return {
    uid,
    displayName: getStringValue(rawValue.displayName) || "Ein Freund",
    status,
    title: getStringValue(rawValue.title) || "Lernsession",
    sessionId: getStringValue(rawValue.sessionId) || null,
    durationMinutes: getNumberValue(rawValue.durationMinutes),
    updatedAtIso,
  };
};

const migrateSettings = (rawValue: FirebaseFirestore.DocumentData | undefined): NotificationSettings => ({
  pushNotificationsEnabled: rawValue?.pushNotificationsEnabled === true,
  inAppNotificationsEnabled: rawValue?.inAppNotificationsEnabled !== false,
  friendActivityPushEnabled: rawValue?.friendActivityPushEnabled !== false,
  quietHoursEnabled: rawValue?.quietHoursEnabled === true,
  quietHoursStart: /^([01]\d|2[0-3]):[0-5]\d$/.test(getStringValue(rawValue?.quietHoursStart))
    ? getStringValue(rawValue?.quietHoursStart)
    : "22:00",
  quietHoursEnd: /^([01]\d|2[0-3]):[0-5]\d$/.test(getStringValue(rawValue?.quietHoursEnd))
    ? getStringValue(rawValue?.quietHoursEnd)
    : "08:00",
});

const getBerlinMinutes = () => {
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
};

const parseTimeToMinutes = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

const isInQuietHours = (settings: NotificationSettings) => {
  if (!settings.quietHoursEnabled) return false;

  const now = getBerlinMinutes();
  const start = parseTimeToMinutes(settings.quietHoursStart);
  const end = parseTimeToMinutes(settings.quietHoursEnd);

  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
};

const buildNotificationText = (activity: StudyActivity) => {
  const title = activity.status === "started"
    ? `${activity.displayName} lernt gerade`
    : `${activity.displayName} hat gelernt`;
  const body = activity.status === "completed" && activity.durationMinutes > 0
    ? `${activity.durationMinutes} min · ${activity.title}`
    : activity.title;

  return { title, body };
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const writeNotificationDocument = async (
  recipientUid: string,
  activity: StudyActivity,
  notificationId: string,
  title: string,
  body: string,
) => {
  await db
    .collection("users")
    .doc(recipientUid)
    .collection(NOTIFICATIONS_COLLECTION)
    .doc(notificationId)
    .set(
      {
        kind: "friend_activity",
        title,
        body,
        url: "/friends",
        actorUid: activity.uid,
        actorName: activity.displayName,
        createdAtIso: new Date().toISOString(),
        readAtIso: "",
        sourceEventId: activity.updatedAtIso,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        version: 1,
      },
      { merge: true },
    );
};

const deleteInvalidTokens = async (
  recipientUid: string,
  tokenDocs: FirebaseFirestore.QueryDocumentSnapshot[],
  invalidTokenIndexes: number[],
) => {
  if (invalidTokenIndexes.length === 0) return;

  const batch = db.batch();
  invalidTokenIndexes.forEach((index) => {
    const tokenDoc = tokenDocs[index];
    if (tokenDoc) {
      batch.delete(
        db
          .collection("users")
          .doc(recipientUid)
          .collection(NOTIFICATION_TOKENS_COLLECTION)
          .doc(tokenDoc.id),
      );
    }
  });
  await batch.commit();
};

const sendPushToRecipient = async (
  recipientUid: string,
  activity: StudyActivity,
  notificationId: string,
  title: string,
  body: string,
) => {
  const [settingsSnapshot, tokenSnapshot] = await Promise.all([
    db
      .collection("users")
      .doc(recipientUid)
      .collection(NOTIFICATION_SETTINGS_COLLECTION)
      .doc(SETTINGS_DOCUMENT_ID)
      .get(),
    db
      .collection("users")
      .doc(recipientUid)
      .collection(NOTIFICATION_TOKENS_COLLECTION)
      .get(),
  ]);

  const settings = migrateSettings(settingsSnapshot.data());

  if (settings.inAppNotificationsEnabled) {
    await writeNotificationDocument(recipientUid, activity, notificationId, title, body);
  }

  if (
    !settings.pushNotificationsEnabled ||
    !settings.friendActivityPushEnabled ||
    isInQuietHours(settings) ||
    tokenSnapshot.empty
  ) {
    return;
  }

  const tokenDocs = tokenSnapshot.docs;
  const tokens = tokenDocs
    .map((tokenDoc) => (tokenDoc.data() as TokenRecord).token)
    .filter((token): token is string => typeof token === "string" && token.trim().length > 0);

  if (tokens.length === 0) return;

  const baseMessage = {
    data: {
      kind: "friend_activity",
      title,
      body,
      url: "/friends",
      tag: `gradeglow-friend-${activity.uid}`,
      notificationId,
      actorUid: activity.uid,
      actorName: activity.displayName,
      sourceEventId: activity.updatedAtIso,
      createdAtIso: new Date().toISOString(),
    },
    webpush: {
      headers: {
        Urgency: "normal",
      },
    },
  } satisfies Omit<MulticastMessage, "tokens">;

  for (const tokenChunk of chunk(tokens, MAX_MULTICAST_TOKENS)) {
    const response = await messaging.sendEachForMulticast({
      ...baseMessage,
      tokens: tokenChunk,
    });

    const invalidIndexes = response.responses
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.error && invalidTokenErrorCodes.has(result.error.code))
      .map(({ index }) => index);

    await deleteInvalidTokens(recipientUid, tokenDocs, invalidIndexes);
  }
};

export const sendFriendActivityPush = onDocumentWritten(
  {
    document: "studyActivityEvents/{profileId}",
    region: REGION,
    maxInstances: 10,
  },
  async (event) => {
    const beforeActivity = migrateActivity(event.data?.before.data());
    const activity = migrateActivity(event.data?.after.data());

    if (!activity) return;
    if (beforeActivity?.updatedAtIso === activity.updatedAtIso) return;

    const friendLinks = await db
      .collectionGroup(FRIENDS_COLLECTION_GROUP)
      .where("uid", "==", activity.uid)
      .get();

    if (friendLinks.empty) return;

    const { title, body } = buildNotificationText(activity);
    const notificationId = `${activity.uid}_${activity.updatedAtIso.replace(/[^a-zA-Z0-9]/g, "")}`.slice(0, 180);
    const recipientUids = new Set(
      friendLinks.docs
        .map((friendDoc) => friendDoc.ref.parent.parent?.id ?? "")
        .filter((uid) => uid && uid !== activity.uid),
    );

    await Promise.all(
      [...recipientUids].map((recipientUid) =>
        sendPushToRecipient(recipientUid, activity, notificationId, title, body),
      ),
    );
  },
);
