import Link from "next/link";
import GradeGlowLogo from "./GradeGlowLogo";
import { GRADEGLOW_APP_VERSION } from "../lib/appVersion";
import {
  LEGAL_LAST_UPDATED,
  getLegalSection,
  legalNavigation,
  legalOwnerPlaceholders,
  legalReadinessChecklist,
  legalSections,
  type LegalPageId,
} from "../lib/legal";

const statusLabels = {
  draft: "Entwurf",
  needs_review: "Prüfen",
  ready_to_fill: "Ausfüllen",
};

const statusClass = {
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  needs_review: "bg-amber-50 text-amber-700 ring-amber-100",
  ready_to_fill: "bg-violet-50 text-violet-700 ring-violet-100",
};

type LegalCenterPageProps = {
  page?: LegalPageId;
};

export default function LegalCenterPage({ page = "overview" }: LegalCenterPageProps) {
  const currentSection = page === "overview" ? undefined : getLegalSection(page);
  const isOverview = !currentSection;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950 gg-safe-top gg-safe-x gg-safe-bottom">
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
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">
                    Legal Draft · {LEGAL_LAST_UPDATED}
                  </span>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">GradeGlow Rechtliches</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {isOverview ? "Impressum, Datenschutz und Payments sauber vorbereiten." : currentSection.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  {isOverview
                    ? "Technische Struktur für rechtliche Seiten, bevor Plus, Sponsor-Slots oder Ads wirklich live gehen. Inhalte sind Platzhalter und keine Rechtsberatung."
                    : currentSection.summary}
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/monetization" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Monetarisierung</Link>
                <Link href="/launch" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Launch Center</Link>
              </div>
            </div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-3xl bg-white/80 p-2 shadow-sm ring-1 ring-violet-100 backdrop-blur">
          {legalNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-black transition ${item.id === page ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-violet-50 hover:text-violet-700"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isOverview ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {legalSections.map((section) => (
                <Link key={section.id} href={section.href} className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur transition hover:-translate-y-0.5 hover:ring-violet-200">
                  <p className="text-sm font-bold text-violet-700">{section.eyebrow}</p>
                  <h2 className="mt-2 text-xl font-black tracking-tight">{section.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{section.summary}</p>
                </Link>
              ))}
            </section>

            <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
                <p className="text-sm font-bold text-violet-700">Platzhalterdaten</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Vor Livegang ersetzen</h2>
                <div className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm font-semibold leading-6 text-slate-700 ring-1 ring-violet-100">
                  <p className="font-black text-slate-950">{legalOwnerPlaceholders.responsibleName}</p>
                  <p>{legalOwnerPlaceholders.addressLine1}</p>
                  <p>{legalOwnerPlaceholders.addressLine2}</p>
                  <p>{legalOwnerPlaceholders.country}</p>
                  <p className="mt-3">E-Mail: {legalOwnerPlaceholders.supportEmail}</p>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
                  Bewusst keine echten Privatdaten im Template: erst vor Veröffentlichung ausfüllen und prüfen.
                </p>
              </article>

              <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
                <p className="text-sm font-bold text-violet-700">Readiness</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Was vor Geld/Ads offen bleibt</h2>
                <div className="mt-4 grid gap-3">
                  {legalReadinessChecklist.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black text-slate-950">{item.title}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-black ring-1 ${statusClass[item.status]}`}>{statusLabels[item.status]}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{item.description}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <aside className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-violet-700">Status</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Noch Entwurf</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                Diese Seite ist strukturell vorbereitet. Vor einem öffentlichen Launch und vor echten Zahlungen bitte echte Angaben einsetzen und prüfen lassen.
              </p>
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 ring-1 ring-amber-100">
                Kein Ersatz für Rechtsberatung. Payments/Ads erst aktivieren, wenn diese Texte final sind.
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-400">{GRADEGLOW_APP_VERSION}</p>
            </aside>

            <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <p className="text-sm font-bold text-violet-700">{currentSection.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{currentSection.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{currentSection.summary}</p>
              <div className="mt-5 grid gap-4">
                {currentSection.blocks.map((block) => (
                  <section key={block.title} className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <h3 className="text-lg font-black tracking-tight text-slate-950">{block.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{block.text}</p>
                    {block.items && (
                      <ul className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
                        {block.items.map((item) => (
                          <li key={item} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">{item}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}
