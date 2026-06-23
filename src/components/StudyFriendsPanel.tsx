"use client";

import { useMemo, useState } from "react";
import { formatStudyMinutes } from "../lib/studyStats";
import { useStudyFriends } from "../hooks/useStudyFriends";
import type { AppUser, ExamPlanItem, GradeGlowProfile } from "../types";

type StudyFriendsPanelProps = {
  user: AppUser;
  profile: GradeGlowProfile;
  exams: ExamPlanItem[];
  saveProfile: (nextProfile: GradeGlowProfile) => Promise<void>;
};

const getInitial = (label: string) => label.trim().charAt(0).toUpperCase() || "G";

const Avatar = ({ image, label }: { image: string; label: string }) => {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt="Profilbild"
        className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-violet-100"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-base font-black text-violet-800 ring-1 ring-violet-100">
      {getInitial(label)}
    </div>
  );
};

export default function StudyFriendsPanel({
  user,
  profile,
  exams,
  saveProfile,
}: StudyFriendsPanelProps) {
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [isSavingSharing, setIsSavingSharing] = useState(false);

  const {
    canUseCloudSocial,
    ownPublicProfile,
    friends,
    friendCode,
    message,
    isBusy,
    addFriend,
    removeFriend,
  } = useStudyFriends({ user, profile, exams });

  const topOwnSubjects = useMemo(
    () => ownPublicProfile.topSubjects.slice(0, 3),
    [ownPublicProfile.topSubjects],
  );

  const toggleSharing = async () => {
    setIsSavingSharing(true);
    try {
      await saveProfile({
        ...profile,
        studySharingEnabled: !profile.studySharingEnabled,
      });
    } finally {
      setIsSavingSharing(false);
    }
  };

  const handleAddFriend = async () => {
    await addFriend(friendCodeInput);
    setFriendCodeInput("");
  };

  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold text-violet-700">Study Circle</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">
            Freunde & Lernvergleich
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Teile freiwillig deine Lernstatistik und füge Freunde per Code hinzu. Sichtbar werden nur Name, Studiengang, Profilbild und Lernminuten pro Fach.
          </p>
        </div>
        <button
          type="button"
          className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 transition hover:-translate-y-0.5 disabled:opacity-50 ${
            profile.studySharingEnabled
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100"
              : "bg-slate-950 text-white ring-slate-900 hover:bg-violet-800"
          }`}
          onClick={toggleSharing}
          disabled={!canUseCloudSocial || isSavingSharing}
        >
          {profile.studySharingEnabled ? "Teilen aktiv" : "Teilen aktivieren"}
        </button>
      </div>

      {!canUseCloudSocial && (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800 ring-1 ring-amber-100">
          Study Circle braucht einen Firebase-Login, damit Freunde dich über die Cloud finden können. Lokale Accounts bleiben privat auf diesem Gerät.
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-3xl bg-slate-950 p-4 text-white ring-1 ring-slate-900 sm:p-5">
          <div className="flex items-center gap-3">
            <Avatar image={profile.avatarDataUrl || user.photoURL || ""} label={ownPublicProfile.displayName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{ownPublicProfile.displayName}</p>
              <p className="truncate text-xs font-semibold text-slate-300">
                {ownPublicProfile.degreeProgram || "Studiengang nicht gesetzt"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Diese Woche</p>
              <p className="mt-1 text-2xl font-black">
                {formatStudyMinutes(ownPublicProfile.thisWeekDoneMinutes)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-xs text-slate-300">Gesamt gelernt</p>
              <p className="mt-1 text-2xl font-black">
                {formatStudyMinutes(ownPublicProfile.totalDoneMinutes)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Dein Freundescode
            </p>
            <p className="mt-2 break-all text-sm font-black text-white">{friendCode}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Nur teilen, wenn du möchtest, dass andere dich hinzufügen können. Ohne aktives Teilen findet man dein Profil nicht.
            </p>
          </div>

          {topOwnSubjects.length > 0 && (
            <div className="mt-4 space-y-2">
              {topOwnSubjects.map((subject) => (
                <div key={subject.subjectId} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="truncate font-black">{subject.subjectName}</p>
                    <p className="shrink-0 font-black text-violet-100">
                      {formatStudyMinutes(subject.doneMinutes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">
                Freundescode einfügen
              </span>
              <input
                className="field-input bg-white"
                placeholder="UID / Freundescode"
                value={friendCodeInput}
                onChange={(event) => setFriendCodeInput(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="self-end rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:opacity-50"
              onClick={handleAddFriend}
              disabled={!canUseCloudSocial || isBusy || !friendCodeInput.trim()}
            >
              Hinzufügen
            </button>
          </div>

          {message && (
            <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              {message}
            </p>
          )}

          <div className="mt-5 space-y-3">
            {friends.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-violet-200 bg-white p-6 text-center text-sm font-semibold leading-6 text-violet-700">
                Noch keine Freunde hinzugefügt. Sobald jemand Study Circle aktiviert und dir den Code gibt, siehst du hier Lernzeit und Top-Fächer.
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.uid} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex items-start gap-3">
                    <Avatar image={friend.avatarDataUrl} label={friend.displayName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {friend.displayName}
                          </p>
                          <p className="truncate text-xs font-semibold text-slate-500">
                            {friend.degreeProgram || "Kein Studiengang sichtbar"}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="self-start rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-100 disabled:opacity-50"
                          onClick={() => void removeFriend(friend.uid)}
                          disabled={isBusy}
                        >
                          Entfernen
                        </button>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl bg-violet-50 p-3 ring-1 ring-violet-100">
                          <p className="text-xs font-semibold text-violet-600">Diese Woche</p>
                          <p className="text-lg font-black text-violet-950">
                            {formatStudyMinutes(friend.thisWeekDoneMinutes)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <p className="text-xs font-semibold text-slate-500">Gesamt</p>
                          <p className="text-lg font-black text-slate-950">
                            {formatStudyMinutes(friend.totalDoneMinutes)}
                          </p>
                        </div>
                      </div>

                      {friend.isMissing ? (
                        <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 ring-1 ring-amber-100">
                          Dieses Profil ist aktuell nicht öffentlich geteilt.
                        </p>
                      ) : friend.topSubjects.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {friend.topSubjects.slice(0, 3).map((subject) => (
                            <div key={subject.subjectId} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                              <div className="flex items-center justify-between gap-3 text-xs">
                                <p className="truncate font-black text-slate-700">{subject.subjectName}</p>
                                <p className="shrink-0 font-black text-slate-950">
                                  {formatStudyMinutes(subject.doneMinutes)}
                                </p>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                                  style={{
                                    width: `${Math.min(
                                      (subject.doneMinutes /
                                        Math.max(friend.topSubjects[0]?.doneMinutes ?? 1, 1)) *
                                        100,
                                      100,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-slate-400">
                          Noch keine erledigten Lernblöcke sichtbar.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
