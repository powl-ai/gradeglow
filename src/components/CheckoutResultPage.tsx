import Link from "next/link";
import GradeGlowLogo from "./GradeGlowLogo";
import { checkoutRedirectPaths, entitlementFlowSteps } from "../lib/checkout";
import { GRADEGLOW_SUPPORT_EMAIL } from "../lib/appVersion";

type CheckoutResultPageProps = {
  result: "success" | "cancel";
};

const copyByResult = {
  success: {
    eyebrow: "Checkout Success",
    title: "Danke — der Checkout-Rückweg ist vorbereitet.",
    text: "Diese Seite ist bereit für Stripe, Lemon Squeezy oder Paddle Redirects. Solange noch keine Webhooks/Functions aktiv sind, muss Plus nach einem echten Kauf manuell in /admin freigeschaltet werden.",
    badge: "Manuelle Freischaltung prüfen",
  },
  cancel: {
    eyebrow: "Checkout Cancel",
    title: "Checkout abgebrochen oder zurück zur App.",
    text: "Diese Seite ist der sichere Rückweg, wenn Nutzer den externen Checkout schließen. Es wird nichts automatisch verändert und kein Entitlement gesetzt.",
    badge: "Keine Änderung am Plan",
  },
};

export default function CheckoutResultPage({ result }: CheckoutResultPageProps) {
  const content = copyByResult[result];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950 gg-safe-x gg-safe-bottom">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-5 px-3 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <GradeGlowLogo size="md" tone="light" />
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">{content.badge}</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">{content.eyebrow}</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{content.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{content.text}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/premium" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Plus ansehen</Link>
                <Link href="/monetization" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Monetarisierung</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <p className="text-sm font-bold text-violet-700">Provider Redirects</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Diese URLs später im Anbieter eintragen</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Success URL</p>
              <p className="mt-2 break-all font-mono text-sm font-black text-slate-950">{checkoutRedirectPaths.success}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Cancel URL</p>
              <p className="mt-2 break-all font-mono text-sm font-black text-slate-950">{checkoutRedirectPaths.cancel}</p>
            </div>
          </div>
          <ol className="mt-5 grid gap-2 text-sm font-semibold leading-6 text-slate-600">
            {entitlementFlowSteps.map((step, index) => (
              <li key={step} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                <span className="mr-2 font-black text-violet-700">{index + 1}.</span>{step}
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800 ring-1 ring-amber-100">
            Support bei Kauf-/Freischaltungsfragen: {GRADEGLOW_SUPPORT_EMAIL}
          </p>
        </section>
      </div>
    </main>
  );
}
