"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { validPageThemeIds } from "../lib/gradeglowThemes";
import type { AccentColor, AppUser, GradeGlowProfile, PageThemeId, StartMode, ThemeMode } from "../types";

export type ProfileSyncStatus =
  | "local"
  | "cloud-loading"
  | "cloud-ready"
  | "cloud-saving"
  | "cloud-saved"
  | "cloud-error";

const PROFILE_STORAGE_KEY = "gradeglow-profile-v1";
const PROFILE_BACKUP_STORAGE_KEY = "gradeglow-profile-backups-v1";
export const DEFAULT_TARGET_ECTS = 180;

const validStartModes: StartMode[] = ["manual", "stupo", "template", "demo"];
const validThemeModes: ThemeMode[] = ["system", "light", "dark"];
const validAccentColors: AccentColor[] = ["violet", "pink", "blue", "emerald", "amber", "cyan", "rose"];

const parseTargetEcts = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return DEFAULT_TARGET_ECTS;
};

const parseSemester = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return Math.max(1, Math.round(parsed));
  }

  return 1;
};

const getStringValue = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const getStartMode = (value: unknown): StartMode =>
  validStartModes.includes(value as StartMode) ? (value as StartMode) : "manual";

const getThemeMode = (value: unknown): ThemeMode =>
  validThemeModes.includes(value as ThemeMode) ? (value as ThemeMode) : "system";

const getAccentColor = (value: unknown): AccentColor =>
  validAccentColors.includes(value as AccentColor) ? (value as AccentColor) : "violet";

const getPageThemeId = (value: unknown): PageThemeId =>
  validPageThemeIds.includes(value as PageThemeId) ? (value as PageThemeId) : "default";

const getAvatarDataUrl = (value: unknown) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.startsWith("data:image/") ? trimmed : "";
};

const getShareFlag = (value: unknown) => value !== false;
const getBooleanValue = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const getStringArrayValue = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];

const getPositiveNumberValue = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
  }
  return fallback;
};

const getReminderTime = (value: unknown) => {
  if (typeof value !== "string") return "19:00";
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed) ? trimmed : "19:00";
};

const isMeaningfulProfile = (profile: GradeGlowProfile) =>
  Boolean(
    profile.university ||
      profile.degreeProgram ||
      profile.avatarDataUrl ||
      profile.studySharingEnabled ||
      profile.activeAvatarFrameId ||
      profile.activeProfileBannerId ||
      profile.activePageThemeId !== "default" ||
      profile.accentColor !== "violet" ||
      profile.glowPoints > 0 ||
      profile.purchasedCosmeticIds.length > 0
  );

const keepRecentBackups = (value: unknown): GradeGlowProfile[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is GradeGlowProfile => typeof item === "object" && item !== null)
    .slice(0, 6);
};

