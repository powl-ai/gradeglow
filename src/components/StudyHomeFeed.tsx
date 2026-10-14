"use client";

import Link from "next/link";
import { formatStudyMinutesExact, getSessionStudyMinutes } from "../lib/studyStats";
import { localDateKey, mondayOf, shiftDay } from "../lib/calendarLayout";
import { getExamPlanStatus, getTodayBlocks } from "../lib/examTopics";
import type { ExamPlanItem } from "../types";

// Design: DESIGN.md. One thing glows per screen: the next block to start.

const minutesLabel = formatStudyMinutesExact;
const weekdayLetters = ["M", "D", "M", "D", "F", "S", "S"];
const blocksLabel = (count: number) => `${count} ${count === 1 ? "Block" : "Blöcke"}`;

export default function StudyHomeFeed({ name, exams, passedEcts, targetEcts, average, streak, weekMinutes, timerRunning }: {
  name: string; exams: ExamPlanItem[]; passedEcts: number; targetEcts: number;
  average: number; streak: number; weekMinutes: number; timerRunning: boolean;
}) {
  const now = new Date(), today = localDateKey(now), weekStart = mondayOf(now);
  const visibleExams = exams.filter(exam => !exam.isHidden);
  const sessions = visibleExams.flatMap(exam => exam.studySessions.filter(session => !session.isHidden).map(session => ({ ...session, subject: exam.moduleName || exam.title })));
  const todaySessions = sessions.filter(session => session.dateKey === today);
  const todayDone = todaySessions.filter(session => session.isDone).length;
  const nextExam = visibleExams.filter(exam => exam.status !== "done" && exam.examDate >= today).sort((a, b) => a.examDate.localeCompare(b.examDate))[0];
  const progress = Math.min(100, Math.max(0, passedEcts / Math.max(1, targetEcts) * 100));
  const dateLabel = (date: string) => date === today ? "heute" : new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  const todayBlocks = getTodayBlocks(visibleExams, today);
  const [firstBlock, ...moreBlocks] = todayBlocks;
  const timerHref = (sessionId?: string) => sessionId ? `/timer?session=${encodeURIComponent(sessionId)}` : "/timer";
  const upcoming = sessions.filter(session => !session.isDone && session.dateKey > today).sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`)).slice(0, 3);
  const nextExamStatus = nextExam ? getExamPlanStatus(nextExam, today) : null;
  const firstName = name.split(" ")[0];
  const dayLine = now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  const hero = timerRunning
    ? { headline: "Dein Fokusblock läuft.", detail: "Bleib dran, der Timer zählt weiter.", action: { href: "/timer", label: "Zum Timer" } }
    : firstBlock
      ? {
        headline: `${firstBlock.isOverdue ? "Nachholen" : "Heute"}: ${firstBlock.title || "Fokusblock"}`,
        detail: `${firstBlock.isOverdue ? `Verpasst ${dateLabel(firstBlock.dateKey)} · ` : firstBlock.time ? `${firstBlock.time} · ` : ""}${minutesLabel(getSessionStudyMinutes(firstBlock))} · ${firstBlock.subject}`,
        note: firstBlock.focus,
        action: { href: timerHref(firstBlock.id), label: `${firstBlock.title || "Fokusblock"} starten` },
      }
      : todayDone > 0
        ? { headline: "Für heute erledigt.", detail: `${todayDone} von ${todaySessions.length} Lernblöcken geschafft. Jetzt ist Pause dran.`, quiet: { href: "/timer", label: "Trotzdem weiterlernen" } }
        : sessions.length > 0
          ? { headline: "Heute ist frei.", detail: upcoming[0] ? `Nächster Block: ${dateLabel(upcoming[0].dateKey)}.` : "Kein Lernblock geplant.", quiet: { href: "/timer", label: "Freien Fokusblock starten" } }
          : { headline: "Plan deine erste Klausur.", detail: "Trag Datum und Themen ein, GradeGlow verteilt die Lernblöcke rückwärts bis zur Prüfung.", action: { href: "/exams", label: "Klausur eintragen" } };

  return <section className="gg-ds-home" aria-label="Heute">
    <header className="gg-ds-hero">
      <p className="gg-ds-small">Hey {firstName} · {dayLine}</p>
      <h2 className="gg-ds-display">{hero.headline}</h2>
      <p className="gg-ds-text">{hero.detail}</p>
      {"note" in hero && hero.note && <p className="gg-ds-small">{hero.note}</p>}
      {"action" in hero && hero.action && <Link className="gg-ds-button is-primary" href={hero.action.href}>{hero.action.label}</Link>}
      {"quiet" in hero && hero.quiet && <Link className="gg-ds-button" href={hero.quiet.href}>{hero.quiet.label}</Link>}
    </header>

    {moreBlocks.length > 0 && <article className="gg-ds-panel">
      <div className="gg-ds-panel-head"><h3>Auch heute dran</h3><span>{blocksLabel(moreBlocks.length)}</span></div>
      <ul className="gg-ds-rows">{moreBlocks.map(block => <li key={block.id}>
        <div><strong>{block.title || "Fokusblock"}</strong>
          <p className={block.isOverdue ? "is-warn" : undefined}>{block.isOverdue ? `Verpasst ${dateLabel(block.dateKey)} · ` : ""}{block.subject} · {minutesLabel(getSessionStudyMinutes(block))}</p></div>
        <Link className="gg-ds-chip" href={timerHref(block.id)} aria-label={`${block.title} jetzt starten`}>Start</Link>
      </li>)}</ul>
    </article>}

    <article className="gg-ds-panel">
      <div className="gg-ds-panel-head"><h3>Diese Woche</h3><span>{weekMinutes > 0 ? `${minutesLabel(weekMinutes)} gelernt` : "noch nichts gelernt"}</span></div>
      <ol className="gg-ds-week">{Array.from({ length: 7 }, (_, index) => {
        const date = shiftDay(weekStart, index), key = localDateKey(date);
        const completed = sessions.some(session => session.dateKey === key && session.isDone);
        return <li key={key} className={`${key === today ? "is-today" : ""} ${completed ? "is-done" : ""}`.trim() || undefined}
          aria-label={`${date.toLocaleDateString("de-DE", { weekday: "long" })}: ${completed ? "gelernt" : "keine abgeschlossene Session"}`}>
          <span aria-hidden="true">{weekdayLetters[index]}</span><strong aria-hidden="true">{date.getDate()}</strong>
        </li>;
      })}</ol>
      {streak > 1 && <p className="gg-ds-small">{streak} Tage in Folge gelernt.</p>}
    </article>

    {nextExam && nextExamStatus && <Link href={`/exams?exam=${encodeURIComponent(nextExam.id)}`} className="gg-ds-panel gg-ds-exam">
      <div className="gg-ds-exam-head">
        <p className="gg-ds-count"><strong>{nextExamStatus.daysUntil}</strong><span>{nextExamStatus.daysUntil === 1 ? "Tag" : "Tage"}</span></p>
        <div><h3>{nextExam.title}</h3><p>{new Date(`${nextExam.examDate}T12:00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</p></div>
      </div>
      {nextExamStatus.totalSessions > 0 && <>
        <div className="gg-ds-track" role="progressbar" aria-label="Lernplan erledigt" aria-valuemin={0} aria-valuemax={nextExamStatus.totalSessions} aria-valuenow={nextExamStatus.doneSessions}>
          <i style={{ width: `${nextExamStatus.doneSessions / nextExamStatus.totalSessions * 100}%` }} />
        </div>
        <p className="gg-ds-small">{nextExamStatus.doneSessions} von {nextExamStatus.totalSessions} Blöcken{nextExamStatus.topicsTotal > 0 ? ` · ${nextExamStatus.topicsCovered} von ${nextExamStatus.topicsTotal} Themen` : ""}</p>
      </>}
      <p className={`gg-ds-status ${nextExamStatus.state === "behind" ? "is-warn" : ""}`.trim()}>
        {nextExamStatus.state === "behind" ? `${blocksLabel(nextExamStatus.overdueSessions.length)} hinterher. Plan neu verteilen`
          : nextExamStatus.state === "no-plan" ? "Noch kein Lernplan. Jetzt erstellen"
          : nextExamStatus.topicsTotal === 0 ? "Themen eintragen, damit der Plan passt"
          : "Du liegst im Plan"}<span aria-hidden="true"> ›</span>
      </p>
    </Link>}

    {upcoming.length > 0 && <article className="gg-ds-panel">
      <div className="gg-ds-panel-head"><h3>Als Nächstes</h3><Link href="/exams">Kalender</Link></div>
      <ul className="gg-ds-rows">{upcoming.map(task => <li key={task.id}>
        <div><strong>{task.title || "Fokusblock"}</strong><p>{dateLabel(task.dateKey)}{task.time ? ` · ${task.time}` : ""} · {task.subject}</p></div>
      </li>)}</ul>
    </article>}

    <Link href="/profile" className="gg-ds-panel gg-ds-study">
      <div className="gg-ds-panel-head"><h3>Studium</h3><span>{average > 0 ? `Schnitt ${average.toFixed(2).replace(".", ",")}` : "noch keine Noten"}</span></div>
      <div className="gg-ds-track" role="progressbar" aria-label="Studienfortschritt" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><i style={{ width: `${progress}%` }} /></div>
      <p className="gg-ds-small">{passedEcts} von {targetEcts} ECTS<span aria-hidden="true"> ›</span></p>
    </Link>
  </section>;
}
