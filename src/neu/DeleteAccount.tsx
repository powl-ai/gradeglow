"use client";

import { useState } from "react";
import { clearLocalData, deleteFirebaseAccount, needsPassword, type DeleteError } from "../lib/accountDeletion";
import type { AppCtx } from "./NeuApp";

const MESSAGES: Record<DeleteError, string> = {
  password: "Gib dein Passwort ein, damit wir sicher sind, dass du es bist.",
  "wrong-password": "Das Passwort stimmt nicht.",
  cancelled: "Die Bestätigung wurde abgebrochen. Es wurde nichts gelöscht.",
  "recent-login": "Melde dich einmal ab und wieder an, dann lösch direkt danach.",
  network: "Keine Verbindung. Es wurde nichts gelöscht, versuch es gleich nochmal.",
  other: "Das hat nicht geklappt. Melde dich ab und wieder an und versuch es dann nochmal.",
};

/** Delete account and all data. Two steps, so nobody gets here by accident. */
export default function DeleteAccount({ ctx }: { ctx: AppCtx }) {
  const [step, setStep] = useState<"idle" | "confirm" | "busy">("idle");
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const firebase = ctx.user.provider === "firebase";
  const askPassword = firebase && needsPassword();

  const run = async () => {
    setError("");
    setStep("busy");
    try {
      if (firebase) await deleteFirebaseAccount(password);
      else { clearLocalData(ctx.user.uid); await ctx.logout(); }
      window.location.replace("/");
    } catch (caught) {
      setError(MESSAGES[(typeof caught === "string" ? caught : "other") as DeleteError] ?? MESSAGES.other);
      setStep("confirm");
    }
  };

  if (step === "idle") {
    return (
      <section className="gn-card">
        <strong style={{ fontSize: 16 }}>Konto löschen</strong>
        <p className="gn-muted gn-note">Löscht dein Konto und alle Klausuren, Noten, Lernzeiten und Einstellungen. Das lässt sich nicht rückgängig machen.</p>
        <button type="button" className="gn-link gn-hit" style={{ color: "var(--warn)" }} onClick={() => setStep("confirm")}>Konto löschen …</button>
      </section>
    );
  }

  return (
    <section className="gn-card gn-form">
      <strong style={{ fontSize: 16 }}>Wirklich löschen?</strong>
      <p className="gn-note">Alles ist danach weg, auch in der alten Version. {firebase && !askPassword ? "Zur Sicherheit fragt Google bzw. GitHub gleich noch einmal nach deinem Login." : ""}</p>
      <label>Tippe LÖSCHEN ein<input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" autoComplete="off" /></label>
      {askPassword && <label>Passwort<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>}
      {error && <p className="gn-note" style={{ color: "var(--warn)" }}>{error}</p>}
      <div className="gn-row" style={{ gap: 8 }}>
        <button type="button" className="gn-go quiet" style={{ flex: 1 }} disabled={step === "busy"} onClick={() => { setStep("idle"); setTyped(""); setPassword(""); setError(""); }}>Abbrechen</button>
        <button type="button" className="gn-go gn-go-danger" style={{ flex: 1 }} disabled={step === "busy" || typed.trim().toUpperCase() !== "LÖSCHEN"} onClick={() => { void run(); }}>
          {step === "busy" ? "Wird gelöscht …" : "Endgültig löschen"}
        </button>
      </div>
    </section>
  );
}
