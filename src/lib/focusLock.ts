import type { FocusLock } from "../../plugins/focus-lock/src/definitions";
export type { AppSelection, FocusLock } from "../../plugins/focus-lock/src/definitions";

export class WebFocusLock implements FocusLock {
  async isSupported() { return false; }
  async requestAuthorization(): Promise<"granted" | "denied"> { return "denied"; }
  async getSelectedApps() { return { applicationTokens: [], categoryTokens: [], webDomainTokens: [] }; }
  async start() { /* Web cannot shield other apps. */ }
  async stop() { /* No-op fallback. */ }
}

// Only replace this adapter after the real native plugin is implemented.
export const focusLock: FocusLock = new WebFocusLock();
