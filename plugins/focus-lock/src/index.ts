import type { FocusLock, FocusLockPlugin } from "./definitions";
export type { AppSelection, FocusLock, FocusLockPlugin } from "./definitions";

// Preparation only: nothing registers or loads a native plugin in the PWA.
// When Capacitor is installed later, pass registerPlugin<FocusLockPlugin>("FocusLock").
export function createNativeFocusLock(plugin: FocusLockPlugin): FocusLock {
  return {
    isSupported: async () => (await plugin.isSupported()).supported,
    requestAuthorization: async () => (await plugin.requestAuthorization()).status,
    getSelectedApps: () => plugin.getSelectedApps(),
    start: (appSelection, until) => plugin.start({ appSelection, untilIso: until.toISOString() }),
    stop: () => plugin.stop(),
  };
}
