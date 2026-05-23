/* ── Tajweed rule registry ────────────────────────────────────────────────
   Single source of truth for rule metadata, CSS class mappings, and themes.
   ──────────────────────────────────────────────────────────────────────── */

export type TajweedCategory =
  | "madd" | "ghunnah" | "ikhfa" | "idgham" | "iqlab"
  | "qalqalah" | "silent" | "hamza" | "lam";

export interface TajweedRule {
  id: string;
  cssClasses: string[];        // QuranCDN <rule class="..."> variants
  name: string;
  arabicName: string;
  shortDesc: string;
  longDesc: string;
  category: TajweedCategory;
  categoryLabel: string;
  accessibilityMarker: string; // symbol for color-blind mode
}

export const TAJWEED_RULES: TajweedRule[] = [
  {
    id: "ham_wasl",
    cssClasses: ["ham_wasl"],
    name: "Hamzat al-Wasl",
    arabicName: "همزة الوصل",
    shortDesc: "Connected hamza — silent when preceded by a word",
    longDesc:
      "Hamzat al-Wasl is a hamza that is pronounced when beginning a recitation but elided (connected to the previous word's vowel) when appearing mid-sentence. It typically appears on the definite article الـ and on certain verb and noun patterns.",
    category: "hamza",
    categoryLabel: "Hamza",
    accessibilityMarker: "⊙",
  },
  {
    id: "silent",
    cssClasses: ["slnt", "silent"],
    name: "Silent Letter",
    arabicName: "حرف صامت",
    shortDesc: "Written in the Uthmani script but not recited",
    longDesc:
      "Certain letters appear in the Quranic Uthmani orthography by convention of the original scribes but carry no phonetic value during recitation. They are part of the written text only.",
    category: "silent",
    categoryLabel: "Silent",
    accessibilityMarker: "∅",
  },
  {
    id: "lam_shamsiyyah",
    cssClasses: ["lam_shamsiyyah", "laam_shamsiyyah", "laam_shamsiyah"],
    name: "Lam Shamsiyyah",
    arabicName: "لام شمسية",
    shortDesc: "Sun-letter lam — assimilated into the following letter",
    longDesc:
      "When the definite article الـ precedes any of the 14 'sun letters' (حروف شمسية), the lam is assimilated into that letter. The letter is doubled with a shaddah and the lam is not separately audible.",
    category: "lam",
    categoryLabel: "Lam",
    accessibilityMarker: "◌",
  },
  {
    id: "madda_normal",
    cssClasses: ["madda_normal"],
    name: "Natural Madd",
    arabicName: "مد طبيعي",
    shortDesc: "Natural elongation — 2 counts",
    longDesc:
      "Al-Madd al-Tabii is the basic elongation of a long vowel letter (alef ا, waw و, ya ي) when not followed by a hamza or sukoon in the same word. It is held for exactly 2 counts (harakaat) and is the foundation of all other madd types.",
    category: "madd",
    categoryLabel: "Elongation (Madd)",
    accessibilityMarker: "—",
  },
  {
    id: "madda_permissible",
    cssClasses: ["madda_permissible"],
    name: "Permissible Madd",
    arabicName: "مد جائز منفصل",
    shortDesc: "Long vowel before hamza in the next word — 2, 4 or 6 counts",
    longDesc:
      "Al-Madd al-Munfasil (separated permissible madd) occurs when a long vowel letter is at the end of one word and a hamza begins the next word. The reciter may hold it for 2, 4 or 6 counts depending on the recitation style (riwayah).",
    category: "madd",
    categoryLabel: "Elongation (Madd)",
    accessibilityMarker: "──",
  },
  {
    id: "madda_necessary",
    cssClasses: ["madda_necessary"],
    name: "Necessary Madd",
    arabicName: "مد لازم",
    shortDesc: "Long vowel followed by permanent sukoon — 6 counts",
    longDesc:
      "Al-Madd al-Lazim occurs when a long vowel letter is immediately followed by a letter carrying a permanent sukoon (or a shaddah letter with implicit sukoon) within the same word. It must be held for 6 counts according to all qurra'.",
    category: "madd",
    categoryLabel: "Elongation (Madd)",
    accessibilityMarker: "═",
  },
  {
    id: "madda_obligatory",
    cssClasses: [
      "madda_obligatory",
      "madda_obligatory_monfasel",
      "madda_obligatory_mottasel",
    ],
    name: "Obligatory Madd",
    arabicName: "مد واجب متصل",
    shortDesc: "Long vowel before hamza in the same word — 4 or 5 counts",
    longDesc:
      "Al-Madd al-Wajib al-Muttasil occurs when a long vowel letter is immediately followed by a hamza in the same word. It must be held for 4–5 counts. Al-Madd al-Munfasil (separated) has the same colour here when obligatory in a given riwayah.",
    category: "madd",
    categoryLabel: "Elongation (Madd)",
    accessibilityMarker: "≡",
  },
  {
    id: "qalqalah",
    cssClasses: ["qalaqah", "qalaqala", "qlql"],
    name: "Qalqalah",
    arabicName: "قلقلة",
    shortDesc: "Echo/bounce on ق ط ب ج د when carrying sukoon",
    longDesc:
      "Qalqalah is a slight echoing or bouncing vibration produced on any of the five qalqalah letters (ق ط ب ج د) when they carry a sukoon. The echo is subtle in the middle of a word and more pronounced at a stopping point.",
    category: "qalqalah",
    categoryLabel: "Qalqalah (Echo)",
    accessibilityMarker: "◆",
  },
  {
    id: "ghunnah",
    cssClasses: ["ghunnah", "ghn", "ghnn_mshd"],
    name: "Ghunnah",
    arabicName: "غنة",
    shortDesc: "Nasalization on shaddah nun or meem — 2 counts",
    longDesc:
      "Ghunnah is a nasal resonance produced through the nose. It applies to nun (ن) and meem (م) when they carry a shaddah, and must be held for 2 counts. The sound emanates from the nasal passage, not the mouth.",
    category: "ghunnah",
    categoryLabel: "Ghunnah (Nasalization)",
    accessibilityMarker: "~",
  },
  {
    id: "ikhfa",
    cssClasses: ["ikhfa", "ikhf", "ikhfa_shafawi", "ikhf_shfw", "ikhf_meem", "ikhafa"],
    name: "Ikhfa",
    arabicName: "إخفاء",
    shortDesc: "Concealment — between clear pronunciation and full merging",
    longDesc:
      "Ikhfa (concealment) occurs when a noon saakinah or tanween is followed by any of the 15 ikhfa letters. The noon is neither fully pronounced (izhar) nor fully merged (idgham); it is held in a concealed nasal state for 2 counts. Ikhfa Shafawi applies the same principle when a meem saakinah precedes a ba (ب).",
    category: "ikhfa",
    categoryLabel: "Ikhfa (Concealment)",
    accessibilityMarker: "≈",
  },
  {
    id: "idgham_ghunnah",
    cssClasses: [
      "idgham_w_ghunnah",
      "idghm_w_ghunna",
      "idgham_with_ghunnah",
      "idgham_ghunnah",
    ],
    name: "Idgham with Ghunnah",
    arabicName: "إدغام بغنة",
    shortDesc: "Merging into ي ن م و with nasalization — 2 counts",
    longDesc:
      "When a noon saakinah or tanween is followed by ي ن م و, the noon is merged into that letter and a ghunnah of 2 counts is applied. The noon disappears into the following letter, which is said with nasal resonance.",
    category: "idgham",
    categoryLabel: "Idgham (Merging)",
    accessibilityMarker: "⊕",
  },
  {
    id: "idgham_no_ghunnah",
    cssClasses: [
      "idgham_wo_ghunnah",
      "idghm_wO_ghunna",
      "idgham_without_ghunnah",
    ],
    name: "Idgham without Ghunnah",
    arabicName: "إدغام بلا غنة",
    shortDesc: "Complete merging into ل ر without nasalization",
    longDesc:
      "When a noon saakinah or tanween is followed by ل or ر, the noon is completely merged into that letter with no ghunnah. The noon simply disappears and the lam or ra is said normally.",
    category: "idgham",
    categoryLabel: "Idgham (Merging)",
    accessibilityMarker: "⊗",
  },
  {
    id: "idgham_shafawi",
    cssClasses: ["idgham_shafawi", "idghm_shfwy"],
    name: "Idgham Shafawi",
    arabicName: "إدغام شفوي",
    shortDesc: "Labial merging: meem saakinah before meem",
    longDesc:
      "Idgham Shafawi (labial merging) occurs when a meem saakinah is followed by another meem. The first meem is merged into the second with a ghunnah of 2 counts. Both lips come together as in normal meem articulation.",
    category: "idgham",
    categoryLabel: "Idgham (Merging)",
    accessibilityMarker: "⊞",
  },
  {
    id: "idgham_meem_meem",
    cssClasses: ["idghm_meem_meem"],
    name: "Idgham Meem-Meem",
    arabicName: "إدغام ميم في ميم",
    shortDesc: "Meem merging into meem with ghunnah",
    longDesc:
      "A variant labial assimilation case where a meem with sukoon merges into the following meem. Held with ghunnah for 2 counts.",
    category: "idgham",
    categoryLabel: "Idgham (Merging)",
    accessibilityMarker: "⊠",
  },
  {
    id: "iqlab",
    cssClasses: ["iqlab", "iqlb"],
    name: "Iqlab",
    arabicName: "إقلاب",
    shortDesc: "Noon converts to meem sound before ب",
    longDesc:
      "Iqlab (conversion) occurs when a noon saakinah or tanween is followed by the letter ba (ب). The noon sound is converted to a meem sound and a ghunnah of 2 counts is applied. A small meem (م) is often written above the noon as a scribal indicator.",
    category: "iqlab",
    categoryLabel: "Iqlab (Conversion)",
    accessibilityMarker: "⇄",
  },
];

