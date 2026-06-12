"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";
import { DEFAULT_TARGET_ECTS, useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import type { AppUser } from "../types";

type SettingsPageProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
};

const ectsPresets = [180, 210, 120, 90];

const parseNumber = (value: string) => Number(value.replace(",", "."));

const formatNumber = (value: number) => String(value).replace(".", ",");

export default function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const {
    profile,
    isProfileLoaded,
    profileSyncMessage,
    profileSyncStatus,
    saveProfile,
  } = useGradeGlowProfile(user);

  const [displayName, setDisplayName] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [targetEcts, setTargetEcts] = useState(String(DEFAULT_TARGET_ECTS));
  const [formMessage, setFormMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isProfileLoaded) return;

    setDisplayName(profile.displayName);
    setDegreeProgram(profile.degreeProgram);
    setTargetEcts(formatNumber(profile.targetEcts));
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

  const hasChanges = useMemo(() => {
    const parsedTargetEcts = parseNumber(targetEcts);

    return (
      displayName.trim() !== profile.displayName ||
      degreeProgram.trim() !== profile.degreeProgram ||
      parsedTargetEcts !== profile.targetEcts
    );
  }, [degreeProgram, displayName, profile, targetEcts]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    const parsedTargetEcts = parseNumber(targetEcts);

    if (!displayName.trim()) {
      setFormMessage("Bitte gib einen Namen ein.");
      return;
    }

    if (!Number.isFinite(parsedTargetEcts) || parsedTargetEcts <= 0) {
      setFormMessage("Bitte gib gültige Ziel-ECTS ein.");
      return;
    }

    if (parsedTargetEcts < 30 || parsedTargetEcts > 400) {
      setFormMessage("Ziel-ECTS sollten realistisch zwischen 30 und 400 liegen.");
      return;
    }

    setIsSaving(true);

    try {
      const cleanedDisplayName = displayName.trim();

      await saveProfile({
        displayName: cleanedDisplayName,
        degreeProgram: degreeProgram.trim(),
        targetEcts: parsedTargetEcts,
      });

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

  const userLabel = profile.displayName || user.displayName || user.email || "GradeGlow User";
  const userInitial = userLabel.trim().charAt(0).toUpperCase() || "G";

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-base font-black text-violet-950 shadow-lg shadow-fuchsia-950/20">
                    GG
                  </div>

                  <div className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${syncStyle}`}>
                    {profileSyncMessage}
                  </div>
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">
                  GradeGlow Profil
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Deine App, dein Studium.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Lege fest, wie GradeGlow dich anspricht, welcher Studiengang angezeigt wird
                  und mit wie vielen ECTS dein Fortschritt berechnet werden soll.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-80">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/10">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{userLabel}</p>
                    <p className="truncate text-xs text-slate-300">{user.email ?? "Lokaler Account"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs text-slate-300">Studiengang</p>
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
                  <Link
                    href="/"
                    className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
                    onClick={onLogout}
                  >
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
          <form
            className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6"
            onSubmit={handleSubmit}
          >
            <div className="mb-6">
              <p className="text-sm font-bold text-violet-700">Profil & Einstellungen</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Basisdaten bearbeiten</h2>
              <p className="mt-1 text-sm text-slate-500">
                Diese Daten werden pro Account gespeichert und auf dem Dashboard verwendet.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Name</span>
                <input
                  className="field-input"
                  placeholder="z. B. Paul"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Studiengang</span>
                <input
                  className="field-input"
                  placeholder="z. B. BWL, Wirtschaftsinformatik, Maschinenbau"
                  value={degreeProgram}
                  onChange={(event) => setDegreeProgram(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Ziel-ECTS</span>
                <input
                  className="field-input"
                  inputMode="decimal"
                  placeholder="z. B. 180"
                  value={targetEcts}
                  onChange={(event) => setTargetEcts(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ectsPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-100"
                  onClick={() => setTargetEcts(String(preset))}
                >
                  {preset} ECTS
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {formMessage ? (
                  <p className="text-sm font-bold text-slate-600">{formMessage}</p>
                ) : (
                  <p className="text-sm text-slate-500">
                    Änderungen wirken direkt auf Fortschritt und Zielnotenrechner.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasChanges || isSaving || !isProfileLoaded}
              >
                {isSaving ? "Speichern…" : "Profil speichern"}
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-violet-700">Vorschau</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">So erscheint es im Dashboard</h2>

              <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white shadow-lg shadow-violet-950/15">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/10">
                    {(displayName.trim() || "G").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{displayName.trim() || "GradeGlow User"}</p>
                    <p className="truncate text-xs text-slate-300">
                      {degreeProgram.trim() || "Studiengang noch nicht gesetzt"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs text-slate-300">Bachelor-Fortschritt</p>
                  <p className="mt-1 text-2xl font-black">0 / {targetEcts || DEFAULT_TARGET_ECTS} ECTS</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-violet-700">Speicherung</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Accountbasiert</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Bei Firebase-Login liegt dein Profil unter
                <span className="font-bold text-slate-700"> users/{user.uid}/gradeglow/settings</span>.
                Falls die Cloud kurz nicht erreichbar ist, bleibt ein lokales Backup im Browser.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
