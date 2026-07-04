import { GRADEGLOW_SUPPORT_EMAIL } from "./appVersion";

export type LegalPageId = "overview" | "impressum" | "privacy" | "terms" | "refund" | "delete-account" | "ads";

export type LegalChecklistItem = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "needs_review" | "ready_to_fill";
};

export type LegalSection = {
  id: LegalPageId;
  href: string;
  eyebrow: string;
  title: string;
  summary: string;
  blocks: Array<{
    title: string;
    text: string;
    items?: string[];
  }>;
};

export const LEGAL_LAST_UPDATED = "04.07.2026";

export const legalOwnerPlaceholders = {
  appName: "GradeGlow",
  responsibleName: "[Name / Betreiber eintragen]",
  addressLine1: "[Straße und Hausnummer eintragen]",
  addressLine2: "[PLZ und Ort eintragen]",
  country: "Deutschland",
  supportEmail: GRADEGLOW_SUPPORT_EMAIL,
};

export const legalSections: LegalSection[] = [
  {
    id: "impressum",
    href: "/legal/impressum",
    eyebrow: "Impressum",
    title: "Verantwortliche Stelle eintragen",
    summary: "Struktur für Anbieterkennzeichnung, Kontakt und Projektverantwortung. Vor Veröffentlichung mit echten Daten füllen.",
    blocks: [
      {
        title: "Anbieter / verantwortlich",
        text: "Trage hier die Person oder Gesellschaft ein, die GradeGlow betreibt. Die aktuellen Werte sind bewusst Platzhalter.",
        items: [
          legalOwnerPlaceholders.responsibleName,
          legalOwnerPlaceholders.addressLine1,
          legalOwnerPlaceholders.addressLine2,
          legalOwnerPlaceholders.country,
        ],
      },
      {
        title: "Kontakt",
        text: `Support und rechtliche Anfragen laufen über ${GRADEGLOW_SUPPORT_EMAIL}. Ergänze später Telefonnummer oder weitere Pflichtangaben nur, wenn sie für deine konkrete Veröffentlichung nötig sind.`,
      },
      {
        title: "Hinweis",
        text: "Diese Seite ist ein technischer Platzhalter und keine Rechtsberatung. Vor Live-Zahlungen, Ads oder einem größeren öffentlichen Launch final prüfen lassen.",
      },
    ],
  },
  {
    id: "privacy",
    href: "/legal/privacy",
    eyebrow: "Datenschutz",
    title: "Datenschutzerklärung vorbereiten",
    summary: "Erklärt Datenarten, Firebase/Vercel, Account-Löschung, Export und optionale Ads/Payments als vorbereitete Struktur.",
    blocks: [
      {
        title: "Welche Daten GradeGlow verarbeitet",
        text: "GradeGlow verarbeitet Daten, die Nutzer selbst eingeben oder die für Login, Synchronisierung und App-Betrieb technisch nötig sind.",
        items: [
          "Accountdaten: E-Mail, Anzeigename, Login-Anbieter, Firebase UID",
          "Studieninhalte: Module, Prüfungen, Lernplan, Stundenplan, Notizen, Lernzeiten",
          "Profil: Anzeigename, Studiengang, Theme, Feature-Auswahl, Benachrichtigungseinstellungen",
          "Study Circle: Freundescode, Freundesliste, öffentliche Lernprofil-Werte, wenn Sharing aktiviert ist",
          "Feedback/Diagnostics: freiwillige Bugmeldungen, App-Version, Seite und technische Hinweise",
          "Lokale Daten: PWA Cache, lokale Einstellungen, Browser-Speicher und optionale Backups",
        ],
      },
      {
        title: "Dienste",
        text: "Die App nutzt Firebase Authentication für Login, Cloud Firestore für accountbasierte Daten, Vercel für Hosting und Browser/PWA-Funktionen für Cache und Offline-Seite.",
      },
      {
        title: "Payments und Ads",
        text: "Zahlungsanbieter, Sponsor-Slots und AdSense sind technisch vorbereitet, aber standardmäßig nicht live. Sobald diese aktiviert werden, müssen Anbieter, Rechtsgrundlage, Consent und Datenflüsse final ergänzt werden.",
      },
      {
        title: "Rechte der Nutzer",
        text: "Nutzer können Export, App-Daten-Löschung und Account-Löschung in GradeGlow verwenden. Zusätzlich können sie Anfragen per Mail stellen.",
      },
    ],
  },
  {
    id: "terms",
    href: "/legal/terms",
    eyebrow: "Nutzungsbedingungen",
    title: "Regeln für Free, Beta und Plus",
    summary: "Saubere Basis für Beta-Nutzung, Account-Regeln, Studienhinweise, Fair Use und spätere Plus-Funktionen.",
    blocks: [
      {
        title: "Beta-Charakter",
        text: "GradeGlow befindet sich in einer Beta-Phase. Funktionen können sich ändern, Datenmodelle können erweitert werden und einzelne Bereiche können noch Fehler enthalten.",
      },
      {
        title: "Kein offizieller Studiennachweis",
        text: "GradeGlow hilft bei Planung und Übersicht, ersetzt aber keine offiziellen Informationen deiner Hochschule, Prüfungsordnung, Lehrveranstaltung oder Prüfungsverwaltung.",
      },
      {
        title: "Fair Use",
        text: "Nutzer sollen keine fremden Accounts missbrauchen, keine rechtswidrigen Inhalte speichern und Feedback-/Circle-Funktionen nicht zum Spam verwenden.",
      },
      {
        title: "Free und Plus",
        text: "Free-Funktionen bleiben nutzbar. Plus-Funktionen, Limits, Preise und Laufzeiten werden vor Aktivierung sichtbar erklärt. Noch sind keine echten Zahlungen aktiv.",
      },
    ],
  },
  {
    id: "refund",
    href: "/legal/refund",
    eyebrow: "Widerruf & Kündigung",
    title: "Zahlungs- und Widerrufshinweise vorbereiten",
    summary: "Struktur für spätere Checkout-Links, Laufzeiten, Testkäufe, Kündigung und Support-Prozess.",
    blocks: [
      {
        title: "Aktueller Status",
        text: "GradeGlow nimmt aktuell über diese Codebasis keine echten Zahlungen an. Checkout-Links bleiben deaktiviert, solange NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT nicht bewusst aktiviert wird.",
      },
      {
        title: "Spätere Zahlungsanbieter",
        text: "Bei Stripe, Lemon Squeezy, Paddle oder App Stores müssen konkrete Preise, Laufzeiten, Steuern, Rechnung, Widerruf und Kündigungsweg passend zum Anbieter ergänzt werden.",
      },
      {
        title: "Support-Prozess",
        text: `Fragen zu Zahlungen, Kündigung oder versehentlichen Buchungen sollen an ${GRADEGLOW_SUPPORT_EMAIL} gehen. Vor Livegang einen internen Ablauf für Testkauf, Freischaltung und Rückerstattung definieren.`,
      },
    ],
  },
  {
    id: "delete-account",
    href: "/legal/delete-account",
    eyebrow: "Account-Löschung",
    title: "Datenexport und Löschung transparent machen",
    summary: "Erklärt, wie Nutzer ihre Daten sichern, App-Daten löschen oder den kompletten Account entfernen können.",
    blocks: [
      {
        title: "In der App",
        text: "Die Einstellungen enthalten Export, App-Daten-Löschung und Account-Löschung mit Reauth. Google- und E-Mail/Passwort-Konten sollten separat getestet werden.",
        items: [
          "Einstellungen öffnen",
          "Backup/Export herunterladen, falls gewünscht",
          "App-Daten löschen oder Account löschen wählen",
          "Reauth durchführen",
          "Bestätigen und zurück zur Startseite wechseln",
        ],
      },
      {
        title: "Per Mail",
        text: `Falls die App nicht erreichbar ist, können Nutzer eine Lösch- oder Datenschutzanfrage an ${GRADEGLOW_SUPPORT_EMAIL} senden.`,
      },
    ],
  },
  {
    id: "ads",
    href: "/legal/ads",
    eyebrow: "Ads & Sponsoring",
    title: "Monetarisierungs-Hinweise vorbereiten",
    summary: "Legt fest, wie GradeGlow Werbung, Sponsoren und Plus-Hinweise fair und lernfreundlich kommuniziert.",
    blocks: [
      {
        title: "Produktprinzip",
        text: "Plus soll das Hauptmodell bleiben. Ads und Sponsoren dürfen Lernphasen, Timer, kritische Buttons oder Datenschutzbereiche nicht stören.",
      },
      {
        title: "Kennzeichnung",
        text: "Sponsor-Slots müssen klar als Anzeige, Sponsor oder Empfehlung gekennzeichnet werden. Native App Stores und Ad-Netzwerke können weitere Vorgaben haben.",
      },
      {
        title: "Consent und Datenschutz",
        text: "AdSense oder personalisierte Werbung erst aktivieren, wenn Consent, Datenschutzangaben und Anbieterlisten final eingerichtet sind.",
      },
    ],
  },
];

