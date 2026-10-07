import { useId } from "react";

// Original, code-native character: crisp on every screen without bitmap assets.
export default function GlowMascot({ happy = false }: { happy?: boolean }) {
  const id = useId();
  return <svg className="gg-glow-mascot" viewBox="0 0 160 160" role="img" aria-labelledby={`${id}-title`}>
    <title id={`${id}-title`}>Lumi, dein kleiner Glow-Lernbegleiter</title>
    <ellipse cx="80" cy="142" rx="40" ry="7" fill="#291447" opacity=".13" />
    <path d="M52 126q-9 16 7 15l15-10M94 129q7 15 17 11t-7-17" fill="#9168cf" />
    <path d="M70 25q10-19 20 0l11 25q3 5 10 7l24 9q17 7 2 19l-19 16q-5 4-5 11l1 23q0 17-15 8l-17-10q-5-3-10 0l-21 9q-15 5-13-11l3-22q1-6-4-10L16 82q-12-12 5-18l26-8q6-2 9-8Z" fill="#dfc5ff" stroke="#b596dc" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M45 72q-10 11-7 23" fill="none" stroke="#f8f0ff" strokeWidth="5" strokeLinecap="round" />
    {happy ? <path d="M57 78q6-9 12 0m25 0q6-9 12 0" fill="none" stroke="#39204e" strokeWidth="4" strokeLinecap="round" /> : <g fill="#39204e"><ellipse cx="63" cy="79" rx="4.5" ry="7" /><ellipse cx="100" cy="79" rx="4.5" ry="7" /><g fill="white"><circle cx="64" cy="77" r="1.5" /><circle cx="101" cy="77" r="1.5" /></g></g>}
    <ellipse cx="50" cy="92" rx="8" ry="4" fill="#f39ac3" opacity=".7" /><ellipse cx="113" cy="92" rx="8" ry="4" fill="#f39ac3" opacity=".7" />
    <path d="M76 91q6 7 12 0" fill="none" stroke="#39204e" strokeWidth="3" strokeLinecap="round" />
    <path d="m57 110 23 5 24-5v23l-24 5-23-5Z" fill="#faf4ff" stroke="#9168cf" strokeWidth="2" /><path d="M80 115v23" stroke="#9168cf" strokeWidth="2" />
    <path d="M51 110q-9 11 6 13m53-13q11 10-5 13" fill="none" stroke="#b596dc" strokeWidth="7" strokeLinecap="round" />
    <path d="m128 23 3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM25 32l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#f8ce73" />
  </svg>;
}
