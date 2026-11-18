// Impressum, Datenschutz und Nutzungsbedingungen der neuen App. Shown in-app (LegalSheet) and on
// /legal/impressum, /legal/privacy, /legal/terms for links from outside (App Store, emails).
// Not legal advice: have it checked before charging money or a bigger public launch.

import { GRADEGLOW_SUPPORT_EMAIL } from "../lib/appVersion";

/** Operator details. Fill in before going public: an Impressum without them is not valid. */
export const LEGAL_OWNER = {
  name: "Paul Matti Vock",
  street: "Binzstraße 61A",
  city: "13189 Berlin",
  email: GRADEGLOW_SUPPORT_EMAIL,
};

export const LEGAL_UPDATED = "18. November 2026";

export type LegalId = "impressum" | "privacy" | "terms";
export type LegalBlock = { title: string; text?: string; items?: string[] };
export type LegalDoc = { id: LegalId; title: string; href: string; blocks: LegalBlock[] };

const owner = [LEGAL_OWNER.name, LEGAL_OWNER.street, LEGAL_OWNER.city, "Deutschland"];

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "impressum", title: "Impressum", href: "/legal/impressum",
    blocks: [
      { title: "Angaben gemäß § 5 DDG", items: owner },
      { title: "Kontakt", items: [`E-Mail: ${LEGAL_OWNER.email}`] },
      { title: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV", items: owner.slice(0, 3) },
      { title: "Verbraucherstreitbeilegung", text: "Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen." },
    ],
  },
  {
    id: "privacy", title: "Datenschutz", href: "/legal/privacy",
    blocks: [
      { title: "Wer verantwortlich ist", text: `${LEGAL_OWNER.name}, ${LEGAL_OWNER.street}, ${LEGAL_OWNER.city}. E-Mail: ${LEGAL_OWNER.email}.` },
      {
        title: "Was GradeGlow speichert",
        items: [
          "Konto: E-Mail-Adresse, Name und die Anmeldeart (E-Mail, Google oder GitHub).",
          "Lerndaten: Klausuren, Themen und wie sicher du sie kannst, Lernblöcke, Fokuszeiten, Noten, ECTS, Stundenplan und Einstellungen.",
        ],
        text: "Das brauchen wir, um dir die App bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO). Wir verkaufen keine Daten und zeigen keine Werbung.",
      },
      {
        title: "Dienste, die wir dafür nutzen",
        items: [
          "Google Firebase (Google Ireland Ltd.): Anmeldung und Speicherung deiner Daten, auf Wunsch Push-Benachrichtigungen.",
          "Vercel Inc.: Hosting der App. Dabei fallen technische Zugriffsdaten wie die IP-Adresse an, die nur kurz gespeichert werden.",
          "Vercel Web Analytics und Speed Insights: anonyme Nutzungs- und Ladezeit-Statistik ohne Cookies und ohne Profil von dir (Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse an einer funktionierenden App).",
          "KI-Quiz (nur Premium): Fach- und Themenname gehen an Anthropic PBC oder Mistral AI, um Fragen zu erstellen. Name, E-Mail oder andere Daten von dir werden dabei nicht übermittelt.",
        ],
        text: "Einige Anbieter sitzen in den USA. Die Übermittlung stützt sich auf das EU-US Data Privacy Framework oder EU-Standardvertragsklauseln.",
      },
      { title: "Auf deinem Gerät", text: "Die App speichert Einstellungen und einen laufenden Fokus-Timer im Speicher deines Browsers (localStorage). Tracking-Cookies setzen wir nicht." },
      { title: "Wie lange", text: "Solange du ein Konto hast. Wenn du es löschen lässt, entfernen wir deine Daten, soweit wir sie nicht gesetzlich aufbewahren müssen." },
      {
        title: "Deine Rechte",
        text: `Du kannst Auskunft, Berichtigung, Löschung, Einschränkung und eine Kopie deiner Daten verlangen und der Verarbeitung widersprechen. Schreib dafür an ${LEGAL_OWNER.email}. Beschweren kannst du dich bei einer Datenschutzaufsicht, etwa der Berliner Beauftragten für Datenschutz und Informationsfreiheit.`,
      },
      { title: "Konto löschen", text: `In der App unter Einstellungen → Konto löschen. Das entfernt dein Konto und alle Lerndaten sofort. Alternativ schreib an ${LEGAL_OWNER.email}.` },
    ],
  },
  {
    id: "terms", title: "Nutzungsbedingungen", href: "/legal/terms",
    blocks: [
      { title: "Was GradeGlow ist", text: "GradeGlow hilft dir, Klausuren rückwärts zu planen und deine Lernzeit festzuhalten. Die App ist in der Beta und kostenlos. Premium-Funktionen werden gerade getestet und können sich ändern." },
      { title: "Kein Versprechen auf Noten", text: "Der Plan ist ein Vorschlag. Ob du bestehst, hängt von dir ab. Für Prüfungstermine und Inhalte gilt, was deine Uni sagt." },
      { title: "KI-Fragen", text: "Quizfragen werden von einer KI erstellt und können falsch sein. Im Zweifel gilt dein Skript." },
      { title: "Fair bleiben", text: "Nutze GradeGlow nur für dich selbst und nicht, um den Dienst zu stören, auszulesen oder zu missbrauchen. Sonst können wir dein Konto sperren." },
      { title: "Verfügbarkeit", text: "Wir geben uns Mühe, dass alles läuft, können aber keine ständige Verfügbarkeit garantieren. Sichere wichtige Daten wie Noten zusätzlich selbst." },
      { title: "Haftung", text: "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit und bei Verletzung von Leben, Körper oder Gesundheit. Sonst nur bei Verletzung wesentlicher Pflichten und begrenzt auf den typischen, vorhersehbaren Schaden." },
      { title: "Kündigen", text: "Du kannst GradeGlow jederzeit nicht mehr nutzen und dein Konto in den Einstellungen löschen." },
      { title: "Änderungen und Recht", text: "Wenn sich diese Bedingungen ändern, sagen wir dir das in der App. Es gilt deutsches Recht." },
    ],
  },
];

export const legalDoc = (id: LegalId) => LEGAL_DOCS.find((doc) => doc.id === id) ?? LEGAL_DOCS[0];
