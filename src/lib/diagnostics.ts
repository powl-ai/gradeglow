import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { GRADEGLOW_APP_VERSION } from "./appVersion";
import type {
  AppUser,
  DiagnosticPriority,
  DiagnosticReport,
  DiagnosticReportKind,
  DiagnosticStatus,
  UiIssue,
} from "../types";

const validDiagnosticKinds: DiagnosticReportKind[] = ["bug_report", "client_error", "ui_audit", "system_check"];
const validDiagnosticStatuses: DiagnosticStatus[] = ["open", "reviewing", "fixed", "ignored", "closed"];
const validDiagnosticPriorities: DiagnosticPriority[] = ["low", "normal", "high", "critical"];

const getStringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const getNumberValue = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const getObjectValue = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const getDiagnosticKind = (value: unknown): DiagnosticReportKind =>
  validDiagnosticKinds.includes(value as DiagnosticReportKind) ? (value as DiagnosticReportKind) : "bug_report";

const getDiagnosticStatus = (value: unknown): DiagnosticStatus =>
  validDiagnosticStatuses.includes(value as DiagnosticStatus) ? (value as DiagnosticStatus) : "open";

const getDiagnosticPriority = (value: unknown): DiagnosticPriority =>
  validDiagnosticPriorities.includes(value as DiagnosticPriority) ? (value as DiagnosticPriority) : "normal";

export const normalizeDiagnosticReport = (id: string, rawValue: DocumentData): DiagnosticReport => ({
  id,
  ownerUid: getStringValue(rawValue.ownerUid),
  ownerEmail: getStringValue(rawValue.ownerEmail),
  ownerName: getStringValue(rawValue.ownerName),
  kind: getDiagnosticKind(rawValue.kind),
  status: getDiagnosticStatus(rawValue.status),
  priority: getDiagnosticPriority(rawValue.priority),
  title: getStringValue(rawValue.title) || "Ohne Titel",
  message: getStringValue(rawValue.message),
  page: getStringValue(rawValue.page),
  route: getStringValue(rawValue.route),
  userAgent: getStringValue(rawValue.userAgent),
  appVersion: getStringValue(rawValue.appVersion) || GRADEGLOW_APP_VERSION,
  browserLanguage: getStringValue(rawValue.browserLanguage),
  viewport: getStringValue(rawValue.viewport),
  onlineStatus: getStringValue(rawValue.onlineStatus),
  notificationPermission: getStringValue(rawValue.notificationPermission),
  createdAtIso: getStringValue(rawValue.createdAtIso),
  updatedAtIso: getStringValue(rawValue.updatedAtIso),
  lastSeenAtIso: getStringValue(rawValue.lastSeenAtIso),
  occurrenceCount: Math.max(1, getNumberValue(rawValue.occurrenceCount) || 1),
  errorName: getStringValue(rawValue.errorName),
  errorMessage: getStringValue(rawValue.errorMessage),
  stack: getStringValue(rawValue.stack),
  adminNote: getStringValue(rawValue.adminNote),
  metadata: getObjectValue(rawValue.metadata),
});

export type DiagnosticsSnapshot = {
  appVersion: string;
  route: string;
  userAgent: string;
  browserLanguage: string;
  viewport: string;
  onlineStatus: string;
  notificationPermission: string;
  localStorageAvailable: boolean;
  serviceWorkerAvailable: boolean;
  pushManagerAvailable: boolean;
  firebaseConfigured: boolean;
};

export const getDiagnosticsSnapshot = (): DiagnosticsSnapshot => {
  const hasWindow = typeof window !== "undefined";
  const hasNavigator = typeof navigator !== "undefined";
  const width = hasWindow ? window.innerWidth : 0;
  const height = hasWindow ? window.innerHeight : 0;

  let localStorageAvailable = false;
  try {
    if (hasWindow) {
      const key = "gradeglow-diagnostics-storage-test";
      window.localStorage.setItem(key, "ok");
      window.localStorage.removeItem(key);
      localStorageAvailable = true;
    }
  } catch {
    localStorageAvailable = false;
  }

  return {
    appVersion: GRADEGLOW_APP_VERSION,
    route: hasWindow ? `${window.location.pathname}${window.location.search}` : "server",
    userAgent: hasNavigator ? navigator.userAgent : "unknown",
    browserLanguage: hasNavigator ? navigator.language : "unknown",
    viewport: hasWindow ? `${width}x${height}` : "unknown",
    onlineStatus: hasNavigator ? (navigator.onLine ? "online" : "offline") : "unknown",
    notificationPermission:
      hasWindow && "Notification" in window ? Notification.permission : "unsupported",
    localStorageAvailable,
    serviceWorkerAvailable: hasNavigator && "serviceWorker" in navigator,
    pushManagerAvailable: hasWindow && "PushManager" in window,
    firebaseConfigured: isFirebaseConfigured,
  };
};

