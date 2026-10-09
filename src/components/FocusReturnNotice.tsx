"use client";

import { useFocusSession } from "./FocusSessionProvider";
import { LONG_ABSENCE_MS } from "../lib/focusSession";
import Mascot from "./Mascot";

export default function FocusReturnNotice({ withMascot = false }: { withMascot?: boolean }) {
  const focus = useFocusSession();
  const absence = focus.returnFeedback;
  if (!absence || absence.durationMs < 1000) return null;
  const seconds = Math.round(absence.durationMs / 1000);
  const duration = seconds < 60 ? `${seconds} s` : `${Math.round(seconds / 60)} min`;
  return <aside className="gg-focus-return" role="status">
    {withMascot && <Mascot mood={absence.durationMs >= LONG_ABSENCE_MS ? "panic" : "neutral"} />}
    <div><strong>Du warst {duration} weg.</strong><p>{focus.status === "finished" ? "Dein Fokusblock ist inzwischen fertig." : "Alles gut. Weiter in deinem Tempo."}</p></div>
    <button type="button" onClick={() => focus.store.dismissFeedback()}>Alles klar</button>
  </aside>;
}
