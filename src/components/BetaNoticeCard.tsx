import Link from "next/link";

type BetaNoticeCardProps = {
  compact?: boolean;
};

export default function BetaNoticeCard({ compact = false }: BetaNoticeCardProps) {
  return (
    <section className={`rounded-3xl bg-slate-950 text-white shadow-xl shadow-violet-950/10 ring-1 ring-white/10 ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-fuchsia-200">GradeGlow Beta</p>
          <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Testversion mit aktivem Feedback-Kanal</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            GradeGlow befindet sich noch in der Beta. Funktionen, Limits und Oberflächen können sich ändern.
            Nutze die App als Lern- und Planungshilfe, aber gleiche wichtige Prüfungsdaten immer mit deiner Hochschule ab.
          </p>
        </div>
        <Link
          href="/feedback"
          className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
        >
          Feedback geben
        </Link>
      </div>

      {!compact && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-sm font-black">Keine Studienberatung</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">GradeGlow berechnet und organisiert deine Eingaben, ersetzt aber keine offizielle StuPo- oder Prüfungsberatung.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-sm font-black">Daten kontrollierbar</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">In den Einstellungen kannst du Daten exportieren, App-Daten löschen oder deinen Account entfernen.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-sm font-black">Support</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">Kontakt: gradeglow.support@icloud.com</p>
          </div>
        </div>
      )}
    </section>
  );
}
