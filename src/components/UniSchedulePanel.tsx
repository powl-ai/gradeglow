"use client";

import { useMemo, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { normalizeScheduleTime, sortScheduleItems } from "../lib/gradeglowSchedule";
import type { UniModule, UniScheduleItem } from "../types";

type UniSchedulePanelProps = {
  modules: UniModule[];
  scheduleItems: UniScheduleItem[];
  setScheduleItems: Dispatch<SetStateAction<UniScheduleItem[]>>;
  isLoaded: boolean;
  syncMessage: string;
};

type ScheduleForm = {
  title: string;
  moduleId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  color: string;
};

const weekdayOptions = [
  { value: 1, label: "Montag", short: "Mo" },
  { value: 2, label: "Dienstag", short: "Di" },
  { value: 3, label: "Mittwoch", short: "Mi" },
  { value: 4, label: "Donnerstag", short: "Do" },
  { value: 5, label: "Freitag", short: "Fr" },
  { value: 6, label: "Samstag", short: "Sa" },
  { value: 0, label: "Sonntag", short: "So" },
];

const colorOptions = [
  { value: "violet", label: "Violett", className: "bg-violet-50 text-violet-800 ring-violet-100" },
  { value: "pink", label: "Rosa", className: "bg-pink-50 text-pink-800 ring-pink-100" },
  { value: "blue", label: "Blau", className: "bg-sky-50 text-sky-800 ring-sky-100" },
  { value: "emerald", label: "Grün", className: "bg-emerald-50 text-emerald-800 ring-emerald-100" },
  { value: "amber", label: "Creme", className: "bg-amber-50 text-amber-900 ring-amber-100" },
  { value: "rose", label: "Rose", className: "bg-rose-50 text-rose-800 ring-rose-100" },
];

const emptyForm: ScheduleForm = {
  title: "",
  moduleId: "",
  weekday: "1",
  startTime: "10:00",
  endTime: "12:00",
  location: "",
  notes: "",
  color: "violet",
};

const getColorClassName = (color: string) =>
  colorOptions.find((option) => option.value === color)?.className ?? colorOptions[0].className;

const formatTimeRange = (item: UniScheduleItem) => {
  const start = normalizeScheduleTime(item.startTime) || item.startTime || "offen";
  const end = normalizeScheduleTime(item.endTime) || item.endTime;
  return end ? `${start} – ${end}` : start;
};

export default function UniSchedulePanel({
  modules,
  scheduleItems,
  setScheduleItems,
  isLoaded,
  syncMessage,
}: UniSchedulePanelProps) {
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHiddenItems, setShowHiddenItems] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(scheduleItems.length === 0);
  const [message, setMessage] = useState("");

  const sortedModules = useMemo(() => [...modules].sort((a, b) => a.name.localeCompare(b.name)), [modules]);

  const visibleScheduleItems = useMemo(
    () => scheduleItems.filter((item) => showHiddenItems || !item.isHidden),
    [scheduleItems, showHiddenItems],
  );

  const scheduleByWeekday = useMemo(() => {
    const grouped = new Map<number, UniScheduleItem[]>();
    weekdayOptions.forEach((day) => grouped.set(day.value, []));

    visibleScheduleItems.forEach((item) => {
      const current = grouped.get(item.weekday) ?? [];
      grouped.set(item.weekday, sortScheduleItems([...current, item]));
    });

    return grouped;
  }, [visibleScheduleItems]);

  const hiddenCount = scheduleItems.filter((item) => item.isHidden).length;
  const normalizedStartTime = normalizeScheduleTime(form.startTime);
  const normalizedEndTime = normalizeScheduleTime(form.endTime);
  const isTimeInvalid = Boolean(form.startTime.trim() && !normalizedStartTime) || Boolean(form.endTime.trim() && !normalizedEndTime);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || isTimeInvalid) return;

    const selectedModule = modules.find((module) => module.id === form.moduleId);
    const nextItem: UniScheduleItem = {
      id: editingId ?? crypto.randomUUID(),
      title: form.title.trim(),
      moduleId: selectedModule?.id ?? null,
      moduleName: selectedModule?.name ?? "",
      weekday: Number(form.weekday),
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      location: form.location.trim(),
      notes: form.notes.trim(),
      color: form.color,
      isHidden: false,
    };

    setScheduleItems((currentItems) => {
      const withoutCurrent = currentItems.filter((item) => item.id !== nextItem.id);
      return sortScheduleItems([...withoutCurrent, nextItem]);
    });

    setMessage(editingId ? "Stundenplan-Eintrag aktualisiert." : "Stundenplan-Eintrag gespeichert.");
    resetForm();
    setIsFormOpen(false);
  };

  const editItem = (item: UniScheduleItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      moduleId: item.moduleId ?? "",
      weekday: String(item.weekday),
      startTime: normalizeScheduleTime(item.startTime) || item.startTime,
      endTime: normalizeScheduleTime(item.endTime) || item.endTime,
      location: item.location,
      notes: item.notes,
      color: item.color || "violet",
    });
    setIsFormOpen(true);
    setMessage("");
  };

  const toggleHidden = (itemId: string) => {
    setScheduleItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, isHidden: !item.isHidden } : item)),
    );
  };

  const deleteItem = (itemId: string) => {
    setScheduleItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    if (editingId === itemId) resetForm();
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">Uni-Plan</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Stundenplan</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Trage Vorlesungen, Seminare, Übungen und Tutorien ein. So hast du neben Prüfungen und Lernplan auch deinen normalen Uni-Alltag in GradeGlow.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white ring-1 ring-slate-900 transition hover:-translate-y-0.5"
              onClick={() => {
                resetForm();
                setIsFormOpen((open) => !open);
              }}
            >
              {isFormOpen ? "Formular schließen" : "+ Termin eintragen"}
            </button>
            <button
              type="button"
              className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200"
              onClick={() => setShowHiddenItems((show) => !show)}
            >
              {showHiddenItems ? "Ausgeblendete ausblenden" : `Ausgeblendete anzeigen (${hiddenCount})`}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-violet-50 p-4 ring-1 ring-violet-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">Einträge</p>
            <p className="mt-2 text-3xl font-black text-violet-700">{visibleScheduleItems.length}</p>
          </div>
          <div className="rounded-3xl bg-fuchsia-50 p-4 ring-1 ring-fuchsia-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-400">Aktive Tage</p>
            <p className="mt-2 text-3xl font-black text-fuchsia-700">
              {weekdayOptions.filter((day) => (scheduleByWeekday.get(day.value) ?? []).length > 0).length}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 p-4 text-white ring-1 ring-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Sync</p>
            <p className="mt-2 text-sm font-black text-slate-100">{isLoaded ? syncMessage : "Stundenplan lädt…"}</p>
          </div>
        </div>

        {(message || isTimeInvalid) && (
          <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ring-1 ${isTimeInvalid ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}`}>
            {isTimeInvalid ? "Bitte Uhrzeiten im Format 08:00 oder 0800 eintragen." : message}
          </p>
        )}
      </div>

      {isFormOpen && (
        <form className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-6" onSubmit={handleSubmit}>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-violet-700">{editingId ? "Eintrag bearbeiten" : "Neuer Uni-Termin"}</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight">Stundenplan-Eintrag</h3>
            </div>
            {editingId && (
              <button type="button" className="rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-black text-slate-600 ring-1 ring-slate-200" onClick={resetForm}>
                Bearbeitung abbrechen
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block xl:col-span-2">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Titel</span>
              <input className="field-input" placeholder="z. B. Mikroökonomik Vorlesung" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Modul optional</span>
              <select className="field-input" value={form.moduleId} onChange={(event) => setForm((current) => ({ ...current, moduleId: event.target.value }))}>
                <option value="">Ohne Modul</option>
                {sortedModules.map((module) => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Tag</span>
              <select className="field-input" value={form.weekday} onChange={(event) => setForm((current) => ({ ...current, weekday: event.target.value }))}>
                {weekdayOptions.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Start</span>
              <input className="field-input" placeholder="10:00" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, startTime: normalizeScheduleTime(current.startTime) || current.startTime }))} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Ende</span>
              <input className="field-input" placeholder="12:00" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, endTime: normalizeScheduleTime(current.endTime) || current.endTime }))} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Ort</span>
              <input className="field-input" placeholder="Raum, Campus, online…" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Farbe</span>
              <select className="field-input" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}>
                {colorOptions.map((color) => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2 xl:col-span-4">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Notizen</span>
              <textarea className="field-input min-h-20 resize-y" placeholder="Dozent, Link, Vorbereitung, Besonderheiten…" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>

          <button type="submit" className="mt-5 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 disabled:opacity-50" disabled={!form.title.trim() || isTimeInvalid}>
            {editingId ? "Änderung speichern" : "Termin speichern"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl bg-white/90 p-3 shadow-sm ring-1 ring-violet-100 backdrop-blur sm:p-5">
        <div className="grid gap-3 xl:grid-cols-7">
          {weekdayOptions.map((day) => {
            const dayItems = scheduleByWeekday.get(day.value) ?? [];
            return (
              <div key={day.value} className="min-h-48 rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{day.short}</p>
                    <h3 className="text-base font-black text-slate-950">{day.label}</h3>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                    {dayItems.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="rounded-2xl bg-white p-3 text-xs font-semibold leading-5 text-slate-400 ring-1 ring-slate-200">
                      Noch kein Termin.
                    </p>
                  ) : (
                    dayItems.map((item) => (
                      <article key={item.id} className={`rounded-2xl p-3 ring-1 ${getColorClassName(item.color)} ${item.isHidden ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">{item.title}</p>
                            <p className="mt-1 text-xs font-bold opacity-80">{formatTimeRange(item)}</p>
                            {(item.moduleName || item.location) && (
                              <p className="mt-1 truncate text-xs font-semibold opacity-70">
                                {[item.moduleName, item.location].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.notes && <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 opacity-75">{item.notes}</p>}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <button type="button" className="rounded-xl bg-white/70 px-2.5 py-1.5 text-[0.68rem] font-black ring-1 ring-white/70" onClick={() => editItem(item)}>Bearbeiten</button>
                          <button type="button" className="rounded-xl bg-white/70 px-2.5 py-1.5 text-[0.68rem] font-black ring-1 ring-white/70" onClick={() => toggleHidden(item.id)}>{item.isHidden ? "Einblenden" : "Ausblenden"}</button>
                          <button type="button" className="rounded-xl bg-white/70 px-2.5 py-1.5 text-[0.68rem] font-black text-rose-700 ring-1 ring-white/70" onClick={() => deleteItem(item.id)}>Löschen</button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
