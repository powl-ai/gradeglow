"use client";

import { useState } from "react";
import type { ModuleStatus, UniModule } from "../types";
import { STATUS_LABELS, applyModuleInput, finalGrade, gradeLabel, parseGrade } from "./studium";

const STATUSES: ModuleStatus[] = ["passed", "open", "ungraded", "failed"];
const SEMESTERS = Array.from({ length: 14 }, (_, index) => index + 1);

type Props = {
  current: UniModule | null;
  defaultSemester: number;
  /** Free limit reached: only relevant for a new module. */
  blocked: boolean;
  maxModules: number;
  onSave: (module: UniModule) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function ModuleSheet({ current, defaultSemester, blocked, maxModules, onSave, onDelete, onClose }: Props) {
  const parts = current?.assessments.length ?? 0;
  const hasParts = parts > 0;
  const [name, setName] = useState(current?.name ?? "");
  const [ects, setEcts] = useState(current ? String(current.ects).replace(".", ",") : "6");
  const [semester, setSemester] = useState(current?.semester ?? defaultSemester);
  const [status, setStatus] = useState<ModuleStatus>(current?.status ?? "open");
  const [grade, setGrade] = useState(current && current.grade !== null ? gradeLabel(current.grade) : "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parsedEcts = Number(ects.trim().replace(",", "."));
  const parsedGrade = hasParts ? null : parseGrade(grade);
  const ectsOk = ects.trim() !== "" && Number.isFinite(parsedEcts) && parsedEcts >= 0 && parsedEcts <= 60;
  const stop = blocked && current === null;
  const valid = !stop && name.trim().length > 0 && ectsOk && parsedGrade !== undefined;

  const save = () => {
    if (!valid || parsedGrade === undefined) return;
    onSave(applyModuleInput({ name, ects: parsedEcts, semester, status, grade: parsedGrade }, current));
    onClose();
  };

  const remove = () => {
    if (!current) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(current.id);
    onClose();
  };

  // Typing a grade settles the status; a module without grade cannot stay "Bestanden" by accident.
  const changeGrade = (text: string) => {
    setGrade(text);
    const value = parseGrade(text);
    if (typeof value === "number") setStatus(value > 4 ? "failed" : "passed");
  };

  return (
    <div className="gn-sheet" role="dialog" aria-modal="true" aria-label={current ? "Modul bearbeiten" : "Modul eintragen"}>
      <header className="gn-sheet-head">
        <button type="button" className="gn-link" onClick={onClose}>{stop ? "Schließen" : "Abbrechen"}</button>
        <strong>{current ? "Modul bearbeiten" : "Neues Modul"}</strong>
        {stop ? <span /> : <button type="button" className="gn-link" disabled={!valid} onClick={save}>Sichern</button>}
      </header>
      <div className="gn-sheet-body gn-stack">
        {stop ? (
          <section className="gn-card">
            <strong className="gn-h3">{maxModules} Module sind eingetragen</strong>
            <p className="gn-muted gn-note">Das ist die Grenze im kostenlosen Plan. Bestehende Module kannst du weiter bearbeiten oder löschen. Mit Premium gibt es keine Grenze.</p>
          </section>
        ) : (
          <>
            <section className="gn-card gn-form">
              <label>Modul<input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Mechanik" autoComplete="off" /></label>
              <div className="gn-form-row">
                <label>ECTS<input value={ects} onChange={(e) => setEcts(e.target.value)} inputMode="decimal" autoComplete="off" aria-invalid={!ectsOk} /></label>
                <label>Semester<select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                  {(SEMESTERS.includes(semester) ? SEMESTERS : [...SEMESTERS, semester]).map((value) => <option key={value} value={value}>{value}. Semester</option>)}
                </select></label>
              </div>
            </section>
            <section className="gn-card gn-form">
              <div className="gn-form-row">
                <label><span>Note <em className="gn-muted">(optional)</em></span>
                  {hasParts
                    ? <input value={gradeLabel(current ? finalGrade(current) : null, 2)} readOnly aria-readonly="true" />
                    : <input value={grade} onChange={(e) => changeGrade(e.target.value)} inputMode="decimal" placeholder="1,7" autoComplete="off" aria-invalid={parsedGrade === undefined} />}
                </label>
                <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as ModuleStatus)}>
                  {STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
                </select></label>
              </div>
              <p className="gn-muted gn-note">
                {hasParts ? `Die Note ergibt sich aus ${parts} ${parts === 1 ? "Teilleistung" : "Teilleistungen"}.`
                  : parsedGrade === undefined ? "Noten liegen zwischen 1,0 und 5,0."
                  : "In den Schnitt zählen bestandene Module mit Note, gewichtet nach ECTS."}
              </p>
            </section>
            {current && <button type="button" className="gn-danger" onClick={remove}>{confirmDelete ? "Wirklich löschen? Nochmal tippen" : "Modul löschen"}</button>}
          </>
        )}
      </div>
    </div>
  );
}
