"use client";

import Link from "next/link";
import { getCheckoutTarget } from "../lib/checkout";
import { canOpenCheckout, getRecommendedCheckoutLink } from "../lib/monetization";

type UpgradeCardProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export default function UpgradeCard({
  title = "GradeGlow Plus vorbereiten",
  description = "Mehr Module, mehr Prüfungen, Premium-Themes, Export und Circle-Insights. Checkout ist erst aktiv, wenn du ihn in Vercel bewusst verbindest.",
  compact = false,
}: UpgradeCardProps) {
  const link = getRecommendedCheckoutLink();
  const target = getCheckoutTarget(link.cycle);

  const previewHref = `/checkout/success?preview=1&cycle=${link.cycle}`;

  return (
    <div className={`rounded-3xl bg-slate-950 text-white ring-1 ring-slate-900 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
          <p className="mt-2 text-xs font-bold text-violet-200">{link.label} · {link.priceLabel}</p>
          {!target.isLive && <p className="mt-1 text-[0.68rem] font-bold text-slate-400">Fake-Live: Preview setzt keine Rechte und nimmt kein Geld.</p>}
        </div>
        <span className="self-start rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-white ring-1 ring-white/10">
          {canOpenCheckout ? "Checkout aktiv" : "Preview"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {target.isLive ? (
          <a href={target.href} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">
            Plus öffnen
          </a>
        ) : (
          <Link href={previewHref} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">
            Plus Preview testen
          </Link>
        )}
        <Link href="/premium" className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">
          Free vs Plus
        </Link>
        {!target.isLive && (
          <Link href="/monetization" className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">
            Verbinden
          </Link>
        )}
      </div>
    </div>
  );
}
