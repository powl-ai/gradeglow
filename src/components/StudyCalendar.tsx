"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { layoutTimelineEntries, localDateKey, mondayOf, shiftDay, timeInMinutes } from "../lib/calendarLayout";
import type { CalendarEntry, CalendarViewMode } from "../lib/calendarLayout";

const HOUR_HEIGHT = 48;
const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const entryTime = (entry: CalendarEntry) => entry.time || "Ohne Uhrzeit";

function DayTimeline({ date, entries, onOpen }: { date: Date; entries: CalendarEntry[]; onOpen: (entry: CalendarEntry) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);
  const positions = useMemo(() => layoutTimelineEntries(entries), [entries]);
  const untimed = entries.filter(entry => timeInMinutes(entry.time) === null);
  const key = localDateKey(date);
  const isToday = key === localDateKey(now);
  return <>
    {untimed.length > 0 && <div className="gg-calendar-untimed"><span>Ohne Uhrzeit</span><div>{untimed.map(entry => <button type="button" key={entry.id} data-kind={entry.kind} onClick={() => onOpen(entry)}>{entry.title}</button>)}</div></div>}
    <div className="gg-calendar-timeline-viewport" aria-label="Tageskalender">
      <div className="gg-calendar-timeline" style={{ height: 24 * HOUR_HEIGHT }}>
        {Array.from({ length: 24 }, (_, hour) => <div className="gg-calendar-hour" key={hour} style={{ top: hour * HOUR_HEIGHT }}><span>{String(hour).padStart(2, "0")}:00</span><i /></div>)}
        <div className="gg-calendar-event-lanes">{positions.map(({ entry, start, end, lane, lanes }) => <button type="button" key={entry.id} className={`gg-calendar-event ${entry.isDone ? "is-done" : ""} ${end - start < 45 ? "is-short" : ""}`} data-kind={entry.kind}
          draggable={entry.kind === "study"} onDragStart={event => { event.dataTransfer.setData("application/gradeglow-entry", entry.id); event.dataTransfer.effectAllowed = "move"; }}
          style={{ top: start / 60 * HOUR_HEIGHT, height: Math.max(1, (end - start) / 60 * HOUR_HEIGHT - 2), left: `${lane / lanes * 100}%`, width: `calc(${100 / lanes}% - 3px)` }}
          aria-label={`${entry.title}, ${entry.time}, ${entry.kind === "study" ? `${entry.durationMinutes} Minuten` : "Prüfung, Dauer noch offen"}${entry.isDone ? ", erledigt" : ""}`} onClick={() => onOpen(entry)}>
          <strong>{entry.isDone ? "✓ " : ""}{entry.title}</strong><span>{entry.time} · {entry.kind === "study" ? `${entry.durationMinutes} min` : "Prüfung · Dauer offen"}</span>{entry.moduleName && <small>{entry.moduleName}</small>}
        </button>)}</div>
        {isToday && <div className="gg-calendar-now" style={{ top: (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT }} aria-label="Aktuelle Uhrzeit"><span>{now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span><i /></div>}
      </div>
    </div>
    {entries.length === 0 && <p className="gg-calendar-empty">Noch nichts geplant. Platz für Lernen – und für Pausen.</p>}
  </>;
}

export default function StudyCalendar({ date, onDateChange, entries, onOpen, onMove, onAddExam, onAddStudy }: {
  date: Date; onDateChange: (date: Date) => void; entries: CalendarEntry[];
  onOpen: (entry: CalendarEntry) => void; onAddExam: () => void; onAddStudy: () => void;
  onMove: (entry: CalendarEntry, dateKey: string) => void;
}) {
  const [mode, setMode] = useState<CalendarViewMode>("day");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const today = localDateKey(new Date()), selected = localDateKey(date);
  const filtered = entries.filter(entry => filter === "all" || entry.kind === filter);
  const week = Array.from({ length: 7 }, (_, index) => shiftDay(mondayOf(date), index));
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthDays = Array.from({ length: 42 }, (_, index) => shiftDay(mondayOf(monthStart), index));
  const days = mode === "month" ? monthDays : week;
  const move = (direction: number) => {
    onDateChange(mode === "month" ? new Date(date.getFullYear(), date.getMonth() + direction, 1) : shiftDay(date, direction * (mode === "week" ? 7 : 1)));
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current; touch.current = null;
    const end = event.changedTouches[0];
    if (start && end && Math.abs(end.clientX - start.x) > 65 && Math.abs(end.clientY - start.y) < 35) move(end.clientX < start.x ? 1 : -1);
  };
  return <section className="gg-study-calendar" aria-label="Studienkalender">
    <div className="gg-calendar-toolbar"><button type="button" className="gg-calendar-month-title" onClick={() => setMode(mode === "month" ? "day" : "month")}>{date.toLocaleDateString("de-DE", { month: "long" })}<span>{date.getFullYear()}</span><span aria-hidden="true">⌄</span></button>
      <div className="gg-calendar-toolbar-actions"><button type="button" onClick={() => onDateChange(new Date())}>Heute</button><button type="button" aria-label="Termin hinzufügen" aria-expanded={adding} onClick={() => setAdding(!adding)}>+</button></div>
    </div>
    {adding && <div className="gg-calendar-add-options"><button type="button" onClick={() => { setAdding(false); onAddExam(); }}>Prüfung hinzufügen</button><button type="button" onClick={() => { setAdding(false); onAddStudy(); }}>Lernblock hinzufügen</button></div>}
    <div className="gg-calendar-view-row"><div className="gg-calendar-view-switch" role="group" aria-label="Kalenderansicht">{(["day", "week", "month"] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === "day" ? "Tag" : value === "week" ? "Woche" : "Monat"}</button>)}</div>
      <label className="gg-calendar-filter"><span className="sr-only">Kalenderinhalt</span><select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Alles</option><option value="exam">Prüfungen</option><option value="study">Lernen</option></select></label>
    </div>
    <div className={`gg-calendar-date-navigation ${mode === "day" ? "is-day" : ""}`}>
    <div className={`gg-calendar-date-picker ${mode === "month" ? "is-month" : ""}`} onTouchStart={event => { const first = event.touches[0]; if (first) touch.current = { x: first.clientX, y: first.clientY }; }} onTouchEnd={onTouchEnd}>
      <div className="gg-calendar-weekday-labels">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
      <div className="gg-calendar-date-grid">{days.map(day => {
        const key = localDateKey(day), dayEntries = filtered.filter(entry => entry.dateKey === key);
        return <button key={key} type="button" data-date={key} className={`${key === selected ? "is-selected" : ""} ${key === today ? "is-today" : ""} ${mode === "month" && day.getMonth() !== date.getMonth() ? "is-outside" : ""}`} aria-pressed={key === selected} aria-label={day.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} onClick={() => onDateChange(day)}
          onDragOver={event => { if (event.dataTransfer.types.includes("application/gradeglow-entry")) event.preventDefault(); }}
          onDrop={event => { event.preventDefault(); const entry = entries.find(item => item.id === event.dataTransfer.getData("application/gradeglow-entry")); if (entry?.kind === "study") onMove(entry, key); }}><strong>{day.getDate()}</strong><span className="gg-calendar-date-dots" aria-hidden="true">{["exam", "study"].filter(kind => dayEntries.some(entry => entry.kind === kind)).map(kind => <i key={kind} data-kind={kind} />)}</span></button>;
      })}</div>
    </div>
    <div className="gg-calendar-day-heading"><button type="button" aria-label="Vorheriger Zeitraum" onClick={() => move(-1)}>‹</button><h2>{mode === "week" ? `${week[0].getDate()}. – ${week[6].toLocaleDateString("de-DE", { day: "numeric", month: "short" })}` : date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" })}</h2><button type="button" aria-label="Nächster Zeitraum" onClick={() => move(1)}>›</button></div>
    </div>
    {mode === "week" ? <div className="gg-calendar-week-agenda">{week.map(day => {
      const key = localDateKey(day), dayEntries = filtered.filter(entry => entry.dateKey === key).sort((a, b) => a.time.localeCompare(b.time));
      return <div className="gg-calendar-agenda-day" key={key}><button type="button" className={key === today ? "is-today" : ""} onClick={() => { onDateChange(day); setMode("day"); }}><span>{weekdays[(day.getDay() + 6) % 7]}</span><strong>{day.getDate()}</strong></button><div>{dayEntries.length ? dayEntries.map(entry => <button type="button" className="gg-calendar-agenda-event" key={entry.id} data-kind={entry.kind} onClick={() => onOpen(entry)}><span>{entryTime(entry)}</span><strong>{entry.isDone ? "✓ " : ""}{entry.title}</strong><small>{entry.kind === "exam" ? "Prüfung" : `${entry.durationMinutes} min Lernen`}</small></button>) : <p>Keine Termine</p>}</div></div>;
    })}</div> : <DayTimeline date={date} entries={filtered.filter(entry => entry.dateKey === selected)} onOpen={onOpen} />}
    <div className="gg-calendar-key"><span><i data-kind="exam" />Prüfungen</span><span><i data-kind="study" />Lernblöcke</span><span>Tippen zum Bearbeiten</span></div>
  </section>;
}
