"use client";

import { useState } from "react";
import { normalizeScheduleTime } from "../lib/gradeglowSchedule";
import type { UniScheduleItem } from "../types";
import { WEEKDAYS, validTimes } from "./studium";

type Props = {
  item: UniScheduleItem | null;
  defaultWeekday: number;
  onSave: (item: UniScheduleItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function ScheduleSheet({ item, defaultWeekday, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [weekday, setWeekday] = useState(item?.weekday ?? defaultWeekday);
  const [start, setStart] = useState(item ? normalizeScheduleTime(item.startTime) : "10:00");
  const [end, setEnd] = useState(item ? normalizeScheduleTime(item.endTime) : "12:00");
  const [location, setLocation] = useState(item?.location ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timesOk = validTimes(start, end);
  const valid = title.trim().length > 0 && timesOk;

  const save = () => {
    if (!valid) return;
    onSave({
      ...(item ?? { id: crypto.randomUUID(), moduleId: null, moduleName: "", notes: "", color: "violet", isHidden: false }),
      title: title.trim(), weekday, startTime: start, endTime: end, location: location.trim(),
    });
    onClose();
  };

  const remove = () => {
    if (!item) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(item.id);
    onClose();
  };

  return (
    <div className="gn-sheet" role="dialog" aria-modal="true" aria-label={item ? "Termin bearbeiten" : "Termin eintragen"}>
      <header className="gn-sheet-head">
        <button type="button" className="gn-link" onClick={onClose}>Abbrechen</button>
        <strong>{item ? "Termin bearbeiten" : "Neuer Termin"}</strong>
        <button type="button" className="gn-link" disabled={!valid} onClick={save}>Sichern</button>
      </header>
      <div className="gn-sheet-body gn-stack">
        <section className="gn-card gn-form">
          <label>Titel<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Mechanik Vorlesung" autoComplete="off" /></label>
          <label>Wochentag<select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select></label>
          <div className="gn-form-row">
            <label>Von<input type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-invalid={!timesOk} /></label>
            <label>Bis<input type="time" value={end} onChange={(e) => setEnd(e.target.value)} aria-invalid={!timesOk} /></label>
          </div>
          {!timesOk && <p className="gn-note" style={{ color: "var(--warn)" }}>Das Ende muss nach dem Beginn liegen.</p>}
          <label><span>Ort <em className="gn-muted">(optional)</em></span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z. B. H 0104" autoComplete="off" /></label>
        </section>
        {item && <button type="button" className="gn-danger" onClick={remove}>{confirmDelete ? "Wirklich löschen? Nochmal tippen" : "Termin löschen"}</button>}
      </div>
    </div>
  );
}
