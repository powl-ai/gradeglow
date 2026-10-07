"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppDialog from "./AppDialog";

const titles: Record<string, string> = {
  "/": "GradeGlow", "/exams": "Kalender", "/timer": "Fokus",
  "/friends": "Study Circle", "/profile": "Profil", "/settings": "Einstellungen",
  "/modules": "Module", "/insights": "Insights", "/planning": "Studienplan",
  "/schedule": "Stundenplan", "/backup": "Backup", "/premium": "GradeGlow Pro",
  "/feedback": "Feedback", "/store": "Glow Shop",
};
const links = [
  ["/", "Home"], ["/exams", "Kalender"], ["/timer", "Fokus"],
  ["/profile", "Profil"], ["/modules", "Module"], ["/insights", "Insights"],
  ["/friends", "Study Circle"], ["/schedule", "Stundenplan"],
  ["/planning", "Studienplan"], ["/settings", "Einstellungen"], ["/feedback", "Feedback"],
];

export default function MobileAppHeader({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  return <>
    <header className="gg-app-header lg:hidden" aria-label="App-Kopfbereich">
      <div className="gg-app-header-inner">
        <button type="button" className="gg-header-action" aria-label="App-Menü öffnen" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
        </button>
        <h1 className={pathname === "/" ? "gg-header-wordmark" : ""}>{titles[pathname] ?? "GradeGlow"}</h1>
        <Link href="/settings" className="gg-header-action" aria-label="Einstellungen öffnen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m9 3-.7 2.1-2 .9-2-.4-1.5 2.6 1.4 1.7-.2 2.2-1.4 1.7L4 16.5l2.2-.3 1.7 1.3.7 2.2h3l.8-2.2 1.7-1.3 2.2.3 1.5-2.6-1.4-1.7-.2-2.2 1.4-1.7L18 5.7l-2 .4-2-.9L13.3 3Z" transform="translate(1 1)" /><circle cx="12" cy="12" r="3" /></svg>
        </Link>
      </div>
    </header>
    {open && <AppDialog label="App-Menü" onClose={() => setOpen(false)} className="gg-menu-dialog">
      <div className="gg-dialog-heading"><h2>Deine Bereiche</h2><button type="button" aria-label="Menü schließen" onClick={() => setOpen(false)}>×</button></div>
      <nav className="gg-app-menu" aria-label="Alle Bereiche">{links.map(([href, label]) => <Link key={href} href={href} aria-current={href === pathname ? "page" : undefined} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">›</span></Link>)}</nav>
    </AppDialog>}
  </>;
}
