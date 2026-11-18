"use client";

import { FormEvent, ReactNode, createContext, useContext, useEffect, useState } from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type AuthProvider,
  type User,
} from "firebase/auth";
import "./auth.css";
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

  // Sends a link to set a new password. Also lets Google/GitHub accounts add a password.
  const handlePasswordReset = async () => {
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Trag oben deine E-Mail ein, dann schicken wir dir einen Link.");
      return;
    }
    if (!auth || !isFirebaseConfigured) {
      setErrorMessage("Das geht gerade nicht. Versuch es später nochmal.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setInfoMessage(`Wenn es ein Konto mit ${normalizedEmail} gibt, kommt gleich eine Mail mit einem Link für ein neues Passwort. Schau auch im Spam nach.`);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <main className="ga-page ga-center" aria-busy="true">
        <span className="ga-spinner" aria-hidden="true" />
        <p className="ga-muted">GradeGlow lädt …</p>
      </main>
    );
  }

  if (user) {
    const session = { user, logout, startRegistration };
    return <AuthSessionContext.Provider value={session}>{children(session)}</AuthSessionContext.Provider>;
  }

  const firebaseLogin = mode === "login" && !isFirebaseConfigured;

  return (
    <main className="ga-page">
      <div className="ga-wrap">
        <p className="ga-brand"><span aria-hidden="true" className="ga-dot" />GradeGlow</p>

        {screen === "welcome" ? (
          <section className="ga-welcome" aria-labelledby="welcome-title">
            <h1 id="welcome-title">Klausur eintragen. Der Lernplan steht.</h1>
            <p className="ga-lead">GradeGlow verteilt deine Lernblöcke rückwärts bis zum Prüfungstag und sagt dir jeden Tag, was dran ist.</p>

            {/* A real piece of the app instead of a slogan: this is what "Heute" looks like. */}
            <div className="ga-preview" aria-hidden="true">
              <span className="ga-preview-meta">Analysis · 10:00 · 45 min</span>
              <strong>Eigenwerte</strong>
              <span className="ga-preview-sub">Probeklausur Aufgabe 4</span>
              <span className="ga-preview-bar"><i /></span>
              <span className="ga-preview-foot">Block 2 von 6 · noch 24 Tage</span>
            </div>

            <div className="ga-actions">
              <button type="button" className="ga-primary" onClick={() => switchMode("register")}>Kostenlos starten</button>
              <button type="button" className="ga-secondary" onClick={() => switchMode("login")}>Ich habe schon ein Konto</button>
              <button type="button" className="ga-text" onClick={() => {
                clearMessages();
                try { setUser(startDemo()); }
                catch { setErrorMessage("Bitte erlaube den lokalen Speicher, um die Demo zu öffnen."); }
              }}>Ohne Konto ausprobieren</button>
            </div>
            {errorMessage && <p role="alert" className="ga-error">{errorMessage}</p>}
          </section>
        ) : (
          <section className="ga-card" aria-labelledby="auth-title">
            <button type="button" className="ga-back" disabled={isSubmitting} onClick={() => {
              setScreen("welcome"); clearMessages(); setPassword("");
            }}>Zurück</button>
            <h1 id="auth-title">{mode === "login" ? "Willkommen zurück" : "Konto erstellen"}</h1>

            <form className="ga-form" onSubmit={handleEmailAuth}>
              {mode === "register" && (
                <label>Name
                  <input required autoComplete="name" placeholder="Wie sollen wir dich nennen?" value={username} onChange={(event) => setUsername(event.target.value)} />
                </label>
              )}
              <label>{firebaseLogin ? "E-Mail oder Benutzername" : "E-Mail"}
                <input required autoComplete="email" inputMode={firebaseLogin ? "text" : "email"} type={firebaseLogin ? "text" : "email"}
                  placeholder={firebaseLogin ? "E-Mail oder Benutzername" : "name@mail.de"} value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>Passwort
                <input required type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 6 : undefined}
                  placeholder={mode === "register" ? "mindestens 6 Zeichen" : ""} value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              {mode === "login" && isFirebaseConfigured && (
                <button type="button" className="ga-text ga-forgot" disabled={isSubmitting} onClick={() => { void handlePasswordReset(); }}>Passwort vergessen?</button>
              )}

              {infoMessage && <p role="status" className="ga-info">{infoMessage}</p>}
              {errorMessage && <p role="alert" className="ga-error">{errorMessage}</p>}

              <button className="ga-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Einen Moment …" : mode === "login" ? "Einloggen" : "Konto erstellen"}
              </button>
            </form>

            {isFirebaseConfigured && (
              <>
                <p className="ga-or">oder</p>
                <div className="ga-social">
                  {socialLoginOptions.filter((option) => !option.disabled).map((option) => (
                    <button key={option.provider} type="button" className="ga-secondary" onClick={() => handleSocialLogin(option.provider)} disabled={isSubmitting}>Mit {option.label}</button>
                  ))}
                </div>
              </>
            )}

            <p className="ga-switch">
              {mode === "login" ? "Noch kein Konto? " : "Schon ein Konto? "}
              <button type="button" className="ga-text" disabled={isSubmitting} onClick={() => switchMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Kostenlos starten" : "Einloggen"}
              </button>
            </p>
          </section>
        )}

        <footer className="ga-footer">
          <a href="/legal/impressum">Impressum</a><a href="/legal/privacy">Datenschutz</a><a href="/legal/terms">Nutzungsbedingungen</a>
        </footer>
      </div>
    </main>
  );
}
