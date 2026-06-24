"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { DEFAULT_USER_PLAN, getPlanLimits, mergeEntitlementSources } from "../lib/gradeglowAccess";
import type { AppUser, GradeGlowEntitlement } from "../types";

const ENTITLEMENTS_COLLECTION = "entitlements";
const USERS_COLLECTION = "users";

export type AccessSyncStatus = "local" | "cloud-loading" | "cloud-ready" | "cloud-error";

const defaultEntitlement: GradeGlowEntitlement = {
  plan: DEFAULT_USER_PLAN,
  storedPlan: DEFAULT_USER_PLAN,
  premiumUntil: "",
  premiumSource: "default",
  note: "",
  updatedAtIso: "",
  isManuallyGranted: false,
};

const getAccessMessage = (entitlement: GradeGlowEntitlement) => {
  if (entitlement.plan === "free") return "Free Plan aktiv";

  const planLabel = entitlement.plan === "premium" ? "Premium" : entitlement.plan;
  const untilSuffix = entitlement.premiumUntil ? ` bis ${entitlement.premiumUntil}` : "";
  const sourceSuffix = entitlement.premiumSource === "beta_test" ? " · Beta" : "";

  return `${planLabel} aktiv${untilSuffix}${sourceSuffix}`;
};

export function useGradeGlowAccess(user: AppUser) {
  const [entitlement, setEntitlement] = useState<GradeGlowEntitlement>(defaultEntitlement);
  const [status, setStatus] = useState<AccessSyncStatus>("local");
  const [message, setMessage] = useState("Free Plan aktiv");

  useEffect(() => {
    if (user.provider !== "firebase" || !isFirebaseConfigured || !db) {
      setEntitlement(defaultEntitlement);
      setStatus("local");
      setMessage("Free Plan aktiv · lokaler Account");
      return undefined;
    }

    setStatus("cloud-loading");
    setMessage("Plan wird geladen…");

    let userDocumentData: Record<string, unknown> | null | undefined = undefined;
    let entitlementDocumentData: Record<string, unknown> | null | undefined = undefined;
    let hasAnyListenerError = false;

    const applyEntitlement = () => {
      const hasReceivedAtLeastOneSnapshot =
        userDocumentData !== undefined || entitlementDocumentData !== undefined;

      if (!hasReceivedAtLeastOneSnapshot) return;

      const nextEntitlement = mergeEntitlementSources(
        userDocumentData ?? null,
        entitlementDocumentData ?? null,
      );

      setEntitlement(nextEntitlement);
      setStatus(hasAnyListenerError && nextEntitlement.plan === "free" ? "cloud-error" : "cloud-ready");
      setMessage(getAccessMessage(nextEntitlement));
    };

    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const entitlementRef = doc(db, ENTITLEMENTS_COLLECTION, user.uid);

    const unsubscribeUser = onSnapshot(
      userRef,
      (snapshot) => {
        userDocumentData = snapshot.exists() ? snapshot.data() : null;
        applyEntitlement();
      },
      () => {
        hasAnyListenerError = true;
        userDocumentData = null;
        applyEntitlement();
      },
    );

    const unsubscribeEntitlement = onSnapshot(
      entitlementRef,
      (snapshot) => {
        entitlementDocumentData = snapshot.exists() ? snapshot.data() : null;
        applyEntitlement();
      },
      () => {
        hasAnyListenerError = true;
        entitlementDocumentData = null;
        applyEntitlement();
      },
    );

    return () => {
      unsubscribeUser();
      unsubscribeEntitlement();
    };
  }, [user.provider, user.uid]);

  const limits = useMemo(() => getPlanLimits(entitlement.plan), [entitlement.plan]);

  return {
    entitlement,
    limits,
    accessSyncStatus: status,
    accessSyncMessage: message,
  };
}
