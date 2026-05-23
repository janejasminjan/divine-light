/* ═══════════════════════════════════════════════════════════════
   Qiyam — E-Reader Display Profiles
   Perceptual colour math (OKLCH) for four reading surface modes:
     kobo   · Kobo Clara ComfortLight PRO (front-lit, warm ramp)
     boox   · Onyx BOOX dual white + amber front-light channels
     kindle · Kindle App software themes (White / Sepia / Black)
     paper  · Passive reflective e-ink paper surface
   ═══════════════════════════════════════════════════════════════ */

/* ── OKLCH math helpers ──────────────────────────────────────── */
export const clamp = (v: number, lo = 0, hi = 1): number =>
  Math.max(lo, Math.min(hi, v));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * clamp(t);

const pct = (L: number): string =>
  `${(clamp(L) * 100).toFixed(2)}%`;

const chr = (C: number): string =>
  clamp(C, 0, 0.4).toFixed(4);

const hue = (H: number): string => H.toFixed(1);

/** Format an OKLCH CSS color string */
export const ok = (L: number, C: number, H: number): string =>
  `oklch(${pct(L)} ${chr(C)} ${hue(H)})`;

/** Interpolate two OKLCH triplets */
type Triplet = readonly [number, number, number]; // [L, C, H]

export const mixOk = (
  [L1, C1, H1]: Triplet,
  [L2, C2, H2]: Triplet,
  t: number
): string => ok(lerp(L1, L2, t), lerp(C1, C2, t), lerp(H1, H2, t));

/* ── Profile types ───────────────────────────────────────────── */
export type ProfileId =
  | "light" | "dark"
  | "kobo"  | "boox" | "kindle" | "paper";

export type KoboSettings = {
  brightness: number; // 0–100  (dim → full-bright front-light)
  warmth:     number; // 0–100  (cool daylight → candlelight)
};

export type BooxSettings = {
  whiteChannel: number; // 0–100 (white LED contribution)
  amberChannel: number; // 0–100 (amber LED contribution)
};

export type KindleSubTheme = "white" | "sepia" | "black";

export type KindleSettings = {
  subTheme:      KindleSubTheme;
  sepiaIntensity: number; // 0–100  (mild → deep sepia tint)
};

export type PaperSettings = {
  contrast: number; // 0–100 (light ink → deep charcoal)
};

export type ProfileSettings = {
  kobo:   KoboSettings;
  boox:   BooxSettings;
  kindle: KindleSettings;
  paper:  PaperSettings;
};

export const DEFAULT_SETTINGS: ProfileSettings = {
  kobo:   { brightness: 70, warmth: 35 },
  boox:   { whiteChannel: 60, amberChannel: 40 },
  kindle: { subTheme: "white", sepiaIntensity: 50 },
  paper:  { contrast: 65 },
};

/* ── Perceptual colour anchors ───────────────────────────────── */

// Kobo ComfortLight PRO — front-lit warm ramp
const K_COOL  = [0.965, 0.010, 90.0] as const; // cool daylight
const K_WARM  = [0.820, 0.058, 63.0] as const; // candlelight
const K_INK   = [0.220, 0.010, 65.0] as const; // warm dark ink

// Onyx BOOX — dual LED channels
const B_WHITE = [0.975, 0.005, 92.0] as const; // white LED
const B_AMBER = [0.820, 0.058, 67.0] as const; // amber LED
const B_INK   = [0.180, 0.010, 68.0] as const; // near-black ink

// Kindle — software themes
const KL_WH   = [0.988, 0.002, 90.0] as const; // White bg
const KL_SP_L = [0.940, 0.018, 82.0] as const; // Sepia mild
const KL_SP_H = [0.900, 0.036, 76.0] as const; // Sepia deep
const KL_BK   = [0.092, 0.005, 260. ] as const; // Black bg
const KL_TW   = [0.085, 0.003, 260. ] as const; // text / White
const KL_TS   = [0.155, 0.014, 62.0] as const; // text / Sepia
const KL_TB   = [0.880, 0.006, 82.0] as const; // text / Black

// Passive paper — reflective matte surface
const PP_BG   = [0.910, 0.008, 85.0] as const; // off-white matte
const PP_TL   = [0.360, 0.006, 72.0] as const; // low-contrast text
const PP_TH   = [0.180, 0.010, 68.0] as const; // high-contrast text

/* ── CSS variable dict type ──────────────────────────────────── */
export type CSSVarDict = Record<string, string>;

/* ── Shared surface builder ──────────────────────────────────── */
function surface(
  bgL: number, bgC: number, bgH: number,
  fgL: number, fgC: number, fgH: number,
): CSSVarDict {
  const bL = clamp(bgL); const bC = bgC; const bH = bgH;
  const fL = fgL;        const fC = fgC; const fH = fgH;

  const cardL = clamp(bL + 0.012, 0, 0.988);
  const sbL   = clamp(bL - 0.022);
  const muL   = clamp(bL - 0.050);
  const bdL   = clamp(bL - 0.090);
  const muF   = clamp(fL + 0.240, 0, 0.92);

  return {
    "--background":           ok(bL,   bC,        bH),
    "--foreground":           ok(fL,   fC,        fH),
    "--card":                 ok(cardL, bC * 0.85, bH),
    "--card-foreground":      ok(fL,   fC,        fH),
    "--popover":              ok(cardL, bC * 0.85, bH),
    "--popover-foreground":   ok(fL,   fC,        fH),
    "--muted":                ok(muL,  bC * 0.60, bH),
    "--muted-foreground":     ok(muF,  fC * 0.70, fH),
    "--border":               ok(bdL,  bC * 0.50, bH),
    "--input":                ok(bdL,  bC * 0.50, bH),
    "--sidebar":              ok(sbL,  bC * 0.90, bH),
    "--sidebar-foreground":   ok(fL,   fC,        fH),
    "--sidebar-border":       ok(clamp(sbL - 0.040), bC * 0.50, bH),
  };
}

