"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRecentDiagnosticReportsForAdmin,
  updateDiagnosticReportForAdmin,
} from "../lib/diagnostics";
import type { DiagnosticReport, DiagnosticStatus } from "../types";

const statusOptions: { value: DiagnosticStatus; label: string }[] = [
  { value: "open", label: "Offen" },
  { value: "reviewing", label: "In Prüfung" },
  { value: "fixed", label: "Gefixt" },
  { value: "ignored", label: "Ignoriert" },
  { value: "closed", label: "Geschlossen" },
];

const priorityStyle: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 ring-slate-200",
  normal: "bg-violet-50 text-violet-700 ring-violet-100",
  high: "bg-amber-50 text-amber-700 ring-amber-100",
  critical: "bg-rose-50 text-rose-700 ring-rose-100",
};

export default function AdminDiagnosticsPanel() {
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => (b.createdAtIso || "").localeCompare(a.createdAtIso || "")),
    [reports],
  );

  const openCount = sortedReports.filter((report) => report.status === "open" || report.status === "reviewing").length;
  const criticalCount = sortedReports.filter((report) => report.priority === "critical" && !["fixed", "closed", "ignored"].includes(report.status)).length;
  const clientErrorCount = sortedReports.filter((report) => report.kind === "client_error" && !["fixed", "closed", "ignored"].includes(report.status)).length;
  const groupedClientErrors = useMemo(() => {
    const groups = new Map<string, { key: string; title: string; message: string; count: number; lastSeen: string; routes: Set<string>; ids: string[] }>();
    sortedReports
      .filter((report) => report.kind === "client_error" && !["fixed", "closed", "ignored"].includes(report.status))
      .forEach((report) => {
        const key = `${report.errorName || "Error"}:${report.errorMessage || report.message}`.slice(0, 220);
        const current = groups.get(key) ?? {
          key,
          title: report.errorName || "Client Error",
          message: report.errorMessage || report.message,
          count: 0,
          lastSeen: report.lastSeenAtIso || report.createdAtIso,
          routes: new Set<string>(),
          ids: [],
        };
        current.count += Math.max(1, report.occurrenceCount || 1);
        current.ids.push(report.id);
        if (report.route || report.page) current.routes.add(report.route || report.page);
        if ((report.lastSeenAtIso || report.createdAtIso) > current.lastSeen) current.lastSeen = report.lastSeenAtIso || report.createdAtIso;
        groups.set(key, current);
      });
    return Array.from(groups.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [sortedReports]);

  const loadReports = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const nextReports = await getRecentDiagnosticReportsForAdmin();
      setReports(nextReports);
      setAdminNotes(Object.fromEntries(nextReports.map((report) => [report.id, report.adminNote])));
    } catch {
      setMessage("Diagnosemeldungen konnten nicht geladen werden. Prüfe Firestore Rules/Admin-Rechte.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const updateReport = async (reportId: string, status: DiagnosticStatus) => {
    setMessage("");
    try {
      await updateDiagnosticReportForAdmin(reportId, status, adminNotes[reportId] ?? "");
      setMessage("Diagnosemeldung aktualisiert.");
      await loadReports();
    } catch {
      setMessage("Diagnosemeldung konnte nicht aktualisiert werden.");
    }
  };

  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-violet-700">Diagnostics Inbox</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Bugs, Errors & UI-Audits</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Automatische Browserfehler, manuelle Bug-Reports und Button-Audits aus der Beta.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">
            {openCount} offen
          </span>
          <button type="button" onClick={loadReports} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">
            Neu laden
          </button>
        </div>
      </div>

      {message && <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700 ring-1 ring-violet-100">{message}</p>}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Offene Diagnostics</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{openCount}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-600">Kritisch</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-rose-700">{criticalCount}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">Client Errors</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-amber-700">{clientErrorCount}</p>
        </div>
      </div>

      {groupedClientErrors.length > 0 && (
        <div className="mt-5 rounded-3xl bg-slate-950 p-4 text-white ring-1 ring-slate-800">
          <p className="text-sm font-bold text-violet-200">Error-Gruppen</p>
          <h3 className="mt-1 text-xl font-black tracking-tight">Häufigste aktive Browserfehler</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {groupedClientErrors.map((group) => (
              <article key={group.key} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{group.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{group.message}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">{group.count}x</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">Letzter Eintrag: {group.lastSeen.slice(0, 16).replace("T", " ")}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-400">Routen: {Array.from(group.routes).join(", ") || "—"}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {isLoading && <p className="text-sm font-semibold text-slate-500">Lade…</p>}
        {!isLoading && sortedReports.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
            Noch keine Diagnosemeldungen gefunden.
          </p>
        )}

        {sortedReports.map((report) => (
          <article key={report.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{report.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {report.kind} · {report.ownerEmail || report.ownerUid} · {report.createdAtIso.slice(0, 16).replace("T", " ")}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${priorityStyle[report.priority] ?? priorityStyle.normal}`}>
                {report.priority}
              </span>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">{report.message}</p>

            {(report.errorMessage || report.stack) && (
              <details className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                <summary className="cursor-pointer text-xs font-black text-slate-600">Error Details</summary>
                {report.errorMessage && <p className="mt-2 text-sm font-bold text-rose-700">{report.errorMessage}</p>}
                {report.stack && <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 text-xs font-semibold text-slate-100">{report.stack}</pre>}
              </details>
            )}

            <details className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <summary className="cursor-pointer text-xs font-black text-slate-600">Kontext</summary>
              <div className="mt-2 grid gap-2 text-xs font-semibold text-slate-500">
                <p>Route: {report.route || report.page || "—"}</p>
                <p>Version: {report.appVersion}</p>
                <p>Viewport: {report.viewport}</p>
                <p>Notifications: {report.notificationPermission}</p>
                <p className="break-words">Browser: {report.userAgent}</p>
              </div>
            </details>

            <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <select
                  className="rounded-2xl border-0 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                  value={report.status}
                  onChange={(event) => updateReport(report.id, event.target.value as DiagnosticStatus)}
                >
                  {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
                <button type="button" onClick={() => updateReport(report.id, report.status)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                  Notiz speichern
                </button>
              </div>
              <textarea
                className="mt-2 w-full resize-y rounded-xl border-0 bg-slate-50 p-3 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-violet-300"
                value={adminNotes[report.id] ?? ""}
                onChange={(event) => setAdminNotes((current) => ({ ...current, [report.id]: event.target.value }))}
                placeholder="Admin-Notiz, Fix-Hinweis oder Repro-Schritte…"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