/* ── Fast lookup maps ──────────────────────────────────────────────────── */
export const RULE_BY_ID  = new Map<string, TajweedRule>();
export const RULE_BY_CSS = new Map<string, TajweedRule>();

for (const rule of TAJWEED_RULES) {
  RULE_BY_ID.set(rule.id, rule);
  for (const cls of rule.cssClasses) RULE_BY_CSS.set(cls, rule);
}

/** Walk up from a clicked element to find the nearest tj-* rule. */
export function getRuleFromElement(el: HTMLElement | null, limit: HTMLElement | null): TajweedRule | null {
  let cur = el;
  while (cur && cur !== limit) {
    for (const cls of Array.from(cur.classList)) {
      if (cls.startsWith("tj-")) {
        const rule = RULE_BY_CSS.get(cls.slice(3));
        if (rule) return rule;
      }
    }
    cur = cur.parentElement;
  }
  return null;
}

/* ── Themes ────────────────────────────────────────────────────────────── */
export type TajweedThemeId = "vivid" | "soft" | "hc" | "cb";

export interface TajweedTheme {
  id: TajweedThemeId;
  label: string;
  desc: string;
  previewColors: string[]; // 4 representative swatches for UI preview
}

export const TAJWEED_THEMES: TajweedTheme[] = [
  {
    id: "vivid",
    label: "Classic Vivid",
    desc: "Traditional mushaf colors — widely recognized",
    previewColors: ["#537FFF", "#DD0008", "#169200", "#D500B7"],
  },
  {
    id: "soft",
    label: "Soft Reading",
    desc: "Muted tones — easier for long sessions",
    previewColors: ["#7aa3d4", "#c06060", "#4d9960", "#a060a0"],
  },
  {
    id: "hc",
    label: "High Contrast",
    desc: "Bold colors for maximum legibility",
    previewColors: ["#0044FF", "#CC0000", "#007700", "#AA0099"],
  },
  {
    id: "cb",
    label: "Color-Blind Safe",
    desc: "Shapes and underlines — not color alone",
    previewColors: ["#0066CC", "#AA2200", "#006600", "#660066"],
  },
];
