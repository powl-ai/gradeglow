"use client";

import Link from "next/link";
import GradeGlowLogo from "./GradeGlowLogo";
import UpgradeCard from "./UpgradeCard";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { useGradeGlowProfile } from "../hooks/useGradeGlowProfile";
import { GRADEGLOW_APP_VERSION } from "../lib/appVersion";
import {
  activeCheckoutProvider,
  checkoutFlowSteps,
  checkoutProviderOptions,
  checkoutRedirectPaths,
  entitlementFlowSteps,
  getCheckoutTarget,
} from "../lib/checkout";
import { getEffectivePageThemeId, getPageThemeStyle, getThemeClassName } from "../lib/gradeglowThemes";
import {
  areSponsorSlotsEnabled,
  billingProvider,
  canOpenCheckout,
  checkoutLinks,
  isAdSenseEnabled,
  isPaymentProviderSelected,
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

const stepStatusClass = {
  ready: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  manual: "bg-amber-50 text-amber-700 ring-amber-100",
  later: "bg-slate-100 text-slate-600 ring-slate-200",
};

const stepStatusLabel = {
  ready: "Bereit",
  manual: "Manuell",
  later: "Später",
};

const recommendationLabel = {
  best_start: "Start-Empfehlung",
  good_later: "Gut später",
  native_later: "Native später",
  disabled: "Preview",
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
    `Provider selected: ${isPaymentProviderSelected ? "yes" : "no"}`,
    `Checkout enabled: ${canOpenCheckout ? "yes" : "no"}`,
    `Success URL: ${checkoutRedirectPaths.success}`,
    `Cancel URL: ${checkoutRedirectPaths.cancel}`,
    `Sponsor Slots: ${areSponsorSlotsEnabled ? "enabled" : "disabled"}`,
    `AdSense: ${isAdSenseEnabled ? "enabled" : "disabled"}`,
    `Readiness: ${score}%`,
    `Manual entitlement flow: Nutzer kauft extern -> Kauf prüfen -> /admin -> entitlements/{uid} plan=premium premiumSource=payment_manual premiumStatus=active`,
    `Next: Provider wählen, Legal Hub finalisieren, Payment-Link verbinden, Testkauf mit Testaccount, Entitlement manuell prüfen.`,
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
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Checkout, Legal und Entitlements anschlussfertig.</h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-300">
                  Noch keine echten Zahlungen nötig: Provider-Auswahl, Redirect-Seiten, ENV-Flags, manuelle Plus-Freischaltung und Legal-Struktur sind vorbereitet, damit du später nur noch sauber verbinden musst.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link href="/premium" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Premium Seite</Link>
                <Link href="/legal" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Legal Hub</Link>
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
            <p className="mt-2 text-2xl font-black tracking-tight">{activeCheckoutProvider.label}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{activeCheckoutProvider.setupLevel} · per ENV</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Checkout</p>
            <p className="mt-2 text-2xl font-black tracking-tight">{canOpenCheckout ? "Aktiv" : "Preview"}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Provider + Links + Enable-Flag</p>
          </div>
          <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Legal</p>
            <p className="mt-2 text-2xl font-black tracking-tight">Hub da</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Platzhalter finalisieren</p>
          </div>
        </section>

        <UpgradeCard />

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Provider-Auswahl</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Für GradeGlow zuerst Payment Links, native IAP später.</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Für den Web-Beta-Start sind Stripe Checkout Links oder Lemon Squeezy am einfachsten. Paddle kann später sinnvoll sein; Apple/Google IAP erst, wenn echte native Store-Builds live gehen.
              </p>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">Aktiv: {billingProvider}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {checkoutProviderOptions.map((provider) => (
              <article key={provider.id} className={`rounded-2xl p-4 ring-1 ${provider.id === billingProvider ? "bg-violet-50 ring-violet-100" : "bg-slate-50 ring-slate-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-950">{provider.label}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">Setup: {provider.setupLevel}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-black text-violet-700 ring-1 ring-violet-100">{recommendationLabel[provider.recommendation]}</span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{provider.bestFor}</p>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-400">{provider.caveat}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
          <p className="text-sm font-bold text-violet-700">Checkout Links</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Nur noch Payment-Link eintragen.</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {checkoutLinks.map((link) => {
              const target = getCheckoutTarget(link.cycle);
              return (
                <article key={link.cycle} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-slate-950">{link.label}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{link.priceLabel}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black ring-1 ${link.isConfigured ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"}`}>{link.isConfigured ? "Link da" : "ENV fehlt"}</span>
                  </div>
                  <p className="mt-3 break-all rounded-xl bg-white p-3 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{link.url || `NEXT_PUBLIC_GRADEGLOW_PLUS_${link.cycle.toUpperCase()}_URL`}</p>
                  <a href={target.href} target={target.isLive ? "_blank" : undefined} rel={target.isLive ? "noreferrer" : undefined} className="mt-3 block rounded-2xl bg-white px-3 py-2 text-center text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-700">
                    {target.isLive ? "Checkout testen" : "Preview / verbinden"}
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Checkout Flow</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">So bleibt es ohne Functions sicher.</h2>
            <div className="mt-4 grid gap-3">
              {checkoutFlowSteps.map((step) => (
                <div key={step.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{step.title}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-black ring-1 ${stepStatusClass[step.status]}`}>{stepStatusLabel[step.status]}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{step.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
            <p className="text-sm font-bold text-violet-700">Entitlement-Flow</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Manuelle Plus-Aktivierung dokumentiert.</h2>
            <ol className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-slate-600">
              {entitlementFlowSteps.map((step, index) => (
                <li key={step} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                  <span className="mr-2 font-black text-violet-700">{index + 1}.</span>{step}
                </li>
              ))}
            </ol>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href="/checkout/success" className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:-translate-y-0.5">Success-Seite</Link>
              <Link href="/checkout/cancel" className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5">Cancel-Seite</Link>
            </div>
          </article>
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">Legal vor Livegang</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Impressum, Datenschutz, AGB und Widerruf sind strukturiert.</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Der Legal Hub enthält bewusst Platzhalter. Vor Checkout=true und vor Ads müssen echte Betreiberangaben, Datenschutz, Zahlungsbedingungen und Consent final sein.
              </p>
            </div>
            <Link href="/legal" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">Legal Hub öffnen</Link>
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
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-white/10 p-4 text-xs font-semibold leading-6 text-slate-200 ring-1 ring-white/10">{`NEXT_PUBLIC_GRADEGLOW_MONETIZATION_MODE=preview
NEXT_PUBLIC_GRADEGLOW_BILLING_PROVIDER=stripe
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
