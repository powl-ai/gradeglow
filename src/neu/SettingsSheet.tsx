"use client";

import { useState } from "react";
import { setDemoPlan } from "../lib/guestDemo";
import type { AccentColor, ThemeMode } from "../types";
import type { AppCtx } from "./NeuApp";
import { ACCENTS } from "./model";

const ACCENT_NAMES: Record<AccentColor, string> = {
  violet: "Violett", pink: "Pink", blue: "Blau", emerald: "Grün", amber: "Bernstein", cyan: "Türkis", rose: "Rosé",
};
const MODES: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" }, { value: "light", label: "Hell" }, { value: "dark", label: "Dunkel" },
];

export default function SettingsSheet({ ctx, onClose }: { ctx: AppCtx; onClose: () => void }) {
  const { profile, saveProfile, limits, user } = ctx;
  const [name, setName] = useState(profile.displayName || "");
  const [error, setError] = useState("");
  const premium = limits.premiumThemes;

  const update = (patch: Partial<typeof profile>) => {
    setError("");
    saveProfile({ ...profile, ...patch }).catch(() => setError("Konnte gerade nicht speichern. Versuch es gleich nochmal."));
  };

  return (
    <div className="gn-sheet" role="dialog" aria-modal="true" aria-label="Einstellungen">
      <header className="gn-sheet-head">
        <span />
        <strong>Einstellungen</strong>
        <button type="button" className="gn-link" onClick={() => { if (name.trim() && name.trim() !== profile.displayName) update({ displayName: name.trim() }); onClose(); }}>Fertig</button>
      </header>
      <div className="gn-sheet-body gn-stack">
        {error && <p className="gn-card" style={{ color: "var(--warn)", fontSize: 14 }}>{error}</p>}

        <section className="gn-card gn-form">
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" /></label>
          <p className="gn-muted" style={{ fontSize: 13 }}>{user.email ?? "Ohne E-Mail angemeldet"} · {premium ? "Premium" : "Kostenlos"}</p>
        </section>

        {user.provider === "demo" && (
          <section className="gn-card">
            <div className="gn-row" style={{ justifyContent: "space-between" }}>
              <div><strong>Demo: Premium testen</strong><small>Schaltet Farben und unbegrenzte Klausuren in der Demo frei.</small></div>
              <button type="button" className="gn-chip" aria-pressed={premium} onClick={() => setDemoPlan(premium ? "free" : "premium")}
                style={premium ? { background: "var(--accent)", color: "#fff" } : undefined}>{premium ? "An" : "Aus"}</button>
            </div>
          </section>
        )}

        <section className="gn-card">
          <div className="gn-row" style={{ justifyContent: "space-between" }}>
            <strong style={{ fontSize: 15 }}>Akzentfarbe</strong>
            {!premium && <span className="gn-tag">Premium</span>}
          </div>
          <div className="gn-swatches" style={{ marginTop: 12 }}>
            {(Object.keys(ACCENTS) as AccentColor[]).map((key) => (
              <button key={key} type="button" aria-label={ACCENT_NAMES[key]} aria-pressed={profile.accentColor === key}
                disabled={!premium && key !== "violet"} style={{ background: ACCENTS[key] }}
                onClick={() => update({ accentColor: key })} />
            ))}
          </div>
          {!premium && <p className="gn-muted" style={{ fontSize: 13, marginTop: 10 }}>Mit Premium färbst du die ganze App in deiner Farbe, dazu eigene Farben pro Klausur.</p>}
        </section>

        <section className="gn-card">
          <strong style={{ fontSize: 15 }}>Darstellung</strong>
          <div className="gn-seg" style={{ marginTop: 12, background: "var(--soft)" }}>
            {MODES.map((mode) => (
              <button key={mode.value} type="button" aria-pressed={(profile.themeMode || "system") === mode.value} onClick={() => update({ themeMode: mode.value })}>{mode.label}</button>
            ))}
          </div>
        </section>

        <button type="button" className="gn-danger" onClick={() => { void ctx.logout(); }}>Abmelden</button>
      </div>
    </div>
  );
}
