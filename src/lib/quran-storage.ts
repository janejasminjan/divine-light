import { useEffect, useState } from "react";
import type { ReciterEdition, SupportedLanguage } from "./quran-api";

const STORAGE_KEYS = {
  bookmarks: "quran.bookmarks.v1",
  readingProgress: "quran.readingProgress.v1",
  settings: "quran.settings.v1",
  memorization: "quran.memorization.v1",
} as const;

export interface BookmarkItem {
  surahNumber: number;
  ayahNumber: number;
  surahEnglishName: string;
  ayahText: string;
  createdAt: string;
}

export interface ReadingProgress {
  surahNumber: number;
  ayahNumber: number;
  updatedAt: string;
}

export interface UserSettings {
  language: SupportedLanguage;
  reciter: ReciterEdition;
  showTranslation: boolean;
  showTransliteration: boolean;
}

export interface MemorizationProgress {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  lastCompletedAyah: number;
  updatedAt: string;
}

const defaultSettings: UserSettings = {
  language: "en.asad",
  reciter: "ar.alafasy",
  showTranslation: true,
  showTransliteration: true,
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function useLocalStorageState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(() => readStorage(key, fallback));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}

export function useBookmarks() {
  return useLocalStorageState<BookmarkItem[]>(STORAGE_KEYS.bookmarks, []);
}

export function useReadingProgress() {
  return useLocalStorageState<ReadingProgress | null>(STORAGE_KEYS.readingProgress, null);
}

export function useUserSettings() {
  return useLocalStorageState<UserSettings>(STORAGE_KEYS.settings, defaultSettings);
}

export function useMemorizationProgress() {
  return useLocalStorageState<MemorizationProgress | null>(STORAGE_KEYS.memorization, null);
}

export function isBookmarked(
  bookmarks: BookmarkItem[],
  surahNumber: number,
  ayahNumber: number,
) {
  return bookmarks.some((bookmark) => {
    return bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber;
  });
}