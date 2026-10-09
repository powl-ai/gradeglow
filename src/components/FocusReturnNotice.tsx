"use client";

import { useFocusSession } from "./FocusSessionProvider";
import { AWAY_GRACE_MS, LONG_ABSENCE_MS } from "../lib/focusSession";
import Mascot from "./Mascot";

export default function FocusReturnNotice({ withMascot = false }: { withMascot?: boolean }) {
  const focus = useFocusSession();
  const absence = focus.returnFeedback;
  if (!absence || absence.durationMs <= AWAY_GRACE_MS) return null;
  const seconds = Math.floor(absence.durationMs / 1000);
  const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return <aside className="gg-focus-return" role="status">
    {withMascot && <Mascot mood={absence.durationMs > LONG_ABSENCE_MS ? "panic" : "neutral"} />}
    <div><strong>Pausiert, weil du die App verlassen hast ({duration})</strong><p>Diese Zeit zählt nicht als Lernzeit. Dein Timer läuft jetzt weiter.</p></div>
    <button type="button" onClick={() => focus.store.dismissFeedback()}>Alles klar</button>
  </aside>;
}
