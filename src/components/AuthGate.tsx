"use client";

import Link from "next/link";
import { FormEvent, ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
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
import { demoUser, endDemo, isDemoActive, startDemo } from "../lib/guestDemo";
import type { AppUser } from "../types";

type AuthSession = {
  user: AppUser;
  logout: () => Promise<void>;
  startRegistration: () => void;
};

type AuthGateProps = { children: (props: AuthSession) => ReactNode };
const AuthSessionContext = createContext<AuthSession | null>(null);

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
      return "Diese Anmeldemethode ist gerade nicht verfügbar. Nutze bitte E-Mail oder einen anderen Anbieter.";
    case "auth/unauthorized-domain":
      return "Die Anmeldung ist auf dieser Adresse gerade nicht verfügbar. Bitte versuche es später erneut.";
    case "auth/redirect-cancelled-by-user":
      return "Die Weiterleitung zur Anmeldung wurde abgebrochen.";
    case "auth/redirect-operation-pending":
      return "Eine Anmeldung per Weiterleitung läuft bereits. Warte kurz und versuche es erneut.";
    default:
      return "Anmeldung fehlgeschlagen. Prüfe deine Eingaben und versuche es erneut.";
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
  const inheritedSession = useContext(AuthSessionContext);
  return inheritedSession ? children(inheritedSession) : <AuthGateSession>{children}</AuthGateSession>;
}

function AuthGateSession({ children }: AuthGateProps) {
  const [screen, setScreen] = useState<"welcome" | "auth">("welcome");
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
      setUser(readLocalSession() ?? (isDemoActive() ? demoUser : null));
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

      if (currentUser) endDemo();
      setUser(currentUser ? mapFirebaseUser(currentUser) : (isDemoActive() ? demoUser : null));
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    const previousColor = meta?.getAttribute("content");
    meta?.setAttribute("content", "#421c72");
    return () => {
      if (previousColor) meta?.setAttribute("content", previousColor);
    };
  }, [user]);

  const clearMessages = () => {
    setErrorMessage("");
    setInfoMessage("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setScreen("auth");
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
        "Diese Anmeldemethode ist gerade nicht verfügbar. Nutze bitte E-Mail.",
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

  const startRegistration = () => {
    endDemo();
    setUser(null);
    setPassword("");
    switchMode("register");
  };

  const logout = async () => {
    endDemo();
    setScreen("welcome");
    clearMessages();
    if (auth && isFirebaseConfigured && user?.provider === "firebase") {
      await signOut(auth);
      return;
    }

    localStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
  };

  if (isAuthLoading) {
    return (
      <main className="gg-auth-page flex items-center justify-center text-white">
        <div className="rounded-[2rem] bg-white/10 p-6 text-center ring-1 ring-white/10 backdrop-blur">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="font-semibold">GradeGlow wird geladen…</p>
        </div>
      </main>
    );
  }

  if (user) {
    const session = { user, logout, startRegistration };
    return <AuthSessionContext.Provider value={session}>{children(session)}</AuthSessionContext.Provider>;
  }

  return (
    <main className="gg-auth-page">
      <div className="gg-auth-content">
        {screen === "welcome" ? (
          <section className="gg-welcome" aria-labelledby="welcome-title">
            <GradeGlowLogo size="lg" tone="light" appearance="light" />
            <p className="gg-auth-wordmark">GradeGlow</p>
            <h1 id="welcome-title">Dein Studium,<br />aber schön.</h1>
            <p className="gg-welcome-description">Plane Prüfungen, tracke Lernzeit und behalte deinen Fortschritt im Blick.</p>
            <div className="gg-welcome-actions">
              <button type="button" className="gg-auth-primary" onClick={() => switchMode("register")}>Kostenlos starten</button>
              <button type="button" className="gg-auth-secondary" onClick={() => switchMode("login")}>Ich habe schon ein Konto</button>
              <button type="button" className="gg-auth-demo" onClick={() => {
                clearMessages();
                try { setUser(startDemo()); }
                catch { setErrorMessage("Bitte erlaube den lokalen Speicher, um die Demo zu öffnen."); }
              }}>Erst ausprobieren <span aria-hidden="true">→</span></button>
            </div>
            <p className="gg-welcome-note">Ohne Anmeldung ausprobieren.</p>
            {errorMessage && <p role="alert" className="mt-4 text-sm text-rose-100">{errorMessage}</p>}
          </section>
        ) : (
          <section className="gg-auth-card" aria-labelledby="auth-title">
            <button type="button" className="gg-auth-back" disabled={isSubmitting} onClick={() => {
              setScreen("welcome"); clearMessages(); setPassword("");
            }}>← Zurück</button>
            <div className="mb-6 mt-5 flex items-center gap-3">
              <GradeGlowLogo size="md" appearance="light" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">GradeGlow</p>
                <h1 id="auth-title" className="mt-1 text-2xl font-black tracking-tight">{title}</h1>
              </div>
            </div>
          <form className="space-y-2.5 sm:space-y-3" onSubmit={handleEmailAuth}>
            {mode === "register" && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Benutzername
                </span>
                <input
                  required
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
                required
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
                required
                minLength={mode === "register" ? 6 : undefined}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {infoMessage && (
              <div role="status" className="rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                {infoMessage}
              </div>
            )}

            {errorMessage && (
              <div role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
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


            {isFirebaseConfigured && (
              <>
                <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
                  <div className="h-px flex-1 bg-slate-200" />oder weiter mit<div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {socialLoginOptions.filter((option) => !option.disabled).map((option) => (
                    <button key={option.provider} type="button" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60" onClick={() => handleSocialLogin(option.provider)} disabled={isSubmitting}>{option.label}</button>
                  ))}
                </div>
              </>
            )}
            <p className="mt-5 text-center text-sm text-slate-500">
              {mode === "login" ? "Noch kein Konto? " : "Schon ein Konto? "}
              <button type="button" disabled={isSubmitting} className="font-bold text-violet-700" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Kostenlos starten" : "Einloggen"}
              </button>
            </p>
          </section>
        )}
        <footer className="gg-auth-footer">
          <Link href="/legal">Datenschutz & Impressum</Link>
        </footer>
      </div>
    </main>
  );
}
