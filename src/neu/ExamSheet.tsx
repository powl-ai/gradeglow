"use client";

import { useState } from "react";
import { createTopic } from "../lib/examTopics";
import type { ExamPlanItem, ExamTopic } from "../types";
import type { AppCtx } from "./NeuApp";
import { addDays, dateKey, examColor, fromKey } from "./model";
import { PLAN_DEFAULTS, bookedMinutes, planSessions, replan } from "./plan";

const COLORS = ["#6d3af0", "#f08a24", "#1f9d8a", "#e0457b", "#2f7cf6", "#b8860b"];
const withValue = (list: number[], value: number) => (list.includes(value) ? list : [...list, value].sort((a, b) => a - b));

export default function ExamSheet({ ctx, examId, onClose }: { ctx: AppCtx; examId: string | null; onClose: () => void }) {
  const { exams, setExams, today, limits } = ctx;
  const existing = exams.find((exam) => exam.id === examId) ?? null;
  const activeCount = exams.filter((exam) => !exam.isHidden && exam.status !== "done" && exam.examDate >= today).length;
  const blocked = !existing && activeCount >= limits.maxExams;

  const [subject, setSubject] = useState(existing?.moduleName || existing?.title || "");
  const [title, setTitle] = useState(existing && existing.title !== existing.moduleName ? existing.title : "");
  const [date, setDate] = useState(existing?.examDate || dateKey(addDays(fromKey(today), 28)));
  const [time, setTime] = useState(existing?.examTime || "");
  const [topicsText, setTopicsText] = useState((existing?.topics ?? []).map((topic) => topic.name).join("\n"));
  const [startDays, setStartDays] = useState(existing?.studyStartDays || PLAN_DEFAULTS.startDays);
  const [blockMinutes, setBlockMinutes] = useState(existing?.sessionGoalMinutes || PLAN_DEFAULTS.blockMinutes);
  const [dailyLimit, setDailyLimit] = useState(existing?.dailyStudyLimitMinutes || PLAN_DEFAULTS.dailyLimit);
  const [color, setColor] = useState<string>(existing ? examColor(existing, exams) : COLORS[activeCount % COLORS.length]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = subject.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const save = () => {
    if (!valid || blocked) return;
    const names = [...new Set(topicsText.split(/\n|,/).map((name) => name.trim()).filter(Boolean))];
    const topics: ExamTopic[] = names.map((name) => existing?.topics?.find((topic) => topic.name === name) ?? createTopic(name));
    const base: ExamPlanItem = {
      ...(existing ?? {
        id: crypto.randomUUID(), moduleId: null, kind: "exam", status: "planned", priority: "normal",
        notes: "", targetStudyMinutes: 0, isHidden: false, studySessions: [],
      }),
      title: title.trim() || `Klausur ${subject.trim()}`, moduleName: subject.trim(),
      examDate: date, examTime: time, topics,
      studyStartDays: startDays, sessionGoalMinutes: blockMinutes, dailyStudyLimitMinutes: dailyLimit,
    } as ExamPlanItem;
    const withColor = { ...base, ...(ctx.limits.premiumThemes ? { color } : {}) } as ExamPlanItem;
    const planChanged = !existing || existing.examDate !== date || existing.studyStartDays !== startDays
      || existing.sessionGoalMinutes !== blockMinutes || existing.dailyStudyLimitMinutes !== dailyLimit
      || (existing.topics ?? []).map((t) => t.name).join("|") !== names.join("|");
    const next = !existing
      ? { ...withColor, studySessions: planSessions(withColor, { today, booked: bookedMinutes(exams) }) }
      : planChanged ? { ...withColor, studySessions: replan(withColor, exams, today) } : withColor;
    setExams((previous) => existing ? previous.map((exam) => exam.id === existing.id ? next : exam) : [...previous, next]);
    ctx.setExamId(next.id);
    onClose();
  };

  const remove = () => {
    if (!existing) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setExams((previous) => previous.filter((exam) => exam.id !== existing.id));
    ctx.setExamId(null);
    onClose();
  };

  return (
    <div className="gn-sheet" role="dialog" aria-modal="true" aria-label={existing ? "Klausur bearbeiten" : "Klausur anlegen"}>
      <header className="gn-sheet-head">
        <button type="button" className="gn-link" onClick={onClose}>Abbrechen</button>
        <strong>{existing ? "Klausur bearbeiten" : "Neue Klausur"}</strong>
        <button type="button" className="gn-link" disabled={!valid || blocked} onClick={save}>Sichern</button>
      </header>
      <div className="gn-sheet-body gn-stack">
        {blocked && (
          <section className="gn-card">
            <strong className="gn-h3">Mehr Klausuren mit Premium</strong>
            <p className="gn-muted" style={{ fontSize: 14, marginTop: 4 }}>Kostenlos planst du {limits.maxExams} Klausuren gleichzeitig. Mit Premium unbegrenzt, dazu eigene Farben und Themes.</p>
          </section>
        )}
        <section className="gn-card gn-form">
          <label>Fach<input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="z. B. Analysis I und Lineare Algebra" autoComplete="off" /></label>
          <label><span>Bezeichnung <em className="gn-muted">(optional)</em></span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Wiederholungsklausur" autoComplete="off" /></label>
          <div className="gn-form-row">
            <label>Datum<input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} /></label>
            <label>Uhrzeit<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          </div>
        </section>
        <section className="gn-card gn-form">
          <label><span>Themen <em className="gn-muted">(eins pro Zeile)</em></span>
            <textarea rows={5} value={topicsText} onChange={(e) => setTopicsText(e.target.value)} placeholder={"Eigenwerte\nIntegralrechnung\nLineare Gleichungssysteme"} />
          </label>
          <p className="gn-muted" style={{ fontSize: 13 }}>Schwache Themen bekommen mehr Lernblöcke. Wie sicher du bist, stellst du danach bei der Klausur ein.</p>
        </section>
        <section className="gn-card gn-form">
          <div className="gn-form-row three">
            <label>Lernstart<select value={startDays} onChange={(e) => setStartDays(Number(e.target.value))}>{withValue([7, 14, 21, 28, 42, 56], startDays).map((v) => <option key={v} value={v}>{v} Tage</option>)}</select></label>
            <label>Block<select value={blockMinutes} onChange={(e) => setBlockMinutes(Number(e.target.value))}>{withValue([30, 45, 60, 90, 120], blockMinutes).map((v) => <option key={v} value={v}>{v} min</option>)}</select></label>
            <label>Max./Tag<select value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))}>{withValue([60, 90, 120, 180, 240, 300], dailyLimit).map((v) => <option key={v} value={v}>{(v / 60).toLocaleString("de-DE")} h</option>)}</select></label>
          </div>
          {existing && <p className="gn-muted" style={{ fontSize: 13 }}>Änderst du Datum, Themen oder diese Werte, plant GradeGlow die offenen Blöcke neu. Erledigte bleiben.</p>}
        </section>
        <section className="gn-card">
          <div className="gn-row" style={{ justifyContent: "space-between" }}>
            <strong style={{ fontSize: 15 }}>Farbe</strong>
            {!limits.premiumThemes && <span className="gn-tag">Premium</span>}
          </div>
          <div className="gn-swatches" style={{ marginTop: 12 }}>
            {COLORS.map((value) => (
              <button key={value} type="button" aria-label={`Farbe ${value}`} aria-pressed={color === value} disabled={!limits.premiumThemes}
                style={{ background: value }} onClick={() => setColor(value)} />
            ))}
          </div>
        </section>
        {existing && (
          <button type="button" className="gn-danger" onClick={remove}>{confirmDelete ? "Wirklich löschen? Nochmal tippen" : "Klausur löschen"}</button>
        )}
      </div>
    </div>
  );
}
