"use client";

import { getExamPlanStatus, getTodayBlocks } from "../lib/examTopics";
import { getSessionStudyMinutes } from "../lib/studyStats";
import type { AppCtx } from "./NeuApp";
import { Icon } from "./Icons";
import { addDays, dateKey, dayLabel, examColor, examShort, fromKey, minutesLabel, mondayOf } from "./model";

const LETTERS = ["M", "D", "M", "D", "F", "S", "S"];

export default function Heute({ ctx }: { ctx: AppCtx }) {
  const { exams, today } = ctx;
  const visible = exams.filter((exam) => !exam.isHidden);
  const blocks = getTodayBlocks(visible, today);
  const [first, ...rest] = blocks;
  const sessions = visible.flatMap((exam) => exam.studySessions.filter((s) => !s.isHidden));
  const monday = mondayOf(fromKey(today));
  const nextExam = visible.filter((exam) => exam.status !== "done" && exam.examDate >= today)
    .sort((a, b) => a.examDate.localeCompare(b.examDate))[0];
  const firstExam = first ? visible.find((exam) => exam.id === first.examId) : undefined;
  const firstStatus = firstExam ? getExamPlanStatus(firstExam, today) : null;
  const nextStatus = nextExam ? getExamPlanStatus(nextExam, today) : null;
  const upcoming = sessions.filter((s) => !s.isDone && s.dateKey > today)
    .sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`))[0];

  return (
    <div className="gn-scroll">
      <header className="gn-top">
        <h1>GradeGlow</h1>
        <div className="gn-actions">
          <button type="button" className="gn-icon" aria-label="Klausur hinzufügen" onClick={() => ctx.openExam(null)}>{Icon.plus()}</button>
          <button type="button" className="gn-icon" aria-label="Einstellungen" onClick={ctx.openSettings}>{Icon.user()}</button>
        </div>
      </header>

      <div className="gn-stack">
        <section className="gn-card gn-row" aria-label="Lernserie">
          <div className="gn-streak">{Icon.flame()}<b>{ctx.streak}</b><small>{ctx.streak === 1 ? "Tag" : "Tage"}</small></div>
          <ol className="gn-week">
            {LETTERS.map((letter, index) => {
              const key = dateKey(addDays(monday, index));
              const done = sessions.some((s) => s.dateKey === key && s.isDone);
              const isToday = key === today;
              return (
                <li key={key} className={`${done ? "is-done" : ""} ${isToday ? "is-today" : ""}`.trim() || undefined}
                  aria-label={`${fromKey(key).toLocaleDateString("de-DE", { weekday: "long" })}${done ? ", gelernt" : ""}`}>
                  <span aria-hidden="true">{letter}</span>
                  <b aria-hidden="true">{done && !isToday ? Icon.check() : fromKey(key).getDate()}</b>
                </li>
              );
            })}
          </ol>
        </section>

        {visible.length === 0 ? (
          <section className="gn-card gn-empty">
            <h2 className="gn-h3">Leg deine erste Klausur an</h2>
            <p>Datum und Themen eintragen, GradeGlow plant die Lernblöcke rückwärts bis zur Prüfung.</p>
            <button type="button" className="gn-go" style={{ width: "100%" }} onClick={() => ctx.openExam(null)}>Klausur anlegen</button>
          </section>
        ) : (
          <>
            <div className="gn-h2"><h2>Heute dran</h2><button type="button" className="gn-link" onClick={() => ctx.go("kalender")}>Kalender</button></div>

            {first ? (
              <article className="gn-hero gn-stack" style={{ gap: 14 }}>
                <div className="gn-row" style={{ gap: 8 }}>
                  <span className="gn-hero-pill">{firstExam ? examShort(firstExam) : first.subject}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
                    {first.isOverdue ? `verpasst ${dayLabel(first.dateKey, today)}` : first.time || "heute"} · {minutesLabel(getSessionStudyMinutes(first))}
                  </span>
                </div>
                <div>
                  <h3>{first.title || "Fokusblock"}</h3>
                  {first.focus && <p>{first.focus}</p>}
                </div>
                {firstStatus && firstStatus.totalSessions > 0 && (
                  <div className="gn-row" style={{ gap: 10 }}>
                    <div className="gn-bar"><i style={{ width: `${(firstStatus.doneSessions / firstStatus.totalSessions) * 100}%` }} /></div>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.9, flex: "none" }}>Block {Math.min(firstStatus.doneSessions + 1, firstStatus.totalSessions)} von {firstStatus.totalSessions}</span>
                  </div>
                )}
                <button type="button" className="gn-white" onClick={() => ctx.go("fokus", first.id, first.examId)}>{Icon.play()}Fokus starten</button>
              </article>
            ) : (
              <section className="gn-card">
                <h3 className="gn-h3">{sessions.some((s) => s.dateKey === today && s.isDone) ? "Für heute erledigt" : "Heute ist frei"}</h3>
                <p className="gn-muted" style={{ fontSize: 14, marginTop: 4 }}>
                  {upcoming ? `Nächster Block: ${upcoming.title || "Fokusblock"}, ${dayLabel(upcoming.dateKey, today)}${upcoming.time ? ` um ${upcoming.time}` : ""}.` : "Kein Lernblock geplant."}
                </p>
              </section>
            )}

            {rest.map((block) => {
              const exam = visible.find((item) => item.id === block.examId);
              const color = exam ? examColor(exam, visible) : "var(--accent)";
              return (
                <article key={block.id} className="gn-card gn-row" style={{ padding: "14px 16px" }}>
                  <span className="gn-badge" style={{ background: `color-mix(in oklab, ${color} 16%, var(--card))`, color }}>{exam ? examShort(exam).slice(0, 3) : "—"}</span>
                  <div>
                    <strong>{block.title || "Fokusblock"}</strong>
                    <small style={block.isOverdue ? { color: "var(--warn)" } : undefined}>
                      {block.isOverdue ? `Verpasst ${dayLabel(block.dateKey, today)}` : block.time || "Heute"} · {minutesLabel(getSessionStudyMinutes(block))}
                    </small>
                  </div>
                  <button type="button" className="gn-chip" onClick={() => ctx.go("fokus", block.id, block.examId)}>Start</button>
                </article>
              );
            })}

            {nextExam && nextStatus && (
              <>
                <div className="gn-h2"><h2>Nächste Prüfung</h2></div>
                <button type="button" className="gn-card gn-stack" style={{ gap: 14, textAlign: "left", width: "100%" }} onClick={() => ctx.go("klausuren", undefined, nextExam.id)}>
                  <div className="gn-row">
                    <span className="gn-badge" style={{ background: `color-mix(in oklab, ${examColor(nextExam, visible)} 16%, var(--card))`, color: examColor(nextExam, visible) }}>{examShort(nextExam).slice(0, 3)}</span>
                    <div><strong>{nextExam.title}</strong><small>{fromKey(nextExam.examDate).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}{nextExam.examTime ? ` · ${nextExam.examTime}` : ""}</small></div>
                    <span className="gn-muted">{Icon.chevron()}</span>
                  </div>
                  <div className="gn-stats">
                    <div><span className="gn-muted">Noch</span><strong>{nextStatus.daysUntil} {nextStatus.daysUntil === 1 ? "Tag" : "Tage"}</strong></div>
                    <div><span className="gn-muted">Blöcke</span><strong>{nextStatus.doneSessions}/{nextStatus.totalSessions}</strong></div>
                    <div><span className="gn-muted">Themen</span><strong>{nextStatus.topicsCovered}/{nextStatus.topicsTotal}</strong></div>
                  </div>
                  {nextStatus.state === "behind" && <small style={{ color: "var(--warn)", fontSize: 13, fontWeight: 700 }}>{nextStatus.overdueSessions.length} {nextStatus.overdueSessions.length === 1 ? "Block" : "Blöcke"} hinterher</small>}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
