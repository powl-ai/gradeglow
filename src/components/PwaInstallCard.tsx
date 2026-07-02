"use client";

import { useEffect, useMemo, useState } from "react";
import GradeGlowLogo from "./GradeGlowLogo";

const PWA_UPDATE_EVENT = "gradeglow:pwa-update-ready";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

type PlatformInfo = {
  isIos: boolean;
  isSafari: boolean;
  isAndroid: boolean;
};

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
};

const getPlatformInfo = (): PlatformInfo => {
  if (typeof navigator === "undefined") {
    return { isIos: false, isSafari: false, isAndroid: false };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  const isIpadOs = platform === "MacIntel" && maxTouchPoints > 1;
  const isIos = /iPad|iPhone|iPod/.test(userAgent) || isIpadOs;
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  return { isIos, isSafari, isAndroid };
};

export default function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installState, setInstallState] = useState<"idle" | "installing" | "installed" | "dismissed">("idle");
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => ({ isIos: false, isSafari: false, isAndroid: false }));
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());
    setIsOnline(navigator.onLine);
    setPlatformInfo(getPlatformInfo());

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

    const handleUpdateReady = (event: Event) => {
      const customEvent = event as CustomEvent<ServiceWorkerRegistration>;
      setUpdateRegistration(customEvent.detail);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener(PWA_UPDATE_EVENT, handleUpdateReady as EventListener);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener(PWA_UPDATE_EVENT, handleUpdateReady as EventListener);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (updateRegistration) return "Update bereit";
    if (isStandalone || installState === "installed") return "Installiert";
    if (deferredPrompt) return "Install bereit";
    if (platformInfo.isIos) return "iOS bereit";
    return "PWA bereit";
  }, [deferredPrompt, installState, isStandalone, platformInfo.isIos, updateRegistration]);

  const installHint = useMemo(() => {
    if (isStandalone || installState === "installed") {
      return "GradeGlow läuft bereits im App-Modus. Updates werden beim nächsten Öffnen oder über den Update-Button übernommen.";
    }

    if (deferredPrompt) {
      return "Der Browser erkennt GradeGlow als installierbare App. Tippe auf den Button und bestätige die Installation.";
    }

    if (platformInfo.isIos && platformInfo.isSafari) {
      return "Auf iPhone/iPad: Safari öffnen, Teilen-Symbol antippen und „Zum Home-Bildschirm“ wählen.";
    }

    if (platformInfo.isIos) {
      return "Auf iPhone/iPad muss die Installation über Safari erfolgen. Öffne GradeGlow in Safari und nutze Teilen → Zum Home-Bildschirm.";
    }

    if (platformInfo.isAndroid) {
      return "Auf Android erscheint die Installation meist über Chrome-Menü → App installieren oder Zum Startbildschirm hinzufügen.";
    }

    return "In Chrome/Edge erscheint der Install-Button automatisch, sobald der Browser die App als installierbar erkennt.";
  }, [deferredPrompt, installState, isStandalone, platformInfo]);

  const installSteps = useMemo(() => {
    if (platformInfo.isIos) {
      return ["Safari öffnen", "Teilen-Symbol antippen", "Zum Home-Bildschirm wählen"];
    }

    if (platformInfo.isAndroid) {
      return ["Chrome-Menü öffnen", "App installieren wählen", "Startbildschirm prüfen"];
    }

    return ["Chrome oder Edge öffnen", "Install-Button nutzen", "Dock/Desktop prüfen"];
  }, [platformInfo.isAndroid, platformInfo.isIos]);

  const installApp = async () => {
    if (!deferredPrompt) return;

    setInstallState("installing");
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallState(choice.outcome === "accepted" ? "installed" : "dismissed");
  };

  const activateUpdate = () => {
    updateRegistration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  };

  const copyInstallUrl = async () => {
    setCopyMessage("");

    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopyMessage("Link kopiert.");
    } catch {
      setCopyMessage("Kopieren nicht möglich. Link manuell aus der Adresszeile kopieren.");
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-violet-950/10 ring-1 ring-white/10">
      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />

        <div className="relative flex gap-4">
          <GradeGlowLogo size="lg" tone="glass" />
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
              Installiere GradeGlow auf Homescreen, Dock oder Desktop. Die App startet dann ohne Browser-Chrome, nutzt die Safe-Area sauber und hält wichtige App-Dateien offline verfügbar.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {installSteps.map((step, index) => (
                <div key={step} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-violet-200">Schritt {index + 1}</p>
                  <p className="mt-1 text-xs font-black text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-2 sm:flex-row lg:flex-col">
          {updateRegistration && (
            <button
              type="button"
              className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-200"
              onClick={activateUpdate}
            >
              Update neu laden
            </button>
          )}
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
                  : "Install manuell starten"}
          </button>
          <button
            type="button"
            className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
            onClick={copyInstallUrl}
          >
            App-Link kopieren
          </button>
          <p className="max-w-xs text-xs leading-5 text-slate-400">{installHint}</p>
          {copyMessage && <p className="max-w-xs text-xs font-black text-violet-100">{copyMessage}</p>}
        </div>
      </div>
    </section>
  );
}
