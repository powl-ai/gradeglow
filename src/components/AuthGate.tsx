"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import type { AppUser } from "../types";

type AuthGateProps = {
  children: (props: {
    user: AppUser;
    logout: () => Promise<void>;
  }) => ReactNode;
};

type AuthMode = "login" | "register";
type SocialProvider = "google" | "apple" | "github";

type LocalStoredUser = {
  uid: string;
  username: string;
  email: string;
  password: string;
};

const LOCAL_USERS_KEY = "gradeglow-local-users-v1";
const LOCAL_SESSION_KEY = "gradeglow-local-session-v1";

const mapFirebaseUser = (firebaseUser: User): AppUser => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName:
    firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "GradeGlow User",
  photoURL: firebaseUser.photoURL,
  provider: "firebase",
});

const readLocalUsers = (): LocalStoredUser[] => {
  if (typeof window === "undefined") return [];

  try {
    const savedUsers = localStorage.getItem(LOCAL_USERS_KEY);
    if (!savedUsers) return [];

    const parsed = JSON.parse(savedUsers);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(LOCAL_USERS_KEY);
    return [];
  }
};

const saveLocalUsers = (users: LocalStoredUser[]) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const saveLocalSession = (user: AppUser) => {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
};

const readLocalSession = (): AppUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!savedSession) return null;

    const parsed = JSON.parse(savedSession) as Partial<AppUser>;

    if (!parsed.uid) return null;

    return {
      uid: parsed.uid,
      email: parsed.email ?? null,
      displayName: parsed.displayName ?? "GradeGlow User",
      photoURL: parsed.photoURL ?? null,
      provider: "local",
    };
  } catch {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    return null;
  }
};

