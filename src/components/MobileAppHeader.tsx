"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppDialog from "./AppDialog";

const titles: Record<string, string> = {
  "/alt": "GradeGlow", "/exams": "Kalender", "/timer": "Fokus",
  "/friends": "Study Circle", "/profile": "Profil", "/settings": "Einstellungen",
  "/modules": "Module", "/insights": "Insights", "/planning": "Studienplan",
  "/schedule": "Stundenplan", "/backup": "Backup", "/premium": "GradeGlow Pro",
  "/feedback": "Feedback", "/store": "Glow Shop",
};
const links = [
  ["/", "Zur neuen App"], ["/alt", "Alte Startseite"], ["/exams", "Kalender"], ["/timer", "Fokus"],
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16" strokeLinecap="round" /></svg>
        </button>
        <h1 className={pathname === "/alt" ? "gg-header-wordmark" : ""}>{titles[pathname] ?? "GradeGlow"}</h1>
        {/* The old app lives under /alt now: this is the way back to the new one. */}
        <a href="/" className="gg-header-action" aria-label="Zur neuen App" style={{ width: "auto", padding: "0 12px", fontSize: 14, fontWeight: 800 }}>Neue App</a>
      </div>
    </header>
    {open && <AppDialog label="App-Menü" onClose={() => setOpen(false)} className="gg-menu-dialog">
      <div className="gg-dialog-heading"><h2>Deine Bereiche</h2><button type="button" aria-label="Menü schließen" onClick={() => setOpen(false)}>×</button></div>
      <nav className="gg-app-menu" aria-label="Alle Bereiche">{links.map(([href, label]) => <Link key={href} href={href} aria-current={href === pathname ? "page" : undefined} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">›</span></Link>)}</nav>
    </AppDialog>}
  </>;
}