export const legalNavigation = [
  { id: "overview", href: "/legal", label: "Legal Hub" },
  ...legalSections.map((section) => ({ id: section.id, href: section.href, label: section.eyebrow })),
];

export const legalReadinessChecklist: LegalChecklistItem[] = [
  {
    id: "real-owner-data",
    title: "Echte Betreiberangaben eintragen",
    description: "Name, Anschrift und Kontakt müssen vor öffentlicher Nutzung korrekt sein.",
    status: "ready_to_fill",
  },
  {
    id: "privacy-provider-details",
    title: "Firebase/Vercel/Payment/Ads final prüfen",
    description: "Datenflüsse und Anbieter ändern sich, sobald Payments oder Ads aktiviert werden.",
    status: "needs_review",
  },
  {
    id: "checkout-terms",
    title: "Preise, Laufzeiten und Widerruf finalisieren",
    description: "Vor echten Zahlungen müssen Plus-Details und Kündigungs-/Widerrufsprozess eindeutig sein.",
    status: "needs_review",
  },
  {
    id: "delete-flow-tested",
    title: "Account-Löschung testen",
    description: "E-Mail/Passwort und Google Login jeweils mit Testaccounts prüfen.",
    status: "draft",
  },
  {
    id: "ads-consent-ready",
    title: "Ads nur mit Consent live schalten",
    description: "AdSense/Sponsor-Slots bleiben deaktiviert, bis Consent und Datenschutz final sind.",
    status: "needs_review",
  },
];

export const getLegalSection = (id: LegalPageId) => legalSections.find((section) => section.id === id);

export const isLegalStructureReady = legalSections.length >= 6 && legalReadinessChecklist.length >= 5;
