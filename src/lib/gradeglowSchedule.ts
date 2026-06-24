import type { UniScheduleItem } from "../types";

const LOCAL_SCHEDULE_KEY_PREFIX = "gradeglow-schedule-v1";

const validWeekdays = [1, 2, 3, 4, 5, 6, 0];

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asWeekday = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return validWeekdays.includes(parsed) ? parsed : 1;
};

const asBoolean = (value: unknown) => value === true;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizeScheduleTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const colonMatch = trimmed.match(/^(\d{1,2})[:.](\d{2})$/);
  const compactMatch = trimmed.match(/^(\d{3,4})$/);
  let hours = 0;
  let minutes = 0;

  if (colonMatch) {
    hours = Number(colonMatch[1]);
    minutes = Number(colonMatch[2]);
  } else if (compactMatch) {
    const compact = compactMatch[1].padStart(4, "0");
    hours = Number(compact.slice(0, 2));
    minutes = Number(compact.slice(2, 4));
  } else {
    return "";
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const compareScheduleTimes = (left: string, right: string) => {
  const leftTime = normalizeScheduleTime(left) || "99:99";
  const rightTime = normalizeScheduleTime(right) || "99:99";
  return leftTime.localeCompare(rightTime);
};

export const getUserScheduleStorageKey = (uid: string) =>
  `${LOCAL_SCHEDULE_KEY_PREFIX}-${uid}`;

export const sortScheduleItems = (items: UniScheduleItem[]) =>
  [...items].sort((a, b) => {
    const dayOrder = (a.weekday || 0) - (b.weekday || 0);
    if (dayOrder !== 0) return dayOrder;
    const startDiff = compareScheduleTimes(a.startTime, b.startTime);
    if (startDiff !== 0) return startDiff;
    return a.title.localeCompare(b.title);
  });

export const migrateScheduleItems = (rawItems: unknown): UniScheduleItem[] => {
  if (!Array.isArray(rawItems)) return [];

  return sortScheduleItems(
    rawItems
      .map((rawItem): UniScheduleItem | null => {
        if (typeof rawItem !== "object" || rawItem === null) return null;
        const record = rawItem as Record<string, unknown>;
        const title = asString(record.title).trim();
        if (!title) return null;

        return {
          id: asString(record.id, createId()),
          title,
          moduleId: typeof record.moduleId === "string" && record.moduleId ? record.moduleId : null,
          moduleName: asString(record.moduleName).trim(),
          weekday: asWeekday(record.weekday),
          startTime: normalizeScheduleTime(asString(record.startTime)) || asString(record.startTime).trim(),
          endTime: normalizeScheduleTime(asString(record.endTime)) || asString(record.endTime).trim(),
          location: asString(record.location).trim(),
          notes: asString(record.notes).trim(),
          color: asString(record.color, "violet").trim() || "violet",
          isHidden: asBoolean(record.isHidden),
        } satisfies UniScheduleItem;
      })
      .filter((item): item is UniScheduleItem => Boolean(item)),
  );
};

export const loadLocalScheduleItems = (storageKey: string): UniScheduleItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    return migrateScheduleItems(JSON.parse(saved));
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
};

export const saveLocalScheduleItems = (storageKey: string, items: UniScheduleItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(sortScheduleItems(items)));
};
