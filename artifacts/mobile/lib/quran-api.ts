export interface AlquranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

export interface AlquranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: AlquranAyah[];
}

export interface TranslationAyah {
  number: number;
  text: string;
  numberInSurah: number;
}

export interface AlquranSurahWithTranslation extends AlquranSurah {
  translationAyahs: TranslationAyah[];
}

export interface AlquranAyahFull {
  arabicText: string;
  translationText: string;
}

export async function fetchAyah(
  surahId: number,
  ayahNumber: number,
  translationKey: string = "en.sahih"
): Promise<AlquranAyahFull> {
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/quran-uthmani`),
    fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNumber}/${translationKey}`),
  ]);

  if (!arabicRes.ok || !translationRes.ok) {
    throw new Error("Failed to fetch ayah data");
  }

  const [arabicData, translationData] = await Promise.all([
    arabicRes.json(),
    translationRes.json(),
  ]);

  return {
    arabicText: arabicData.data.text,
    translationText: translationData.data.text,
  };
}

export async function fetchSurah(
  surahId: number,
  translationKey: string = "en.sahih"
): Promise<AlquranSurahWithTranslation> {
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`),
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${translationKey}`),
  ]);

  if (!arabicRes.ok || !translationRes.ok) {
    throw new Error("Failed to fetch surah data");
  }

  const [arabicData, translationData] = await Promise.all([
    arabicRes.json(),
    translationRes.json(),
  ]);

  return {
    ...arabicData.data,
    translationAyahs: translationData.data.ayahs,
  };
}

const BISMILLAH_ARABIC = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
const BISMILLAH_BARE = "بسم الله الرحمن الرحيم";

export function hasBismillahPrefix(text: string): boolean {
  const bare = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").trim();
  return bare.startsWith(BISMILLAH_BARE);
}

export function stripBismillah(text: string): string {
  if (!hasBismillahPrefix(text)) return text;
  const idx = text.indexOf("ر") + 1;
  let i = idx;
  while (i < text.length && /[\u064B-\u065F\u0670\u06D6-\u06ED\s]/.test(text[i])) i++;
  return text.slice(i).trim();
}
