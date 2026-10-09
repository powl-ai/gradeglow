"use client";

import Link from "next/link";
import Mascot from "./Mascot";
import { localDateKey, mondayOf, shiftDay } from "../lib/calendarLayout";
import type { ExamPlanItem } from "../types";

const minutesLabel = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;

export default function StudyHomeFeed({ name, exams, passedEcts, targetEcts, average, streak, weekMinutes, timerRunning }: {
  name: string; exams: ExamPlanItem[]; passedEcts: number; targetEcts: number;
  average: number; streak: number; weekMinutes: number; timerRunning: boolean;
}) {
  const now = new Date(), today = localDateKey(now), weekStart = mondayOf(now);
  const visibleExams = exams.filter(exam => !exam.isHidden);
  const sessions = visibleExams.flatMap(exam => exam.studySessions.filter(session => !session.isHidden).map(session => ({ ...session, subject: exam.moduleName || exam.title })));
  const todaySessions = sessions.filter(session => session.dateKey === today);
  const todayDone = todaySessions.filter(session => session.isDone).length;
  const nextTasks = sessions.filter(session => !session.isDone && session.dateKey >= today).sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`)).slice(0, 3);
  const nextExam = visibleExams.filter(exam => exam.status !== "done" && exam.examDate >= today).sort((a, b) => a.examDate.localeCompare(b.examDate))[0];
  const progress = Math.min(100, Math.max(0, passedEcts / Math.max(1, targetEcts) * 100));
  const dateLabel = (date: string) => date === today ? "Heute" : new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });

  return <section className="gg-home-feed" aria-label="Dein Lernfeed">
    <div className="gg-home-greeting"><p>{now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</p><h2>Hey {name.split(" ")[0]},<br />schön, dass du da bist.</h2></div>
    <article className="gg-home-focus-card">
      <div><span className="gg-feed-eyebrow">DEIN KLEINER GLOW-MOMENT</span><h3>{timerRunning ? "Du bist schon im Flow." : todayDone > 0 ? "Das war ein guter Anfang." : "Kleine Schritte. Großer Glow."}</h3><p>{timerRunning ? "Deine Session läuft weiter. Bleib bei einer Sache – du hast das." : todayDone > 0 ? "Lumi freut sich mit dir. Ein weiterer Fokusblock oder eine verdiente Pause?" : "Du musst heute nicht alles schaffen. Fang mit einem Fokusblock an."}</p>
        <Link className="gg-feed-primary" href="/timer">{timerRunning ? "Zum laufenden Timer" : "Fokus starten"}<span aria-hidden="true">↗</span></Link>
      </div><Mascot mood="happy" />
    </article>
    <article className="gg-feed-card gg-home-week">
      <div className="gg-feed-section-title"><h3>Deine Woche</h3><span>{streak > 0 ? `${streak} ${streak === 1 ? "Tag" : "Tage"} in Folge` : "Jeder Anfang zählt"}</span></div>
      <div className="gg-home-week-days">{Array.from({ length: 7 }, (_, index) => {
        const date = shiftDay(weekStart, index), key = localDateKey(date);
        const completed = sessions.some(session => session.dateKey === key && session.isDone);
        return <div key={key} className={`${key === today ? "is-today" : ""} ${completed ? "is-done" : ""}`} aria-label={`${date.toLocaleDateString("de-DE", { weekday: "long" })}: ${completed ? "gelernt" : "noch keine abgeschlossene Session"}`}><span>{["M", "D", "M", "D", "F", "S", "S"][index]}</span><strong>{completed ? "✓" : date.getDate()}</strong></div>;
      })}</div>
      <p className="gg-feed-muted">{weekMinutes > 0 ? `${minutesLabel(weekMinutes)} diese Woche gelernt. Das zählt.` : "Eine abgeschlossene Session lässt deinen Tag aufleuchten."}</p>
    </article>
    <article className="gg-feed-card gg-home-agenda">
      <div className="gg-feed-section-title"><h3>Dein nächster Schritt</h3><Link href="/exams">Kalender ↗</Link></div>
      {nextTasks.length ? <div className="gg-home-task-list">{nextTasks.map(task => <Link href="/exams" key={task.id}><span className="gg-task-marker" aria-hidden="true" /><div><strong>{task.title || "Fokusblock"}</strong><p>{task.subject}</p><small>{dateLabel(task.dateKey)}{task.time ? ` · ${task.time}` : ""} · {minutesLabel(task.durationMinutes)}</small></div><span aria-hidden="true">›</span></Link>)}</div> : <div className="gg-home-empty"><p>Platz für deinen nächsten guten Schritt.</p><Link href="/exams">Eine Prüfung oder Lernsession planen ↗</Link></div>}
      {todaySessions.length > 0 && <p className="gg-feed-muted gg-home-today-count">Heute {todayDone} von {todaySessions.length} Lernblöcken geschafft.</p>}
    </article>
    {nextExam && <Link href="/exams" className="gg-feed-card gg-home-exam"><span className="gg-home-exam-icon" aria-hidden="true">▤</span><div><span className="gg-feed-eyebrow">NÄCHSTE PRÜFUNG</span><strong>{nextExam.title}</strong><p>{dateLabel(nextExam.examDate)}{nextExam.examTime ? ` · ${nextExam.examTime}` : ""}</p></div><span aria-hidden="true">›</span></Link>}
    <article className="gg-feed-card gg-home-progress">
      <div className="gg-feed-section-title"><h3>Schau, wie weit du bist</h3><strong>{Math.round(progress)}%</strong></div>
      <div className="gg-home-progress-track" role="progressbar" aria-label="Studienfortschritt" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><i style={{ width: `${progress}%` }} /></div>
      <div className="gg-home-progress-numbers"><span><strong>{passedEcts}</strong> / {targetEcts} ECTS</span><span>Schnitt <strong>{average > 0 ? average.toFixed(2).replace(".", ",") : "—"}</strong></span></div>
      <Link href="/profile" className="gg-feed-text-link">Deinen Fortschritt ansehen ↗</Link>
    </article>
    <p className="gg-home-signoff">Dein Tempo. Dein Studium. Dein Glow.</p>
  </section>;
}
