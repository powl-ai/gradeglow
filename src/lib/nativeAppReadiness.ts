export type NativeReadinessCategory = "Setup" | "UI" | "Store" | "Monetarisierung" | "Recht";

export type NativeReadinessItem = {
  id: string;
  category: NativeReadinessCategory;
  title: string;
  description: string;
  priority: "hoch" | "mittel" | "niedrig";
};

export const nativeAppConfig = {
  appId: "app.gradeglow.mobile",
  appName: "GradeGlow",
  webDir: "out",
  currentStrategy: "PWA und Vercel bleiben produktiv. Capacitor ist vorbereitet, aber native Plattformordner werden erst erzeugt, wenn iOS/Android wirklich getestet werden.",
};

export const nativeReadinessItems: NativeReadinessItem[] = [
  {
    id: "config-present",
    category: "Setup",
    priority: "hoch",
    title: "Capacitor Config vorhanden",
    description: "capacitor.config.ts definiert App-ID, App-Name, Web-Verzeichnis und erste Safe-Area-/Statusbar-Defaults.",
  },
  {
    id: "no-native-folders-yet",
    category: "Setup",
    priority: "mittel",
    title: "Noch keine nativen Plattformordner committen",
    description: "ios/ und android/ erst erzeugen, wenn Xcode/Android Studio wirklich für TestFlight/Play-Test gebraucht werden.",
  },
  {
    id: "pwa-shell-stable",
    category: "UI",
    priority: "hoch",
    title: "PWA Shell stabil auf iPhone",
    description: "Home, Plan, Timer, Circle und Profil müssen ohne Header-Overlap, weiße Balken und verdeckte Hotbar funktionieren.",
  },
  {
    id: "native-safe-area-pass",
    category: "UI",
    priority: "hoch",
    title: "Native Safe-Area Testlauf",
    description: "Sobald Capacitor läuft: iPhone mit Dynamic Island, kleines iPhone und Android testen. Appbar darf nicht die Statusbar schneiden.",
  },
  {
    id: "auth-native-flow",
    category: "Setup",
    priority: "hoch",
    title: "Firebase Auth in WebView prüfen",
    description: "E-Mail/Passwort, Google Login, Passwort-Reset und Account-Löschung in Capacitor separat testen. Google kann native Redirect-Konfiguration brauchen.",
  },
  {
    id: "store-assets",
    category: "Store",
    priority: "mittel",
    title: "Native Icons und Splash vorbereiten",
    description: "App-Icon, maskable Icon, iOS Icon-Sets und Splashscreen müssen vor TestFlight sauber erzeugt werden.",
  },
  {
    id: "push-decision",
    category: "Setup",
    priority: "mittel",
    title: "Push-Strategie entscheiden",
    description: "PWA-Push funktioniert schon als Web-App. Native Push braucht später eigene Capacitor-/Firebase-Messaging-Prüfung.",
  },
  {
    id: "iap-decision",
    category: "Monetarisierung",
    priority: "hoch",
    title: "In-App-Purchase-Regeln klären",
    description: "Digitale Plus-Features in iOS sollten vor echten Zahlungen über Apples Regeln geprüft werden. Vorher keine Zahlung live schalten.",
  },
  {
    id: "ads-decision",
    category: "Monetarisierung",
    priority: "mittel",
    title: "Ads nur optional planen",
    description: "Keine Werbung im Timer/Fokus. Wenn Ads kommen, dann höchstens als klare Sponsor Card im Free-Bereich.",
  },
  {
    id: "legal-review",
    category: "Recht",
    priority: "hoch",
    title: "Datenschutz, Impressum und Löschung final prüfen",
    description: "Vor Store-Test mit externen Nutzern müssen Verantwortliche Stelle, Datenexport, Löschung und Support rechtlich sauber sein.",
  },
];
