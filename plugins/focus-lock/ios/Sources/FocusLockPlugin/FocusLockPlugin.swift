// FocusLock — intentionally empty Swift scaffold. No native implementation yet.
//
// TODO: After approval to add Capacitor, create/register a CAPBridgedPlugin.
//       identifier = FocusLockPlugin; jsName = FocusLock; JSON bridge matches
//       plugins/focus-lock/src/definitions.ts. Do not report support until complete.
// TODO: iOS 16+ availability checks for individual Screen Time authorization.
//       FamilyControls: AuthorizationCenter.shared.requestAuthorization(for: .individual)
//       Map authorized/revoked/denied states; never prompt without a user gesture.
// TODO: Show FamilyActivityPicker in SwiftUI after the user taps app selection.
//       Save FamilyActivitySelection in an App Group shared with extensions.
//       Encode opaque application/category/web-domain tokens, never enumerate apps.
// TODO: ManagedSettingsStore: shield only the explicitly selected apps/categories
//       and web domains on start; clear this store on stop, pause, revoked permission,
//       and session expiry. Preserve unrelated managed-settings stores.
// TODO: Validate untilIso, reject expired dates, replace old schedules atomically.
// TODO: DeviceActivitySchedule + DeviceActivityMonitor extension for releasing
//       shields at intervalDidEnd even when the main app is suspended/terminated.
//       Persist deadline and active selection natively; reconcile on launch.
//       System monitor callbacks may wait until the device is used; reconcile
//       expired deadlines in the extension as well as on app launch.
//       Test interval limits and short sessions; do not rely on a JS/Swift timer.
// TODO: Resume starts a new native deadline; a paused session must release shields.
// TODO: Add Family Controls entitlement to app AND each Screen Time extension.
//       Request distribution permission for each relevant bundle ID via Apple.
// TODO: Explain voluntary, revocable self-control in the UI. Users may leave
//       GradeGlow at any time. Never promise to prevent leaving the app.
