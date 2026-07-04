import Link from "next/link";
import {
  activeCheckoutProvider,
  checkoutRedirectPaths,
  getCheckoutTarget,
} from "../lib/checkout";
import { canOpenCheckout, checkoutLinks, monetizationMode } from "../lib/monetization";

const cycleMeta = {
  monthly: {
    eyebrow: "Flexibel",
    benefit: "für erste Plus-Tests",
  },
  yearly: {
    eyebrow: "Empfohlen",
    benefit: "bester Standard-Plan",
  },
  lifetime: {
    eyebrow: "Beta",
    benefit: "Early-Supporter-Idee",
  },
};

export default function PremiumPreviewCheckoutCard() {
  return (
    <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-violet-950/15 ring-1 ring-white/10">
      <div className="relative p-5 sm:p-6">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-200/80">Fake-Live Premium</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Plus sieht kaufbereit aus, Geldfluss bleibt aus.</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                Nutzer sehen echte Plus-Pakete, Preise und CTA-Buttons. Solange Checkout nicht per ENV aktiviert ist, öffnet der Button nur einen Preview-Rückweg und setzt keine Rechte.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-violet-50 ring-1 ring-white/10">
                {canOpenCheckout ? "Checkout aktiv" : "Preview-Modus"}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-violet-50 ring-1 ring-white/10">
                {activeCheckoutProvider.label}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {checkoutLinks.map((link) => {
              const target = getCheckoutTarget(link.cycle);
              const meta = cycleMeta[link.cycle];
              const previewHref = `/checkout/success?preview=1&cycle=${link.cycle}`;

              return (
                <article key={link.cycle} className={`rounded-3xl p-4 ring-1 ${link.recommended ? "bg-white text-slate-950 ring-white" : "bg-white/10 text-white ring-white/10"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-[0.16em] ${link.recommended ? "text-violet-700" : "text-violet-200"}`}>{meta.eyebrow}</p>
                      <h3 className="mt-2 text-lg font-black">{link.label}</h3>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black ring-1 ${link.isConfigured ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : link.recommended ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-white/10 text-white ring-white/10"}`}>
                      {link.isConfigured ? "Verbunden" : "Fake"}
                    </span>
                  </div>
                  <p className={`mt-3 text-2xl font-black tracking-tight ${link.recommended ? "text-slate-950" : "text-white"}`}>{link.priceLabel}</p>
                  <p className={`mt-2 text-sm font-semibold leading-6 ${link.recommended ? "text-slate-500" : "text-slate-300"}`}>{meta.benefit}</p>

                  {target.isLive ? (
                    <a href={target.href} target="_blank" rel="noreferrer" className={`mt-4 block rounded-2xl px-4 py-3 text-center text-sm font-black transition hover:-translate-y-0.5 ${link.recommended ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-white text-slate-950 hover:bg-violet-50"}`}>
                      Plus öffnen
                    </a>
                  ) : (
                    <Link href={previewHref} className={`mt-4 block rounded-2xl px-4 py-3 text-center text-sm font-black transition hover:-translate-y-0.5 ${link.recommended ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-white text-slate-950 hover:bg-violet-50"}`}>
                      Preview testen
                    </Link>
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 rounded-3xl bg-white/10 p-4 text-sm font-semibold leading-6 text-slate-300 ring-1 ring-white/10 lg:grid-cols-[1fr_auto] lg:items-center">
            <p>
              Flow: Plus-Karte → Payment-Link später extern → {checkoutRedirectPaths.success} oder {checkoutRedirectPaths.cancel} → Admin prüft Kauf → entitlements/{"{uid}"} wird manuell gesetzt. Modus aktuell: {monetizationMode}.
            </p>
            <Link href="/admin" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">
              Admin öffnen
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
