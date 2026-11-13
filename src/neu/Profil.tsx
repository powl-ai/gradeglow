"use client";

import { useState } from "react";
import { useGradeGlowModules } from "../hooks/useGradeGlowModules";
import { useGradeGlowSchedule } from "../hooks/useGradeGlowSchedule";
import type { UniModule, UniScheduleItem } from "../types";
import type { AppCtx } from "./NeuApp";
import ModuleSheet from "./ModuleSheet";
import ScheduleSheet from "./ScheduleSheet";
import { fromKey, skyCollection } from "./model";
import type { CollectedSky } from "./model";
import { STATUS_LABELS, bySemester, effectiveStatus, finalGrade, gradeLabel, gradeSummary, scheduleByDay } from "./studium";

type Open = { kind: "module"; id: string | null } | { kind: "schedule"; id: string | null } | null;

const ectsLabel = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ","));

export default function Profil({ ctx, hidden }: { ctx: AppCtx; hidden: boolean }) {
  const { user, profile, limits, exams, today } = ctx;
  const { modules, setModules, isLoaded: modulesLoaded } = useGradeGlowModules(user);
  const { scheduleItems, setScheduleItems, isLoaded: scheduleLoaded } = useGradeGlowSchedule(user);
  const [open, setOpen] = useState<Open>(null);

  const summary = gradeSummary(modules, profile.targetEcts);
  const semesters = bySemester(modules);
  const days = scheduleByDay(scheduleItems);
  const weekdayToday = fromKey(today).getDay();
  const skies = skyCollection(exams);
  const complete = skies.filter((sky) => sky.complete).length;
  const moduleLimited = Number.isFinite(limits.maxModules);
  const modulesFull = moduleLimited && modules.length >= limits.maxModules;
  const studies = [profile.degreeProgram, profile.university].filter(Boolean).join(" · ");
  const editedModule = open?.kind === "module" ? modules.find((item) => item.id === open.id) ?? null : null;
  const editedEntry = open?.kind === "schedule" ? scheduleItems.find((item) => item.id === open.id) ?? null : null;

  const saveModule = (next: UniModule) => setModules((previous) =>
    previous.some((item) => item.id === next.id) ? previous.map((item) => (item.id === next.id ? next : item)) : [...previous, next]);
  const saveEntry = (next: UniScheduleItem) => setScheduleItems((previous) =>
    previous.some((item) => item.id === next.id) ? previous.map((item) => (item.id === next.id ? next : item)) : [...previous, next]);

  if (hidden) return null;

  return (
    <>
      <div className="gn-scroll">
        <header className="gn-top">
          <h1>Profil</h1>
          <div className="gn-actions"><button type="button" className="gn-icon text" onClick={ctx.openSettings}>Einstellungen</button></div>
        </header>

        <div className="gn-stack">
          <section className="gn-card gn-row" aria-label="Konto">
            <div>
              <strong>{ctx.name || "Dein Profil"}</strong>
              <small>{studies || user.email || (user.provider === "demo" ? "Demo ohne Konto" : "Ohne E-Mail angemeldet")}</small>
            </div>
            <span className="gn-tag">{limits.premiumThemes ? "Premium" : "Kostenlos"}</span>
          </section>

          <div className="gn-h2"><h2>Noten und ECTS</h2>{modules.length > 0 && <button type="button" className="gn-link gn-hit" onClick={() => setOpen({ kind: "module", id: null })}>Modul eintragen</button>}</div>
          {!modulesLoaded ? <p className="gn-wait">Deine Module werden geladen.</p> : modules.length === 0 ? (
            <section className="gn-card gn-empty">
              <h3 className="gn-h3">Noch keine Module</h3>
              <p>Trag Module mit ECTS und Note ein. GradeGlow rechnet deinen Schnitt und zeigt, wie weit du im Studium bist.</p>
              <button type="button" className="gn-go" style={{ width: "100%" }} onClick={() => setOpen({ kind: "module", id: null })}>Erstes Modul eintragen</button>
            </section>
          ) : (
            <>
              <section className="gn-card gn-stack" style={{ gap: 12 }} aria-label="Überblick">
                <div className="gn-stats">
                  <div><span className="gn-muted">Schnitt</span><strong>{gradeLabel(summary.average, 2)}</strong></div>
                  <div><span className="gn-muted">ECTS</span><strong>{ectsLabel(summary.earnedEcts)} / {ectsLabel(summary.targetEcts)}</strong></div>
                  <div><span className="gn-muted">Offen</span><strong>{ectsLabel(summary.openEcts)}</strong></div>
                </div>
                <div className="gn-bar" role="img" aria-label={`${Math.round(summary.progress * 100)} Prozent der ECTS erreicht`}><i style={{ width: `${summary.progress * 100}%` }} /></div>
                {summary.average === null && <p className="gn-muted gn-note">Der Schnitt erscheint, sobald ein bestandenes Modul eine Note hat.</p>}
              </section>
              <section className="gn-card" aria-label="Module">
                {semesters.map((group) => (
                  <div key={group.semester} className="gn-group">
                    <h3 className="gn-group-title">{group.semester}. Semester</h3>
                    <ul className="gn-list">
                      {group.items.map((item) => {
                        const status = effectiveStatus(item);
                        const grade = finalGrade(item);
                        return (
                          <li key={item.id}>
                            <button type="button" className="gn-row gn-tap" onClick={() => setOpen({ kind: "module", id: item.id })} aria-label={`${item.name || "Modul"} bearbeiten`}>
                              <div>
                                <strong>{item.name || "Ohne Namen"}</strong>
                                <small style={status === "failed" ? { color: "var(--warn)" } : undefined}>{ectsLabel(item.ects)} ECTS · {STATUS_LABELS[status]}</small>
                              </div>
                              <span className="gn-num">{grade === null ? "–" : gradeLabel(grade, Number.isInteger(grade * 10) ? 1 : 2)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {moduleLimited && limits.maxModules - modules.length <= 2 && (
                  <p className="gn-muted gn-note">{modules.length} von {limits.maxModules} Modulen im kostenlosen Plan.</p>
                )}
              </section>
            </>
          )}

          <div className="gn-h2"><h2>Stundenplan</h2>{days.length > 0 && <button type="button" className="gn-link gn-hit" onClick={() => setOpen({ kind: "schedule", id: null })}>Termin eintragen</button>}</div>
          {!scheduleLoaded ? <p className="gn-wait">Dein Stundenplan wird geladen.</p> : days.length === 0 ? (
            <section className="gn-card">
              <h3 className="gn-h3">Noch kein Stundenplan</h3>
              <p className="gn-muted gn-note">Trag Vorlesungen und Übungen ein, dann steht deine Uni-Woche hier auf einen Blick.</p>
              <button type="button" className="gn-link gn-hit" onClick={() => setOpen({ kind: "schedule", id: null })}>Termin eintragen</button>
            </section>
          ) : (
            <section className="gn-card" aria-label="Stundenplan">
              {days.map((day) => (
                <div key={day.value} className="gn-group">
                  <h3 className="gn-group-title" style={day.value === weekdayToday ? { color: "var(--acc-ink)" } : undefined}>{day.label}{day.value === weekdayToday ? " · heute" : ""}</h3>
                  <ul className="gn-list">
                    {day.items.map((item) => (
                      <li key={item.id}>
                        <button type="button" className="gn-row gn-tap" onClick={() => setOpen({ kind: "schedule", id: item.id })} aria-label={`${item.title} bearbeiten`}>
                          <span className="gn-time">{item.startTime || "offen"}{item.endTime ? <><br />{item.endTime}</> : null}</span>
                          <div><strong>{item.title}</strong>{(item.location || item.moduleName) && <small>{[item.location, item.moduleName].filter(Boolean).join(" · ")}</small>}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          <div className="gn-h2"><h2>Sternbilder</h2>{skies.length > 0 && <span className="gn-muted gn-count">{complete} von {skies.length} vollständig</span>}</div>
          {skies.length === 0 ? (
            <section className="gn-card">
              <h3 className="gn-h3">Noch kein Sternbild</h3>
              <p className="gn-muted gn-note">Jeder erledigte Lernblock lässt einen Stern leuchten. Ist der Plan einer Klausur komplett, bleibt ihr Sternbild hier.</p>
            </section>
          ) : (
            <div className="gn-skies">
              {skies.map((sky) => (
                <button key={sky.examId} type="button" className="gn-skycard" onClick={() => ctx.go("klausuren", undefined, sky.examId)}
                  aria-label={`${sky.constellation.name}, ${sky.name}: ${sky.complete ? "vollständig" : `${sky.lit} von ${sky.constellation.stars.length} Sternen`}`}>
                  <MiniSky sky={sky} />
                  <strong>{sky.constellation.name}</strong>
                  <small>{sky.name} · {sky.complete ? "vollständig" : `${sky.lit} von ${sky.constellation.stars.length}`}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {open?.kind === "module" && (
        <ModuleSheet key={open.id ?? "new"} current={editedModule} defaultSemester={Math.max(1, Math.round(profile.currentSemester) || 1)}
          blocked={modulesFull} maxModules={limits.maxModules} onSave={saveModule}
          onDelete={(id) => setModules((previous) => previous.filter((item) => item.id !== id))} onClose={() => setOpen(null)} />
      )}
      {open?.kind === "schedule" && (
        <ScheduleSheet key={open.id ?? "new"} item={editedEntry} defaultWeekday={weekdayToday}
          onSave={saveEntry} onDelete={(id) => setScheduleItems((previous) => previous.filter((item) => item.id !== id))} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

/** A small, quiet version of the Fokus sky: lit stars and the lines between them. */
function MiniSky({ sky }: { sky: CollectedSky }) {
  const { stars, edges } = sky.constellation;
  const xs = stars.map((star) => star.x), ys = stars.map((star) => star.y);
  const dx = (366 - Math.min(...xs) - Math.max(...xs)) / 2, dy = (270 - Math.min(...ys) - Math.max(...ys)) / 2;
  const at = (index: number) => ({ x: stars[index].x + dx, y: stars[index].y + dy });
  const path = (list: [number, number][]) => list.map(([a, b]) => `M${at(a).x} ${at(a).y}L${at(b).x} ${at(b).y}`).join("") || "M0 0";
  const on = edges.filter(([a, b]) => a < sky.lit && b < sky.lit);
  const off = edges.filter(([a, b]) => !(a < sky.lit && b < sky.lit));
  return (
    <svg viewBox="0 0 366 270" aria-hidden="true">
      <path d={path(off)} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeDasharray="3 7" />
      <path d={path(on)} fill="none" stroke="rgba(214,200,255,0.8)" strokeWidth="2.6" strokeLinecap="round" />
      {stars.map((star, index) => {
        const lit = index < sky.lit;
        return <circle key={index} cx={at(index).x} cy={at(index).y} r={lit ? 4 + star.m * 3 : 3} fill={lit ? star.tint ?? "#fff" : "rgba(255,255,255,0.3)"} />;
      })}
    </svg>
  );
}
