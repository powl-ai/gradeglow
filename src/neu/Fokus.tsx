"use client";

import { useEffect, useState } from "react";
import { useFocusSession } from "../components/FocusSessionProvider";
import { getExamPlanStatus, getTodayBlocks } from "../lib/examTopics";
import { getFocusElapsedMs } from "../lib/focusSession";
import { getSessionStudyMinutes } from "../lib/studyStats";
import type { StudySessionItem } from "../types";
import type { AppCtx } from "./NeuApp";
import { Icon } from "./Icons";
import { constellationFor, dateKey, dayLabel, examColor, examShort, litStars, minutesLabel, timeOf } from "./model";

const DURATIONS = [25, 45, 60, 90];
const VIEW_KEY = "gn-fokus-view";
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

// Background stars: deterministic so they do not jump between renders.
const DUST = (() => {
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return Array.from({ length: 46 }, (_, i) => ({
    x: rnd() * 366, y: rnd() * 300, r: 0.4 + rnd() * 0.9, o: 0.15 + rnd() * 0.45,
    c: i % 7 === 0 ? "gn-tw" : i % 11 === 0 ? "gn-tw2" : undefined,
  }));
})();
const spark = (x: number, y: number, s: number) =>
  `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;

export default function Fokus({ ctx }: { ctx: AppCtx }) {
  const { exams, setExams, today } = ctx;
  const focus = useFocusSession();
  const visible = exams.filter((exam) => !exam.isHidden && exam.status !== "done");
  const active = focus.hasSession ? focus.session : null;

  // What the timer would start: the picked block, else today's first block, else the next exam.
  const todayBlocks = getTodayBlocks(visible, today);
  const options = (() => {
    const open = visible.flatMap((exam) => exam.studySessions
      .filter((s) => !s.isHidden && !s.isDone && s.dateKey <= dateKey(new Date(Date.now() + 7 * 86_400_000)))
      .map((s) => ({ exam, session: s as StudySessionItem | null })))
      .sort((a, b) => `${a.session?.dateKey} ${a.session?.time}`.localeCompare(`${b.session?.dateKey} ${b.session?.time}`))
      .slice(0, 12);
    return [...open, ...visible.map((exam) => ({ exam, session: null }))];
  })();
  const fallback = todayBlocks[0] ? { examId: todayBlocks[0].examId, sessionId: todayBlocks[0].id } : { examId: visible[0]?.id ?? null, sessionId: null };
  const pick = active ? { examId: active.examId, sessionId: active.sessionId }
    : ctx.focusPick.examId || ctx.focusPick.sessionId ? ctx.focusPick : fallback;
  const exam = visible.find((item) => item.id === pick.examId)
    ?? visible.find((item) => item.studySessions.some((s) => s.id === pick.sessionId)) ?? visible[0];
  const block = exam?.studySessions.find((s) => s.id === pick.sessionId) ?? null;
  const [minutes, setMinutes] = useState<number | null>(null);
  const goal = active?.goalMinutes ?? minutes ?? (block?.durationMinutes && block.durationMinutes <= 180 ? Math.round(block.durationMinutes) : 45);
  const [message, setMessage] = useState("");
  // Sky or plain list: a per-device preference, remembered between visits.
  const [asList, setAsList] = useState(false);
  useEffect(() => { try { setAsList(window.localStorage.getItem(VIEW_KEY) === "list"); } catch { /* optional */ } }, []);
  const flip = () => setAsList((current) => {
    try { window.localStorage.setItem(VIEW_KEY, current ? "sky" : "list"); } catch { /* optional */ }
    return !current;
  });

  const status = exam ? getExamPlanStatus(exam, today) : null;
  const constellation = constellationFor(status?.totalSessions ?? 0);
  const lit = status ? litStars(constellation, status.doneSessions, status.totalSessions) : 0;
  const running = Boolean(active && ["running", "away", "paused"].includes(focus.status));
  const shown = lit + (running && lit < constellation.stars.length ? 1 : 0);
  const elapsed = active ? getFocusElapsedMs(active, focus.now) / 1000 : 0;
  const remaining = active ? active.goalMinutes * 60 - elapsed : goal * 60;
  const endsAt = new Date(Date.now() + remaining * 1000);

  const start = () => {
    if (!exam) return;
    const subjectTitle = exam.moduleName || exam.title || "Freie Lernzeit";
    const started = focus.store.start({
      examId: exam.id, sessionId: block?.id ?? null, title: block?.title || subjectTitle, subjectTitle,
      mode: "focus", goalMinutes: goal,
    }, Date.now());
    if (started) setMessage("");
  };

  const save = () => {
    const current = focus.store.getSnapshot().session;
    if (!current || current.savedSessionId || current.status === "abgebrochen") return;
    if (!exams.some((item) => item.id === current.examId)) { setMessage("Die Klausur ist noch nicht geladen. Deine Zeit bleibt im Timer."); return; }
    const finished = focus.store.finish(Date.now());
    if (!finished || finished.status !== "finished") return;
    const startedAt = new Date(finished.startedAt);
    const completedAt = new Date(finished.endedAt ?? Date.now());
    const focusedMs = getFocusElapsedMs(finished, completedAt.getTime());
    if (focusedMs < 60_000) { focus.store.abort(Date.now()); setMessage("Unter einer Minute, nichts gespeichert."); return; }
    const planned = exams.find((item) => item.id === finished.examId)?.studySessions.find((s) => s.id === finished.sessionId);
    const sessionId = planned?.id ?? `focus-${finished.id}`;
    const session: StudySessionItem = {
      ...(planned ?? {}),
      id: sessionId, examId: finished.examId,
      title: planned?.title || `Fokus · ${finished.subjectTitle}`,
      dateKey: dateKey(startedAt), time: planned?.time || timeOf(startedAt),
      durationMinutes: focusedMs / 60_000, focusedMs, awayMs: finished.awayMs, awayCount: finished.awayCount,
      focus: planned?.focus || "Per Timer erfasste Lernzeit", notes: planned?.notes ?? "",
      isDone: true, isHidden: planned?.isHidden ?? false, isManual: planned?.isManual ?? true,
      startedAtIso: startedAt.toISOString(), completedAtIso: completedAt.toISOString(),
    };
    setExams((previous) => previous.map((item) => item.id === finished.examId ? {
      ...item, studySessions: [...item.studySessions.filter((s) => s.id !== sessionId), session]
        .sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`)),
    } : item));
    focus.store.markSaved(finished.id, sessionId);
    ctx.setFocusPick({ examId: finished.examId, sessionId: null });
    setMessage(`${minutesLabel(focusedMs / 60_000)} gespeichert.${planned ? " Ein neuer Stern leuchtet." : ""}`);
  };

  if (!exam) {
    return (
      <div className="gn-scroll">
        <header className="gn-top"><h1>Fokus</h1></header>
        <section className="gn-card gn-empty">
          <h2 className="gn-h3">Noch keine Klausur</h2>
          <p>Leg eine Klausur an, dann sammelst du beim Lernen Sterne für ihr Sternbild.</p>
          <button type="button" className="gn-go" style={{ width: "100%" }} onClick={() => ctx.openExam(null)}>Klausur anlegen</button>
        </section>
      </div>
    );
  }

  const planned = exam.studySessions.filter((s) => !s.isHidden).sort((x, y) => `${x.dateKey} ${x.time}`.localeCompare(`${y.dateKey} ${y.time}`));
  // Centre each figure in the sky above the caption (drawing area 366 × 270).
  const xs = constellation.stars.map((star) => star.x), ys = constellation.stars.map((star) => star.y);
  const dx = (366 - Math.min(...xs) - Math.max(...xs)) / 2, dy = (262 - Math.min(...ys) - Math.max(...ys)) / 2;
  const stars = constellation.stars.map((star) => ({ ...star, x: star.x + dx, y: star.y + dy }));
  const edgeOn = constellation.edges.filter(([a, b]) => a < shown && b < shown);
  const edgeOff = constellation.edges.filter(([a, b]) => !(a < shown && b < shown));
  const line = (edges: [number, number][]) => edges.map(([a, b]) => `M${stars[a].x} ${stars[a].y}L${stars[b].x} ${stars[b].y}`).join("") || "M0 0";
  const optionValue = (examId: string, sessionId: string | null) => `${examId}|${sessionId ?? ""}`;

  return (
    <div className="gn-scroll">
      <header className="gn-top">
        <h1>Fokus</h1>
      </header>

      <div className={`gn-flip ${asList ? "is-flipped" : ""}`}>
        <button type="button" className="gn-sky gn-face" onClick={flip} aria-hidden={asList} tabIndex={asList ? -1 : 0} aria-label={`${constellation.name}: ${lit} von ${stars.length} Sternen. Tippen für die Liste`}>
          <svg viewBox="0 0 366 330" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <radialGradient id="gn-halo"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.35" stopColor="#c8b6ff" stopOpacity="0.45" /><stop offset="1" stopColor="#8f6bff" stopOpacity="0" /></radialGradient>
            </defs>
            {DUST.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff" opacity={p.o} className={p.c} />)}
            <path d={line(edgeOff)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="2 4" />
            <path d={line(edgeOn)} fill="none" stroke="rgba(214,200,255,0.75)" strokeWidth="1.4" strokeLinecap="round" />
            {stars.map((star, index) => {
              const on = index < lit, next = index === lit && running;
              return (
                <g key={index} className={next ? "gn-next" : undefined}>
                  {(on || next) && <circle cx={star.x} cy={star.y} r={on ? 9 + star.m * 5 : 16} fill="url(#gn-halo)" />}
                  {(on || next) && <path d={spark(star.x, star.y, on ? 5 + star.m * 3.5 : 10)} fill="#fff" opacity={0.92} />}
                  <circle cx={star.x} cy={star.y} r={on ? 1.6 + star.m : next ? 2.4 : 1.4 + star.m * 0.4} fill={on ? star.tint ?? "#fff" : next ? "#fff" : "rgba(255,255,255,0.32)"} />
                </g>
              );
            })}
          </svg>
          <div className="gn-sky-caption">
            <div>
              <strong>{constellation.name} <em>· {examShort(exam)}</em></strong>
              <small>{running ? `Stern ${Math.min(lit + 1, stars.length)} von ${stars.length} entsteht gerade` : `${lit} von ${stars.length} Sternen`}</small>
            </div>
            {status && status.daysUntil >= 0 && <span>noch {status.daysUntil} {status.daysUntil === 1 ? "Tag" : "Tage"}</span>}
          </div>
        </button>
        <div className="gn-face gn-face-back gn-blocks" aria-hidden={!asList}>
          <button type="button" className="gn-blocks-head" onClick={flip} aria-label="Sternbild zeigen" tabIndex={asList ? 0 : -1}>
            <div><strong>{examShort(exam)}</strong><small>{status ? `${status.doneSessions} von ${status.totalSessions} Blöcken` : ""}</small></div>
            <span className="gn-tag">Sternbild</span>
          </button>
          <ul className="gn-list">
            {planned.map((s) => {
              const topic = exam.topics?.find((t) => t.id === s.topicId)?.name;
              const isNext = s.id === block?.id && !s.isDone;
              return (
                <li key={s.id}>
                  <span className={`gn-check ${s.isDone ? "is-done" : ""} ${isNext ? "is-today" : ""}`}>{s.isDone && Icon.check(12)}</span>
                  <div>
                    <strong style={s.isDone ? { color: "var(--muted)" } : undefined}>{s.title || "Fokusblock"}</strong>
                    <small>{dayLabel(s.dateKey, today)} · {minutesLabel(getSessionStudyMinutes(s))}{topic && topic !== s.title ? ` · ${topic}` : ""}</small>
                  </div>
                </li>
              );
            })}
            {planned.length === 0 && <li><small>Noch keine Lernblöcke geplant.</small></li>}
          </ul>
        </div>
      </div>

      <div className="gn-pills">
        <label className="gn-pill">
          <i style={{ background: examColor(exam, visible) }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{block?.title || `Frei · ${exam.moduleName || exam.title}`}</span>{Icon.down()}
          <select aria-label="Lernblock wählen" disabled={Boolean(active)} value={optionValue(exam.id, block?.id ?? null)}
            onChange={(event) => { const [examId, sessionId] = event.target.value.split("|"); ctx.setFocusPick({ examId, sessionId: sessionId || null }); setMinutes(null); }}>
            {options.map(({ exam: item, session }) => (
              <option key={optionValue(item.id, session?.id ?? null)} value={optionValue(item.id, session?.id ?? null)}>
                {session ? `${session.title || "Fokusblock"} · ${dayLabel(session.dateKey, today)}` : `Freie Lernzeit · ${item.moduleName || item.title}`}
              </option>
            ))}
          </select>
        </label>
        <label className="gn-pill">
          {goal} min{Icon.down()}
          <select aria-label="Dauer wählen" disabled={Boolean(active)} value={DURATIONS.includes(goal) ? goal : ""} onChange={(event) => setMinutes(Number(event.target.value))}>
            {!DURATIONS.includes(goal) && <option value="">{goal} min</option>}
            {DURATIONS.map((value) => <option key={value} value={value}>{value} min</option>)}
          </select>
        </label>
      </div>

      <section className="gn-timer" aria-label="Timer">
        <span role="timer">{clock(remaining)}</span>
        {focus.status === "away" && <p>Pausiert, solange die App nicht offen ist.</p>}
        {focus.status === "finished" && <p>Zeit um. Speichern, damit der Stern leuchtet.</p>}
        {!active && message && <p>{message}</p>}
        {!active && !message && <p>Fertig um {timeOf(endsAt)}</p>}
        <div>
          {!active && <button type="button" className="gn-go" onClick={start}>{Icon.play()}Fokus starten</button>}
          {active && (
            <>
              <button type="button" className="gn-go quiet" onClick={focus.status === "finished" ? () => focus.store.abort(Date.now()) : save}>{focus.status === "finished" ? "Verwerfen" : "Beenden"}</button>
              {focus.status === "paused" && <button type="button" className="gn-go" onClick={() => focus.store.resume(Date.now())}>Weiter</button>}
              {(focus.status === "running" || focus.status === "away") && <button type="button" className="gn-go" onClick={() => focus.store.pause(Date.now())}>Pause</button>}
              {focus.status === "finished" && <button type="button" className="gn-go" onClick={save}>Stern speichern</button>}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
