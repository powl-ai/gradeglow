import { createDemoGradeGlowData } from "./demoData";
import { getUserModulesStorageKey, saveLocalModules } from "./gradeglowModules";
import { getUserExamsStorageKey, saveLocalExams } from "./gradeglowExams";
import type { AppUser, UserPlan } from "../types";

export const DEMO_UID = "guest-demo-v1";
const DEMO_SESSION_KEY = "gradeglow-guest-demo-active-v1";
const DEMO_PLAN_KEY = "gradeglow-guest-demo-plan-v1";
export const DEMO_PLAN_EVENT = "gradeglow-demo-plan-change";

export const demoUser: AppUser = {
  uid: DEMO_UID,
  displayName: "Alex",
  email: null,
  provider: "demo",
};

export const isDemoActive = () => sessionStorage.getItem(DEMO_SESSION_KEY) === "true";
export const endDemo = () => sessionStorage.removeItem(DEMO_SESSION_KEY);

export const getDemoPlan = (): UserPlan =>
  sessionStorage.getItem(DEMO_PLAN_KEY) === "premium" ? "premium" : "free";

export const setDemoPlan = (plan: "free" | "premium") => {
  sessionStorage.setItem(DEMO_PLAN_KEY, plan);
  window.dispatchEvent(new Event(DEMO_PLAN_EVENT));
};

export const startDemo = () => {
  const profileKey = `gradeglow-profile-v1-${DEMO_UID}`;
  if (!localStorage.getItem(profileKey)) {
    const { modules, exams } = createDemoGradeGlowData();
    saveLocalModules(getUserModulesStorageKey(DEMO_UID), modules);
    saveLocalExams(getUserExamsStorageKey(DEMO_UID), exams);
    localStorage.setItem(profileKey, JSON.stringify({
      displayName: "Alex",
      university: "Beispielhochschule",
      degreeProgram: "BWL",
      preferredStartMode: "demo",
      onboardingCompleted: true,
      studySharingEnabled: false,
      enabledFeatureIds: ["insights", "friends", "schedule", "planning"],
    }));
  }
  sessionStorage.setItem(DEMO_SESSION_KEY, "true");
  return demoUser;
};
