"use client";

import { getExamPlanStatus } from "../lib/examTopics";
import { getSessionStudyMinutes } from "../lib/studyStats";
import type { TopicConfidence } from "../types";
import type { AppCtx } from "./NeuApp";
import { Icon } from "./Icons";
import { addDays, dateKey, dayLabel, examColor, examShort, fromKey, minutesLabel } from "./model";

const CONFIDENCE: Record<number, string> = { 1: "unsicher", 2: "geht so", 3: "sicher" };

export default function Klausuren({ ctx }: { ctx: AppCtx }) {
  const { exams, setExams, today } = ctx;
  const visible = exams.filter((exam) => !exam.isHidden)
    .sort((a, b) => Number(a.examDate < today) - Number(b.examDate < today) || a.examDate.localeCompare(b.examDate));
  const exam = visible.find((item) => item.id === ctx.examId) ?? visible[0];

  if (!exam) {
    return (
      <div className="gn-scroll">
        <header className="gn-top"><h1>Klausuren</h1><div className="gn-actions"><a className="gn-icon" href="/exams" aria-label="Klausur hinzufügen">{Icon.plus()}</a></div></header>
        <section className="gn-card gn-empty">
          <h2 className="gn-h3">Noch keine Klausur</h2>
          <p>Trag Datum und Themen ein. GradeGlow verteilt die Lernblöcke rückwärts bis zur Prüfung.</p>
          <a className="gn-go" href="/exams">Klausur anlegen</a>
        </section>
      </div>
    );
  }

  const status = getExamPlanStatus(exam, today);
  const sessions = exam.studySessions.filter((s) => !s.isHidden).sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`));
  const learned = sessions.filter((s) => s.isDone).reduce((sum, s) => sum + getSessionStudyMinutes(s), 0);
  const weekEnd = dateKey(addDays(fromKey(today), 7));
  const soon = sessions.filter((s) => (s.dateKey >= today && s.dateKey < weekEnd) || (!s.isDone && s.dateKey < today));
  const topics = [...(exam.topics ?? [])].sort((a, b) => a.confidence - b.confidence);

  const cycleTopic = (topicId: string) => setExams((previous) => previous.map((item) => item.id !== exam.id ? item : {
    ...item, topics: (item.topics ?? []).map((topic) => topic.id !== topicId ? topic
      : { ...topic, confidence: ((topic.confidence % 3) + 1) as TopicConfidence }),
  }));

  const stateLabel = status.state === "behind" ? `${status.overdueSessions.length} ${status.overdueSessions.length === 1 ? "Block" : "Blöcke"} hinterher`
    : status.state === "no-plan" ? "Noch kein Lernplan" : status.state === "done" ? "Vorbei" : "Im Plan";

  return (
    <div className="gn-scroll">
      <header className="gn-top">
        <h1>Klausuren</h1>
        <div className="gn-actions"><a className="gn-icon" href="/exams" aria-label="Klausur hinzufügen oder bearbeiten">{Icon.plus()}</a></div>
      </header>

      <div className="gn-chips" aria-label="Klausur wählen">
        {visible.map((item) => (
          <button key={item.id} type="button" aria-pressed={item.id === exam.id} onClick={() => ctx.setExamId(item.id)}>
            <i style={{ background: examColor(item, visible) }} />{examShort(item)}
          </button>
        ))}
      </div>

      <div className="gn-stack">
        <section className="gn-hero gn-stack" style={{ gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{exam.title}</h2>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, opacity: 0.85 }}>
              {fromKey(exam.examDate).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}{exam.examTime ? ` · ${exam.examTime}` : ""}
            </div>
          </div>
          <div className="gn-stats">
            <div><span>Noch</span><strong>{Math.max(0, status.daysUntil)} {status.daysUntil === 1 ? "Tag" : "Tage"}</strong></div>
            <div><span>Blöcke</span><strong>{status.doneSessions}/{status.totalSessions}</strong></div>
            <div><span>Gelernt</span><strong>{minutesLabel(learned)}</strong></div>
          </div>
          <div className="gn-row" style={{ gap: 10 }}>
            <div className="gn-bar"><i style={{ width: `${status.totalSessions ? (status.doneSessions / status.totalSessions) * 100 : 0}%` }} /></div>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, flex: "none" }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: status.state === "behind" ? "#ffb26b" : "#5ff0a0" }} />{stateLabel}
            </span>
          </div>
        </section>

        <section className="gn-card" aria-label="Themen">
          <div className="gn-row" style={{ justifyContent: "space-between", marginBottom: 2 }}>
            <h2 className="gn-h3">Themen</h2>
            {topics.length > 0 && <span className="gn-muted" style={{ fontSize: 13, fontWeight: 600, flex: "none" }}>Tippen zum Ändern</span>}
          </div>
          {topics.length === 0 ? (
            <p className="gn-muted" style={{ fontSize: 14, marginTop: 6 }}>Noch keine Themen. <a className="gn-link" href={`/exams?exam=${encodeURIComponent(exam.id)}`}>Themen eintragen</a>, damit schwache Themen mehr Blöcke bekommen.</p>
          ) : (
            <ul className="gn-list">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <div><strong>{topic.name}</strong></div>
                  <button type="button" className="gn-row" style={{ gap: 8, flex: "none", minHeight: 36 }} onClick={() => cycleTopic(topic.id)}
                    aria-label={`${topic.name}: ${CONFIDENCE[topic.confidence]}. Ändern`}>
                    <small>{CONFIDENCE[topic.confidence]}</small>
                    <span className="gn-lvl" aria-hidden="true">{[1, 2, 3].map((level) => <i key={level} className={level <= topic.confidence ? "on" : undefined} />)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="gn-card" aria-label="Nächste Lernblöcke">
          <div className="gn-row" style={{ justifyContent: "space-between", marginBottom: 2 }}>
            <h2 className="gn-h3">Nächste 7 Tage</h2>
            <span className="gn-muted" style={{ fontSize: 13, fontWeight: 600, flex: "none" }}>{soon.filter((s) => s.isDone).length} von {soon.length}</span>
          </div>
          {soon.length === 0 ? <p className="gn-muted" style={{ fontSize: 14, marginTop: 6 }}>Keine Lernblöcke in den nächsten 7 Tagen.</p> : (
            <ul className="gn-list">
              {soon.map((s) => {
                const isToday = s.dateKey === today && !s.isDone;
                const late = !s.isDone && s.dateKey < today;
                return (
                  <li key={s.id}>
                    <span className={`gn-check ${s.isDone ? "is-done" : ""} ${isToday ? "is-today" : ""}`}>{s.isDone && Icon.check(12)}</span>
                    <div>
                      <strong style={isToday ? { fontWeight: 700 } : undefined}>{s.title || "Fokusblock"}</strong>
                      <small style={isToday ? { color: "var(--acc-ink)", fontWeight: 700 } : late ? { color: "var(--warn)", fontWeight: 600 } : undefined}>
                        {late ? "Verpasst " : ""}{dayLabel(s.dateKey, today)}{s.time ? ` · ${s.time}` : ""} · {minutesLabel(getSessionStudyMinutes(s))}
                      </small>
                    </div>
                    {!s.isDone && <button type="button" className="gn-chip" onClick={() => ctx.go("fokus", s.id, exam.id)}>Start</button>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
