"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { initialTimelineMinute } from "../lib/calendarLayout";
import { getSessionStudyMinutes } from "../lib/studyStats";
import type { AppCtx } from "./NeuApp";
import { Icon } from "./Icons";
import { addDays, dateKey, dayLabel, examColor, examShort, fromKey, minutesLabel, mondayOf, timeOf } from "./model";

const HOUR = 44;
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const toMinutes = (time: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export default function Kalender({ ctx }: { ctx: AppCtx }) {
  const { exams, today } = ctx;
  const [selected, setSelected] = useState(today);
  const [mode, setMode] = useState<"tag" | "woche">("tag");
  const [now, setNow] = useState(() => new Date());
  const timeline = useRef<HTMLDivElement>(null);
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(id); }, []);

  const visible = exams.filter((exam) => !exam.isHidden);
  const sessions = visible.flatMap((exam) => exam.studySessions.filter((s) => !s.isHidden)
    .map((s) => ({ ...s, exam, color: examColor(exam, visible) })));
  const monday = mondayOf(fromKey(selected));
  const week = DAYS.map((_, index) => dateKey(addDays(monday, index)));
  const daySessions = sessions.filter((s) => s.dateKey === selected).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const timed = daySessions.filter((s) => toMinutes(s.time) !== null);
  const untimed = daySessions.filter((s) => toMinutes(s.time) === null);
  const examsToday = visible.filter((exam) => exam.examDate === selected);
  const total = daySessions.reduce((sum, s) => sum + getSessionStudyMinutes(s), 0);
  const isToday = selected === today;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const firstOpen = timed.find((s) => !s.isDone);

  useLayoutEffect(() => {
    if (mode !== "tag" || !timeline.current) return;
    const target = initialTimelineMinute(isToday, nowMin, toMinutes(timed[0]?.time ?? "") ?? undefined, firstOpen ? toMinutes(firstOpen.time) ?? undefined : undefined);
    timeline.current.scrollTop = (target / 60) * HOUR;
    // Only when the day or view changes, not on every minute tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, mode]);

  return (
    <div className="gn-scroll">
      <header className="gn-top">
        <h1>Kalender</h1>
        <div className="gn-actions">
          <button type="button" className="gn-icon text" onClick={() => setSelected(today)}>Heute</button>
          <button type="button" className="gn-icon" aria-label="Klausur hinzufügen" onClick={() => ctx.openExam(null)}>{Icon.plus()}</button>
        </div>
      </header>

      <div className="gn-seg" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", margin: "0 4px" }}>
        <button type="button" aria-pressed={mode === "tag"} onClick={() => setMode("tag")}>Tag</button>
        <button type="button" aria-pressed={mode === "woche"} onClick={() => setMode("woche")}>Woche</button>
      </div>

      <section className="gn-cal" style={{ marginTop: 12 }} aria-label="Kalender">
        <div className="gn-row" style={{ justifyContent: "space-between", padding: "10px 12px 0" }}>
          <button type="button" className="gn-icon" style={{ width: 36, height: 36, transform: "scaleX(-1)" }} aria-label="Vorherige Woche" onClick={() => setSelected(dateKey(addDays(fromKey(selected), -7)))}>{Icon.chevron()}</button>
          <strong style={{ fontSize: 15, flex: "none" }}>{fromKey(week[0]).toLocaleDateString("de-DE", { day: "numeric", month: "short" })} – {fromKey(week[6]).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</strong>
          <button type="button" className="gn-icon" style={{ width: 36, height: 36 }} aria-label="Nächste Woche" onClick={() => setSelected(dateKey(addDays(fromKey(selected), 7)))}>{Icon.chevron()}</button>
        </div>
        <div className="gn-days">
          {week.map((key, index) => {
            const colors = [...new Set(sessions.filter((s) => s.dateKey === key).map((s) => s.color))].slice(0, 3);
            return (
              <button key={key} type="button" className={key === today ? "is-today" : undefined} aria-pressed={key === selected}
                aria-label={fromKey(key).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                onClick={() => { setSelected(key); setMode("tag"); }}>
                <span>{DAYS[index]}</span><b>{fromKey(key).getDate()}</b>
                <span style={{ display: "flex", gap: 2, minHeight: 5 }}>{colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
              </button>
            );
          })}
        </div>

        {mode === "tag" ? (
          <>
            <div className="gn-dayhead">
              <strong>{fromKey(selected).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</strong>
              <span className="gn-muted" style={{ fontSize: 13, fontWeight: 600 }}>{total > 0 ? minutesLabel(total) : "frei"}</span>
            </div>
            {(examsToday.length > 0 || untimed.length > 0) && (
              <ul className="gn-list" style={{ padding: "0 16px 8px" }}>
                {examsToday.map((exam) => <li key={exam.id}><span className="gn-badge" style={{ width: 28, height: 28, background: "var(--now)", color: "#fff" }}>!</span><div><strong>Prüfung: {exam.title}</strong><small>{exam.examTime || "ganztägig"}</small></div></li>)}
                {untimed.map((s) => <li key={s.id}><span className="gn-badge" style={{ width: 28, height: 28, background: `color-mix(in oklab, ${s.color} 18%, var(--card))`, color: s.color }}>·</span><div><strong>{s.title || "Fokusblock"}</strong><small>ohne Uhrzeit · {minutesLabel(getSessionStudyMinutes(s))}</small></div></li>)}
              </ul>
            )}
            <div className="gn-timeline" ref={timeline} aria-label="Tagesverlauf">
              <div style={{ position: "relative", height: 24 * HOUR + 24 }}>
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="gn-hour" style={{ top: hour * HOUR + 12 }}><span>{String(hour).padStart(2, "0")}:00</span><i /></div>
                ))}
                {timed.map((s) => {
                  const start = toMinutes(s.time) ?? 0;
                  const length = Math.max(20, s.durationMinutes || 30);
                  const hero = !s.isDone && s.id === firstOpen?.id && isToday;
                  return (
                    <button key={s.id} type="button" className={`gn-ev ${hero ? "is-hero" : ""} ${s.isDone ? "is-done" : ""}`}
                      style={{ top: (start / 60) * HOUR + 12, height: (length / 60) * HOUR - 2, ...(hero ? {} : { background: `color-mix(in oklab, ${s.color} 16%, var(--card))`, color: `color-mix(in oklab, ${s.color} 70%, var(--ink))` }) }}
                      onClick={() => !s.isDone && ctx.go("fokus", s.id, s.examId)}
                      aria-label={`${s.title}, ${s.time}, ${minutesLabel(length)}${s.isDone ? ", erledigt" : ""}`}>
                      <strong>{s.isDone ? "✓ " : ""}{s.title || "Fokusblock"}</strong>
                      {length >= 45 && <span>{s.time} · {examShort(s.exam)}</span>}
                    </button>
                  );
                })}
                {isToday && (
                  <div className="gn-now" style={{ top: (nowMin / 60) * HOUR + 12 - 4 }} aria-label={`Jetzt, ${timeOf(now)}`}>
                    <span>{timeOf(now)}</span><i /><em />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <ul className="gn-list" style={{ padding: "4px 16px 12px", borderTop: "1px solid var(--line)" }}>
            {week.map((key) => {
              const items = sessions.filter((s) => s.dateKey === key).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
              return (
                <li key={key} style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: "0 0 64px" }}><strong style={{ fontSize: 14, color: key === today ? "var(--now)" : undefined }}>{dayLabel(key, today)}</strong></div>
                  <div className="gn-stack" style={{ gap: 6 }}>
                    {items.length === 0 ? <small>frei</small> : items.map((s) => (
                      <div key={s.id} className="gn-row" style={{ gap: 8 }}>
                        <i style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flex: "none" }} />
                        <small style={{ color: "var(--ink)", fontWeight: 600, textDecoration: s.isDone ? "line-through" : undefined }}>{s.time ? `${s.time} · ` : ""}{s.title || "Fokusblock"}</small>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
