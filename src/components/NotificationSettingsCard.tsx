"use client";

import { useState } from "react";
import { usePushNotifications } from "../hooks/usePushNotifications";
import type { AppUser, GradeGlowNotificationSettings } from "../types";

type NotificationSettingsCardProps = {
  user: AppUser;
};

type ToggleKey = keyof Pick<
  GradeGlowNotificationSettings,
  | "friendActivityPushEnabled"
  | "studyReminderPushEnabled"
  | "examReminderPushEnabled"
  | "streakReminderPushEnabled"
  | "inAppNotificationsEnabled"
  | "quietHoursEnabled"
>;

const setupStatusLabels = {
  checking: "wird geprüft",
  ready: "bereit",
  unsupported: "nicht unterstützt",
  "not-configured": "Firebase fehlt",
  "missing-vapid-key": "Web-Push-Schlüssel fehlt",
  "permission-denied": "blockiert",
  active: "aktiv",
  error: "Fehler",
};

const ToggleRow = ({
  title,
  description,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    className={`flex w-full items-start justify-between gap-4 rounded-2xl p-3 text-left ring-1 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? "bg-violet-50 ring-violet-100" : "bg-slate-50 ring-slate-200"
    }`}
    onClick={onToggle}
    disabled={disabled}
  >
    <span>
      <span className="block text-sm font-black text-slate-950">{title}</span>
      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{description}</span>
    </span>
    <span
      className={`mt-0.5 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
        checked ? "bg-violet-700" : "bg-slate-300"
      }`}
      aria-hidden="true"
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </span>
  </button>
);

export default function NotificationSettingsCard({ user }: NotificationSettingsCardProps) {
  const {
    canUseCloud,
    settings,
    notifications,
    unreadCount,
    setupStatus,
    permission,
    message,
    enablePush,
    disablePush,
    updateSettings,
    markNotificationAsRead,
    deleteNotification,
  } = usePushNotifications(user);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSetting = async (key: ToggleKey) => {
    setIsSaving(true);
    try {
      await updateSettings({ [key]: !settings[key] });
    } finally {
      setIsSaving(false);
    }
  };

  const activatePush = async () => {
    setIsSaving(true);
    try {
      await enablePush();
    } finally {
      setIsSaving(false);
    }
  };

  const deactivatePush = async () => {
    setIsSaving(true);
    try {
      await disablePush();
    } finally {
      setIsSaving(false);
    }
  };

  const pushActive = settings.pushNotificationsEnabled && permission === "granted" && setupStatus === "active";

  return (
    <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-violet-700">Benachrichtigungen</p>
          <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Push & Notification Center</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            GradeGlow nutzt In-App-Hinweise, wenn du die App offen hast. Mit Push bekommst du wichtige Hinweise auch, wenn der Tab geschlossen ist.
          </p>
        </div>
        <span className={`self-start rounded-full px-3 py-1.5 text-xs font-black ring-1 ${pushActive ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
          {setupStatusLabels[setupStatus]}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200">
        Browser-Recht: <span className="font-black text-slate-700">{permission}</span>
        {message ? <span className="mt-1 block font-bold text-violet-700">{message}</span> : null}
        {!canUseCloud ? <span className="mt-1 block font-bold text-amber-700">Push funktioniert nur mit Firebase-Login.</span> : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {pushActive ? (
          <button
            type="button"
            className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:-translate-y-0.5 disabled:opacity-50"
            onClick={deactivatePush}
            disabled={isSaving}
          >
            Push deaktivieren
          </button>
        ) : (
          <button
            type="button"
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 disabled:opacity-50"
            onClick={activatePush}
            disabled={isSaving || !canUseCloud}
          >
            Push aktivieren
          </button>
        )}
        <button
          type="button"
          className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 disabled:opacity-50"
          onClick={() => void toggleSetting("inAppNotificationsEnabled")}
          disabled={isSaving || !canUseCloud}
        >
          {settings.inAppNotificationsEnabled ? "In-App aktiv" : "In-App aktivieren"}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <ToggleRow
          title="Freunde lernen gerade"
          description="Push, sobald jemand aus deinem Study Circle eine Lernsession startet oder abschließt."
          checked={settings.friendActivityPushEnabled}
          disabled={isSaving || !canUseCloud}
          onToggle={() => void toggleSetting("friendActivityPushEnabled")}
        />
        <ToggleRow
          title="Lernplan-Erinnerungen"
          description="Vorbereitet für geplante Lernblöcke und tägliche Lernziele."
          checked={settings.studyReminderPushEnabled}
          disabled={isSaving || !canUseCloud}
          onToggle={() => void toggleSetting("studyReminderPushEnabled")}
        />
        <ToggleRow
          title="Prüfungserinnerungen"
          description="Vorbereitet für Hinweise vor Klausuren, Abgaben und Präsentationen."
          checked={settings.examReminderPushEnabled}
          disabled={isSaving || !canUseCloud}
          onToggle={() => void toggleSetting("examReminderPushEnabled")}
        />
        <ToggleRow
          title="Streak-Erinnerungen"
          description="Vorbereitet für Erinnerungen, wenn dein Lernstreak gefährdet ist."
          checked={settings.streakReminderPushEnabled}
          disabled={isSaving || !canUseCloud}
          onToggle={() => void toggleSetting("streakReminderPushEnabled")}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">Ruhezeiten</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Push soll nachts nicht nerven.</p>
          </div>
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${settings.quietHoursEnabled ? "bg-violet-700 text-white ring-violet-600" : "bg-white text-slate-600 ring-slate-200"}`}
            onClick={() => void toggleSetting("quietHoursEnabled")}
            disabled={isSaving || !canUseCloud}
          >
            {settings.quietHoursEnabled ? "aktiv" : "aus"}
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">Start</span>
            <input
              className="field-input bg-white"
              type="time"
              value={settings.quietHoursStart}
              onChange={(event) => void updateSettings({ quietHoursStart: event.target.value })}
              disabled={!settings.quietHoursEnabled || isSaving || !canUseCloud}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">Ende</span>
            <input
              className="field-input bg-white"
              type="time"
              value={settings.quietHoursEnd}
              onChange={(event) => void updateSettings({ quietHoursEnd: event.target.value })}
              disabled={!settings.quietHoursEnabled || isSaving || !canUseCloud}
            />
          </label>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">Notification Center</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{unreadCount} ungelesen · letzte {notifications.length} Hinweise</p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
            Noch keine Benachrichtigungen gespeichert.
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <article key={notification.id} className={`rounded-2xl p-3 ring-1 ${notification.readAtIso ? "bg-white ring-slate-200" : "bg-violet-50 ring-violet-100"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{notification.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{notification.body}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-black text-slate-500 ring-1 ring-slate-200"
                    onClick={() => void deleteNotification(notification.id)}
                  >
                    Entfernen
                  </button>
                </div>
                {!notification.readAtIso && (
                  <button
                    type="button"
                    className="mt-2 text-xs font-black text-violet-700"
                    onClick={() => void markNotificationAsRead(notification.id)}
                  >
                    Als gelesen markieren
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
