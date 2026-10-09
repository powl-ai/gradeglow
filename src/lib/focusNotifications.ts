export function supportsFocusNotifications() {
  if (typeof window === "undefined" || !window.isSecureContext || !("Notification" in window)
    || !("serviceWorker" in navigator) || !("ServiceWorkerRegistration" in window)
    || !("showNotification" in ServiceWorkerRegistration.prototype)) return false;
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return !isiOS || window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Call only from the confirmation button: iOS requires direct user interaction.
export async function requestFocusNotificationPermission() {
  if (!supportsFocusNotifications()) return false;
  try { return await Notification.requestPermission() === "granted"; }
  catch { return false; }
}

export async function showFocusNotification(sessionId: string, kind: "away" | "finished", stillAllowed = () => true) {
  if (!supportsFocusNotifications() || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active || !stillAllowed() || Notification.permission !== "granted") return;
    // No delayed alarm is promised: this runs while the browser still executes JS.
    await registration.showNotification(kind === "away" ? "Deine Fokus-Session pausiert" : "Fokusblock geschafft", {
      body: kind === "away" ? "Komm zurück, wenn du bereit bist. Abwesenheit zählt nicht als Lernzeit." : "Deine Lernzeit wartet in GradeGlow aufs Speichern.",
      tag: `gradeglow-focus-${sessionId}`,
      icon: "/icons/icon-192.png?v=2",
      data: { kind: "gradeglow-focus", url: "/timer" },
    });
  } catch { /* Unsupported or revoked permissions never affect the timer. */ }
}

export async function clearFocusNotifications(sessionId: string) {
  if (!supportsFocusNotifications() || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const notifications = await registration?.getNotifications({ tag: `gradeglow-focus-${sessionId}` });
    notifications?.forEach((notification) => notification.close());
  } catch { /* Best effort. */ }
}
