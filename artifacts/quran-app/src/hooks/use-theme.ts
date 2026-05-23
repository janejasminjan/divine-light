/**
 * Backward-compatible shim over useReadingProfile.
 * Existing import sites (`{ useTheme, type Theme }`) keep working.
 * New code should import useReadingProfile directly.
 */
export type { ProfileId as Theme } from "@/lib/display-profiles";

import { useReadingProfile } from "./use-reading-profile";

export function useTheme() {
  const ctx = useReadingProfile();
  return {
    // legacy API
    theme:      ctx.profileId,
    setTheme:   ctx.setProfileId,
    // full API (for components that want it)
    ...ctx,
  };
}
