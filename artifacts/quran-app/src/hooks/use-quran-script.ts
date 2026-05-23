import { useState } from "react";

const SCRIPT_KEY = "qiyam_quran_script";

export const QURAN_SCRIPTS = [
  {
    id: "uthmani",
    label: "Uthmani / Madani",
    description: "Standard Ottoman calligraphy (Hafs an Asim)",
    region: "Middle East & worldwide",
    apiEdition: "quran-uthmani",
    fontClass: "font-arabic",
  },
  {
    id: "indopak",
    label: "Indo-Pak",
    description: "South Asian Naskh calligraphy style",
    region: "India, Pakistan, Bangladesh",
    apiEdition: "quran-indopak",
    fontClass: "font-arabic-indopak",
  },
  {
    id: "warsh",
    label: "Warsh",
    description: "North African riwayah of Nafi'",
    region: "Morocco, Algeria, West Africa",
    apiEdition: "quran-warsh-hafs",
    fontClass: "font-arabic",
  },
] as const;

export type QuranScriptId = typeof QURAN_SCRIPTS[number]["id"];
export type QuranScript = typeof QURAN_SCRIPTS[number];

export function useQuranScript() {
  const [scriptId, setScriptIdRaw] = useState<QuranScriptId>(() => {
    const stored = localStorage.getItem(SCRIPT_KEY);
    return (QURAN_SCRIPTS.find(s => s.id === stored)?.id ?? "uthmani") as QuranScriptId;
  });

  const setScriptId = (id: QuranScriptId) => {
    localStorage.setItem(SCRIPT_KEY, id);
    setScriptIdRaw(id);
  };

  const scriptInfo = QURAN_SCRIPTS.find(s => s.id === scriptId) ?? QURAN_SCRIPTS[0];

  return { scriptId, setScriptId, scriptInfo };
}
