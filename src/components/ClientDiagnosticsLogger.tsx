"use client";

import { Component, ErrorInfo, ReactNode, useEffect, useRef } from "react";
import { logClientError } from "../lib/diagnostics";
import { GRADEGLOW_APP_VERSION } from "../lib/appVersion";
import type { AppUser } from "../types";

type ClientDiagnosticsLoggerProps = {
  user: AppUser;
  children: ReactNode;
};

type ClientDiagnosticsLoggerState = {
  hasRenderError: boolean;
  errorMessage: string;
};

class ClientErrorBoundary extends Component<ClientDiagnosticsLoggerProps, ClientDiagnosticsLoggerState> {
  state: ClientDiagnosticsLoggerState = {
    hasRenderError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: unknown): ClientDiagnosticsLoggerState {
    const message = error instanceof Error ? error.message : String(error);
    return {
      hasRenderError: true,
      errorMessage: message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void logClientError(this.props.user, error, "react-render-error", {
      componentStack: errorInfo.componentStack,
    }).catch(() => undefined);
  }

  render() {
    if (this.state.hasRenderError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#fbf7ff] px-4 text-slate-950">
          <div className="max-w-xl rounded-[2rem] bg-white/95 p-6 shadow-xl shadow-violet-100 ring-1 ring-violet-100">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-600">GradeGlow Fehler</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Diese Ansicht konnte gerade nicht geladen werden.</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              Der Fehler wurde für die Beta-Diagnose gespeichert. Lade die Seite neu oder öffne die Diagnose-Seite.
            </p>
            <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700 ring-1 ring-rose-100">
              {this.state.errorMessage || "Unbekannter Fehler"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="/diagnostics" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
                Diagnose öffnen
              </a>
              <button
                type="button"
                className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 ring-1 ring-violet-100 transition hover:-translate-y-0.5"
                onClick={() => window.location.reload()}
              >
                Neu laden
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function BrowserErrorListeners({ user }: { user: AppUser }) {
  const lastErrorRef = useRef("");

  useEffect(() => {
    const shouldSkipDuplicate = (signature: string) => {
      if (lastErrorRef.current === signature) return true;
      lastErrorRef.current = signature;
      window.setTimeout(() => {
        if (lastErrorRef.current === signature) lastErrorRef.current = "";
      }, 5000);
      return false;
    };

    const handleError = (event: ErrorEvent) => {
      const signature = `${event.filename}:${event.lineno}:${event.colno}:${event.message}`;
      if (shouldSkipDuplicate(signature)) return;

      void logClientError(user, event.error ?? event.message, "window-error", {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        appVersion: GRADEGLOW_APP_VERSION,
      }).catch(() => undefined);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      const signature = `unhandled:${reason}`;
      if (shouldSkipDuplicate(signature)) return;

      void logClientError(user, event.reason, "unhandled-promise-rejection", {
        appVersion: GRADEGLOW_APP_VERSION,
      }).catch(() => undefined);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [user]);

  return null;
}

export default function ClientDiagnosticsLogger({ user, children }: ClientDiagnosticsLoggerProps) {
  return (
    <ClientErrorBoundary user={user}>
      <BrowserErrorListeners user={user} />
      {children}
    </ClientErrorBoundary>
  );
}
