"use client";

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const socialLoginOptions: {
  provider: SocialProvider;
  label: string;
  icon: string;
}[] = [
  { provider: "google", label: "Google", icon: "G" },
  { provider: "apple", label: "Apple", icon: "" },
  { provider: "github", label: "GitHub", icon: "⌘" },
];

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

const requiresEmailVerification = (firebaseUser: User) => {
  const hasPasswordProvider = firebaseUser.providerData.some(
    (provider) => provider.providerId === "password"
  );

  return hasPasswordProvider && !firebaseUser.emailVerified;
};

const isRedirectFriendlyDevice = () => {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const isInstalledPwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true;

  return isMobile || isInstalledPwa;
};

const shouldFallbackToRedirect = (error: unknown) => {
  const code = getAuthErrorCode(error);

  return code === "auth/popup-blocked" || code === "auth/cancelled-popup-request";
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
  const [mode, setMode] = useState<AuthMode>("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const title = useMemo(() => {
    return mode === "login" ? "Willkommen zurück" : "Account erstellen";
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
        setErrorMessage("Bitte gib eine echte E-Mail-Adresse ein, z. B. name@mail.de.");
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
    clearMessages();
    setIsSubmitting(true);

    try {
      if (!auth || !isFirebaseConfigured) {
        handleLocalAuth();
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        setErrorMessage("Bitte gib eine echte E-Mail-Adresse ein, z. B. name@mail.de.");
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
          password
        );

        await updateProfile(credential.user, {
          displayName: username.trim(),
        });

        await sendEmailVerification(credential.user);
        await signOut(auth);

        setMode("login");
        setPassword("");
        setInfoMessage(
          `Wir haben eine Bestätigungs-Mail an ${normalizedEmail} geschickt. Öffne den Link und logge dich danach ein.`
        );
        return;
      }

      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user).catch(() => undefined);
        await signOut(auth);
        setInfoMessage(
          `Bitte bestätige zuerst deine E-Mail-Adresse. Ich habe den Link gerade nochmal an ${normalizedEmail} geschickt.`
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
        "Social Login braucht Firebase. Die App läuft gerade im lokalen Demo-Login. Fülle .env.local aus und aktiviere die Anbieter in Firebase."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = buildSocialProvider(providerName);

      if (isRedirectFriendlyDevice()) {
        setInfoMessage("Du wirst zur Anmeldung weitergeleitet…");
        await signInWithRedirect(auth, provider);
        return;
      }

      await signInWithPopup(auth, provider);
    } catch (error) {
      if (shouldFallbackToRedirect(error)) {
        try {
          const provider = buildSocialProvider(providerName);
          setInfoMessage("Popup wurde blockiert. Ich öffne stattdessen die Weiterleitungs-Anmeldung…");
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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#f5d0fe,_transparent_34%),radial-gradient(circle_at_bottom_right,_#fbcfe8,_transparent_30%),linear-gradient(135deg,_#2e1065,_#4c1d95_48%,_#831843)] p-4 text-white md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative">
            <div className="mb-8 flex items-center gap-4">
              <GradeGlowLogo size="lg" tone="light" />
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
              einem Ort — mit App-Feeling, Login und Cloud-Sync.
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
              {mode === "login"
                ? "E-Mail-Accounts müssen bestätigt sein. Social Login läuft über Firebase Auth."
                : "Nach der Registrierung bekommst du eine Bestätigungs-Mail, bevor der Account genutzt wird."}
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
                clearMessages();
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
                clearMessages();
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
                  autoComplete="name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  placeholder="z. B. Paul"
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                inputMode={mode === "login" && !isFirebaseConfigured ? "text" : "email"}
                placeholder={
                  mode === "login" && !isFirebaseConfigured
                    ? "deine E-Mail oder dein Benutzername"
                    : "name@mail.de"
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
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
            {socialLoginOptions.map((option) => (
              <button
                key={option.provider}
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                onClick={() => handleSocialLogin(option.provider)}
                disabled={isSubmitting}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                  {option.icon}
                </span>
                {option.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Apple und GitHub funktionieren erst, wenn die Anbieter in Firebase Authentication aktiviert
            und die passenden OAuth-Daten hinterlegt sind. Auf Mobile/PWA nutzt GradeGlow automatisch
            Redirect statt Popup.
          </p>
        </section>
      </div>
    </main>
  );
}
