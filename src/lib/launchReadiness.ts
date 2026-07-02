export type LaunchReadinessCategoryId = "product" | "data" | "beta" | "mobile" | "store";

export type LaunchReadinessCategory = {
  id: LaunchReadinessCategoryId;
  title: string;
  description: string;
};

export type ManualLaunchCheck = {
  id: string;
  categoryId: LaunchReadinessCategoryId;
  title: string;
  description: string;
  owner: "Produkt" | "Technik" | "Recht" | "Beta" | "Store";
  priority: "hoch" | "mittel" | "niedrig";
};

export const launchReadinessCategories: LaunchReadinessCategory[] = [
  {
    id: "product",
    title: "Produktkern",
    description: "Onboarding, Module, Prüfungen, Lernplan und Study Circle müssen für echte Tester stabil wirken.",
  },
  {
    id: "data",
    title: "Daten & Vertrauen",
    description: "Export, Löschung, Auth-Branding und Transparenz müssen vor einer größeren Beta sauber sein.",
  },
  {
    id: "beta",
    title: "Beta-Betrieb",
    description: "Feedback, Diagnostics, Testfälle und Admin-Ablauf müssen ohne Firestore-Handarbeit nutzbar sein.",
  },
  {
    id: "mobile",
    title: "Mobile/PWA",
    description: "GradeGlow soll auf iPhone, iPad und Desktop installierbar und angenehm bedienbar sein.",
  },
  {
    id: "store",
    title: "App-Store-Vorbereitung",
    description: "Noch kein Store-Release, aber alle Unterlagen und Entscheidungen werden strukturiert vorbereitet.",
  },
];

export const manualLaunchChecks: ManualLaunchCheck[] = [
  {
    id: "auth-branding",
    categoryId: "data",
    title: "Firebase Auth-Mail zeigt GradeGlow",
    description: "Neuen Testaccount anlegen und prüfen, dass Verifizierungs-/Reset-Mail nicht mehr project-...-Team zeigt. Falls Firebase die Änderung blockiert: Owner-Rechte/Public-facing name/Auth-Templates in der Console prüfen.",
    owner: "Technik",
    priority: "hoch",
  },
  {
    id: "delete-real-account",
    categoryId: "data",
    title: "Account-Löschung mit echtem Testaccount geprüft",
    description: "Einmal E-Mail/Passwort und einmal Google testen: Reauth, App-Daten, Auth-Account, Redirect zur Startseite.",
    owner: "Beta",
    priority: "hoch",
  },
  {
    id: "privacy-placeholders",
    categoryId: "data",
    title: "Info-/Datenschutz-Platzhalter ersetzt",
    description: "Kontakt, Verantwortliche Stelle, Impressum und Datenschutz vor öffentlicher Beta final prüfen lassen.",
    owner: "Recht",
    priority: "hoch",
  },
  {
    id: "beta-script",
    categoryId: "beta",
    title: "Beta-Test-Skript einmal komplett durchlaufen",
    description: "Neuer Account, Onboarding, Modul, Prüfung, Timer, Study Circle, Export, Löschung und Feedback testen.",
    owner: "Beta",
    priority: "hoch",
  },
  {
    id: "admin-triage",
    categoryId: "beta",
    title: "Feedback-Triage in /admin getestet",
    description: "Feedback markieren als offen, in Arbeit, erledigt, archiviert und interne Admin-Notiz speichern.",
    owner: "Beta",
    priority: "mittel",
  },
  {
    id: "ios-pwa-install",
    categoryId: "mobile",
    title: "iOS PWA-Installation getestet",
    description: "Safari öffnen, Teilen, Zum Home-Bildschirm, App starten, Safe-Area und Standalone-Verhalten prüfen.",
    owner: "Technik",
    priority: "hoch",
  },
  {
    id: "android-desktop-install",
    categoryId: "mobile",
    title: "Android/Desktop PWA-Installation getestet",
    description: "Install-Hinweis, Offline-Seite und Update neu laden auf Chrome/Edge prüfen.",
    owner: "Technik",
    priority: "mittel",
  },
  {
    id: "store-positioning",
    categoryId: "store",
    title: "Store-Positionierung formuliert",
    description: "Ein Satz: Für wen ist GradeGlow, welches Problem löst es und warum ist es besser als Notizen/Excel.",
    owner: "Store",
    priority: "mittel",
  },
  {
    id: "screenshots-plan",
    categoryId: "store",
    title: "Screenshot-Plan erstellt",
    description: "Mindestens Dashboard, Prüfungen/Lernplan, Study Circle, Insights und Datenschutz/Export als Store-Screenshots planen.",
    owner: "Store",
    priority: "mittel",
  },
  {
    id: "pricing-decision",
    categoryId: "store",
    title: "Free/Premium-Grenzen final entschieden",
    description: "Vor Store-Readiness klären, welche Limits kostenlos bleiben und welche Premium-Features sichtbar beworben werden.",
    owner: "Produkt",
    priority: "mittel",
  },
  {
    id: "premium-page-review",
    categoryId: "store",
    title: "Premium-Seite ohne Payment geprüft",
    description: "/premium öffnen und prüfen: keine falschen Zahlungsversprechen, Free/Beta/Plus verständlich, Paywall noch nicht live.",
    owner: "Produkt",
    priority: "mittel",
  },
];

export const priorityOrder: Record<ManualLaunchCheck["priority"], number> = {
  hoch: 0,
  mittel: 1,
  niedrig: 2,
};