/* ── Profile colour computations ─────────────────────────────── */

/**
 * Kobo Clara ComfortLight PRO
 * Front-lit simulation: warmth ramp (cool→candlelight) × brightness scale.
 * No LCD glow — background stays paper-like, never white or saturated.
 */
export function computeKoboVars(s: KoboSettings): CSSVarDict {
  const w = s.warmth    / 100;
  const b = s.brightness / 100;

  const bgL_warm = lerp(K_COOL[0], K_WARM[0], w);
  const bgL      = lerp(bgL_warm * 0.82, bgL_warm, b); // dim → full
  const bgC      = lerp(K_COOL[1], K_WARM[1], w);
  const bgH      = lerp(K_COOL[2], K_WARM[2], w);
  const fgC      = lerp(K_INK[1], 0.018, w * 0.6);

  return surface(bgL, bgC, bgH, K_INK[0], fgC, K_INK[2]);
}

/**
 * Onyx BOOX — split white + amber front-light channels.
 * Two independent LED contributions; blended perceptually.
 * Stays paper-like across all mixes — never LCD-glow appearance.
 */
export function computeBooxVars(s: BooxSettings): CSSVarDict {
  const w   = s.whiteChannel / 100;
  const a   = s.amberChannel  / 100;
  const tot = w + a + 1e-6;

  const bgL = clamp(w * B_WHITE[0] + a * B_AMBER[0], 0.12, 0.988);
  const bgC = (a / tot) * 0.054;
  const bgH = (w * B_WHITE[2] + a * B_AMBER[2]) / tot;

  return surface(bgL, bgC, bgH, B_INK[0], B_INK[1], B_INK[2]);
}

/**
 * Kindle App — pure software theme simulation (no hardware LED).
 * Three sub-themes: White / Sepia / Black.
 * Sepia intensity is a continuous control over tint depth.
 */
export function computeKindleVars(s: KindleSettings): CSSVarDict {
  const { subTheme, sepiaIntensity } = s;

  if (subTheme === "white") {
    return surface(KL_WH[0], KL_WH[1], KL_WH[2], KL_TW[0], KL_TW[1], KL_TW[2]);
  }
  if (subTheme === "black") {
    return surface(KL_BK[0], KL_BK[1], KL_BK[2], KL_TB[0], KL_TB[1], KL_TB[2]);
  }
  // sepia — interpolate mild → deep based on intensity
  const t   = sepiaIntensity / 100;
  const bgL = lerp(KL_SP_L[0], KL_SP_H[0], t);
  const bgC = lerp(KL_SP_L[1], KL_SP_H[1], t);
  const bgH = lerp(KL_SP_L[2], KL_SP_H[2], t);
  return surface(bgL, bgC, bgH, KL_TS[0], KL_TS[1], KL_TS[2]);
}

/**
 * Passive reflective paper — e-ink matte surface simulation.
 * No emitted-light glow; ambient-light-first aesthetic.
 * Contrast controls text ink depth; surface is fixed matte off-white.
 */
export function computePaperVars(s: PaperSettings): CSSVarDict {
  const t   = s.contrast / 100;
  const fgL = lerp(PP_TL[0], PP_TH[0], t);
  const fgC = lerp(PP_TL[1], PP_TH[1], t);
  const fgH = lerp(PP_TL[2], PP_TH[2], t);
  return surface(PP_BG[0], PP_BG[1], PP_BG[2], fgL, fgC, fgH);
}

/* ── Preview colour helper ───────────────────────────────────── */
export type PreviewColors = {
  bg:     string;
  fg:     string;
  fg2:    string;
  border: string;
  sidebar: string;
};

/** Returns inline-style colours for a mini preview card (no global state) */
export function getPreviewColors(
  id: "kobo" | "boox" | "kindle" | "paper",
  settings: ProfileSettings,
): PreviewColors {
  let vars: CSSVarDict;
  if      (id === "kobo")   vars = computeKoboVars(settings.kobo);
  else if (id === "boox")   vars = computeBooxVars(settings.boox);
  else if (id === "kindle") vars = computeKindleVars(settings.kindle);
  else                      vars = computePaperVars(settings.paper);

  return {
    bg:      vars["--background"]       ?? "oklch(90% 0.02 80)",
    fg:      vars["--foreground"]       ?? "oklch(22% 0.01 65)",
    fg2:     vars["--muted-foreground"] ?? "oklch(46% 0.01 65)",
    border:  vars["--border"]           ?? "oklch(80% 0.01 80)",
    sidebar: vars["--sidebar"]          ?? "oklch(87% 0.02 80)",
  };
}

/** Check that a profile's bg/fg combination meets WCAG AA contrast (4.5:1).
 *  OKLCH L is not linear luminance; use it only as a rough check. */
export function validateContrast(vars: CSSVarDict): boolean {
  // Rough heuristic: |bg_L − fg_L| should exceed 0.55
  const bgStr = vars["--background"] ?? "";
  const fgStr = vars["--foreground"] ?? "";
  const bgMatch = bgStr.match(/oklch\((\d+\.?\d*)%/);
  const fgMatch = fgStr.match(/oklch\((\d+\.?\d*)%/);
  if (!bgMatch || !fgMatch) return true; // can't check
  const diff = Math.abs(parseFloat(bgMatch[1]) - parseFloat(fgMatch[1]));
  return diff > 50; // > 50% lightness difference
}
