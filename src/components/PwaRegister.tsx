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

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

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
    window.addEventListener("load", registerServiceWorker);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}
