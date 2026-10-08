import { useId } from "react";

// Original vector character; no external image requests or animation timers.
export default function GlowMascot({ happy = false }: { happy?: boolean }) {
  const id = useId();
  return <svg className="gg-glow-mascot" viewBox="0 0 180 190" role="img" aria-labelledby={`${id}-title`} data-mood={happy ? "celebrate" : "ready"}>
    <title id={`${id}-title`}>Lumi, dein Glow-Lernbegleiter mit Kopfhörern und Hoodie</title>
    <defs>
      <linearGradient id={`${id}-body`} x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#fff3ff" /><stop offset=".45" stopColor="#dfb8ff" /><stop offset="1" stopColor="#ad80e2" /></linearGradient>
      <linearGradient id={`${id}-hoodie`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#66508b" /><stop offset="1" stopColor="#302348" /></linearGradient>
      <linearGradient id={`${id}-phones`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff1ca" /><stop offset="1" stopColor="#dfaa60" /></linearGradient>
      <radialGradient id={`${id}-glow`}><stop stopColor="#e5baff" stopOpacity=".5" /><stop offset="1" stopColor="#e5baff" stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx="90" cy="94" r="83" fill={`url(#${id}-glow)`} />
    <ellipse className="gg-lumi-shadow" cx="91" cy="175" rx="41" ry="7" fill="#2b193c" opacity=".18" />
    <g className="gg-lumi-character">
      <path d="M64 151 57 168q-2 7 7 7h17q6-1 3-8l-7-14m25 0-3 14q-2 8 6 8h19q8-2 3-9l-12-16" fill="#42304e" />
      <path d="M58 167h24m20 0h23" stroke="#fff0fc" strokeWidth="6" strokeLinecap="round" />
      <path d="M79 27q10-19 21 0l12 25q3 6 9 7l23 6q16 5 5 18l-18 18q-5 5-5 11l2 26q0 15-13 9l-20-9q-6-3-11 0l-23 10q-15 6-13-11l3-25q0-6-5-10L26 86q-13-11 2-18l25-10q6-2 9-8Z" fill={`url(#${id}-body)`} stroke="#9567bc" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="m81 29-11 25q-4 8-12 11l-21 9" fill="none" stroke="#fff8ff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <path d="M46 78q-4-38 39-39t48 39" fill="none" stroke="#594264" strokeWidth="9" strokeLinecap="round" />
      <path d="M48 74q-3-29 24-35" fill="none" stroke="#dac1e5" strokeWidth="3" strokeLinecap="round" />
      <rect x="37" y="69" width="16" height="29" rx="8" fill={`url(#${id}-phones)`} stroke="#9b7548" strokeWidth="2" transform="rotate(-9 45 84)" />
      <rect x="128" y="69" width="16" height="29" rx="8" fill={`url(#${id}-phones)`} stroke="#9b7548" strokeWidth="2" transform="rotate(9 136 84)" />
      <path d="M43 77v12m92-12v12" stroke="#fff2cc" strokeWidth="3" strokeLinecap="round" />
      <path d="m66 68 9-2m25 0 8 3" stroke="#674173" strokeWidth="2.5" strokeLinecap="round" />
      {happy ? <g fill="none" stroke="#382342" strokeWidth="4" strokeLinecap="round"><path d="M63 83q6-9 12 0M103 81l8 3-8 3" /></g> : <g fill="#382342"><ellipse cx="69" cy="82" rx="5.5" ry="8" /><ellipse cx="107" cy="82" rx="5.5" ry="8" /><g fill="#fff9ff"><circle cx="71" cy="79" r="2" /><circle cx="109" cy="79" r="2" /></g></g>}
      <ellipse cx="58" cy="95" rx="8" ry="4" fill="#ee91b7" opacity=".7" /><ellipse cx="118" cy="95" rx="8" ry="4" fill="#ee91b7" opacity=".7" />
      <path d={happy ? "M81 95q8 14 17 0Z" : "M82 96q8 8 16-1"} fill={happy ? "#674056" : "none"} stroke="#382342" strokeWidth="2.5" strokeLinecap="round" />
      {happy && <path d="M85 101q6-3 10 0" stroke="#ffb4cd" strokeWidth="3" strokeLinecap="round" />}
      <path d="m53 108 22-4q14 10 29 0l23 5-7 44q-26 14-61 0Z" fill={`url(#${id}-hoodie)`} stroke="#302348" strokeWidth="2" strokeLinejoin="round" />
      <path d="m72 108 17 14 17-14M78 116l-1 12m24-12 1 12" fill="none" stroke="#c8a6e0" strokeWidth="2" strokeLinecap="round" />
      <path d="m62 120-15 16q-7 6-12 0m86-16 16 13q7 4 10-4" fill="none" stroke="#66508b" strokeWidth="13" strokeLinecap="round" />
      <path d="m37 129-4-6m5 9-10-1" fill="none" stroke="#e7c4ff" strokeWidth="7" strokeLinecap="round" />
      <path d="M145 127v-10m0 11 7-8" fill="none" stroke="#e7c4ff" strokeWidth="6" strokeLinecap="round" />
      <path d="M74 137q14-6 29 0v12q-14 5-29 0Z" fill="#473354" stroke="#806393" strokeWidth="1.5" />
      <path d="m89 126 2 5 5 1-4 4 1 5-4-2-5 2 1-5-4-4 5-1Z" fill="#f3d18c" />
      <path d="m114 142 9-4 6 14-10 4Z" fill="#f9e5fd" /><path d="m117 144 5-2m-4 5 5-2" stroke="#b283c5" strokeWidth="1" />
    </g>
    <g className="gg-lumi-sparkles" fill="#efc477"><path d="m148 29 3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM23 43l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" /><circle cx="161" cy="102" r="2.5" /><circle cx="25" cy="105" r="2" /></g>
  </svg>;
}
