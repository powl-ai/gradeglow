import type { GradeGlowEntitlement, PlanLimits, UserPlan } from "../types";
import { getPlanLimits, isPremiumPlan, planLabels } from "./gradeglowAccess";

export type GradeGlowFeatureGateId =
  | "modulesCore"
  | "examsCore"
  | "basicTimer"
  | "studyCircleBasic"
  | "studyCircleAdvanced"
  | "premiumThemes"
  | "appIconCosmetics"
  | "advancedInsights"
  | "exportBackup"
  | "diagnostics"
  | "launchCenter"
  | "adminConsole"
  | "futureAi";

export type FeatureAccessResult = {
  allowed: boolean;
  label: string;
  reason: string;
  badge: "Free" | "Plus" | "Beta" | "Admin" | "Bald";
};

const betaSources = ["beta_test", "founder", "manual", "friend_bonus", "promo"];

export const isBetaEntitlement = (entitlement: Pick<GradeGlowEntitlement, "plan" | "premiumSource">) =>
  entitlement.plan === "admin" || betaSources.includes(entitlement.premiumSource);

export const getFeatureAccess = (
  featureId: GradeGlowFeatureGateId,
  entitlement: Pick<GradeGlowEntitlement, "plan" | "premiumSource">,
  limits: PlanLimits = getPlanLimits(entitlement.plan as UserPlan),
): FeatureAccessResult => {
  const isPremium = isPremiumPlan(entitlement.plan as UserPlan);
  const isBeta = isBetaEntitlement(entitlement);
  const isAdmin = entitlement.plan === "admin";
  const planLabel = planLabels[entitlement.plan as UserPlan] ?? "Free";

  switch (featureId) {
    case "modulesCore":
    case "examsCore":
    case "basicTimer":
    case "studyCircleBasic":
      return { allowed: true, label: "Free enthalten", reason: "Dieses Kernfeature bleibt in GradeGlow Free nutzbar.", badge: "Free" };
    case "premiumThemes":
      return { allowed: limits.premiumThemes, label: limits.premiumThemes ? `${planLabel} aktiv` : "GradeGlow Plus", reason: limits.premiumThemes ? "Premium-Themes sind für diesen Account aktiv." : "Premium-Themes sind für GradeGlow Plus vorbereitet.", badge: limits.premiumThemes ? (isBeta ? "Beta" : "Plus") : "Plus" };
    case "appIconCosmetics":
    case "advancedInsights":
    case "studyCircleAdvanced":
    case "exportBackup":
      return { allowed: isPremium || isBeta, label: isPremium || isBeta ? `${planLabel} aktiv` : "GradeGlow Plus", reason: isPremium || isBeta ? "Dieses Plus-Feature ist für deinen Account freigeschaltet." : "Dieses Feature bleibt sichtbar, wird später aber als Plus-Vorteil vermarktet.", badge: isPremium || isBeta ? (isBeta ? "Beta" : "Plus") : "Plus" };
    case "diagnostics":
    case "launchCenter":
      return { allowed: isBeta || isAdmin, label: isBeta || isAdmin ? "Beta-Werkzeug" : "Beta intern", reason: isBeta || isAdmin ? "Beta-/Admin-Werkzeuge sind für diesen Account sichtbar." : "Dieses Werkzeug ist nur für Beta-Betrieb und interne Tests gedacht.", badge: isAdmin ? "Admin" : "Beta" };
    case "adminConsole":
      return { allowed: isAdmin, label: isAdmin ? "Admin aktiv" : "Admin intern", reason: isAdmin ? "Admin-Konsole ist freigeschaltet." : "Nur Admins können diese Konsole öffnen.", badge: "Admin" };
    case "futureAi":
      return { allowed: false, label: "Noch nicht aktiv", reason: "KI-Funktionen sind nur vorbereitet und noch nicht Bestandteil der Beta.", badge: "Bald" };
    default:
      return { allowed: false, label: "Nicht definiert", reason: "Dieses Feature hat noch keine Freigabe-Regel.", badge: "Bald" };
  }
};

export const premiumBoundaryRows: Array<{
  featureId: GradeGlowFeatureGateId;
  title: string;
  free: string;
  plus: string;
  beta: string;
}> = [
  { featureId: "modulesCore", title: "Module, ECTS und Noten", free: "Basis mit fairen Limits", plus: "Unbegrenzt", beta: "Unbegrenzt" },
  { featureId: "examsCore", title: "Prüfungen und Lernplan", free: "Basis mit Limit", plus: "Unbegrenzt", beta: "Unbegrenzt" },
  { featureId: "basicTimer", title: "Fokus-Timer", free: "Enthalten", plus: "Enthalten", beta: "Enthalten" },
  { featureId: "studyCircleBasic", title: "Study Circle Basic", free: "Freunde mit Limit", plus: "Mehr Freunde", beta: "Mehr Freunde" },
  { featureId: "studyCircleAdvanced", title: "Circle Wochenziele & Mitglieder-Insights", free: "Vorschau", plus: "Plus-Vorteil", beta: "Freigeschaltet" },
  { featureId: "premiumThemes", title: "Premium Themes & Akzent-Look", free: "Basisdesign", plus: "Alle Looks", beta: "Alle Looks" },
  { featureId: "appIconCosmetics", title: "App-Icon & Profil-Cosmetics", free: "Basis", plus: "Plus-Vorteil", beta: "Freigeschaltet" },
  { featureId: "exportBackup", title: "Export & Backup", free: "sichtbar vorbereitet", plus: "Plus-Kandidat", beta: "Freigeschaltet" },
  { featureId: "diagnostics", title: "Diagnostics & Button-Audit", free: "nicht sichtbar", plus: "nicht sichtbar", beta: "Beta/Admin" },
  { featureId: "launchCenter", title: "Launch Center", free: "nicht sichtbar", plus: "nicht sichtbar", beta: "Beta/Admin" },
  { featureId: "futureAi", title: "Spätere KI-Funktionen", free: "nicht aktiv", plus: "mögliches Plus", beta: "noch nicht live" },
];
