"use client";

import { useEffect } from "react";

const PWA_UPDATE_EVENT = "gradeglow:pwa-update-ready";

const dispatchUpdateReady = (registration: ServiceWorkerRegistration) => {
  window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: registration }));
};

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    let activeRegistration: ServiceWorkerRegistration | undefined;

    const checkForUpdate = () => {
      if (document.visibilityState === "visible") {
        void activeRegistration?.update().catch(() => undefined);
      }
    };

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        activeRegistration = registration;

        if (registration.waiting) {
          dispatchUpdateReady(registration);
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              dispatchUpdateReady(registration);
            }
          });
        });
      } catch {
        // GradeGlow läuft trotzdem; nur Offline/PWA-Cache ist dann nicht aktiv.
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    window.addEventListener("pageshow", checkForUpdate);
    document.addEventListener("visibilitychange", checkForUpdate);
    if (document.readyState === "complete") void registerServiceWorker();
    else window.addEventListener("load", registerServiceWorker, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      window.removeEventListener("pageshow", checkForUpdate);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}
