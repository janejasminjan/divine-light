const ONBOARDING_LOCAL_KEY = "qiyam_onboarding_completed";

export function isOnboardingCompletedLocally(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDING_LOCAL_KEY) === "true";
}

export function markOnboardingCompletedLocally(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_LOCAL_KEY, "true");
}