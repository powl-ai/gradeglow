"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type AuthProvider,
  type User,
} from "firebase/auth";
import GradeGlowLogo from "./GradeGlowLogo";
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
const AUTH_SEEN_KEY = "gradeglow-auth-seen-v1";
const AUTH_PREFERRED_MODE_KEY = "gradeglow-auth-preferred-mode-v1";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const socialLoginOptions: {
  provider: SocialProvider;
  label: string;
  icon: string;
  disabled?: boolean;
  badge?: string;
}[] = [
  { provider: "google", label: "Google", icon: "G" },
  {
    provider: "apple",
    label: "Apple",
    icon: "",
    disabled: true,
    badge: "bald",
  },
  { provider: "github", label: "GitHub", icon: "⌘" },
];

const mapFirebaseUser = (firebaseUser: User): AppUser => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName:
    firebaseUser.displayName ||
    firebaseUser.email?.split("@")[0] ||
    "GradeGlow User",
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

const getAuthErrorCode = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";

const getAuthErrorMessage = (error: unknown) => {
  const code = getAuthErrorCode(error);

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
    case "auth/popup-blocked":
      return "Der Browser hat das Anmeldefenster blockiert. Versuche es nochmal oder nutze einen anderen Browser.";
    case "auth/popup-closed-by-user":
      return "Das Anmeldefenster wurde geschlossen.";
    case "auth/cancelled-popup-request":
      return "Es läuft schon ein anderes Anmeldefenster. Warte kurz und versuche es erneut.";
    case "auth/account-exists-with-different-credential":
      return "Für diese E-Mail gibt es schon einen Account mit einer anderen Anmeldemethode.";
    case "auth/operation-not-allowed":
      return "Diese Anmeldemethode ist in Firebase noch nicht aktiviert.";
    case "auth/unauthorized-domain":
      return "Diese Domain ist für Firebase Auth noch nicht freigegeben. Prüfe Firebase Authorized Domains und den OAuth Client in Google Cloud.";
    case "auth/redirect-cancelled-by-user":
      return "Die Weiterleitung zur Anmeldung wurde abgebrochen.";
    case "auth/redirect-operation-pending":
      return "Eine Anmeldung per Weiterleitung läuft bereits. Warte kurz und versuche es erneut.";
    default:
      return "Anmeldung fehlgeschlagen. Prüfe deine Eingaben und deine Firebase-Konfiguration.";
  }
};

const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

const getInitialAuthMode = (): AuthMode => {
  if (typeof window === "undefined") return "register";

  const preferredMode = localStorage.getItem(AUTH_PREFERRED_MODE_KEY);
  if (preferredMode === "login" || preferredMode === "register") {
    return preferredMode;
  }

  return localStorage.getItem(AUTH_SEEN_KEY) === "true" ? "login" : "register";
};

const rememberAuthMode = (mode: AuthMode) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_SEEN_KEY, "true");
  localStorage.setItem(AUTH_PREFERRED_MODE_KEY, mode);
};

const requiresEmailVerification = (firebaseUser: User) => {
  const hasPasswordProvider = firebaseUser.providerData.some(
    (provider) => provider.providerId === "password",
  );

  return hasPasswordProvider && !firebaseUser.emailVerified;
};

const isRedirectFriendlyDevice = () => {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  const isInstalledPwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true;

  return isMobile || isInstalledPwa;
};

const shouldFallbackToRedirect = (error: unknown) => {
  const code = getAuthErrorCode(error);

  return (
    code === "auth/popup-blocked" || code === "auth/cancelled-popup-request"
  );
};

