import { NextResponse } from "next/server";
import { isPremiumPlan, mergeEntitlementSources } from "../../../lib/gradeglowAccess";
import { parseQuiz, QUIZ_LENGTH } from "../../../lib/quiz";

// Short multiple-choice quiz on one exam topic, written by Claude. Premium only.
// Needs ANTHROPIC_API_KEY in the Vercel project. ANTHROPIC_QUIZ_MODEL is optional.

export const runtime = "nodejs";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const MODEL = process.env.ANTHROPIC_QUIZ_MODEL || "claude-haiku-5-5";
const PER_HOUR = 12;
const recent = new Map<string, number[]>(); // best effort per server instance

type FirestoreValue = {
  stringValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number;
  timestampValue?: string; nullValue?: null; mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
};
const plain = (value: FirestoreValue): unknown => {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([k, v]) => [k, plain(v)]));
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(plain);
  return null;
};

/** Reads users/{uid} and entitlements/{uid} with the user's own token, so Firestore checks it. */
const readDoc = async (path: string, token: string) => {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`, {
    headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore ${res.status}`);
  const body = (await res.json()) as { fields?: Record<string, FirestoreValue> };
  return Object.fromEntries(Object.entries(body.fields ?? {}).map(([k, v]) => [k, plain(v)]));
};

const uidFromToken = (token: string) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { user_id?: unknown; sub?: unknown };
    const uid = payload.user_id ?? payload.sub;
    return typeof uid === "string" && /^[A-Za-z0-9]{6,128}$/.test(uid) ? uid : null;
  } catch { return null; }
};

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY || !PROJECT_ID) {
    return NextResponse.json({ error: "Das Quiz ist noch nicht eingerichtet." }, { status: 503 });
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const uid = token ? uidFromToken(token) : null;
  if (!uid) return NextResponse.json({ error: "Bitte melde dich an." }, { status: 401 });

  try {
    // Unverified uid only picks the documents; Firestore rejects the read if the token is not this user's.
    const [userDoc, entitlementDoc] = await Promise.all([readDoc(`users/${uid}`, token), readDoc(`entitlements/${uid}`, token)]);
    if (!isPremiumPlan(mergeEntitlementSources(userDoc, entitlementDoc).plan)) {
      return NextResponse.json({ error: "Das Quiz gibt es mit Premium." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Anmeldung abgelaufen. Lad die App neu." }, { status: 401 });
  }

  const now = Date.now();
  const times = (recent.get(uid) ?? []).filter((time) => now - time < 3_600_000);
  if (times.length >= PER_HOUR) return NextResponse.json({ error: "Genug Quiz für diese Stunde. Später weiter." }, { status: 429 });
  recent.set(uid, [...times, now]);

  const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const subject = clean(input.subject, 120);
  const topic = clean(input.topic, 120);
  if (!topic) return NextResponse.json({ error: "Kein Thema angegeben." }, { status: 400 });

  const prompt = `Du schreibst ein kurzes Übungsquiz für eine Studentin oder einen Studenten an einer deutschen Universität.
Fach: ${subject || "unbekannt"}
Thema: ${topic}

Schreibe genau ${QUIZ_LENGTH} Multiple-Choice-Fragen auf Deutsch, die prüfen, ob das Thema auf Klausurniveau sitzt:
Verständnis und kleine Rechen- oder Anwendungsaufgaben, keine Definitionen zum Auswendiglernen. Vom Leichten zum Schweren.
Jede Frage hat genau 4 Antworten, genau eine ist richtig. Prüfe jede Rechnung, bevor du sie aufschreibst.
Formeln als einfacher Text (z. B. x^2, sqrt(2), A^T), kein LaTeX.
Antworte nur mit JSON in dieser Form, ohne Text davor oder danach:
{"questions":[{"q":"Frage","options":["A","B","C","D"],"answer":0,"why":"Ein Satz, warum das stimmt"}]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 2500, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) return NextResponse.json({ error: "Die Fragen konnten nicht erstellt werden. Versuch es gleich nochmal." }, { status: 502 });
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (body.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("");
  const questions = parseQuiz(text);
  if (!questions) return NextResponse.json({ error: "Die Fragen konnten nicht erstellt werden. Versuch es gleich nochmal." }, { status: 502 });
  return NextResponse.json({ questions });
}
