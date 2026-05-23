import { useState, useEffect, useCallback } from "react";
import {
  type ProfileId,
  type ProfileSettings,
  type CSSVarDict,
  DEFAULT_SETTINGS,
  computeKoboVars,
  computeBooxVars,
  computeKindleVars,
  computePaperVars,
} from "@/lib/display-profiles";

/* ── Storage keys ────────────────────────────────────────────── */
const PROFILE_KEY  = "qiyam_profile";
const SETTINGS_KEY = "qiyam_profile_settings";

/* ── CSS class management ────────────────────────────────────── */
const ALL_CLASSES: string[] = ["dark", "kobo", "boox", "kindle", "paper"];

/** CSS vars that are dynamically overridden by the active profile */
const DYNAMIC_VARS = [
  "--background", "--foreground",
  "--card", "--card-foreground",
  "--popover", "--popover-foreground",
  "--muted", "--muted-foreground",
  "--border", "--input",
  "--sidebar", "--sidebar-foreground", "--sidebar-border",
] as const;

function clearDynamicVars(): void {
  const el = document.documentElement;
  for (const v of DYNAMIC_VARS) el.style.removeProperty(v);
}

function applyVars(vars: CSSVarDict): void {
  const el = document.documentElement;
  for (const v of DYNAMIC_VARS) {
    if (vars[v]) el.style.setProperty(v, vars[v]);
  }
}

function setProfileClass(id: ProfileId): void {
  const cl = document.documentElement.classList;
  cl.remove(...ALL_CLASSES);
  if (id !== "light") cl.add(id);
}

function computeProfileVars(
  id: ProfileId,
  settings: ProfileSettings,
): CSSVarDict | null {
  if (id === "kobo")   return computeKoboVars(settings.kobo);
  if (id === "boox")   return computeBooxVars(settings.boox);
  if (id === "kindle") return computeKindleVars(settings.kindle);
  if (id === "paper")  return computePaperVars(settings.paper);
  return null; // light / dark — handled entirely by CSS class
}

/* ── Profile ID init (with old-key migration) ────────────────── */
function loadProfileId(): ProfileId {
  const VALID: ProfileId[] = ["light", "dark", "kobo", "boox", "kindle", "paper"];

  const stored = localStorage.getItem(PROFILE_KEY) as ProfileId | null;
  if (stored && VALID.includes(stored)) return stored;

  // Migrate from legacy qiyam_theme key
  const OLD_MAP: Record<string, ProfileId> = {
    light: "light", dark: "dark", kobo: "kobo",
    onyx: "boox", kindle: "kindle", daylight: "paper",
  };
  const old = localStorage.getItem("qiyam_theme");
  if (old && OLD_MAP[old]) return OLD_MAP[old];

  return "light";
}

function loadSettings(): ProfileSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
      return {
        kobo:   { ...DEFAULT_SETTINGS.kobo,   ...(parsed.kobo   ?? {}) },
        boox:   { ...DEFAULT_SETTINGS.boox,   ...(parsed.boox   ?? {}) },
        kindle: { ...DEFAULT_SETTINGS.kindle, ...(parsed.kindle ?? {}) },
        paper:  { ...DEFAULT_SETTINGS.paper,  ...(parsed.paper  ?? {}) },
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

/* ══════════════════════════════════════════════════════════════ */
/*  Hook                                                          */
/* ══════════════════════════════════════════════════════════════ */
export function useReadingProfile() {
  const [profileId, setProfileIdRaw] = useState<ProfileId>(loadProfileId);
  const [settings, setSettings]      = useState<ProfileSettings>(loadSettings);

  /* Apply CSS on every profile/settings change */
  useEffect(() => {
    clearDynamicVars();
    setProfileClass(profileId);
    const vars = computeProfileVars(profileId, settings);
    if (vars) applyVars(vars);
  }, [profileId, settings]);

  /* ── Setters ─────────────────────────────────────────────── */
  const setProfileId = useCallback((id: ProfileId) => {
    localStorage.setItem(PROFILE_KEY, id);
    setProfileIdRaw(id);
  }, []);

  const updateSettings = useCallback(
    <K extends keyof ProfileSettings>(
      profile: K,
      patch: Partial<ProfileSettings[K]>,
    ): void => {
      setSettings(prev => {
        const next: ProfileSettings = {
          ...prev,
          [profile]: { ...prev[profile], ...patch },
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const resetProfile = useCallback((id: keyof ProfileSettings): void => {
    setSettings(prev => {
      const next: ProfileSettings = { ...prev, [id]: DEFAULT_SETTINGS[id] };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isEReader = (["kobo", "boox", "kindle", "paper"] as ProfileId[])
    .includes(profileId);

  return {
    profileId,
    setProfileId,
    settings,
    updateSettings,
    resetProfile,
    isEReader,
  };
}

/* ── Flash prevention: apply class immediately (before React) ── */
(function initProfile() {
  const id = loadProfileId();
  if (id !== "light") document.documentElement.classList.add(id);
})();
