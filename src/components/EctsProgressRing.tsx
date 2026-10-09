"use client";

import { useId } from "react";

export default function EctsProgressRing({ percent }: { percent: number }) {
  const gradientId = `ects-${useId().replace(/:/g, "")}`;
  const progress = Math.max(0, Math.min(100, percent));
  const circumference = 2 * Math.PI * 39;
  return <svg className="gg-ects-ring" width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${Math.round(progress)} Prozent Uni-Fortschritt`}>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
    <circle cx="44" cy="44" r="39" fill="none" className="gg-ects-track" strokeWidth="10" />
    {progress > 0 && <circle cx="44" cy="44" r="39" fill="none" stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} transform="rotate(-90 44 44)" />}
    <text x="44" y="44" dy=".35em" textAnchor="middle">{Math.round(progress)} %</text>
  </svg>;
}
