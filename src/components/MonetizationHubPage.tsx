"use client";

import Link from "next/link";
import GradeGlowLogo from "./GradeGlowLogo";
import UpgradeCard from "./UpgradeCard";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { GRADEGLOW_APP_VERSION } from "../lib/appVersion";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import {
  areSponsorSlotsEnabled,
  billingProvider,
  canOpenCheckout,
  checkoutLinks,
  isAdSenseEnabled,
  monetizationMode,
  monetizationReadinessChecks,
  monetizationSlots,
} from "../lib/monetization";
import type { AppUser } from "../types";

const statusClass = {
  ready: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  needs_config: "bg-amber-50 text-amber-700 ring-amber-100",
  blocked: "bg-rose-50 text-rose-700 ring-rose-100",
};

const statusLabel = {
  ready: "Bereit",
  needs_config: "Verbinden",
  blocked: "Blocker",
};

export default function MonetizationHubPage({ user, onLogout }: { user: AppUser; onLogout: () => Promise<void> }) {
  const { limits, accessSyncMessage } = useGradeGlowAccess(user);
  const { profile } = useGradeGlowProfile(user);
  const effectivePageThemeId = getEffectivePageThemeId(profile.activePageThemeId, limits.premiumThemes);
  const themeClassName = getThemeClassName(profile.themeMode);
  const themeStyle = getPageThemeStyle(effectivePageThemeId);
  const readyCount = monetizationReadinessChecks.filter((check) => check.status === "ready").length;
  const score = Math.round((readyCount / monetizationReadinessChecks.length) * 100);
  const report = [
    `GradeGlow Monetization Report`,
    `Version: ${GRADEGLOW_APP_VERSION}`,
    `Mode: ${monetizationMode}`,
    `Billing Provider: ${billingProvider}`,
    `Checkout enabled: ${canOpenCheckout ? "yes" : "no"}`,
    `Sponsor Slots: ${areSponsorSlotsEnabled ? "enabled" : "disabled"}`,
    `AdSense: ${isAdSenseEnabled ? "enabled" : "disabled"}`,
    `Readiness: ${score}%`,
    `Next: Rechtliche Seiten finalisieren, Payment-Link verbinden, Testkauf mit Testaccount, Entitlement manuell prüfen.`,
  ].join("\n");

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      // ignore
    }
  };

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
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-fuchsia-200/80">Monetarisierung</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Zahlung, Plus und Ads anschlussbereit machen.</h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-300">
                  Noch keine echten Zahlungen nötig: Hier siehst du, welche ENV-Variablen, Checkout-Links, Sponsor-Slots und rechtlichen Blocker fehlen, damit du später nur noch verbinden musst.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link href="/premium" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Premium Seite</Link>
                <Link href="/launch" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Launch Center</Link>
                <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Readiness</p>
            <p className="mt-2 text-3xl font-black tracking-tight">{score}%</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{readyCount} / {monetizationReadinessChecks.length} Checks bereit</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Provider</p>
            <p className="mt-2 text-2xl font-black tracking-tight">{billingProvider}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">per ENV umstellbar</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Checkout</p>
            <p className="mt-2 text-2xl font-black tracking-tight">{canOpenCheckout ? "Aktiv" : "Preview"}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Links + Enable-Flag nötig</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Ads</p>
            <p className="mt-2 text-2xl font-black tracking-tight">{areSponsorSlotsEnabled || isAdSenseEnabled ? "Vorbereitet" : "Aus"}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">nicht im Timer/Fokus</p>
          </div>
        </section>

        <UpgradeCard />

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <p className="text-sm font-bold text-violet-700">Checkout Links</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Nur noch Payment-Link eintragen.</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {checkoutLinks.map((link) => (
              <article key={link.cycle} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-950">{link.label}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{link.priceLabel}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black ring-1 ${link.isConfigured ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"}`}>{link.isConfigured ? "Link da" : "ENV fehlt"}</span>
                </div>
                <p className="mt-3 break-all rounded-xl bg-white p-3 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{link.url || `NEXT_PUBLIC_GRADEGLOW_PLUS_${link.cycle.toUpperCase()}_URL`}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <p className="text-sm font-bold text-violet-700">Readiness Checks</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Was vor echtem Geld noch offen ist</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {monetizationReadinessChecks.map((check) => (
              <article key={check.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{check.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">Owner: {check.owner}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black ring-1 ${statusClass[check.status]}`}>{statusLabel[check.status]}</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{check.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <p className="text-sm font-bold text-violet-700">Ads/Sponsor Slots</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Vorsichtig vorbereitet, standardmäßig aus.</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {monetizationSlots.map((slot) => (
              <article key={slot.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-slate-950">{slot.label}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black ring-1 ${slot.allowed ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-rose-50 text-rose-700 ring-rose-100"}`}>{slot.allowed ? "OK" : "Nein"}</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{slot.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm ring-1 ring-slate-900 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-200">Connect-Checkliste</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">ENV in Vercel setzen, dann testen.</h2>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-white/10 p-4 text-xs font-semibold leading-6 text-slate-200 ring-1 ring-white/10">{`NEXT_PUBLIC_GRADEGLOW_BILLING_PROVIDER=stripe
NEXT_PUBLIC_GRADEGLOW_ENABLE_CHECKOUT=false
NEXT_PUBLIC_GRADEGLOW_PLUS_MONTHLY_URL=
NEXT_PUBLIC_GRADEGLOW_PLUS_YEARLY_URL=
NEXT_PUBLIC_GRADEGLOW_PLUS_LIFETIME_URL=
NEXT_PUBLIC_GRADEGLOW_ENABLE_SPONSOR_SLOTS=false
NEXT_PUBLIC_GRADEGLOW_ENABLE_ADSENSE=false
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=`}</pre>
            </div>
            <button type="button" onClick={copyReport} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50">Report kopieren</button>
          </div>
        </section>
      </div>
    </main>
  );
}
