// Opaque, native-encoded Screen Time tokens; never bundle IDs or app names.
export interface AppSelection {
  applicationTokens: string[];
  categoryTokens: string[];
  webDomainTokens: string[];
}

export interface FocusLock {
  isSupported(): Promise<boolean>;
  requestAuthorization(): Promise<"granted" | "denied">;
  getSelectedApps(): Promise<AppSelection>;
  start(appSelection: AppSelection, until: Date): Promise<void>;
  stop(): Promise<void>;
}

// Capacitor calls cross the bridge using JSON objects, including ISO dates.
export interface FocusLockPlugin {
  isSupported(): Promise<{ supported: boolean }>;
  requestAuthorization(): Promise<{ status: "granted" | "denied" }>;
  getSelectedApps(): Promise<AppSelection>;
  start(options: { appSelection: AppSelection; untilIso: string }): Promise<void>;
  stop(): Promise<void>;
}
