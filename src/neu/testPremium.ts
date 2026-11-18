// Premium test access for Paul's own testing. Exists only on Vercel preview links (behind the
// Vercel login) and in local development, never on the live app.

const KEY = "gradeglow-neu-test-premium";
const EVENT = "gradeglow-neu-test-premium";

export const testPremiumAllowed = () =>
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"
  // Fallback if Vercel does not expose its env to the browser: preview links carry the team suffix.
  || (typeof window !== "undefined" && window.location.hostname.endsWith("-powl-ais-projects.vercel.app"));

export const getTestPremium = () => {
  if (!testPremiumAllowed() || typeof window === "undefined") return false;
  try { return window.localStorage.getItem(KEY) === "1"; } catch { return false; }
};

export const setTestPremium = (on: boolean) => {
  if (!testPremiumAllowed()) return;
  try { if (on) window.localStorage.setItem(KEY, "1"); else window.localStorage.removeItem(KEY); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
};

export const onTestPremiumChange = (listener: () => void) => {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
