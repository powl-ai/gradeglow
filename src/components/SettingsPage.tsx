"use client";

import Link from "next/link";
import GradeGlowLogo from "./GradeGlowLogo";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { deleteUser, updateProfile } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../lib/firebase";
import { DEFAULT_TARGET_ECTS, useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { formatLimit, planDescriptions, planLabels } from "../lib/gradeglowAccess";
import { STREAK_BADGES, getAvatarFrameWrapperClassName, getProfileBannerClassName } from "../lib/glowRewards";
import { getUserModulesStorageKey } from "../lib/gradeglowModules";
import { getUserExamsStorageKey } from "../lib/gradeglowExams";
import type { AccentColor, AppUser, GradeGlowProfile, StartMode, ThemeMode } from "../types";

type SettingsPageProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
};

const ectsPresets = [180, 210, 120, 90];
const startModeLabels: Record<StartMode, string> = {
  manual: "Module manuell eintragen",
  stupo: "StuPo importieren",
  template: "Vorlage nutzen",
  demo: "Demo ansehen",
};

const themeModeLabels: { value: ThemeMode; label: string; description: string }[] = [
  { value: "system", label: "System", description: "folgt Gerät" },
  { value: "light", label: "Hell", description: "klassisch hell" },
  { value: "dark", label: "Dark", description: "dunkle App" },
];

const accentColorLabels: { value: AccentColor; label: string; dotClassName: string; unlockId?: string }[] = [
  { value: "violet", label: "Violett", dotClassName: "bg-violet-500" },
  { value: "pink", label: "Pink", dotClassName: "bg-pink-500" },
  { value: "blue", label: "Blau", dotClassName: "bg-blue-500" },
  { value: "emerald", label: "Emerald", dotClassName: "bg-emerald-500" },
  { value: "amber", label: "Amber", dotClassName: "bg-amber-500" },
  { value: "cyan", label: "Cyan", dotClassName: "bg-cyan-500", unlockId: "accent-cyan" },
  { value: "rose", label: "Rose", dotClassName: "bg-rose-500", unlockId: "accent-rose" },
];

const getThemeClassName = (themeMode: ThemeMode) => {
  if (themeMode === "dark") return "gg-theme-dark";
  if (themeMode === "light") return "gg-theme-light";
  return "gg-theme-system";
};

const getThemeStyle = (): CSSProperties => ({});

const LOCAL_USERS_KEY = "gradeglow-local-users-v1";
const LOCAL_SESSION_KEY = "gradeglow-local-session-v1";
const PROFILE_STORAGE_KEY = "gradeglow-profile-v1";
const MAX_AVATAR_SIZE = 320;

const parseNumber = (value: string) => Number(value.replace(",", "."));
const formatNumber = (value: number) => String(value).replace(".", ",");

const deleteCollectionDocs = async (path: string[]) => {
  if (!db) return;
  const snapshot = await getDocs(collection(db, path.join("/")));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
};

const removeLocalUser = (uid: string) => {
  try {
    const savedUsers = localStorage.getItem(LOCAL_USERS_KEY);
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      if (Array.isArray(parsed)) {
        localStorage.setItem(
          LOCAL_USERS_KEY,
          JSON.stringify(parsed.filter((storedUser) => storedUser?.uid !== uid)),
        );
      }
    }
  } catch {
    localStorage.removeItem(LOCAL_USERS_KEY);
  }
};

const resizeAvatarFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("unsupported-file"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-error"));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("image-error"));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, MAX_AVATAR_SIZE / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas-error"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });

const clearLocalGradeGlowData = (uid: string) => {
  localStorage.removeItem(getUserModulesStorageKey(uid));
  localStorage.removeItem(getUserExamsStorageKey(uid));
  localStorage.removeItem(`${PROFILE_STORAGE_KEY}-${uid}`);
  localStorage.removeItem(LOCAL_SESSION_KEY);
};

