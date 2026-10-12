"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createTopic, TOPIC_CONFIDENCE_OPTIONS } from "../lib/examTopics";
import type { ExamPlanItem, ExamTopic, TopicConfidence } from "../types";

const confidenceClass: Record<TopicConfidence, string> = {
  1: "bg-rose-400 text-slate-950",
  2: "bg-amber-300 text-slate-950",
  3: "bg-emerald-400 text-slate-950",
};

/**
 * Topics of one exam with a quick self-assessment. The plan generator turns these into
 * study blocks: weak topics ("unsicher") get the most repetitions.
 */
export default function ExamTopicsEditor({ exam, onChange, onRebuildPlan }: {
  exam: ExamPlanItem;
  onChange: (topics: ExamTopic[]) => void;
  onRebuildPlan: () => void;
}) {
  const topics = exam.topics ?? [];
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);

  const update = (next: ExamTopic[]) => { onChange(next); setDirty(true); };

  const addTopics = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Several topics at once: "Eigenwerte, Taylor; Integrale"
    const names = draft.split(/[,;\n]/).map((name) => name.trim()).filter(Boolean);
    const known = new Set(topics.map((topic) => topic.name.toLowerCase()));
    const fresh = names.filter((name) => !known.has(name.toLowerCase())).map((name) => createTopic(name));
    if (fresh.length) update([...topics, ...fresh]);
    setDraft("");
  };

  const covered = new Set(exam.studySessions.filter((session) => session.isDone && session.topicId).map((session) => session.topicId));

  return <div className="mt-5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-sm font-black">Themen & Selbsteinschätzung</p>
      {topics.length > 0 && <span className="text-xs font-bold text-slate-400">{topics.filter((topic) => covered.has(topic.id)).length}/{topics.length} gelernt</span>}
    </div>
    <p className="mt-1 text-xs leading-5 text-slate-400">Was kommt dran? Je unsicherer ein Thema, desto öfter plant GradeGlow es ein.</p>

    {topics.length > 0 && <ul className="mt-3 space-y-2">
      {topics.map((topic) => <li key={topic.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
        <span className="min-w-0 flex-1 text-sm font-bold [overflow-wrap:anywhere]">{covered.has(topic.id) && <span aria-label="schon gelernt">✓ </span>}{topic.name}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={`Wie sicher bist du bei ${topic.name}?`}>
          {TOPIC_CONFIDENCE_OPTIONS.map((option) => <button key={option.value} type="button" role="radio" aria-checked={topic.confidence === option.value}
            className={`rounded-full px-2.5 py-1 text-xs font-black transition ${topic.confidence === option.value ? confidenceClass[option.value] : "bg-white/10 text-slate-300"}`}
            onClick={() => update(topics.map((item) => item.id === topic.id ? { ...item, confidence: option.value } : item))}>{option.label}</button>)}
        </div>
        <button type="button" className="rounded-full px-2 text-lg leading-none text-slate-400" aria-label={`${topic.name} entfernen`}
          onClick={() => update(topics.filter((item) => item.id !== topic.id))}>×</button>
      </li>)}
    </ul>}

    <form className="mt-3 flex gap-2" onSubmit={addTopics}>
      <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="z. B. Eigenwerte, Taylorreihen"
        aria-label="Themen hinzufügen (mit Komma trennen)"
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-300" />
      <button type="submit" disabled={!draft.trim()} className="rounded-xl bg-white/15 px-3 py-2 text-sm font-black disabled:opacity-40">Hinzufügen</button>
    </form>

    {topics.length > 0 && (dirty || !exam.studySessions.some((session) => session.topicId)) && <button type="button"
      className="mt-3 w-full rounded-xl bg-fuchsia-300 px-3 py-2.5 text-sm font-black text-slate-950"
      onClick={() => { onRebuildPlan(); setDirty(false); }}>Lernplan aus Themen erstellen</button>}
  </div>;
}
