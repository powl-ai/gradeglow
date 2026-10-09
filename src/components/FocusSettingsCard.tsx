"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppDialog from "./AppDialog";
import { useFocusSession } from "./FocusSessionProvider";
import { requestFocusNotificationPermission, supportsFocusNotifications } from "../lib/focusNotifications";
import { focusLock } from "../lib/focusLock";
import FocusReturnNotice from "./FocusReturnNotice";

export default function FocusSettingsCard() {
  const focus = useFocusSession();
  const [supported, setSupported] = useState(false);
  const [lockSupported, setLockSupported] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setSupported(supportsFocusNotifications());
    let active = true;
    void focusLock.isSupported().then((result) => { if (active) setLockSupported(result); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const enableNotifications = async () => {
    setIsRequesting(true);
    const granted = await requestFocusNotificationPermission();
    focus.store.updateSettings({ notificationsEnabled: granted }, Date.now());
    setMessage(granted ? "Fokus-Hinweise sind eingeschaltet." : "Keine Freigabe erhalten. Dein Timer funktioniert weiterhin. Du kannst die Berechtigung in den Systemeinstellungen prüfen.");
    setIsRequesting(false);
    setShowConsent(false);
  };

  return <section className="gg-focus-settings" aria-label="Fokus-Einstellungen">
    <FocusReturnNotice withMascot />
    <h2>Fokus-Schutz</h2>
    <p>Der Fokus-Schutz blendet kleine In-App-Erinnerungen aus und fragt vor dem Verwerfen nach. Du kannst die App jederzeit verlassen; unabhängig vom Schutz zählt der Timer nur Vordergrundzeit, mit 10 Sekunden Kulanz bei kurzen Unterbrechungen.</p>
    <label className="gg-focus-toggle"><span>Fokus-Schutz aktivieren<small>Freiwillig · auf diesem Gerät</small></span><input type="checkbox" checked={focus.settings.protectionEnabled} disabled={!focus.ready} onChange={(event) => focus.store.updateSettings({ protectionEnabled: event.target.checked }, Date.now())} /></label>
    <label className="gg-focus-toggle"><span>Bildschirm wach halten<small>Während laufender Sessions · soweit der Browser es erlaubt</small></span><input type="checkbox" checked={focus.settings.keepScreenAwake} disabled={!focus.ready} onChange={(event) => focus.store.updateSettings({ keepScreenAwake: event.target.checked }, Date.now())} /></label>
    {supported ? <div className="gg-focus-notification-option">
      <p>Optionaler Hinweis beim Wechseln in den Hintergrund. Der Browser muss den Hinweis noch ausführen können; eine pünktliche Erinnerung bei geschlossener App ist damit nicht garantiert.</p>
      <button type="button" disabled={!focus.ready || !focus.settings.protectionEnabled} onClick={() => {
        if (focus.settings.notificationsEnabled) focus.store.updateSettings({ notificationsEnabled: false }, Date.now());
        else setShowConsent(true);
      }}>{focus.settings.notificationsEnabled ? "Fokus-Hinweise ausschalten" : "Fokus-Hinweise einschalten"}</button>
    </div> : <p className="gg-focus-muted">Fokus-Hinweise sind in diesem Browser nicht verfügbar. Auf dem iPhone kannst du die App zum Home-Bildschirm hinzufügen und dort erneut prüfen.</p>}
    {lockSupported && <div className="gg-focus-native-option"><strong>Fokus-Sperre</strong><p>Die native App-Auswahl wird nach Einrichtung der iOS-Anbindung verfügbar.</p></div>}
    <div className="gg-focus-coming-soon" aria-disabled="true"><strong>Apps sperren (bald verfügbar)</strong><p>Geplant für die native iOS-App: freiwillige Sperren für selbst ausgewählte Apps.</p></div>
    <Link href="/timer" className="gg-feed-text-link">Zum Fokus-Timer ↗</Link>
    {message && <p role="status">{message}</p>}
    {showConsent && <AppDialog label="Fokus-Hinweise erlauben" onClose={() => { if (!isRequesting) setShowConsent(false); }}>
      <section className="gg-focus-consent"><h2>Fokus-Hinweise erlauben?</h2><p>GradeGlow darf dir beim Verlassen einer laufenden Session einen freundlichen Hinweis anzeigen. Du kannst diese Hinweise hier jederzeit ausschalten; sie sperren keine Apps.</p><p className="gg-focus-muted">Die Zustellung hängt vom Browser und deinen Systemeinstellungen ab.</p><div className="gg-focus-dialog-actions"><button type="button" disabled={isRequesting} onClick={() => setShowConsent(false)}>Jetzt nicht</button><button type="button" disabled={isRequesting || !focus.settings.protectionEnabled} onClick={() => void enableNotifications()}>{isRequesting ? "Warte auf Freigabe …" : "Hinweise erlauben"}</button></div></section>
    </AppDialog>}
  </section>;
}
