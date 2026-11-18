// Stroke icons, 24 px grid, inherit currentColor.
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const Icon = {
  home: (on = false) => on
    ? <svg {...base} fill="currentColor" stroke="none"><path d="M12 3.2 3.5 10v10.3c0 .4.3.7.7.7H9.5v-6h5v6h5.3c.4 0 .7-.3.7-.7V10z" /></svg>
    : <svg {...base}><path d="M12 3.2 3.5 10v10.3c0 .4.3.7.7.7H9.5v-6h5v6h5.3c.4 0 .7-.3.7-.7V10z" /></svg>,
  calendar: (on = false) => <svg {...base} strokeWidth={on ? 2.2 : 1.9}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>,
  timer: (on = false) => <svg {...base} strokeWidth={on ? 2.2 : 1.9}><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5" /></svg>,
  book: (on = false) => <svg {...base} strokeWidth={on ? 2.2 : 1.9}><path d="M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5zm0 0A2.5 2.5 0 0 0 6.5 22H20" /><path d="M9 8h7M9 11.5h5" /></svg>,
  plus: () => <svg {...base} width={20} height={20} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>,
  user: () => <svg {...base} width={20} height={20}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" /></svg>,
  star: () => <svg {...base} width={20} height={20} strokeWidth={1.8}><path d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.5l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" /></svg>,
  chevron: () => <svg {...base} width={18} height={18} strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>,
  down: () => <svg {...base} width={14} height={14} strokeWidth={2.4}><path d="M6 9l6 6 6-6" /></svg>,
  play: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>,
  check: (size = 15) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  flame: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c.6 3.2 4.8 5.6 4.8 10.4A4.8 4.8 0 0 1 12 17.2a4.8 4.8 0 0 1-4.8-4.8c0-1.9.8-3.3 1.8-4.4.2 1.5 1 2.5 2.2 2.8C10.9 8 11.1 4.9 12 2z" /><path d="M7 15.5A5.3 5.3 0 0 0 12 22a5.3 5.3 0 0 0 5-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
};