const buildBaseReport = (user: AppUser, snapshot: DiagnosticsSnapshot) => ({
  ownerUid: user.uid,
  ownerEmail: user.email ?? "",
  ownerName: user.displayName || user.email || "GradeGlow User",
  page: snapshot.route,
  route: snapshot.route,
  userAgent: snapshot.userAgent,
  appVersion: snapshot.appVersion,
  browserLanguage: snapshot.browserLanguage,
  viewport: snapshot.viewport,
  onlineStatus: snapshot.onlineStatus,
  notificationPermission: snapshot.notificationPermission,
});

export type CreateDiagnosticReportInput = {
  kind: DiagnosticReportKind;
  priority?: DiagnosticPriority;
  title: string;
  message: string;
  errorName?: string;
  errorMessage?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
};

export async function createDiagnosticReport(user: AppUser, input: CreateDiagnosticReportInput) {
  if (!db || !isFirebaseConfigured) throw new Error("firebase-not-configured");

  const snapshot = getDiagnosticsSnapshot();
  const nowIso = new Date().toISOString();
  const cleanedTitle = input.title.trim();
  const cleanedMessage = input.message.trim();

  if (!cleanedTitle || cleanedTitle.length < 3) throw new Error("title-too-short");
  if (!cleanedMessage || cleanedMessage.length < 5) throw new Error("message-too-short");

  const docRef = await addDoc(collection(db, "diagnostics"), {
    ...buildBaseReport(user, snapshot),
    kind: input.kind,
    status: "open",
    priority: input.priority ?? "normal",
    title: cleanedTitle.slice(0, 140),
    message: cleanedMessage.slice(0, 7000),
    errorName: (input.errorName ?? "").slice(0, 200),
    errorMessage: (input.errorMessage ?? "").slice(0, 1000),
    stack: (input.stack ?? "").slice(0, 7000),
    metadata: input.metadata ?? {},
    occurrenceCount: 1,
    adminNote: "",
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    lastSeenAtIso: nowIso,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  });

  return docRef.id;
}

const getErrorFields = (error: unknown) => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack ?? "",
    };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      errorName: getStringValue(record.name) || "UnknownError",
      errorMessage: getStringValue(record.message) || JSON.stringify(record).slice(0, 1000),
      stack: getStringValue(record.stack),
    };
  }

  return {
    errorName: "UnknownError",
    errorMessage: String(error),
    stack: "",
  };
};

export async function logClientError(
  user: AppUser,
  error: unknown,
  context: string,
  metadata: Record<string, unknown> = {},
) {
  const errorFields = getErrorFields(error);
  return createDiagnosticReport(user, {
    kind: "client_error",
    priority: "high",
    title: `Client Error: ${context}`,
    message: errorFields.errorMessage || "Unbekannter Fehler im Browser.",
    ...errorFields,
    metadata: {
      context,
      ...metadata,
    },
  });
}

const getVisibleText = (element: Element) =>
  [
    element.textContent,
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("value"),
  ]
    .map((value) => (value ?? "").replace(/\s+/g, " ").trim())
    .find(Boolean) ?? "";

const getElementSelector = (element: Element) => {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = element.className && typeof element.className === "string"
    ? `.${element.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".")}`
    : "";
  return `${tag}${id}${classes}`.slice(0, 220);
};

