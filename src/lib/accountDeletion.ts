// Deletes a GradeGlow account with all its data. Same steps as the old app's settings
// (src/components/SettingsPage.tsx), which goes away with the old app.

import {
  EmailAuthProvider, GithubAuthProvider, GoogleAuthProvider, deleteUser,
  reauthenticateWithCredential, reauthenticateWithPopup, type User,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebase";

const providers = (user: User) => user.providerData.map((provider) => provider.providerId);

/** Does this account confirm with a password (instead of Google/GitHub)? */
export const needsPassword = () => {
  const user = auth?.currentUser;
  if (!user) return false;
  const ids = providers(user);
  return !ids.includes("google.com") && !ids.includes("github.com") && Boolean(user.email);
};

const deleteCollection = async (path: string[]) => {
  if (!db) return;
  const snapshot = await getDocs(collection(db, path.join("/")));
  if (snapshot.empty) return;
  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
};

const deleteWhere = async (path: string, field: string, value: string) => {
  if (!db) return;
  const snapshot = await getDocs(query(collection(db, path), where(field, "==", value)));
  if (snapshot.empty) return;
  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
};

const deleteStudyCircles = async (uid: string) => {
  if (!db) return;
  const firestore = db;
  const memberships = await getDocs(collection(firestore, "users", uid, "studyCircles")).catch(() => null);
  if (memberships) {
    await Promise.allSettled(memberships.docs.map((item) => deleteDoc(doc(firestore, "studyCircles", item.id, "members", uid))));
  }
  const owned = await getDocs(query(collection(firestore, "studyCircles"), where("ownerUid", "==", uid))).catch(() => null);
  for (const circle of owned?.docs ?? []) {
    const data = circle.data();
    const code = typeof data.normalizedCode === "string" ? data.normalizedCode : typeof data.circleCode === "string" ? data.circleCode : "";
    await deleteCollection(["studyCircles", circle.id, "members"]).catch(() => undefined);
    if (code) await deleteDoc(doc(firestore, "studyCircleCodes", code)).catch(() => undefined);
    await deleteDoc(circle.ref).catch(() => undefined);
  }
  await deleteCollection(["users", uid, "studyCircles"]).catch(() => undefined);
};

/** Removes everything this browser stored for the user. */
export const clearLocalData = (uid: string) => {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && (key.includes(uid) || key.startsWith("gradeglow-active-study-timer") || key.startsWith("gradeglow-neu"))) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
  try { sessionStorage.clear(); } catch { /* ignore */ }
};

export type DeleteError = "password" | "wrong-password" | "cancelled" | "recent-login" | "network" | "other";

/** Confirms the login again (Firebase requires a fresh one), then deletes data and login.
 *  Throws a DeleteError string on failure; nothing is deleted before the login is confirmed. */
export async function deleteFirebaseAccount(password: string): Promise<void> {
  const user = auth?.currentUser;
  if (!user || !db) throw "other" satisfies DeleteError;
  const firestore = db;
  const uid = user.uid;
  try {
    const ids = providers(user);
    if (ids.includes("google.com")) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await reauthenticateWithPopup(user, provider);
    } else if (ids.includes("github.com")) {
      await reauthenticateWithPopup(user, new GithubAuthProvider());
    } else if (user.email) {
      if (!password.trim()) throw "password" satisfies DeleteError;
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    }

    await deleteStudyCircles(uid);
    for (const sub of ["modules", "exams", "schedule", "friends", "notificationTokens", "notificationSettings", "notifications"]) {
      await deleteCollection(["users", uid, sub]);
    }
    await deleteWhere("feedback", "ownerUid", uid).catch(() => undefined);
    await deleteWhere("diagnostics", "ownerUid", uid).catch(() => undefined);
    await deleteWhere("studyFriendCodes", "uid", uid).catch(() => undefined);
    for (const path of [["users", uid, "gradeglow", "settings"], ["users", uid, "gradeglow", "dashboard"], ["users", uid], ["publicStudyProfiles", uid], ["studyActivityEvents", uid]]) {
      await deleteDoc(doc(firestore, path.join("/"))).catch(() => undefined);
    }
    clearLocalData(uid);
    await deleteUser(user);
  } catch (error) {
    if (typeof error === "string") throw error;
    const code = typeof error === "object" && error !== null ? String((error as { code?: unknown }).code ?? "") : "";
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") throw "wrong-password" satisfies DeleteError;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || code === "auth/popup-blocked") throw "cancelled" satisfies DeleteError;
    if (code === "auth/requires-recent-login") throw "recent-login" satisfies DeleteError;
    if (code === "auth/network-request-failed") throw "network" satisfies DeleteError;
    throw "other" satisfies DeleteError;
  }
}
