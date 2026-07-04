"use client";

import Link from "next/link";
import GradeGlowLogo from "./GradeGlowLogo";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { formatLimit, getPlanLimits, planLabels } from "../lib/gradeglowAccess";
import { getFeatureAccess, premiumBoundaryRows } from "../lib/featureGates";
import { canOpenCheckout, checkoutLinks } from "../lib/monetization";
import UpgradeCard from "./UpgradeCard";
import PremiumPreviewCheckoutCard from "./PremiumPreviewCheckoutCard";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import type { AppUser } from "../types";

export default function PremiumBoundariesPage({ user, onLogout }: { user: AppUser; onLogout: () => Promise<void> }) {
  const { entitlement, limits, accessSyncMessage } = useGradeGlowAccess(user);
  const { profile } = useGradeGlowProfile(user);
  const effectivePageThemeId = getEffectivePageThemeId(profile.activePageThemeId, limits.premiumThemes);
  const themeClassName = getThemeClassName(profile.themeMode);
  const themeStyle = getPageThemeStyle(effectivePageThemeId);
  const freeLimits = getPlanLimits("free");
  const plusLimits = getPlanLimits("premium");

  return (
    <main className={`gg-themed ${themeClassName} min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950`} data-accent={profile.accentColor} data-page-theme={effectivePageThemeId} style={themeStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-5 sm:p-8">
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" appIconId={profile.activeAppIconId} />
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">{accessSyncMessage}</span>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-fuchsia-200/80">Premium vorbereitet</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Free, Beta und Plus sauber trennen.</h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-300">
                  Diese Seite definiert die Produktgrenzen, ohne echte Zahlungen zu aktivieren. GradeGlow Plus ist vorbereitet, aber noch keine Paywall und kein Zahlungsanbieter sind live.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/launch" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Launch Center</Link>
                <Link href="/monetization" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Monetarisierung</Link>
                <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-sm font-bold text-violet-700">Dein aktueller Plan</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{planLabels[entitlement.plan]}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Quelle: {entitlement.premiumSource || "default"} · bis {entitlement.premiumUntil || "ohne Ablauf"}</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-sm font-bold text-violet-700">Free Limits</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{formatLimit(freeLimits.maxModules)} Module · {formatLimit(freeLimits.maxExams)} Prüfungen</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Freunde: {formatLimit(freeLimits.maxFriends)} · Basisdesign · Kernfunktionen kostenlos.</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-sm font-bold text-violet-700">Plus vorbereitet</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Unbegrenzter Kern + Cosmetics</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Module: {formatLimit(plusLimits.maxModules)} · Prüfungen: {formatLimit(plusLimits.maxExams)} · Freunde: {formatLimit(plusLimits.maxFriends)}</p>
          </div>
        </section>

        <PremiumPreviewCheckoutCard />

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Feature-Gates</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Was bleibt Free, was wird Plus?</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Die Regeln sind zentral vorbereitet. Später kann eine echte Paywall diese Gates nutzen, ohne die ganze App umzubauen.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">Payments noch nicht aktiv</span>
          </div>

          <div className="gg-premium-table-desktop mt-5 overflow-hidden rounded-3xl ring-1 ring-slate-200">
            <div className="grid grid-cols-4 bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">
              <p>Feature</p>
              <p>Free</p>
              <p>Plus</p>
              <p>Beta/Admin</p>
            </div>
            <div className="divide-y divide-slate-200 bg-white/70">
              {premiumBoundaryRows.map((row) => {
                const access = getFeatureAccess(row.featureId, entitlement, limits);
                return (
                  <div key={row.featureId} className="grid gap-3 px-4 py-4 text-sm font-semibold text-slate-600 sm:grid-cols-4">
                    <div>
                      <p className="font-black text-slate-950">{row.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{access.label}</p>
                    </div>
                    <p>{row.free}</p>
                    <p>{row.plus}</p>
                    <p>{row.beta}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gg-premium-mobile-cards mt-4 hidden gap-3">
            {premiumBoundaryRows.map((row) => {
              const access = getFeatureAccess(row.featureId, entitlement, limits);
              return (
                <article key={row.featureId} className="rounded-2xl bg-white/80 p-3 text-sm ring-1 ring-slate-200">
                  <p className="font-black text-slate-950">{row.title}</p>
                  <p className="mt-1 text-xs font-bold text-violet-700">{access.label}</p>
                  <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600">
                    <p><span className="font-black text-slate-900">Free:</span> {row.free}</p>
                    <p><span className="font-black text-slate-900">Plus:</span> {row.plus}</p>
                    <p><span className="font-black text-slate-900">Beta/Admin:</span> {row.beta}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>


        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Monetarisierung</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Plus zuerst, Ads nur vorsichtig.</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Checkout-Links und Sponsor Slots sind jetzt vorbereitet. Live wird es erst, wenn du die ENV-Flags in Vercel bewusst aktivierst.</p>
            </div>
            <Link href="/monetization" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">Monetarisierung öffnen</Link>
          </div>
          <div className="mt-4">
            <UpgradeCard />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {checkoutLinks.map((link) => (
              <div key={link.cycle} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{link.isConfigured ? "Verbunden" : "ENV fehlt"}</p>
                <h3 className="mt-2 font-black">{link.label}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{link.priceLabel}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800 ring-1 ring-amber-100">Checkout-Status: {canOpenCheckout ? "aktiv" : "Preview"}. Vor echten Zahlungen Impressum, Datenschutz, AGB/Widerruf und Support finalisieren.</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Paywall-Status</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Noch keine echte Zahlung.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">GradeGlow zeigt Premium-Vorteile nur vorbereitend an. Vor echten Zahlungen müssen Impressum, Datenschutz, Support-Prozess, Widerrufs-/AGB-Themen und Zahlungsanbieter final geprüft werden.</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Beta-Badge</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">„Seit Beta 2026 dabei“</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">Öffentliche Study-Circle-Profile veröffentlichen jetzt ein Badge. In Circle-Profilen kann man später sehen, wer schon in der Beta dabei war.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
