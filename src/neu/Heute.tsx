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
  // An upcoming exam without any block: the plan is missing, not finished.
  const unplanned = visible.find((exam) => { const status = getExamPlanStatus(exam, today); return status.state === "no-plan" && status.daysUntil >= 1; });
  const upcoming = sessions.filter((s) => !s.isDone && s.dateKey > today)
    .sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`))[0];

  return (
    <div className="gn-scroll">
      <header className="gn-top">
        <div><small>{fromKey(today).toLocaleDateString("de-DE", { weekday: "long" })}</small><h1>{fromKey(today).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}</h1></div>
        <div className="gn-actions">
          <button type="button" className="gn-icon" aria-label="Klausur hinzufügen" onClick={() => ctx.openExam(null)}>{Icon.plus()}</button>
          <button type="button" className="gn-icon" aria-label="Profil" onClick={() => ctx.go("profil")}>{Icon.user()}</button>
        </div>
      </header>

      <div className="gn-stack">
        <section className="gn-weekline" aria-label="Lernserie">
          <div className={`gn-streak ${ctx.streak > 0 ? "is-alive" : ""} ${sessions.some((s) => s.dateKey === today && s.isDone) ? "is-lit" : ""}`.trim()}>{Icon.flame()}<b>{ctx.streak}</b><small>{ctx.streak === 1 ? "Tag" : "Tage"}</small></div>
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
            <ol className="gn-steps">
              <li><strong>Klausur eintragen</strong><span>Datum, Themen und wie viel Zeit du pro Tag hast.</span></li>
              <li><strong>Plan steht</strong><span>GradeGlow verteilt die Lernblöcke rückwärts bis zur Prüfung. Hier siehst du jeden Tag, was dran ist.</span></li>
              <li><strong>Fokus starten</strong><span>Für jeden geschafften Block leuchtet ein Stern in deinem Sternbild.</span></li>
            </ol>
            <button type="button" className="gn-go" style={{ width: "100%" }} onClick={() => ctx.openExam(null)}>Klausur anlegen</button>
          </section>
        ) : (
          <>
            <div className="gn-h2"><h2>Heute dran</h2><button type="button" className="gn-link" onClick={() => ctx.go("kalender")}>Kalender</button></div>

            {first ? (
              <article className="gn-hero gn-stack" style={{ gap: 14 }}>
                <div>
                  <span className="gn-hero-meta">
                    {firstExam ? examShort(firstExam) : first.subject} · {first.isOverdue ? `verpasst ${dayLabel(first.dateKey, today).toLowerCase()}` : first.time || "heute"} · {minutesLabel(getSessionStudyMinutes(first))}
                  </span>
                  <h3 style={{ marginTop: 6 }}>{first.title || "Fokusblock"}</h3>
                  {first.focus && <p>{first.focus}</p>}
                </div>
                {firstStatus && firstStatus.totalSessions > 0 && (
                  <div className="gn-row" style={{ gap: 10 }}>
                    <div className="gn-bar"><i style={{ width: `${(firstStatus.doneSessions / firstStatus.totalSessions) * 100}%` }} /></div>
                    <span className="gn-hero-meta" style={{ flex: "none" }}>Block {Math.min(firstStatus.doneSessions + 1, firstStatus.totalSessions)} von {firstStatus.totalSessions}</span>
                  </div>
                )}
                <button type="button" className="gn-white" onClick={() => ctx.go("fokus", first.id, first.examId)}>{Icon.play()}Fokus starten</button>
              </article>
            ) : (
              <section className="gn-card">
                <h3 className="gn-h3">{sessions.some((s) => s.dateKey === today && s.isDone) ? "Für heute erledigt" : "Heute ist frei"}</h3>
                <p className="gn-muted" style={{ fontSize: 15, marginTop: 4 }}>
                  {upcoming ? `Nächster Block: ${upcoming.title || "Fokusblock"}, ${dayLabel(upcoming.dateKey, today)}${upcoming.time ? ` um ${upcoming.time}` : ""}.`
                    : nextExam ? "Kein Lernblock geplant." : "Alle eingetragenen Klausuren liegen hinter dir."}
                </p>
                {unplanned && <button type="button" className="gn-link gn-hit" onClick={() => ctx.go("klausuren", undefined, unplanned.id)}>Lernplan für {examShort(unplanned)} erstellen</button>}
                {!nextExam && <button type="button" className="gn-link gn-hit" onClick={() => ctx.openExam(null)}>Nächste Klausur anlegen</button>}
              </section>
            )}

            {rest.length > 0 && (
              <ul className="gn-agenda" aria-label="Weitere Blöcke heute">
                {rest.map((block) => {
                  const exam = visible.find((item) => item.id === block.examId);
                  return (
                    <li key={block.id}>
                      <div>
                        <strong>{block.title || "Fokusblock"}</strong>
                        <small style={block.isOverdue ? { color: "var(--warn)" } : undefined}>
                          <i style={{ background: exam ? examColor(exam, visible) : "var(--faint)" }} />
                          {exam ? examShort(exam) : block.subject} · {block.isOverdue ? `verpasst ${dayLabel(block.dateKey, today).toLowerCase()}` : block.time || "heute"} · {minutesLabel(getSessionStudyMinutes(block))}
                        </small>
                      </div>
                      <button type="button" className="gn-chip" onClick={() => ctx.go("fokus", block.id, block.examId)}>Start</button>
                    </li>
                  );
                })}
              </ul>
            )}

            {nextExam && nextStatus && (
              <>
                <div className="gn-h2"><h2>Nächste Prüfung</h2></div>
                <button type="button" className="gn-card gn-stack" style={{ gap: 14, textAlign: "left", width: "100%" }} onClick={() => ctx.go("klausuren", undefined, nextExam.id)}>
                  <div className="gn-row">
                    <div><strong>{nextExam.title}</strong><small>{fromKey(nextExam.examDate).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}{nextExam.examTime ? ` · ${nextExam.examTime}` : ""}</small></div>
                    <span className="gn-muted">{Icon.chevron()}</span>
                  </div>
                  <div className="gn-stats">
                    <div><span className="gn-muted">Noch</span><strong>{nextStatus.daysUntil} {nextStatus.daysUntil === 1 ? "Tag" : "Tage"}</strong></div>
                    <div><span className="gn-muted">Blöcke</span><strong>{nextStatus.doneSessions}/{nextStatus.totalSessions}</strong></div>
                    <div><span className="gn-muted">Themen</span><strong>{nextStatus.topicsCovered}/{nextStatus.topicsTotal}</strong></div>
                  </div>
                  {nextStatus.state === "behind" && <small style={{ color: "var(--warn)", fontSize: 14, fontWeight: 700 }}>{nextStatus.overdueSessions.length} {nextStatus.overdueSessions.length === 1 ? "Block" : "Blöcke"} hinterher</small>}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
