import { useState, useCallback } from "react";

const STORAGE_KEY = "qiyam_preferred_translation";
const DEFAULT_TRANSLATION = "en.sahih";

export function useTranslationPreference() {
  const [translationKey, setTranslationKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_TRANSLATION;
    } catch {
      return DEFAULT_TRANSLATION;
    }
  });

  const setTranslationKey = useCallback((key: string) => {
    setTranslationKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {}
  }, []);

  return { translationKey, setTranslationKey };
}