const migrateProfile = (
  rawProfile: unknown,
  fallbackDisplayName: string
): GradeGlowProfile => {
  const profileObject =
    typeof rawProfile === "object" && rawProfile !== null
      ? (rawProfile as Record<string, unknown>)
      : {};

  return {
    displayName: getStringValue(profileObject.displayName) || fallbackDisplayName,
    university: getStringValue(profileObject.university),
    degreeProgram: getStringValue(profileObject.degreeProgram),
    degreeType: getStringValue(profileObject.degreeType) || "Bachelor",
    currentSemester: parseSemester(profileObject.currentSemester),
    targetEcts: parseTargetEcts(profileObject.targetEcts),
    preferredStartMode: getStartMode(profileObject.preferredStartMode),
    onboardingCompleted: profileObject.onboardingCompleted === true,
    avatarDataUrl: getAvatarDataUrl(profileObject.avatarDataUrl),
    studySharingEnabled: profileObject.studySharingEnabled === true,
    shareStudyTime: getShareFlag(profileObject.shareStudyTime),
    shareStudySubjects: getShareFlag(profileObject.shareStudySubjects),
    shareStudyStreak: getShareFlag(profileObject.shareStudyStreak),
    glowPoints: getPositiveNumberValue(profileObject.glowPoints),
    dailyLoginStreak: getPositiveNumberValue(profileObject.dailyLoginStreak),
    dailyLoginLastClaimDateKey: getStringValue(profileObject.dailyLoginLastClaimDateKey),
    studyReminderNotificationsEnabled: getBooleanValue(profileObject.studyReminderNotificationsEnabled),
    friendActivityNotificationsEnabled: getBooleanValue(profileObject.friendActivityNotificationsEnabled),
    studyReminderTime: getReminderTime(profileObject.studyReminderTime),
    lastStudyDateKey: getStringValue(profileObject.lastStudyDateKey),
    lastStudyCompletedAtIso: getStringValue(profileObject.lastStudyCompletedAtIso),
    currentStudyStreakDays: getPositiveNumberValue(profileObject.currentStudyStreakDays),
    maxStudyStreakDays: getPositiveNumberValue(profileObject.maxStudyStreakDays),
    purchasedCosmeticIds: getStringArrayValue(profileObject.purchasedCosmeticIds),
    rewardedStudySessionIds: getStringArrayValue(profileObject.rewardedStudySessionIds),
    totalStudySessionRewards: getPositiveNumberValue(profileObject.totalStudySessionRewards),
    activeAvatarFrameId: getStringValue(profileObject.activeAvatarFrameId),
    activeProfileBannerId: getStringValue(profileObject.activeProfileBannerId),
    activePageThemeId: getPageThemeId(profileObject.activePageThemeId),
    themeMode: getThemeMode(profileObject.themeMode),
    accentColor: getAccentColor(profileObject.accentColor),
  };
};

