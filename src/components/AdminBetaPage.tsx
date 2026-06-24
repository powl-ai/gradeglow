"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import GradeGlowLogo from "./GradeGlowLogo";
import { getAdminEntitlements, grantEntitlementForAdmin, revokeEntitlementForAdmin } from "../lib/adminBeta";
import { getRecentFeedbackForAdmin, updateFeedbackStatusForAdmin } from "../lib/feedback";
import { useGradeGlowAccess } from "../hooks/useGradeGlowAccess";
import { planLabels } from "../lib/gradeglowAccess";
import type { AppUser, FeedbackStatus, GradeGlowEntitlement, GradeGlowFeedback, UserPlan } from "../types";

type AdminBetaPageProps = {
  user: AppUser;
  onLogout: () => Promise<void>;
};

type EntitlementRow = GradeGlowEntitlement & { uid: string };

const planOptions: UserPlan[] = ["free", "premium", "lifetime", "admin"];
const statusOptions = ["active", "trialing", "beta_test", "cancelled", "expired"];
const feedbackStatusOptions: FeedbackStatus[] = ["open", "reviewing", "planned", "done", "closed"];

const getDefaultPremiumUntil = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
};

const isNonExpiringPlan = (value: UserPlan) => value === "lifetime" || value === "admin";

const getPlanDefaultConfig = (nextPlan: UserPlan) => {
  if (nextPlan === "premium") {
    return {
      premiumUntil: getDefaultPremiumUntil(),
      premiumSource: "beta_test",
      premiumStatus: "active",
      note: "1 Jahr Beta-Test Premium",
      betaTester: true,
    };
  }

  if (nextPlan === "lifetime") {
    return {
      premiumUntil: "",
      premiumSource: "friend_bonus",
      premiumStatus: "active",
      note: "Freundesbonus - Lifetime",
      betaTester: true,
    };
  }

  if (nextPlan === "admin") {
    return {
      premiumUntil: "",
      premiumSource: "founder",
      premiumStatus: "active",
      note: "Founder/Admin",
      betaTester: true,
    };
  }

  return {
    premiumUntil: "",
    premiumSource: "manual_revoke",
    premiumStatus: "cancelled",
    note: "Premium/Admin Zugriff manuell zurückgesetzt.",
    betaTester: false,
  };
};

const statusLabels: Record<FeedbackStatus, string> = {
  open: "Offen",
  reviewing: "In Prüfung",
  planned: "Geplant",
  done: "Erledigt",
  closed: "Geschlossen",
};