const getAuthErrorMessage = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Diese E-Mail ist schon registriert. Melde dich damit an oder nutze eine andere E-Mail.";
    case "auth/invalid-email":
      return "Bitte gib eine gültige E-Mail-Adresse ein.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-Mail oder Passwort ist falsch.";
    case "auth/weak-password":
      return "Das Passwort muss mindestens 6 Zeichen haben.";
    case "auth/popup-closed-by-user":
      return "Das Anmeldefenster wurde geschlossen.";
    case "auth/account-exists-with-different-credential":
      return "Für diese E-Mail gibt es schon einen Account mit einer anderen Anmeldemethode.";
    case "auth/operation-not-allowed":
      return "Diese Anmeldemethode ist in Firebase noch nicht aktiviert.";
    default:
      return "Anmeldung fehlgeschlagen. Prüfe deine Eingaben und deine Firebase-Konfiguration.";
  }
};

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const title = useMemo(() => {
    return mode === "login" ? "Willkommen zurück" : "Account erstellen";
  }, [mode]);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setUser(readLocalSession());
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser ? mapFirebaseUser(currentUser) : null);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLocalAuth = () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const users = readLocalUsers();

    if (mode === "register") {
      if (!normalizedUsername) {
        setErrorMessage("Bitte gib einen Benutzernamen ein.");
        return;
      }

      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        setErrorMessage("Bitte gib eine gültige E-Mail-Adresse ein.");
        return;
      }

      if (password.length < 6) {
        setErrorMessage("Das Passwort muss mindestens 6 Zeichen haben.");
        return;
      }

      const alreadyExists = users.some(
        (storedUser) =>
          storedUser.email.toLowerCase() === normalizedEmail ||
          storedUser.username.toLowerCase() === normalizedUsername.toLowerCase()
      );

      if (alreadyExists) {
        setErrorMessage("Benutzername oder E-Mail ist schon vergeben.");
        return;
      }

      const storedUser: LocalStoredUser = {
        uid: `local-${crypto.randomUUID()}`,
        username: normalizedUsername,
        email: normalizedEmail,
        password,
      };

      saveLocalUsers([...users, storedUser]);

      const nextUser: AppUser = {
        uid: storedUser.uid,
        email: storedUser.email,
        displayName: storedUser.username,
        provider: "local",
      };

      saveLocalSession(nextUser);
      setUser(nextUser);
      return;
    }

    const loginIdentifier = normalizedEmail || normalizedUsername.toLowerCase();

    const matchingUser = users.find(
      (storedUser) =>
        storedUser.email.toLowerCase() === loginIdentifier ||
        storedUser.username.toLowerCase() === loginIdentifier
    );

    if (!matchingUser || matchingUser.password !== password) {
      setErrorMessage("Benutzername/E-Mail oder Passwort ist falsch.");
      return;
    }

    const nextUser: AppUser = {
      uid: matchingUser.uid,
      email: matchingUser.email,
      displayName: matchingUser.username,
      provider: "local",
    };

    saveLocalSession(nextUser);
    setUser(nextUser);
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (!auth || !isFirebaseConfigured) {
        handleLocalAuth();
        return;
      }

      if (mode === "register") {
        if (!username.trim()) {
          setErrorMessage("Bitte gib einen Benutzernamen ein.");
          return;
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(credential.user, {
          displayName: username.trim(),
        });

        setUser({
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: username.trim(),
          photoURL: credential.user.photoURL,
          provider: "firebase",
        });
        return;
      }

      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerName: SocialProvider) => {
    setErrorMessage("");

    if (!auth || !isFirebaseConfigured) {
      setErrorMessage(
        "Social Login braucht Firebase. Die App läuft gerade im lokalen Demo-Login. Fülle .env.local aus und aktiviere die Anbieter in Firebase."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (providerName === "google") {
        await signInWithPopup(auth, new GoogleAuthProvider());
        return;
      }

      if (providerName === "github") {
        await signInWithPopup(auth, new GithubAuthProvider());
        return;
      }

      const appleProvider = new OAuthProvider("apple.com");
      appleProvider.addScope("email");
      appleProvider.addScope("name");
      await signInWithPopup(auth, appleProvider);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    if (auth && isFirebaseConfigured && user?.provider === "firebase") {
      await signOut(auth);
      return;
    }

    localStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
  };

  if (isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-violet-950 p-6 text-white">
        <div className="rounded-[2rem] bg-white/10 p-6 text-center ring-1 ring-white/10 backdrop-blur">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="font-semibold">GradeGlow wird geladen…</p>
        </div>
      </main>
    );
  }

  if (user) {
    return children({ user, logout });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#f5d0fe,_transparent_34%),radial-gradient(circle_at_bottom_right,_#fbcfe8,_transparent_30%),linear-gradient(135deg,_#2e1065,_#4c1d95_48%,_#831843)] p-4 text-white md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-2xl font-black text-violet-950 shadow-xl">
                GG
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-100">
                  GradeGlow
                </p>
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Dein Studium, aber schön.
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-fuchsia-50/90">
              Module, Noten, ECTS, Einzelleistungen, Zielnoten und Backups an
              einem Ort — mit App-Feeling, Login und später leicht erweiterbar
              auf Cloud-Sync.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-2xl font-black">180</p>
                <p className="text-sm text-fuchsia-100/80">ECTS Ziel</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-2xl font-black">JSON</p>
                <p className="text-sm text-fuchsia-100/80">Backup ready</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-2xl font-black">PWA</p>
                <p className="text-sm text-fuchsia-100/80">installierbar</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-fuchsia-50/90 ring-1 ring-white/10">
              {isFirebaseConfigured
                ? "Firebase ist konfiguriert: E-Mail, Google, Apple und GitHub können genutzt werden, sobald die Anbieter in Firebase aktiviert sind."
                : "Aktuell läuft GradeGlow ohne Firebase im lokalen Demo-Login. Du kannst direkt testen; Social Login aktivierst du später über .env.local."}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl md:p-8">
          <div className="mb-6">
            <div className="mb-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
              {mode === "login" ? "Login" : "Registrierung"}
            </div>
            <h2 className="text-3xl font-black tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Melde dich an, damit deine Noten lokal sauber deinem Account
              zugeordnet werden.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => {
                setMode("login");
                setErrorMessage("");
              }}
            >
              Einloggen
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mode === "register"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => {
                setMode("register");
                setErrorMessage("");
              }}
            >
              Registrieren
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleEmailAuth}>
            {mode === "register" && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Benutzername
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  placeholder="z. B. Annik"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                {mode === "login" && !isFirebaseConfigured
                  ? "E-Mail oder Benutzername"
                  : "E-Mail"}
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                placeholder={
                  mode === "login" && !isFirebaseConfigured
                    ? "deine E-Mail oder dein Benutzername"
                    : "deine@email.de"
                }
                type={mode === "login" && !isFirebaseConfigured ? "text" : "email"}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Passwort
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                placeholder="mindestens 6 Zeichen"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {errorMessage && (
              <div className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
                {errorMessage}
              </div>
            )}

            <button
              className="w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-3 font-black text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? "Bitte warten…"
                : mode === "login"
                ? "Einloggen"
                : "Account erstellen"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            oder
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
              onClick={() => handleSocialLogin("google")}
              disabled={isSubmitting}
            >
              Google
            </button>
            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
              onClick={() => handleSocialLogin("apple")}
              disabled={isSubmitting}
            >
              Apple
            </button>
            <button
              type="button"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
              onClick={() => handleSocialLogin("github")}
              disabled={isSubmitting}
            >
              GitHub
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Lokaler Demo-Login speichert Accounts nur in deinem Browser und ist
            nicht für echte Produktivdaten gedacht. Für echten Login verbindest
            du Firebase über die Datei <code>.env.local</code>.
          </p>
        </section>
      </div>
    </main>
  );
}
