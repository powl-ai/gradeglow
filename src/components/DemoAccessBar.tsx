"use client";

import { useEffect, useState } from "react";
import { DEMO_PLAN_EVENT, getDemoPlan, setDemoPlan } from "../lib/guestDemo";

export default function DemoAccessBar({ onRegister, onExit }: {
  onRegister: () => void;
  onExit: () => Promise<void>;
}) {
  const [plan, setPlan] = useState(getDemoPlan);
  useEffect(() => {
    const update = () => setPlan(getDemoPlan());
    window.addEventListener(DEMO_PLAN_EVENT, update);
    return () => window.removeEventListener(DEMO_PLAN_EVENT, update);
  }, []);

  return (
    <details className="gg-demo-bar" aria-label="Probezugang">
      <summary>Demo · {plan === "free" ? "Basic" : "Pro"}<span>Optionen ⌄</span></summary>
      <div>
        <p className="font-bold">Du probierst GradeGlow aus.</p>
        <p className="mt-1 text-xs">Beispieldaten · Änderungen bleiben auf diesem Gerät.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="gg-demo-plan" role="group" aria-label="Funktionsumfang ausprobieren">
          <button type="button" aria-pressed={plan === "free"} onClick={() => setDemoPlan("free")}>Basic</button>
          <button type="button" aria-pressed={plan === "premium"} onClick={() => setDemoPlan("premium")}>Pro</button>
        </div>
        <button type="button" className="gg-demo-register" onClick={onRegister}>Konto erstellen</button>
        <button type="button" className="gg-demo-exit" onClick={() => void onExit()}>Beenden</button>
      </div>
    </details>
  );
}