export const scanCurrentPageForUiIssues = (): UiIssue[] => {
  if (typeof document === "undefined") return [];

  const issues: UiIssue[] = [];
  const clickableElements = Array.from(document.querySelectorAll("button, a, [role='button']"));

  clickableElements.forEach((element, index) => {
    const text = getVisibleText(element);
    const htmlElement = element as HTMLElement;
    const isButton = element.tagName.toLowerCase() === "button";
    const isLink = element.tagName.toLowerCase() === "a";
    const isRoleButton = element.getAttribute("role") === "button";
    const disabled = htmlElement.hasAttribute("disabled") || htmlElement.getAttribute("aria-disabled") === "true";
    const href = isLink ? element.getAttribute("href") || "" : "";
    const style = window.getComputedStyle(htmlElement);
    const rect = htmlElement.getBoundingClientRect();
    const isHidden = style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05;
    const isTooSmallToTap = !isHidden && !disabled && (rect.width > 0 || rect.height > 0) && (rect.width < 18 || rect.height < 18);

    if (!text) {
      issues.push({
        id: `empty-label-${index}`,
        severity: "high",
        selector: getElementSelector(element),
        label: "",
        message: "Klickbares Element ohne sichtbaren Text/aria-label gefunden.",
      });
    }

    if (!disabled && style.pointerEvents === "none") {
      issues.push({
        id: `pointer-disabled-${index}`,
        severity: "high",
        selector: getElementSelector(element),
        label: text,
        message: "Klickbares Element wirkt aktiv, nimmt aber wegen pointer-events keine Klicks an.",
      });
    }

    if (isTooSmallToTap) {
      issues.push({
        id: `tap-target-${index}`,
        severity: "normal",
        selector: getElementSelector(element),
        label: text,
        message: "Klickfläche ist sehr klein und kann auf Mobile wie ein kaputter Button wirken.",
      });
    }

    if (isLink && !href) {
      issues.push({
        id: `empty-href-${index}`,
        severity: "normal",
        selector: getElementSelector(element),
        label: text,
        message: "Link ohne href gefunden.",
      });
    }

    if (isButton && !disabled && htmlElement.getAttribute("type") === null) {
      issues.push({
        id: `button-type-${index}`,
        severity: "low",
        selector: getElementSelector(element),
        label: text,
        message: "Button ohne type-Attribut gefunden. Kann in Formularen unerwartet submitten.",
      });
    }

    if (isRoleButton && !htmlElement.hasAttribute("tabindex")) {
      issues.push({
        id: `role-button-keyboard-${index}`,
        severity: "normal",
        selector: getElementSelector(element),
        label: text,
        message: "role=button ohne tabindex gefunden. Per Tastatur ist das Element eventuell nicht erreichbar.",
      });
    }
  });

  return issues.slice(0, 80);
};

export async function submitUiAudit(user: AppUser, issues: UiIssue[]) {
  const criticalCount = issues.filter((issue) => issue.severity === "high").length;
  return createDiagnosticReport(user, {
    kind: "ui_audit",
    priority: criticalCount > 0 ? "high" : issues.length > 0 ? "normal" : "low",
    title: issues.length > 0 ? `UI-Audit: ${issues.length} mögliche Probleme` : "UI-Audit ohne Auffälligkeiten",
    message: issues.length > 0
      ? issues.map((issue) => `• ${issue.message} (${issue.selector}${issue.label ? ` · ${issue.label}` : ""})`).join("\n")
      : "Der aktuelle UI-Audit hat keine auffälligen Buttons oder Links gefunden.",
    metadata: { issues },
  });
}

export async function getMyDiagnosticReports(user: AppUser) {
  if (!db || !isFirebaseConfigured) return [];
  const diagnosticsQuery = query(
    collection(db, "diagnostics"),
    where("ownerUid", "==", user.uid),
    orderBy("createdAtIso", "desc"),
  );
  const snapshot = await getDocs(diagnosticsQuery);
  return snapshot.docs.map((item) => normalizeDiagnosticReport(item.id, item.data()));
}

export async function getRecentDiagnosticReportsForAdmin() {
  if (!db || !isFirebaseConfigured) return [];
  const diagnosticsQuery = query(collection(db, "diagnostics"), orderBy("createdAtIso", "desc"));
  const snapshot = await getDocs(diagnosticsQuery);
  return snapshot.docs.map((item) => normalizeDiagnosticReport(item.id, item.data())).slice(0, 150);
}

export async function updateDiagnosticReportForAdmin(
  reportId: string,
  status: DiagnosticStatus,
  adminNote: string,
) {
  if (!db || !isFirebaseConfigured) throw new Error("firebase-not-configured");
  await updateDoc(doc(db, "diagnostics", reportId), {
    status,
    adminNote: adminNote.trim().slice(0, 2000),
    updatedAtIso: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });
}
