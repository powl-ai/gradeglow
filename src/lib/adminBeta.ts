import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { normalizeEntitlement } from "./gradeglowAccess";
import type { GradeGlowEntitlement, UserPlan } from "../types";

export type AdminEntitlementRecord = GradeGlowEntitlement & {
  uid: string;
};

export type AdminEntitlementInput = {
  uid: string;
  plan: UserPlan;
  premiumUntil: string;
  premiumSource: string;
  premiumStatus: string;
  note: string;
  betaTester: boolean;
};

const cleanUid = (uid: string) => uid.trim();
const isNonExpiringPlan = (plan: UserPlan) => plan === "lifetime" || plan === "admin" || plan === "free";

export async function getAdminEntitlements() {
  if (!db || !isFirebaseConfigured) return [];

  const snapshot = await getDocs(collection(db, "entitlements"));
  return snapshot.docs
    .map((item) => ({ uid: item.id, ...normalizeEntitlement(item.data()) }))
    .sort((a, b) => (b.updatedAtIso || "").localeCompare(a.updatedAtIso || "")) as AdminEntitlementRecord[];
}

export async function grantEntitlementForAdmin(input: AdminEntitlementInput) {
  if (!db || !isFirebaseConfigured) throw new Error("firebase-not-configured");

  const uid = cleanUid(input.uid);
  if (!uid) throw new Error("uid-missing");

  const nowIso = new Date().toISOString();
  await setDoc(
    doc(db, "entitlements", uid),
    {
      plan: input.plan,
      premiumUntil: isNonExpiringPlan(input.plan) ? "" : input.premiumUntil.trim(),
      premiumSource: input.premiumSource.trim() || (input.betaTester ? "beta_test" : "manual"),
      premiumStatus: input.premiumStatus.trim() || "active",
      note: input.note.trim(),
      betaTester: input.betaTester,
      updatedAtIso: nowIso,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function revokeEntitlementForAdmin(uid: string) {
  if (!db || !isFirebaseConfigured) throw new Error("firebase-not-configured");
  const cleanedUid = cleanUid(uid);
  if (!cleanedUid) throw new Error("uid-missing");

  await setDoc(
    doc(db, "entitlements", cleanedUid),
    {
      plan: "free",
      premiumUntil: "",
      premiumSource: "manual_revoke",
      premiumStatus: "cancelled",
      note: "Premium/Admin Zugriff manuell zurückgesetzt.",
      betaTester: false,
      updatedAtIso: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteEntitlementForAdmin(uid: string) {
  if (!db || !isFirebaseConfigured) throw new Error("firebase-not-configured");
  const cleanedUid = cleanUid(uid);
  if (!cleanedUid) throw new Error("uid-missing");
  await deleteDoc(doc(db, "entitlements", cleanedUid));
}
