"use client";

import { useEffect, useState } from "react";
import { confidenceFromPct, topicPct } from "../lib/examTopics";
import { auth } from "../lib/firebase";
import { QUICK_CHECK, QUIZ_LENGTH, blendPct, type QuizQuestion } from "../lib/quiz";
import type { AppCtx } from "./NeuApp";
import { testPremiumAllowed } from "./testPremium";

/** After a block, or from the topic list: a short quiz (premium) or a quick check (free).
 *  The result sets how sure the user is on this topic, in percent. */
export default function QuizSheet({ ctx, examId, topicId, onClose }: { ctx: AppCtx; examId: string; topicId: string; onClose: () => void }) {
  const { exams, setExams, limits, user } = ctx;
  const exam = exams.find((item) => item.id === examId);
  const topic = exam?.topics?.find((item) => item.id === topicId);
  // On preview links the quiz also runs for the demo and the premium test switch, without a login.
  const previewTest = testPremiumAllowed() && (ctx.testPremium || user.provider !== "firebase");
  const premium = limits.premiumThemes && (user.provider === "firebase" || previewTest);

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [result, setResult] = useState<{ before: number; after: number; score: number } | null>(null);

  useEffect(() => {
    if (!premium || !exam || !topic) return;
    let cancelled = false;
    (async () => {
      try {
        const token = user.provider === "firebase" ? await auth?.currentUser?.getIdToken() : undefined;
        if (!token && !previewTest) throw new Error("Bitte melde dich an.");
        const res = await fetch("/api/quiz", {
          method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(previewTest ? { "x-gradeglow-test-premium": "1" } : {}) },
          body: JSON.stringify({ subject: exam.moduleName || exam.title, topic: topic.name }),
        });
        const body = (await res.json().catch(() => ({}))) as { questions?: QuizQuestion[]; error?: string };
        if (!res.ok || !body.questions) throw new Error(body.error || "Die Fragen konnten nicht geladen werden.");
        if (!cancelled) setQuestions(body.questions);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Die Fragen konnten nicht geladen werden.");
      }
    })();
    return () => { cancelled = true; };
    // Load once per opened sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!exam || !topic) return null;

  const total = premium ? questions?.length ?? 0 : QUICK_CHECK.length;
  const finish = (all: number[]) => {
    const score = Math.round(all.reduce((sum, value) => sum + value, 0) / all.length);
    const before = topicPct(topic);
    const after = blendPct(topic.confidencePct, score);
    setExams((previous) => previous.map((item) => item.id !== exam.id ? item : {
      ...item, topics: (item.topics ?? []).map((t) => t.id !== topic.id ? t : { ...t, confidencePct: after, confidence: confidenceFromPct(after) }),
    }));
    setResult({ before, after, score });
  };
  const next = (value: number) => {
    const all = [...points, value];
    setPoints(all);
    setPicked(null);
    if (all.length >= total) finish(all); else setIndex(index + 1);
  };

  const question = premium ? questions?.[index] : null;
  const check = premium ? null : QUICK_CHECK[index];

  return (
    <div className="gn-sheet" role="dialog" aria-modal="true" aria-label={premium ? "Quiz" : "Schnellcheck"}>
      <header className="gn-sheet-head">
        <button type="button" className="gn-link" onClick={onClose}>{result ? "Fertig" : "Abbrechen"}</button>
        <strong>{topic.name}</strong>
        <span className="gn-muted gn-count">{!result && total > 0 ? `${index + 1}/${total}` : ""}</span>
      </header>
      <div className="gn-sheet-body gn-stack">
        {result ? (
          <section className="gn-card gn-quiz-result">
            <span className="gn-num" style={{ fontSize: 44 }}>{result.after} %</span>
            <p>{premium ? `${points.filter((value) => value === 100).length} von ${total} richtig.` : "Danke, das fließt in deinen Plan ein."} Vorher {result.before} %.</p>
            <p className="gn-muted gn-note">Unter 34 % bekommt das Thema die meisten Lernblöcke, ab 67 % nur noch Wiederholung.</p>
            <button type="button" className="gn-go" style={{ width: "100%" }} onClick={onClose}>Fertig</button>
          </section>
        ) : premium && !questions ? (
          <section className="gn-card">
            <p className={error ? undefined : "gn-muted"} style={error ? { color: "var(--warn)" } : undefined}>{error || "Fragen werden erstellt …"}</p>
          </section>
        ) : question ? (
          <section className="gn-card gn-quiz">
            <h2 className="gn-h3">{question.q}</h2>
            <div className="gn-stack" style={{ gap: 8, marginTop: 14 }}>
              {question.options.map((option, i) => {
                const state = picked === null ? "" : i === question.answer ? "is-right" : i === picked ? "is-wrong" : "is-dim";
                return <button key={i} type="button" className={`gn-option ${state}`} disabled={picked !== null} onClick={() => setPicked(i)}>{option}</button>;
              })}
            </div>
            {picked !== null && (
              <>
                {question.why && <p className="gn-note" style={{ marginTop: 12 }}>{question.why}</p>}
                <button type="button" className="gn-go" style={{ width: "100%", marginTop: 14 }} onClick={() => next(picked === question.answer ? 100 : 0)}>
                  {index + 1 < total ? "Nächste Frage" : "Ergebnis"}
                </button>
              </>
            )}
            <p className="gn-muted gn-note" style={{ marginTop: 12 }}>Von einer KI erstellt. Wenn eine Lösung falsch wirkt, verlass dich auf dein Skript.</p>
          </section>
        ) : check ? (
          <section className="gn-card gn-quiz">
            <h2 className="gn-h3">{check.q}</h2>
            <div className="gn-stack" style={{ gap: 8, marginTop: 14 }}>
              {check.options.map((option, i) => <button key={option} type="button" className="gn-option" onClick={() => next(i * 50)}>{option}</button>)}
            </div>
            {index === 0 && <p className="gn-muted gn-note" style={{ marginTop: 12 }}>Mit Premium bekommst du stattdessen ein Quiz mit {QUIZ_LENGTH} Fragen zum Thema.</p>}
          </section>
        ) : null}
      </div>
    </div>
  );
}
