import type { GradeGlowNotificationSettings } from "../types";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DEFAULT_NOTIFICATION_SETTINGS: GradeGlowNotificationSettings = {
  pushNotificationsEnabled: false,
  inAppNotificationsEnabled: true,
  friendActivityPushEnabled: true,
  studyReminderPushEnabled: false,
  examReminderPushEnabled: true,
  streakReminderPushEnabled: false,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  updatedAtIso: "",
};

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const asTime = (value: unknown, fallback: string) =>
  typeof value === "string" && TIME_PATTERN.test(value) ? value : fallback;

export const migrateNotificationSettings = (rawValue: unknown): GradeGlowNotificationSettings => {
  const record =
    typeof rawValue === "object" && rawValue !== null
      ? (rawValue as Record<string, unknown>)
      : {};

  return {
    pushNotificationsEnabled: asBoolean(
      record.pushNotificationsEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.pushNotificationsEnabled,
    ),
    inAppNotificationsEnabled: asBoolean(
      record.inAppNotificationsEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.inAppNotificationsEnabled,
    ),
    friendActivityPushEnabled: asBoolean(
      record.friendActivityPushEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.friendActivityPushEnabled,
    ),
    studyReminderPushEnabled: asBoolean(
      record.studyReminderPushEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.studyReminderPushEnabled,
    ),
    examReminderPushEnabled: asBoolean(
      record.examReminderPushEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.examReminderPushEnabled,
    ),
    streakReminderPushEnabled: asBoolean(
      record.streakReminderPushEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.streakReminderPushEnabled,
    ),
    quietHoursEnabled: asBoolean(
      record.quietHoursEnabled,
      DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnabled,
    ),
    quietHoursStart: asTime(record.quietHoursStart, DEFAULT_NOTIFICATION_SETTINGS.quietHoursStart),
    quietHoursEnd: asTime(record.quietHoursEnd, DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnd),
    updatedAtIso: typeof record.updatedAtIso === "string" ? record.updatedAtIso : "",
  };
};