const buildSocialProvider = (providerName: SocialProvider): AuthProvider => {
  if (providerName === "google") {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return provider;
  }

  if (providerName === "github") {
    const provider = new GithubAuthProvider();
    provider.addScope("read:user");
    provider.addScope("user:email");
    return provider;
  }

  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  provider.setCustomParameters({ locale: "de" });
  return provider;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>(getInitialAuthMode);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const title = useMemo(() => {
    return mode === "login" ? "Willkommen zurück" : "Kostenlos starten";
  }, [mode]);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setUser(readLocalSession());
      setIsAuthLoading(false);
      return;
    }

    const currentAuth = auth;

    void getRedirectResult(currentAuth).catch((error) => {
      setErrorMessage(getAuthErrorMessage(error));
    });

    const unsubscribe = onAuthStateChanged(currentAuth, (currentUser) => {
      if (currentUser && requiresEmailVerification(currentUser)) {
        setUser(null);
        setIsAuthLoading(false);
        void signOut(currentAuth);
        return;
      }

      setUser(currentUser ? mapFirebaseUser(currentUser) : null);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearMessages = () => {
    setErrorMessage("");
    setInfoMessage("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearMessages();
    rememberAuthMode(nextMode);
  };

  const handleLocalAuth = () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const users = readLocalUsers();

    if (mode === "register") {
      if (!normalizedUsername) {
        setErrorMessage("Bitte gib einen Benutzernamen ein.");
        return;
      }

      if (!isValidEmail(normalizedEmail)) {
        setErrorMessage(
          "Bitte gib eine echte E-Mail-Adresse ein, z. B. name@mail.de.",
        );
        return;
      }

      if (password.length < 6) {
        setErrorMessage("Das Passwort muss mindestens 6 Zeichen haben.");
        return;
      }

      const alreadyExists = users.some(
        (storedUser) =>
          storedUser.email.toLowerCase() === normalizedEmail ||
          storedUser.username.toLowerCase() ===
            normalizedUsername.toLowerCase(),
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
      rememberAuthMode("login");
      setUser(nextUser);
      return;
    }

    const loginIdentifier = normalizedEmail || normalizedUsername.toLowerCase();

    const matchingUser = users.find(
      (storedUser) =>
        storedUser.email.toLowerCase() === loginIdentifier ||
        storedUser.username.toLowerCase() === loginIdentifier,
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
    rememberAuthMode("login");
    setUser(nextUser);
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      if (!auth || !isFirebaseConfigured) {
        handleLocalAuth();
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        setErrorMessage(
          "Bitte gib eine echte E-Mail-Adresse ein, z. B. name@mail.de.",
        );
        return;
      }

      if (!password) {
        setErrorMessage("Bitte gib dein Passwort ein.");
        return;
      }

      if (mode === "register") {
        if (!username.trim()) {
          setErrorMessage("Bitte gib einen Benutzernamen ein.");
          return;
        }

        if (password.length < 6) {
          setErrorMessage("Das Passwort muss mindestens 6 Zeichen haben.");
          return;
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password,
        );

        await updateProfile(credential.user, {
          displayName: username.trim(),
        });

        await sendEmailVerification(credential.user);
        await signOut(auth);

        switchMode("login");
        setPassword("");
        setInfoMessage(
          `Wir haben eine Bestätigungs-Mail an ${normalizedEmail} geschickt. Öffne den Link und logge dich danach ein.`,
        );
        return;
      }

      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );

      rememberAuthMode("login");

      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user).catch(() => undefined);
        await signOut(auth);
        setInfoMessage(
          `Bitte bestätige zuerst deine E-Mail-Adresse. Ich habe den Link gerade nochmal an ${normalizedEmail} geschickt.`,
        );
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerName: SocialProvider) => {
    clearMessages();

    if (!auth || !isFirebaseConfigured) {
      setErrorMessage(
        "Social Login braucht Firebase. Die App läuft gerade im lokalen Demo-Login. Fülle .env.local aus und aktiviere die Anbieter in Firebase.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = buildSocialProvider(providerName);

      if (isRedirectFriendlyDevice()) {
        rememberAuthMode("login");
        setInfoMessage("Du wirst zur Anmeldung weitergeleitet…");
        await signInWithRedirect(auth, provider);
        return;
      }

      await signInWithPopup(auth, provider);
      rememberAuthMode("login");
    } catch (error) {
      if (shouldFallbackToRedirect(error)) {
        try {
          const provider = buildSocialProvider(providerName);
          rememberAuthMode("login");
          setInfoMessage(
            "Popup wurde blockiert. Ich öffne stattdessen die Weiterleitungs-Anmeldung…",
          );
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          setErrorMessage(getAuthErrorMessage(redirectError));
          return;
        }
      }

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
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_#f5d0fe,_transparent_34%),radial-gradient(circle_at_bottom_right,_#fbcfe8,_transparent_30%),linear-gradient(135deg,_#2e1065,_#4c1d95_48%,_#831843)] px-3 py-4 text-white sm:px-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-5 sm:gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative order-2 overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur md:p-10 lg:order-1">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative">
            <div className="mb-8 flex min-w-0 items-center gap-4">
              <GradeGlowLogo size="lg" tone="light" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-100">
                  GradeGlow
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
                  Dein Studium, aber schön.
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-fuchsia-50/90">
              Starte kostenlos, speichere dein Profil und lege danach Modul +
              Prüfung an. GradeGlow führt neue Tester Schritt für Schritt durch
              den ersten Lernplan.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-violet-950 shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 hover:bg-violet-50"
                onClick={() => switchMode("register")}
              >
                Kostenlos starten
              </button>
              <button
                type="button"
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/15"
                onClick={() => switchMode("login")}
              >
                Ich habe schon ein Konto
              </button>
            </div>

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
                <p className="text-2xl font-black">4 Schritte</p>
                <p className="text-sm text-fuchsia-100/80">klarer Beta-Start</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-fuchsia-50/90 ring-1 ring-white/10">
              {isFirebaseConfigured
                ? "Firebase ist konfiguriert: E-Mail, Google und GitHub sind nutzbar, sobald die Anbieter in Firebase aktiviert sind. Apple bleibt bis zum Apple-Developer-Setup deaktiviert."
                : "Aktuell läuft GradeGlow ohne Firebase im lokalen Demo-Login. Du kannst direkt testen; Social Login aktivierst du später über .env.local."}
            </div>
          </div>
        </section>

        <section className="order-1 min-w-0 rounded-[1.8rem] bg-white p-4 text-slate-950 shadow-2xl sm:rounded-[2rem] sm:p-5 md:p-8 lg:order-2">
          <div className="mb-4 sm:mb-6">
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <GradeGlowLogo size="md" />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-violet-500">
                  GradeGlow
                </p>
                <p className="text-xl font-black leading-tight tracking-tight text-slate-950 sm:text-2xl">
                  Dein Studium, aber schön.
                </p>
              </div>
            </div>

            <div className="mb-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 sm:mb-3 sm:text-sm">
              {mode === "login" ? "Login" : "Registrierung"}
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:mt-2">
              {mode === "login"
                ? "Logge dich ein, wenn du schon einen Account hast. Neue Tester starten über Registrierung."
                : "Erstelle deinen Account. Danach führt dich GradeGlow durch Profil, Modul, Prüfung und erste Lernsession."}
            </p>
            <div className="mt-3 rounded-2xl bg-violet-50 p-3 text-sm font-semibold leading-6 text-violet-900 ring-1 ring-violet-100 sm:mt-4 sm:p-4">
              <p className="font-black">Beta-Start in 4 Schritten</p>
              <p className="mt-1 text-violet-700">
                Account erstellen → Profil speichern → Modul + Prüfung →
                Lernsession testen.
              </p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 sm:mb-5">
            <button
              type="button"
              className={`rounded-xl px-3 py-2.5 text-sm font-bold transition sm:px-4 sm:py-3 ${
                mode === "register"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => switchMode("register")}
            >
              Kostenlos starten
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-2.5 text-sm font-bold transition sm:px-4 sm:py-3 ${
                mode === "login"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => switchMode("login")}
            >
              Einloggen
            </button>
          </div>

          <form className="space-y-2.5 sm:space-y-3" onSubmit={handleEmailAuth}>
            {mode === "register" && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Benutzername
                </span>
                <input
                  autoComplete="name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100 sm:py-3"
                  placeholder="z. B. Max Mustermann"
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
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100 sm:py-3"
                inputMode={
                  mode === "login" && !isFirebaseConfigured ? "text" : "email"
                }
                placeholder={
                  mode === "login" && !isFirebaseConfigured
                    ? "deine E-Mail oder dein Benutzername"
                    : "name@mail.de"
                }
                type={
                  mode === "login" && !isFirebaseConfigured ? "text" : "email"
                }
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Passwort
              </span>
              <input
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100 sm:py-3"
                placeholder="mindestens 6 Zeichen"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {infoMessage && (
              <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                {infoMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
                {errorMessage}
              </div>
            )}

            <button
              className="w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-3 font-black text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] disabled:opacity-60 sm:py-3.5"
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

          <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:my-6">
            <div className="h-px flex-1 bg-slate-200" />
            oder
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {socialLoginOptions.map((option) => (
              <button
                key={option.provider}
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                onClick={() => handleSocialLogin(option.provider)}
                disabled={isSubmitting || option.disabled}
                title={
                  option.disabled
                    ? "Apple Login braucht einen Apple Developer Account und wird später aktiviert."
                    : undefined
                }
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                  {option.icon}
                </span>
                {option.label}
                {option.badge && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-white/70">
                    {option.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400 sm:mt-4">
            GitHub läuft über Firebase und GitHub OAuth. Apple bleibt als „bald
            verfügbar“-Button sichtbar, weil dafür zusätzlich Apple Developer
            Setup mit Service ID, Team ID und Private Key nötig ist. Auf
            Mobile/PWA nutzt GradeGlow automatisch Redirect statt Popup.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-4 text-xs font-bold text-slate-400 sm:mt-5">
            <Link className="transition hover:text-violet-700" href="/legal">
              Legal Hub
            </Link>
            <span aria-hidden="true">·</span>
            <span>GradeGlow Prototype</span>
          </div>
        </section>
      </div>
    </main>
  );
}