export default function AdminBetaPage({ user, onLogout }: AdminBetaPageProps) {
  const { entitlement, accessSyncMessage } = useGradeGlowAccess(user);
  const isAdmin = entitlement.plan === "admin";

  const [uid, setUid] = useState("");
  const [plan, setPlan] = useState<UserPlan>("premium");
  const [premiumUntil, setPremiumUntil] = useState(getDefaultPremiumUntil);
  const [premiumSource, setPremiumSource] = useState("beta_test");
  const [premiumStatus, setPremiumStatus] = useState("active");
  const [note, setNote] = useState("1 Jahr Beta-Test Premium");
  const [betaTester, setBetaTester] = useState(true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [entitlements, setEntitlements] = useState<EntitlementRow[]>([]);
  const [feedback, setFeedback] = useState<GradeGlowFeedback[]>([]);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const selectedUid = uid.trim();
  const selectedPlanHasNoExpiry = isNonExpiringPlan(plan) || plan === "free";

  const applyPreset = (nextPlan: UserPlan) => {
    const defaults = getPlanDefaultConfig(nextPlan);
    setPlan(nextPlan);
    setPremiumUntil(defaults.premiumUntil);
    setPremiumSource(defaults.premiumSource);
    setPremiumStatus(defaults.premiumStatus);
    setNote(defaults.note);
    setBetaTester(defaults.betaTester);
  };

  const handlePlanChange = (nextPlan: UserPlan) => {
    applyPreset(nextPlan);
  };

  const sortedFeedback = useMemo(
    () => [...feedback].sort((a, b) => (b.createdAtIso || "").localeCompare(a.createdAtIso || "")),
    [feedback],
  );

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [nextEntitlements, nextFeedback] = await Promise.all([
        getAdminEntitlements(),
        getRecentFeedbackForAdmin(),
      ]);
      setEntitlements(nextEntitlements);
      setFeedback(nextFeedback);
      setAdminNotes(Object.fromEntries(nextFeedback.map((item) => [item.id, item.adminNote])));
    } catch {
      setMessage("Admin-Daten konnten nicht geladen werden. Prüfe Firestore Rules und Admin-Entitlement.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const saveEntitlement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!selectedUid) {
      setMessage("Bitte Firebase Auth UID eintragen.");
      return;
    }

    setIsSaving(true);
    try {
      await grantEntitlementForAdmin({
        uid: selectedUid,
        plan,
        premiumUntil,
        premiumSource,
        premiumStatus,
        note,
        betaTester,
      });
      setMessage("Entitlement gespeichert.");
      await loadAdminData();
    } catch {
      setMessage("Konnte Entitlement nicht speichern. Bist du als Admin freigeschaltet?");
    } finally {
      setIsSaving(false);
    }
  };

  const revokeSelected = async () => {
    setMessage("");
    if (!selectedUid) {
      setMessage("Bitte Firebase Auth UID eintragen.");
      return;
    }

    setIsSaving(true);
    try {
      await revokeEntitlementForAdmin(selectedUid);
      setMessage("Zugriff zurückgesetzt.");
      await loadAdminData();
    } catch {
      setMessage("Zugriff konnte nicht zurückgesetzt werden.");
    } finally {
      setIsSaving(false);
    }
  };

  const editFromRow = (row: EntitlementRow) => {
    const rowPlan = row.storedPlan;
    setUid(row.uid);
    setPlan(rowPlan);
    setPremiumUntil(isNonExpiringPlan(rowPlan) || rowPlan === "free" ? "" : row.premiumUntil || getDefaultPremiumUntil());
    setPremiumSource(row.premiumSource || getPlanDefaultConfig(rowPlan).premiumSource);
    setPremiumStatus(row.plan === "free" ? "cancelled" : "active");
    setNote(row.note || getPlanDefaultConfig(rowPlan).note);
    setBetaTester(row.premiumSource === "beta_test" || row.premiumSource === "friend_bonus" || row.premiumSource === "founder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateFeedback = async (feedbackId: string, status: FeedbackStatus) => {
    setMessage("");
    try {
      await updateFeedbackStatusForAdmin(feedbackId, status, adminNotes[feedbackId] ?? "");
      setMessage("Feedback aktualisiert.");
      await loadAdminData();
    } catch {
      setMessage("Feedback konnte nicht aktualisiert werden.");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ff] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-[28rem] w-[28rem] rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-violet-950/20 ring-1 ring-white/10">
          <div className="relative p-4 sm:p-7 lg:p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <GradeGlowLogo size="md" tone="light" />
                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15">{accessSyncMessage}</div>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-fuchsia-200/80">Admin Beta</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">Beta-User und Feedback verwalten.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Manuelle Premium-Freischaltung, Beta-Notizen und Feedback-Status direkt über Firestore.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur sm:min-w-72">
                <Link href="/" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50">Zur App</Link>
                <Link href="/feedback" className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Feedback</Link>
                <button type="button" onClick={onLogout} className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/15">Logout</button>
              </div>
            </div>
          </div>
        </header>

        {!isAdmin ? (
          <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-rose-100 backdrop-blur">
            <p className="text-sm font-bold text-rose-700">Kein Admin-Zugriff</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Dein aktueller Plan ist {planLabels[entitlement.plan]}.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Lege in Firebase Console einmalig ein Dokument <span className="font-black text-slate-700">entitlements/{user.uid}</span> mit <span className="font-black text-slate-700">plan = admin</span> an. Danach kannst du diese Seite nutzen.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <form className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6" onSubmit={saveEntitlement}>
                <p className="text-sm font-bold text-violet-700">Beta-Verwaltung</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Premium/Admin vergeben</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">UID aus Firebase Authentication kopieren. Dokument wird unter entitlements/UID gespeichert.</p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => applyPreset("premium")} className="rounded-2xl bg-violet-50 px-4 py-3 text-left text-xs font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5">1 Jahr Beta Premium</button>
                  <button type="button" onClick={() => applyPreset("lifetime")} className="rounded-2xl bg-fuchsia-50 px-4 py-3 text-left text-xs font-black text-fuchsia-700 ring-1 ring-fuchsia-100 transition hover:-translate-y-0.5">Lifetime Freundesbonus</button>
                  <button type="button" onClick={() => applyPreset("admin")} className="rounded-2xl bg-slate-950 px-4 py-3 text-left text-xs font-black text-white transition hover:-translate-y-0.5">Admin / Founder</button>
                  <button type="button" onClick={() => applyPreset("free")} className="rounded-2xl bg-rose-50 px-4 py-3 text-left text-xs font-black text-rose-700 ring-1 ring-rose-100 transition hover:-translate-y-0.5">Free / Entfernen</button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Firebase Auth UID</span>
                    <input className="field-input font-mono text-sm" value={uid} onChange={(event) => setUid(event.target.value)} placeholder="z. B. XyZ123..." />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Plan</span>
                    <select className="field-input" value={plan} onChange={(event) => handlePlanChange(event.target.value as UserPlan)}>
                      {planOptions.map((item) => <option key={item} value={item}>{planLabels[item]}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Premium bis</span>
                    <input
                      className="field-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      type="date"
                      value={premiumUntil}
                      disabled={selectedPlanHasNoExpiry}
                      onChange={(event) => setPremiumUntil(event.target.value)}
                    />
                    <span className="mt-1.5 block text-xs font-semibold text-slate-400">
                      {selectedPlanHasNoExpiry ? "Kein Ablaufdatum nötig." : "Wird bei Premium automatisch auf 1 Jahr gesetzt."}
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Quelle</span>
                    <input className="field-input" value={premiumSource} onChange={(event) => setPremiumSource(event.target.value)} placeholder="beta_test" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Status</span>
                    <select className="field-input" value={premiumStatus} onChange={(event) => setPremiumStatus(event.target.value)}>
                      {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:col-span-2">
                    <input type="checkbox" checked={betaTester} onChange={(event) => setBetaTester(event.target.checked)} className="h-5 w-5 rounded border-slate-300" />
                    <span>
                      <span className="block text-sm font-black text-slate-950">Als Beta-Tester markieren</span>
                      <span className="block text-xs font-semibold text-slate-500">Setzt betaTester = true und hilft später bei Segmentierung.</span>
                    </span>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Notiz</span>
                    <textarea className="field-input min-h-28 resize-y" value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                </div>

                {message && <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700 ring-1 ring-violet-100">{message}</p>}
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button type="submit" disabled={isSaving} className="rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:opacity-50">{isSaving ? "Speichere…" : "Speichern"}</button>
                  <button type="button" disabled={isSaving} onClick={revokeSelected} className="rounded-2xl bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:-translate-y-0.5 disabled:opacity-50">Auf Free setzen</button>
                </div>
              </form>

              <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-violet-700">Aktive Entitlements</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">Beta- und Admin-Liste</h2>
                  </div>
                  <button type="button" onClick={loadAdminData} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">Neu laden</button>
                </div>
                <div className="mt-5 space-y-3">
                  {isLoading && <p className="text-sm font-semibold text-slate-500">Lade…</p>}
                  {!isLoading && entitlements.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Noch keine Entitlements gefunden.</p>}
                  {entitlements.map((row) => (
                    <article key={row.uid} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-black text-slate-950">{row.uid}</p>
                          <p className="mt-1 text-sm font-black text-slate-700">{planLabels[row.plan]} · Quelle: {row.premiumSource || "—"}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">bis {row.premiumUntil || "ohne Ablauf"} · {row.note || "keine Notiz"}</p>
                        </div>
                        <button type="button" onClick={() => editFromRow(row)} className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100">Bearbeiten</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>

            <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-violet-700">Feedback Inbox</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Beta-Rückmeldungen</h2>
                </div>
                <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{sortedFeedback.length} Einträge</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {sortedFeedback.map((item) => (
                  <article key={item.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{item.subject}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{item.type} · {item.priority} · {item.ownerEmail || item.ownerUid}</p>
                      </div>
                      <select className="rounded-2xl border-0 bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200" value={item.status} onChange={(event) => updateFeedback(item.id, event.target.value as FeedbackStatus)}>
                        {feedbackStatusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                      </select>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">{item.message}</p>
                    <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                      <p className="text-xs font-black text-slate-500">Admin-Notiz</p>
                      <textarea className="mt-2 w-full resize-y rounded-xl border-0 bg-slate-50 p-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-violet-300" value={adminNotes[item.id] ?? ""} onChange={(event) => setAdminNotes((current) => ({ ...current, [item.id]: event.target.value }))} />
                      <button type="button" onClick={() => updateFeedback(item.id, item.status)} className="mt-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Notiz speichern</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
