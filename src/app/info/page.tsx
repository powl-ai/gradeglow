import Link from "next/link";
import GradeGlowLogo from "../../components/GradeGlowLogo";

const dataItems = [
  "Accountdaten wie E-Mail-Adresse, Anzeigename und Login-Anbieter",
  "Profilangaben wie Name, Studiengang und Ziel-ECTS",
  "Module, Semester, ECTS, Status, Noten und Einzelleistungen",
  "Prüfungen, Lernplan-Inhalte und Stundenplan, wenn du sie in GradeGlow anlegst",
  "Freundeslisten, Study-Circle-Aktivitäten und Benachrichtigungseinstellungen",
  "Feedback, Bugmeldungen oder Löschanfragen, die du über die App sendest",
  "lokale Browserdaten für PWA, Offline-Seite, Cache und lokale Backups",
];

const storageItems = [
  {
    title: "Firebase Authentication",
    text: "wird für E-Mail/Passwort, Google, GitHub und optional Apple Login verwendet.",
  },
  {
    title: "Cloud Firestore",
    text: "speichert deine GradeGlow-Daten accountbasiert unter deinem Nutzerpfad.",
  },
  {
    title: "Vercel",
    text: "hostet die Web-App und liefert die App-Dateien an deinen Browser aus.",
  },
  {
    title: "Browser/PWA Cache",
    text: "speichert App-Dateien lokal, damit GradeGlow schneller lädt und eine Offline-Seite anzeigen kann.",
  },
];

export default function InfoPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-4 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" />
                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">
                    Transparenz & Kontakt
                  </div>
                </div>

                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">
                  GradeGlow Info
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Datenschutz, Impressum & App-Infos.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Diese Seite ist als sauberer Startpunkt gedacht. Ersetze die Platzhalter vor einer
                  öffentlichen Nutzung durch deine echten Angaben und lass sie bei Bedarf rechtlich prüfen.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link
                  href="/"
                  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
                >
                  Zur App
                </Link>
                <Link
                  href="/settings"
                  className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Profil öffnen
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Impressum Platzhalter</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Verantwortlich für GradeGlow</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
                <p className="font-black text-slate-900">[Paul Matti Vock]</p>
                <p>[Binzstraße 61A]</p>
                <p>[13189 Berlin]</p>
                <p>[Deutschland]</p>
              </div>

              <div>
                <p className="font-black text-slate-900">Kontakt</p>
                <p>E-Mail: gradeglow.support@icloud.com</p>
              </div>

              <p className="rounded-2xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-100">
                Hinweis: Diese Angaben sind bewusst Platzhalter. Für eine öffentliche App solltest du hier
                keine Fake-Daten stehen lassen.
              </p>
            </div>
          </article>

          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Datenschutz kurz erklärt</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Welche Daten GradeGlow speichert</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              GradeGlow verarbeitet nur Daten, die für Login, Cloud-Sync und deine Studienübersicht
              benötigt werden. Die konkreten Inhalte entstehen durch deine Eingaben in der App.
            </p>

            <div className="mt-5 grid gap-3">
              {dataItems.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-bold text-violet-700">Technische Dienste</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Wofür Firebase, Vercel und dein Browser genutzt werden</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {storageItems.map((item) => (
              <div key={item.title} className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl bg-slate-950 p-5 text-white shadow-2xl shadow-violet-950/20 sm:p-6">
            <p className="text-sm font-bold text-fuchsia-200">Nutzerrechte & Löschung</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Daten exportieren oder entfernen</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              In den Einstellungen kannst du einen JSON-Export erstellen, App-Daten löschen oder den Account entfernen. Zusätzlich kannst du über die Feedback-Seite eine Datenschutz- oder Löschanfrage speichern. Kontakt: gradeglow.support@icloud.com.
            </p>
          </article>

          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Entwickler-Checkliste</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Vor dem Teilen der App prüfen</h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <li>□ echte Impressumsdaten eintragen</li>
              <li>□ Kontaktmail prüfen: gradeglow.support@icloud.com</li>
              <li>□ Firebase-/Vercel-Projektname prüfen</li>
              <li>□ Datenexport und Löschung in Einstellungen testen</li>
              <li>□ Admin-Account in entitlements einmalig auf plan = admin setzen</li>
              <li>□ Seite nach finalem Hosting-Domainwechsel nochmal prüfen</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
