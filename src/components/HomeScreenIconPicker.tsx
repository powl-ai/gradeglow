"use client";

import Image from "next/image";
import { useState } from "react";
import { HOME_SCREEN_ICONS, homeScreenIconPath } from "../lib/homeScreenIcons";
import type { HomeScreenIcon } from "../lib/homeScreenIcons";

export default function HomeScreenIconPicker() {
  const [style, setStyle] = useState<HomeScreenIcon>("anglerfish");
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState("");
  const copyInstallLink = async () => {
    const url = new URL(`/install/${style}`, window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setCopied(true); setCopyFallback(""); }
    catch { setCopied(false); setCopyFallback(url); }
  };
  return <section className="gg-homescreen-picker" aria-label="Homescreen-App-Icon">
    <h3>Icon auf deinem Homescreen</h3>
    <p>Wähle das Bild, mit dem du GradeGlow zum Home-Bildschirm hinzufügst.</p>
    <div className="gg-homescreen-options" role="group" aria-label="Homescreen-Icon auswählen">{HOME_SCREEN_ICONS.map(icon => <button key={icon.id} type="button" aria-pressed={style === icon.id} onClick={() => { setStyle(icon.id); setCopied(false); setCopyFallback(""); }}><Image src={homeScreenIconPath(icon.id, 180)} width={64} height={64} alt="" unoptimized /><span>{icon.label}</span></button>)}</div>
    <a className="gg-homescreen-install" href={`/install/${style}`}>Mit diesem Icon hinzufügen ↗</a>
    <button type="button" className="gg-homescreen-copy" onClick={() => void copyInstallLink()}>{copied ? "Link kopiert ✓" : "Safari-Link kopieren"}</button>
    {copyFallback && <input className="gg-homescreen-link" aria-label="Installationslink zum Kopieren" value={copyFallback} readOnly onFocus={event => event.currentTarget.select()} />}
    <p className="gg-homescreen-note" aria-live="polite">{copied ? "Füge den kopierten Link in Safari ein. " : "In der installierten App? Kopiere den Link und öffne ihn in Safari. "}Ein vorhandenes PWA-Icon wird dadurch nicht direkt ersetzt. Füge GradeGlow mit dem neuen Bild hinzu. Ein automatischer Hell-/Dunkel-Wechsel des installierten Icons ist hier nicht garantiert.</p>
  </section>;
}
