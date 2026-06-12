"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
};

export default function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installState, setInstallState] = useState<"idle" | "installing" | "installed" | "dismissed">("idle");

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());
    setIsOnline(navigator.onLine);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallState("idle");
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallState("installed");
      setIsStandalone(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (isStandalone || installState === "installed") return "Installiert";
    if (deferredPrompt) return "Install bereit";
    return "PWA bereit";
  }, [deferredPrompt, installState, isStandalone]);

  const installApp = async () => {
    if (!deferredPrompt) return;

    setInstallState("installing");
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallState(choice.outcome === "accepted" ? "installed" : "dismissed");
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-violet-950/10 ring-1 ring-white/10">
      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />

        <div className="relative flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-xl font-black shadow-xl shadow-fuchsia-950/30 ring-1 ring-white/15">
            GG
          </div>
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-violet-50 ring-1 ring-white/10">
                {statusLabel}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${isOnline ? "bg-emerald-400/15 text-emerald-100 ring-emerald-300/20" : "bg-amber-400/15 text-amber-100 ring-amber-300/20"}`}>
                {isOnline ? "Online" : "Offline-Modus"}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">GradeGlow als App nutzen</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Installiere GradeGlow auf Homescreen, Dock oder Desktop. Deine Oberfläche öffnet sich dann wie eine echte App und der Service Worker hält wichtige App-Dateien offline verfügbar.
            </p>
          </div>
        </div>

        <div className="relative flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            type="button"
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={installApp}
            disabled={!deferredPrompt || isStandalone || installState === "installing"}
          >
            {isStandalone || installState === "installed"
              ? "App ist installiert"
              : installState === "installing"
              ? "Installiere…"
              : deferredPrompt
              ? "GradeGlow installieren"
              : "Install-Button erscheint automatisch"}
          </button>
          <p className="max-w-xs text-xs leading-5 text-slate-400">
            Auf iPhone/iPad: Safari öffnen → Teilen → „Zum Home-Bildschirm“. In Chrome/Edge erscheint der Button, sobald der Browser die App als installierbar erkennt.
          </p>
        </div>
      </div>
    </section>
  );
}