export default function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const {
    profile,
    isProfileLoaded,
    profileSyncMessage,
    profileSyncStatus,
    saveProfile,
  } = useGradeGlowProfile(user);
  const { entitlement, limits, accessSyncMessage } = useGradeGlowAccess(user);

  const [displayName, setDisplayName] = useState("");
  const [university, setUniversity] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [degreeType, setDegreeType] = useState("Bachelor");
  const [currentSemester, setCurrentSemester] = useState("1");
  const [targetEcts, setTargetEcts] = useState(String(DEFAULT_TARGET_ECTS));
  const [preferredStartMode, setPreferredStartMode] = useState<StartMode>("manual");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [accentColor, setAccentColor] = useState<AccentColor>("violet");
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [dangerMessage, setDangerMessage] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isRestartingOnboarding, setIsRestartingOnboarding] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isProfileLoaded) return;

    setDisplayName(profile.displayName);
    setUniversity(profile.university);
    setDegreeProgram(profile.degreeProgram);
    setDegreeType(profile.degreeType || "Bachelor");
    setCurrentSemester(formatNumber(profile.currentSemester || 1));
    setTargetEcts(formatNumber(profile.targetEcts));
    setPreferredStartMode(profile.preferredStartMode || "manual");
    setThemeMode(profile.themeMode || "system");
    setAccentColor(profile.accentColor || "violet");
    setAvatarDataUrl(profile.avatarDataUrl || "");
  }, [isProfileLoaded, profile]);

  const syncStyle = useMemo(() => {
    switch (profileSyncStatus) {
      case "cloud-saved":
      case "cloud-ready":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "cloud-saving":
      case "cloud-loading":
        return "bg-amber-50 text-amber-700 ring-amber-200";
      case "cloud-error":
        return "bg-rose-50 text-rose-700 ring-rose-200";
      case "local":
        return "bg-violet-50 text-violet-700 ring-violet-200";
    }
  }, [profileSyncStatus]);

  const nextProfile = useMemo<GradeGlowProfile>(() => {
    const parsedTargetEcts = parseNumber(targetEcts);
    const parsedSemester = parseNumber(currentSemester);

    return {
      ...profile,
      displayName: displayName.trim(),
      university: university.trim(),
      degreeProgram: degreeProgram.trim(),
      degreeType: degreeType.trim() || "Bachelor",
      currentSemester: Number.isFinite(parsedSemester) ? Math.max(1, Math.round(parsedSemester)) : 1,
      targetEcts: Number.isFinite(parsedTargetEcts) ? parsedTargetEcts : profile.targetEcts,
      preferredStartMode,
      themeMode,
      accentColor,
      onboardingCompleted: true,
      avatarDataUrl,
    };
  }, [accentColor, avatarDataUrl, currentSemester, degreeProgram, degreeType, displayName, preferredStartMode, profile, targetEcts, themeMode, university]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(nextProfile) !== JSON.stringify({ ...profile, onboardingCompleted: true });
  }, [nextProfile, profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    if (!displayName.trim()) {
      setFormMessage("Bitte gib einen Namen ein.");
      return;
    }

    if (!Number.isFinite(nextProfile.targetEcts) || nextProfile.targetEcts <= 0) {
      setFormMessage("Bitte gib gültige Ziel-ECTS ein.");
      return;
    }

    if (nextProfile.targetEcts < 30 || nextProfile.targetEcts > 400) {
      setFormMessage("Ziel-ECTS sollten realistisch zwischen 30 und 400 liegen.");
      return;
    }

    setIsSaving(true);

    try {
      const cleanedDisplayName = displayName.trim();
      await saveProfile({ ...nextProfile, displayName: cleanedDisplayName });

      if (auth?.currentUser && cleanedDisplayName) {
        await updateProfile(auth.currentUser, {
          displayName: cleanedDisplayName,
        });
      }

      setFormMessage("Profil gespeichert.");
    } catch {
      setFormMessage("Profil konnte nicht vollständig gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAppData = async () => {
    if (deleteConfirmation !== "LÖSCHEN") {
      setDangerMessage("Tippe LÖSCHEN ein, um die Datenlöschung zu bestätigen.");
      return;
    }

    setDangerMessage("");
    setIsDeletingData(true);

    try {
      if (user.provider === "firebase" && isFirebaseConfigured && db) {
        await deleteCollectionDocs(["users", user.uid, "modules"]);
        await deleteCollectionDocs(["users", user.uid, "exams"]);
        await deleteDoc(doc(db, "users", user.uid, "gradeglow", "settings")).catch(() => undefined);
        await deleteDoc(doc(db, "users", user.uid, "gradeglow", "dashboard")).catch(() => undefined);
        await deleteDoc(doc(db, "publicStudyProfiles", user.uid)).catch(() => undefined);
      }

      clearLocalGradeGlowData(user.uid);
      setDangerMessage("App-Daten gelöscht. Du wirst abgemeldet.");
      await onLogout();
    } catch {
      setDangerMessage("Daten konnten nicht vollständig gelöscht werden. Prüfe Firebase-Regeln oder melde dich neu an.");
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "LÖSCHEN") {
      setDangerMessage("Tippe LÖSCHEN ein, um die Account-Löschung zu bestätigen.");
      return;
    }

    setDangerMessage("");
    setIsDeletingAccount(true);

    try {
      if (user.provider === "firebase" && auth?.currentUser) {
        await deleteCollectionDocs(["users", user.uid, "modules"]);
        await deleteCollectionDocs(["users", user.uid, "exams"]);
        await deleteDoc(doc(db!, "users", user.uid, "gradeglow", "settings")).catch(() => undefined);
        await deleteDoc(doc(db!, "users", user.uid, "gradeglow", "dashboard")).catch(() => undefined);
        await deleteDoc(doc(db!, "publicStudyProfiles", user.uid)).catch(() => undefined);
        clearLocalGradeGlowData(user.uid);
        await deleteUser(auth.currentUser);
        return;
      }

      clearLocalGradeGlowData(user.uid);
      removeLocalUser(user.uid);
      await onLogout();
    } catch {
      setDangerMessage(
        "Account konnte nicht gelöscht werden. Bei Firebase musst du dich aus Sicherheitsgründen eventuell neu einloggen und es direkt danach erneut versuchen.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarMessage("");

    try {
      if (file.size > 5 * 1024 * 1024) {
        setAvatarMessage("Bild ist zu groß. Bitte maximal 5 MB hochladen.");
        return;
      }

      const nextAvatar = await resizeAvatarFile(file);
      setAvatarDataUrl(nextAvatar);
      setAvatarMessage("Profilbild vorbereitet. Speichern nicht vergessen.");
    } catch {
      setAvatarMessage("Profilbild konnte nicht gelesen werden.");
    } finally {
      event.target.value = "";
    }
  };

  const restartOnboarding = async () => {
    setFormMessage("");
    setIsRestartingOnboarding(true);

    try {
      await saveProfile({ ...profile, onboardingCompleted: false });
      window.location.href = "/";
    } catch {
      setFormMessage("Onboarding konnte nicht neu gestartet werden.");
    } finally {
      setIsRestartingOnboarding(false);
    }
  };

  const themeClassName = getThemeClassName(themeMode);
  const themeStyle = getThemeStyle();
  const userLabel = profile.displayName || user.displayName || user.email || "GradeGlow User";
  const userInitial = userLabel.trim().charAt(0).toUpperCase() || "G";
  const avatarSource = avatarDataUrl || profile.avatarDataUrl || user.photoURL || "";
  const avatarFrameWrapperClassName = getAvatarFrameWrapperClassName(profile.activeAvatarFrameId);
  const profileBannerClassName = getProfileBannerClassName(profile.activeProfileBannerId);
  const renderAvatar = (className: string, fallback = userInitial) => {
    const avatar = avatarSource ? (
      <div
        className={`${className} bg-cover bg-center`}
        style={{ backgroundImage: `url(${avatarSource})` }}
        aria-label="Profilbild"
        role="img"
      />
    ) : (
      <div className={className}>{fallback}</div>
    );

    return avatarFrameWrapperClassName ? (
      <div className={`${avatarFrameWrapperClassName} shrink-0 rounded-[1.7rem]`}>
        {avatar}
      </div>
    ) : avatar;
  };

  return (
    <main className={`gg-themed ${themeClassName} min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950`} data-accent={accentColor} style={themeStyle}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-4 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" />
                  <div className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${syncStyle}`}>
                    {profileSyncMessage}
                  </div>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">
                  GradeGlow Profil
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Deine App, dein Studium.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Bearbeite dein Studienprofil, deinen Startmodus und lösche bei Bedarf deine gespeicherten Daten.
                </p>
              </div>

              <div className={`flex w-full min-w-0 flex-col gap-3 rounded-3xl p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-80 lg:w-auto ${profileBannerClassName === "bg-slate-950" ? "bg-white/10" : profileBannerClassName}`}>
                <div className="flex items-center gap-3">
                  {renderAvatar("flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/10")}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{userLabel}</p>
                    <p className="truncate text-xs text-slate-300">{user.email ?? "Lokaler Account"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Studium</p>
                    <p className="truncate text-base font-black">
                      {profile.degreeProgram || "Nicht gesetzt"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Ziel</p>
                    <p className="text-base font-black">{profile.targetEcts} ECTS</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href="/" className="rounded-2xl bg-white/10 px-3 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">
                    App
                  </Link>
                  <button type="button" className="rounded-2xl bg-white px-3 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50" onClick={onLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
          <form className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6" onSubmit={handleSubmit}>
            <div className="mb-6">
              <p className="text-sm font-bold text-violet-700">Profil & Onboarding</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Basisdaten bearbeiten</h2>
              <p className="mt-1 text-sm text-slate-500">Diese Daten werden pro Account gespeichert und auf Dashboard, StuPo-Assistent und Kalender verwendet.</p>
            </div>

            <div className="mb-6 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {renderAvatar("flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-xl font-black text-violet-800 ring-1 ring-violet-100", (displayName.trim() || "G").charAt(0).toUpperCase())}
                  <div>
                    <p className="text-sm font-black text-slate-950">Profilbild</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      Wird verkleinert und in deinem Profil gespeichert. Perfekt für Study Circle und Dashboard.
                    </p>
                    {avatarMessage && <p className="mt-2 text-xs font-bold text-violet-700">{avatarMessage}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-700"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Bild hochladen
                  </button>
                  {avatarDataUrl && (
                    <button
                      type="button"
                      className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-100"
                      onClick={() => {
                        setAvatarDataUrl("");
                        setAvatarMessage("Profilbild entfernt. Speichern nicht vergessen.");
                      }}
                    >
                      Entfernen
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Name</span>
                <input className="field-input" placeholder="z. B. Paul" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Hochschule</span>
                <input className="field-input" placeholder="z. B. TU Berlin" value={university} onChange={(event) => setUniversity(event.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Studiengang</span>
                <input className="field-input" placeholder="z. B. Wirtschaftsingenieurwesen" value={degreeProgram} onChange={(event) => setDegreeProgram(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Abschluss</span>
                <select className="field-input" value={degreeType} onChange={(event) => setDegreeType(event.target.value)}>
                  <option>Bachelor</option>
                  <option>Master</option>
                  <option>Staatsexamen</option>
                  <option>Sonstiges</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Aktuelles Semester</span>
                <input className="field-input" inputMode="numeric" value={currentSemester} onChange={(event) => setCurrentSemester(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Ziel-ECTS</span>
                <input className="field-input" inputMode="decimal" value={targetEcts} onChange={(event) => setTargetEcts(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Bevorzugter Start</span>
                <select className="field-input" value={preferredStartMode} onChange={(event) => setPreferredStartMode(event.target.value as StartMode)}>
                  {Object.entries(startModeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="mb-4">
                <p className="text-sm font-black text-slate-950">Look & Feel</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Passe GradeGlow an: Akzentfarbe, heller Modus, Dark Mode oder automatisch nach System.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Design-Modus</span>
                  <div className="grid grid-cols-3 gap-2">
                    {themeModeLabels.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`rounded-2xl px-3 py-3 text-left ring-1 transition hover:-translate-y-0.5 ${themeMode === option.value ? "bg-violet-700 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-violet-50"}`}
                        onClick={() => setThemeMode(option.value)}
                      >
                        <span className="block text-sm font-black">{option.label}</span>
                        <span className={`mt-1 block text-[0.68rem] font-bold ${themeMode === option.value ? "text-violet-100" : "text-slate-400"}`}>{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Akzentfarbe</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {accentColorLabels.map((option) => {
                      const isLocked = Boolean(option.unlockId && !profile.purchasedCosmeticIds.includes(option.unlockId) && accentColor !== option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-black ring-1 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 ${accentColor === option.value ? "bg-slate-950 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-200 hover:bg-violet-50"}`}
                          onClick={() => setAccentColor(option.value)}
                          disabled={isLocked}
                          title={isLocked ? "Im Glow Shop freischalten" : option.label}
                        >
                          <span className={`h-4 w-4 shrink-0 rounded-full ${option.dotClassName}`} />
                          <span>{option.label}</span>
                          {isLocked && <span className="text-[0.6rem] font-black text-slate-400">Shop</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ectsPresets.map((preset) => (
                <button key={preset} type="button" className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-100" onClick={() => setTargetEcts(String(preset))}>
                  {preset} ECTS
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {formMessage ? <p className="text-sm font-bold text-slate-600">{formMessage}</p> : <p className="text-sm text-slate-500">Änderungen wirken direkt auf Fortschritt, Startseite und StuPo-Assistent.</p>}
              </div>
              <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={!hasChanges || isSaving || !isProfileLoaded}>
                {isSaving ? "Speichern…" : "Profil speichern"}
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-violet-700">Vorschau</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">So erscheint es in GradeGlow</h2>
              <div className={`mt-5 rounded-3xl p-5 text-white shadow-lg shadow-violet-950/15 ${profileBannerClassName}`}>
                <div className="flex items-center gap-3">
                  {renderAvatar("flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/10", (displayName.trim() || "G").charAt(0).toUpperCase())}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{displayName.trim() || "GradeGlow User"}</p>
                    <p className="truncate text-xs text-slate-300">{degreeProgram.trim() || "Studiengang noch nicht gesetzt"}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Fortschritt</p>
                    <p className="mt-1 text-xl font-black">0 / {targetEcts || DEFAULT_TARGET_ECTS} ECTS</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Start</p>
                    <p className="mt-1 text-sm font-black">{startModeLabels[preferredStartMode]}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-violet-700">Streak-Abzeichen</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Max-Streak: {profile.maxStudyStreakDays} Tage</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Diese Abzeichen richten sich nach deinem besten Lernstreak und gehen nicht verloren, wenn du später einen Tag verpasst.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {STREAK_BADGES.map((badge) => {
                  const unlocked = profile.maxStudyStreakDays >= badge.threshold;
                  return (
                    <span key={badge.id} className={`rounded-2xl px-3 py-2 text-xs font-black ring-1 ${unlocked ? "bg-violet-700 text-white ring-violet-600" : "bg-slate-50 text-slate-400 ring-slate-200"}`} title={badge.description}>
                      {badge.emoji} {badge.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-violet-700">Plan & Premium</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                    {planLabels[entitlement.plan]} Plan
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {planDescriptions[entitlement.plan]}
                  </p>
                </div>
                <span className="self-start rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 ring-1 ring-violet-100">
                  {accessSyncMessage}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-500">Freunde</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{formatLimit(limits.maxFriends)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-500">Prüfungen</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{formatLimit(limits.maxExams)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-500">Module</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{formatLimit(limits.maxModules)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-500">Advanced Stats</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{limits.advancedStats ? "aktiv" : "Free-Basis"}</p>
                </div>
              </div>

              <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200">
                Manuelle Freischaltung läuft später über Firebase Console im Dokument <span className="font-black text-slate-700">entitlements/{user.uid}</span>. User können dieses Dokument nur lesen, nicht selbst schreiben.
              </p>
            </div>

            <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-violet-700">Setup</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Onboarding erneut starten</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Starte den Einrichtungsassistenten nochmal, ohne Module, Prüfungen oder Accountdaten zu löschen. Praktisch, wenn du Demo-Daten testen oder den Startweg neu wählen willst.
              </p>
              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:opacity-50"
                onClick={restartOnboarding}
                disabled={isRestartingOnboarding || !isProfileLoaded}
              >
                {isRestartingOnboarding ? "Starte…" : "Onboarding erneut starten"}
              </button>
            </div>

            <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-rose-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-rose-700">Daten & Account</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Löschen</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                App-Daten löschen entfernt Module, Prüfungen und Profil. Account löschen entfernt zusätzlich den Login-Account. Bei Firebase kann dafür aus Sicherheitsgründen ein frischer Login nötig sein.
              </p>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Zur Bestätigung LÖSCHEN eintippen</span>
                <input className="field-input" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="LÖSCHEN" />
              </label>
              {dangerMessage && <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">{dangerMessage}</p>}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 disabled:opacity-50" onClick={handleDeleteAppData} disabled={isDeletingData || isDeletingAccount}>
                  {isDeletingData ? "Lösche…" : "App-Daten löschen"}
                </button>
                <button type="button" className="rounded-2xl bg-rose-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-100 disabled:opacity-50" onClick={handleDeleteAccount} disabled={isDeletingData || isDeletingAccount}>
                  {isDeletingAccount ? "Lösche…" : "Account löschen"}
                </button>
              </div>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 pb-2 text-xs font-bold text-slate-400 sm:flex-row">
          <span>GradeGlow Einstellungen</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="transition hover:text-violet-700">Dashboard</Link>
            <Link href="/info" className="transition hover:text-violet-700">Info, Datenschutz & Impressum</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
