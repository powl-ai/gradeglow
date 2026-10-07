export type CalendarViewMode = "day" | "week" | "month";
export type CalendarEntry = {
  id: string; kind: "exam" | "study"; title: string; dateKey: string;
  time: string; durationMinutes: number; isDone?: boolean; moduleName?: string;
};
export const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const shiftDay = (date: Date, offset: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
export const mondayOf = (date: Date) => shiftDay(date, -((date.getDay() + 6) % 7));
export const timeInMinutes = (time: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]), minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
};

// Connected overlap groups receive independent lanes; adjacent events share a lane.
export function layoutTimelineEntries(entries: CalendarEntry[]) {
  const timed = entries.flatMap(entry => {
    const start = timeInMinutes(entry.time);
    return start === null ? [] : [{ entry, start, end: Math.min(1440, start + Math.max(1, entry.durationMinutes)), lane: 0, lanes: 1 }];
  }).sort((a, b) => a.start - b.start || a.end - b.end || a.entry.id.localeCompare(b.entry.id));
  let group: typeof timed = [], groupEnd = -1;
  const finishGroup = () => {
    const ends: number[] = [];
    for (const item of group) {
      let lane = ends.findIndex(end => end <= item.start);
      if (lane < 0) lane = ends.length;
      ends[lane] = item.end;
      item.lane = lane;
    }
    for (const item of group) item.lanes = ends.length;
  };
  for (const item of timed) {
    if (item.start >= groupEnd) { finishGroup(); group = []; groupEnd = -1; }
    group.push(item); groupEnd = Math.max(groupEnd, item.end);
  }
  finishGroup();
  return timed;
}