export function useGradeGlowProfile(user: AppUser) {
  const fallbackDisplayName = user.displayName?.trim() ?? "";
  const storageKey = `${PROFILE_STORAGE_KEY}-${user.uid}`;
  const backupStorageKey = `${PROFILE_BACKUP_STORAGE_KEY}-${user.uid}`;
  const shouldUseCloudSync = user.provider === "firebase" && isFirebaseConfigured && Boolean(db);

  const defaultProfile = useMemo<GradeGlowProfile>(
    () => ({
      displayName: fallbackDisplayName,
      university: "",
      degreeProgram: "",
      degreeType: "Bachelor",
      currentSemester: 1,
      targetEcts: DEFAULT_TARGET_ECTS,
      preferredStartMode: "manual",
      onboardingCompleted: false,
      avatarDataUrl: "",
      studySharingEnabled: false,
      shareStudyTime: true,
      shareStudySubjects: true,
      shareStudyStreak: true,
      glowPoints: 0,
      dailyLoginStreak: 0,
      dailyLoginLastClaimDateKey: "",
      studyReminderNotificationsEnabled: false,
      friendActivityNotificationsEnabled: false,
      studyReminderTime: "19:00",
      lastStudyDateKey: "",
      lastStudyCompletedAtIso: "",
      currentStudyStreakDays: 0,
      maxStudyStreakDays: 0,
      purchasedCosmeticIds: [],
      rewardedStudySessionIds: [],
      totalStudySessionRewards: 0,
      activeAvatarFrameId: "",
      activeProfileBannerId: "",
      activePageThemeId: "default",
      themeMode: "system",
      accentColor: "violet",
    }),
    [fallbackDisplayName]
  );

  const [profile, setProfile] = useState<GradeGlowProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastStableProfileRef = useRef<GradeGlowProfile>(defaultProfile);
  const [syncStatus, setSyncStatus] = useState<ProfileSyncStatus>("local");
  const [syncMessage, setSyncMessage] = useState("Profil lokal gespeichert");

  const readLocalProfile = useCallback(() => {
    try {
      const savedProfile = localStorage.getItem(storageKey);
      if (!savedProfile) return defaultProfile;

      return migrateProfile(JSON.parse(savedProfile), fallbackDisplayName);
    } catch {
      localStorage.removeItem(storageKey);
      return defaultProfile;
    }
  }, [defaultProfile, fallbackDisplayName, storageKey]);

  const writeLocalProfile = useCallback(
    (nextProfile: GradeGlowProfile) => {
      localStorage.setItem(storageKey, JSON.stringify(nextProfile));
    },
    [storageKey]
  );

  const writeProfileBackup = useCallback(
    (currentProfile: GradeGlowProfile) => {
      if (!isMeaningfulProfile(currentProfile)) return;

      try {
        const savedBackups = localStorage.getItem(backupStorageKey);
        const parsedBackups = savedBackups ? keepRecentBackups(JSON.parse(savedBackups)) : [];
        const nextBackups = [currentProfile, ...parsedBackups]
          .filter((item, index, array) =>
            index === array.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(item))
          )
          .slice(0, 6);

        localStorage.setItem(backupStorageKey, JSON.stringify(nextBackups));
      } catch {
        localStorage.removeItem(backupStorageKey);
      }
    },
    [backupStorageKey]
  );

  useEffect(() => {
    setIsLoaded(false);

    if (!shouldUseCloudSync || !db) {
      const localProfile = readLocalProfile();
      lastStableProfileRef.current = localProfile;
      setProfile(localProfile);
      setSyncStatus("local");
      setSyncMessage("Profil lokal gespeichert");
      setIsLoaded(true);
      return;
    }

    setSyncStatus("cloud-loading");
    setSyncMessage("Profil wird geladen…");

    const settingsRef = doc(db, "users", user.uid, "gradeglow", "settings");

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudProfile = migrateProfile(snapshot.data(), fallbackDisplayName);
          lastStableProfileRef.current = cloudProfile;
          setProfile(cloudProfile);
          writeLocalProfile(cloudProfile);
          setSyncStatus("cloud-saved");
          setSyncMessage("Profil gespeichert");
          setIsLoaded(true);
          return;
        }

        const localProfile = readLocalProfile();
        lastStableProfileRef.current = localProfile;
        setProfile(localProfile);
        setSyncStatus("cloud-ready");
        setSyncMessage("Profil bereit");
        setIsLoaded(true);
      },
      () => {
        const localProfile = readLocalProfile();
        lastStableProfileRef.current = localProfile;
        setProfile(localProfile);
        setSyncStatus("cloud-error");
        setSyncMessage("Profil-Cloud nicht erreichbar · lokales Backup aktiv");
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [
    fallbackDisplayName,
    readLocalProfile,
    shouldUseCloudSync,
    user.uid,
    writeLocalProfile,
  ]);

  const saveProfile = useCallback(
    async (nextProfile: GradeGlowProfile) => {
      if (!isLoaded) {
        setSyncStatus("cloud-loading");
        setSyncMessage("Profil wird noch geladen · Speichern blockiert");
        throw new Error("gradeglow-profile-not-loaded");
      }

      const normalizedProfile = migrateProfile(nextProfile, fallbackDisplayName);
      writeProfileBackup(lastStableProfileRef.current);
      lastStableProfileRef.current = normalizedProfile;

      setProfile(normalizedProfile);
      writeLocalProfile(normalizedProfile);

      if (!shouldUseCloudSync || !db) {
        setSyncStatus("local");
        setSyncMessage("Profil lokal gespeichert");
        return;
      }

      setSyncStatus("cloud-saving");
      setSyncMessage("Profil wird gespeichert…");

      try {
        const settingsRef = doc(db, "users", user.uid, "gradeglow", "settings");

        await setDoc(
          settingsRef,
          {
            ...normalizedProfile,
            ownerUid: user.uid,
            updatedAt: serverTimestamp(),
            version: 5,
          },
          { merge: true }
        );

        setSyncStatus("cloud-saved");
        setSyncMessage("Profil gespeichert");
      } catch {
        setSyncStatus("cloud-error");
        setSyncMessage("Profil-Speichern fehlgeschlagen · lokales Backup aktiv");
      }
    },
    [fallbackDisplayName, isLoaded, shouldUseCloudSync, user.uid, writeLocalProfile, writeProfileBackup]
  );

  return {
    profile,
    isProfileLoaded: isLoaded,
    profileSyncStatus: syncStatus,
    profileSyncMessage: syncMessage,
    saveProfile,
  };
}
