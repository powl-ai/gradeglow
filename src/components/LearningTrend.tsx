"use client";

import { useMemo, useState } from "react";
import type { ExamPlanItem } from "../types";
import { localDateKey, mondayOf, shiftDay } from "../lib/calendarLayout";
import { formatStudyMinutes } from "../lib/studyStats";

type Range = "week" | "month" | "year";
type Point = { key: string; label: string; description: string; minutes: number; current: boolean };

export default function LearningTrend({ exams, thisWeekMinutes, lastWeekMinutes }: {
  exams: ExamPlanItem[]; thisWeekMinutes: number; lastWeekMinutes: number;
}) {
  const [range, setRange] = useState<Range>("week");
  const [selected, setSelected] = useState<string | null>(null);
  const points = useMemo<Point[]>(() => {
    const now = new Date(), today = localDateKey(now);
    const sessions = exams.filter(exam => !exam.isHidden).flatMap(exam => exam.studySessions)
      .filter(session => session.isDone && !session.isHidden);
    const sum = (start: Date, end: Date) => {
      const from = localDateKey(start), until = localDateKey(end);
      return sessions.filter(session => session.dateKey >= from && session.dateKey < until)
        .reduce((total, session) => total + Math.max(0, session.durationMinutes), 0);
    };
    if (range === "week") {
      const monday = mondayOf(now);
      return Array.from({ length: 7 }, (_, i) => {
        const start = shiftDay(monday, i), end = shiftDay(start, 1);
        return { key: localDateKey(start), label: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i],
          description: start.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" }),
          minutes: sum(start, end), current: localDateKey(start) === today };
      });
    }
    if (range === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const result: Point[] = [];
      // Calendar weeks, clipped to this month: no days from adjacent months.
      for (let week = mondayOf(first); week < next; week = shiftDay(week, 7)) {
        const start = week < first ? first : week;
        const end = shiftDay(week, 7) > next ? next : shiftDay(week, 7);
        result.push({ key: localDateKey(start), label: `${start.getDate()}.–${shiftDay(end, -1).getDate()}.`,
          description: `${start.toLocaleDateString("de-DE")} – ${shiftDay(end, -1).toLocaleDateString("de-DE")}`,
          minutes: sum(start, end), current: today >= localDateKey(start) && today < localDateKey(end) });
      }
      return result;
    }
    return Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now.getFullYear(), i, 1), end = new Date(now.getFullYear(), i + 1, 1);
      return { key: localDateKey(start), label: start.toLocaleDateString("de-DE", { month: "short" }).replace(".", ""),
        description: start.toLocaleDateString("de-DE", { month: "long", year: "numeric" }),
        minutes: sum(start, end), current: i === now.getMonth() };
    });
  }, [exams, range]);
  const hasData = points.some(point => point.minutes > 0);
  const max = Math.max(...points.map(point => point.minutes), 1);
  const delta = thisWeekMinutes - lastWeekMinutes;
  const chosen = points.find(point => point.key === selected);
  const left = 48, width = 304, baseline = 152, chartHeight = 116;
  const slot = width / points.length, barWidth = Math.min(28, slot * .62);
  // At most six evenly distributed labels, including both endpoints.
  const labels = new Set(Array.from({ length: Math.min(6, points.length) }, (_, i) => Math.round(i * (points.length - 1) / (Math.min(6, points.length) - 1))));

  return <section className="gg-learning-trend" aria-labelledby="learning-trend-title">
    <div className="gg-learning-trend-summary">
      <div><span>Diese Woche</span><strong>{formatStudyMinutes(thisWeekMinutes)}</strong></div>
      <div><span>Letzte Woche</span><strong>{formatStudyMinutes(lastWeekMinutes)}</strong></div>
      <span className="gg-learning-trend-delta" aria-label={`Differenz: ${delta < 0 ? "minus" : "plus"} ${formatStudyMinutes(Math.abs(delta))}`}>
        {delta > 0 ? "+" : delta < 0 ? "−" : "±"}{formatStudyMinutes(Math.abs(delta))}
      </span>
    </div>
    <p className="gg-learning-trend-caption">Jede Lernminute zählt.</p>
    <div className="gg-learning-trend-heading">
      <h3 id="learning-trend-title">Lerntrend</h3>
      <div className="gg-learning-trend-switch" role="group" aria-label="Lerntrend-Zeitraum">
        {(["week", "month", "year"] as const).map(value => <button key={value} type="button" aria-pressed={range === value}
          onClick={() => { setRange(value); setSelected(null); }}>{value === "week" ? "Woche" : value === "month" ? "Monat" : "Jahr"}</button>)}
      </div>
    </div>
    {hasData ? <div className="gg-trend-svg-wrap">
      <svg className="gg-trend-svg" viewBox="0 0 360 180" role="group" aria-label={`Lernzeit: ${range === "week" ? "aktuelle Woche" : range === "month" ? "aktueller Monat" : "aktuelles Jahr"}`}>
        {[{ y: baseline, label: "0" }, { y: baseline - chartHeight, label: formatStudyMinutes(max) }].map(line => <g key={line.y} aria-hidden="true">
          <line x1={left} x2={352} y1={line.y} y2={line.y} className="gg-trend-guide" />
          <text x={left - 5} y={line.y - 4} textAnchor="end" className="gg-trend-axis">{line.label}</text>
        </g>)}
        {points.map((point, i) => {
          const x = left + i * slot + (slot - barWidth) / 2;
          const height = point.minutes > 0 ? Math.max(3, point.minutes / max * chartHeight) : 3;
          const toggle = () => setSelected(selected === point.key ? null : point.key);
          return <g key={point.key} role="button" tabIndex={0} aria-pressed={selected === point.key}
            aria-label={`${point.description}: ${formatStudyMinutes(point.minutes)}`} onClick={toggle}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } }}>
            <rect x={x} y={baseline - height} width={barWidth} height={height} rx={Math.min(5, height / 2)}
              className={point.minutes === 0 ? "gg-trend-bar is-zero" : point.current ? "gg-trend-bar is-current" : "gg-trend-bar"} />
            {point.current && <text x={x + barWidth / 2} y={baseline - height - 7} textAnchor="middle" className="gg-trend-value">{formatStudyMinutes(point.minutes)}</text>}
            {labels.has(i) && <text x={x + barWidth / 2} y={172} textAnchor="middle" className="gg-trend-axis">{point.label}</text>}
            <rect x={left + i * slot} y={20} width={slot} height={160} fill="transparent" />
          </g>;
        })}
      </svg>
      {chosen && <div className="gg-trend-tooltip" role="status">{chosen.description}<strong>{formatStudyMinutes(chosen.minutes)}</strong></div>}
    </div> : <div className="gg-learning-trend-empty"><div aria-hidden="true" /><p>Noch keine Lernzeit in diesem Zeitraum.</p></div>}
  </section>;
}
