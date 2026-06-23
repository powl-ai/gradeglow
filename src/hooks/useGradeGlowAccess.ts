"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { DEFAULT_USER_PLAN, getPlanLimits, normalizeEntitlement } from "../lib/gradeglowAccess";
import type { AppUser, GradeGlowEntitlement } from "../types";

const ENTITLEMENTS_COLLECTION = "entitlements";

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

    const entitlementRef = doc(db, ENTITLEMENTS_COLLECTION, user.uid);
    const unsubscribe = onSnapshot(
      entitlementRef,
      (snapshot) => {
        const nextEntitlement = snapshot.exists()
          ? normalizeEntitlement(snapshot.data())
          : defaultEntitlement;

        setEntitlement(nextEntitlement);
        setStatus("cloud-ready");
        setMessage(
          nextEntitlement.plan === "free"
            ? "Free Plan aktiv"
            : `${nextEntitlement.plan === "premium" ? "Premium" : nextEntitlement.plan} aktiv`,
        );
      },
      () => {
        setEntitlement(defaultEntitlement);
        setStatus("cloud-error");
        setMessage("Plan konnte nicht geladen werden · Free Fallback aktiv");
      },
    );

    return () => unsubscribe();
  }, [user.provider, user.uid]);

  const limits = useMemo(() => getPlanLimits(entitlement.plan), [entitlement.plan]);

  return {
    entitlement,
    limits,
    accessSyncStatus: status,
    accessSyncMessage: message,
  };
}
