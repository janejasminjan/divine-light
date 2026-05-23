import { queryOptions } from "@tanstack/react-query";

const API_BASE = "https://api.alquran.cloud/v1";

export type SupportedLanguage = "en.asad" | "fr.hamidullah" | "ur.jalandhry";
export type ReciterEdition = "ar.alafasy" | "ar.husary" | "ar.abdurrahmaansudais";

export interface SurahSummary {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface AyahBundle {
  numberInSurah: number;
  text: string;
  translation: string;
  transliteration: string;
  audio: string;
}

export interface SearchResultAyah {
  numberInSurah: number;
  text: string;
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Failed Quran API call: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

interface SurahListResponse {
  data: SurahSummary[];
}

interface EditionsResponse {
  data: Array<{
    ayahs: Array<{
      numberInSurah: number;
      text: string;
      audio?: string;
    }>;
  }>;
}

interface SearchResponse {
  data: {
    count: number;
    matches: Array<{
      numberInSurah: number;
      text: string;
      surah: { number: number; name: string; englishName: string };
    }>;
  };
}

export async function getSurahs(): Promise<SurahSummary[]> {
  const result = await fetchJson<SurahListResponse>("/surah");
  return result.data;
}

export async function getSurahAyahsBundle(
  surahNumber: number,
  language: SupportedLanguage,
  reciter: ReciterEdition,
): Promise<AyahBundle[]> {
  const result = await fetchJson<EditionsResponse>(
    `/surah/${surahNumber}/editions/quran-uthmani,${language},en.transliteration,${reciter}`,
  );

  const [arabicEdition, translationEdition, transliterationEdition, recitationEdition] = result.data;

  return arabicEdition.ayahs.map((ayah, index) => ({
    numberInSurah: ayah.numberInSurah,
    text: ayah.text,
    translation: translationEdition.ayahs[index]?.text ?? "",
    transliteration: transliterationEdition.ayahs[index]?.text ?? "",
    audio: recitationEdition.ayahs[index]?.audio ?? "",
  }));
}

export async function searchAyahs(
  query: string,
  language: SupportedLanguage,
): Promise<SearchResultAyah[]> {
  if (!query.trim()) return [];

  const result = await fetchJson<SearchResponse>(
    `/search/${encodeURIComponent(query)}/all/${language}`,
  );

  return result.data.matches.map((ayah) => ({
    numberInSurah: ayah.numberInSurah,
    text: ayah.text,
    surahNumber: ayah.surah.number,
    surahName: ayah.surah.name,
    surahEnglishName: ayah.surah.englishName,
  }));
}

export const surahsQueryOptions = queryOptions({
  queryKey: ["quran", "surahs"],
  queryFn: getSurahs,
  staleTime: 1000 * 60 * 60,
});

export const surahAyahsQueryOptions = (
  surahNumber: number,
  language: SupportedLanguage,
  reciter: ReciterEdition,
) =>
  queryOptions({
    queryKey: ["quran", "surah", surahNumber, language, reciter],
    queryFn: () => getSurahAyahsBundle(surahNumber, language, reciter),
    staleTime: 1000 * 60 * 30,
  });

export const searchAyahsQueryOptions = (query: string, language: SupportedLanguage) =>
  queryOptions({
    queryKey: ["quran", "search", query, language],
    queryFn: () => searchAyahs(query, language),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(query.trim()),
  });