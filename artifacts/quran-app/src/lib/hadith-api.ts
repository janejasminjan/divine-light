/* ── Hadith API — fawazahmed0 CDN (no key required) ─────────────
   Base: https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/
   Per-section fetching: /editions/{edition}/sections/{n}.min.json

   NOTE: Riyad as-Salihin is served via sunnah.com API instead —
   the fawazahmed0 package exceeds jsDelivr's 150 MB file-size limit,
   so all CDN requests for that edition are blocked with 403.
──────────────────────────────────────────────────────────────── */

export const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

/* Proxy base — the API server forwards requests to sunnah.com to avoid CORS */
const SUNNAH_BASE = "/api/hadith-proxy";

/* ── Collection metadata (hardcoded; section counts from the repo) ── */
export interface HadithBook {
  id: string;
  engEdition: string;
  araEdition: string;
  name: string;
  arabicName: string;
  compiler: string;
  description: string;
  hadithCount: number;
  sectionCount: number;
  color: string;
  /** If set, use the sunnah.com API for this book instead of the CDN */
  sunnahCollection?: string;
}

export const HADITH_BOOKS: HadithBook[] = [
  {
    id: "bukhari",
    engEdition: "eng-bukhari",
    araEdition: "ara-bukhari",
    name: "Sahih al-Bukhari",
    arabicName: "صحيح البخاري",
    compiler: "Imam al-Bukhari",
    description:
      "The most authentic hadith collection, compiled by Imam Muhammad al-Bukhari (d. 256 AH). Recognised worldwide as the most rigorously verified record of the Sunnah.",
    hadithCount: 7563,
    sectionCount: 97,
    color: "from-primary/25 to-primary/5",
  },
  {
    id: "muslim",
    engEdition: "eng-muslim",
    araEdition: "ara-muslim",
    name: "Sahih Muslim",
    arabicName: "صحيح مسلم",
    compiler: "Imam Muslim",
    description:
      "The second most authentic collection by Imam Muslim ibn al-Hajjaj (d. 261 AH). Praised for its organisation and precise chain evaluation.",
    hadithCount: 7470,
    sectionCount: 56,
    color: "from-secondary/30 to-secondary/5",
  },
  {
    id: "abudawud",
    engEdition: "eng-abudawud",
    araEdition: "ara-abudawud",
    name: "Sunan Abu Dawud",
    arabicName: "سنن أبي داود",
    compiler: "Imam Abu Dawud",
    description:
      "Compiled by Imam Abu Dawud al-Sijistani (d. 275 AH). Emphasises legal rulings and contains 5274 narrations across 43 books.",
    hadithCount: 5274,
    sectionCount: 43,
    color: "from-amber-500/20 to-amber-500/5",
  },
  {
    id: "tirmidhi",
    engEdition: "eng-tirmidhi",
    araEdition: "ara-tirmidhi",
    name: "Jami at-Tirmidhi",
    arabicName: "جامع الترمذي",
    compiler: "Imam al-Tirmidhi",
    description:
      "Compiled by Imam al-Tirmidhi (d. 279 AH). Unique for including the juristic consensus on each hadith alongside its grade.",
    hadithCount: 3956,
    sectionCount: 49,
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    id: "ibnmajah",
    engEdition: "eng-ibnmajah",
    araEdition: "ara-ibnmajah",
    name: "Sunan Ibn Majah",
    arabicName: "سنن ابن ماجه",
    compiler: "Imam Ibn Majah",
    description:
      "Compiled by Imam Ibn Majah (d. 273 AH). The sixth of the Kutub al-Sittah, containing narrations unique to this collection.",
    hadithCount: 4341,
    sectionCount: 37,
    color: "from-violet-500/20 to-violet-500/5",
  },
  {
    id: "nasai",
    engEdition: "eng-nasai",
    araEdition: "ara-nasai",
    name: "Sunan an-Nasai",
    arabicName: "سنن النسائي",
    compiler: "Imam al-Nasai",
    description:
      "Compiled by Imam al-Nasai (d. 303 AH). Renowned for strict chain criticism, containing 5765 narrations across 51 books.",
    hadithCount: 5765,
    sectionCount: 51,
    color: "from-sky-500/20 to-sky-500/5",
  },
  {
    id: "malik",
    engEdition: "eng-malik",
    araEdition: "ara-malik",
    name: "Muwatta Malik",
    arabicName: "موطأ مالك",
    compiler: "Imam Malik",
    description:
      "The earliest systematic hadith compilation by Imam Malik ibn Anas (d. 179 AH). A foundational text for Maliki jurisprudence.",
    hadithCount: 1857,
    sectionCount: 61,
    color: "from-rose-500/20 to-rose-500/5",
  },
  {
    id: "riyadussalihin",
    engEdition: "eng-riyadussalihin",
    araEdition: "ara-riyadussalihin",
    name: "Riyad as-Salihin",
    arabicName: "رياض الصالحين",
    compiler: "Imam al-Nawawi",
    description:
      "A beloved collection of ethical and devotional hadiths compiled by Imam al-Nawawi (d. 676 AH). Widely read for daily guidance.",
    hadithCount: 1903,
    sectionCount: 20,
    color: "from-teal-500/20 to-teal-500/5",
    sunnahCollection: "riyadussalihin",
  },
];

/* ── Types ──────────────────────────────────────────────────────── */
export interface HadithGrade {
  name: string;
  grade: string;
}

export interface HadithItem {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
  arabicText?: string;
  grades: HadithGrade[];
  reference: { book: number; hadith: number };
}

export interface ArabicHadithItem {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
  grades: HadithGrade[];
  reference: { book: number; hadith: number };
}

export interface SectionMeta {
  hadithnumber_first: number;
  hadithnumber_last: number;
  arabicnumber_first?: number;
  arabicnumber_last?: number;
}

export interface SectionResponse {
  metadata: {
    name: string;
    section: Record<string, string>;
    section_detail: Record<string, SectionMeta>;
  };
  hadiths: HadithItem[];
}

/* ── Helpers ────────────────────────────────────────────────────── */
export function bookById(id: string): HadithBook | undefined {
  return HADITH_BOOKS.find((b) => b.id === id);
}

export async function fetchSection(
  edition: string,
  sectionId: number,
): Promise<SectionResponse> {
  const url = `${CDN_BASE}/${edition}/sections/${sectionId}.min.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Section ${sectionId} not found (${res.status})`);
  return res.json();
}

/* ── sunnah.com helpers (used for Riyad as-Salihin) ────────────── */

/**
 * Map our 1-based numeric sectionId to the sunnah.com book number string.
 * sectionId 1  → "introduction"  (The Book of Miscellany, hadiths 1–679)
 * sectionId 2  → "1"             (The Book of Good Manners, 680–726)
 * sectionId 3  → "2"  … etc.
 */
function sunnahBookId(sectionId: number): string {
  if (sectionId === 1) return "introduction";
  return String(sectionId - 1);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

interface SunnahHadithRaw {
  hadithNumber: string;
  bookNumber: string;
  hadith: Array<{
    lang: string;
    chapterNumber?: string;
    chapterTitle?: string;
    body: string;
    grades?: Array<{ grade: string; graded_by?: string }>;
  }>;
}

interface SunnahBooksRaw {
  data: Array<{
    bookNumber: string;
    book: Array<{ lang: string; name: string }>;
    hadithStartNumber: number;
    hadithEndNumber: number;
    numberOfHadith: number;
  }>;
  total: number;
}

async function fetchSunnahBooks(collection: string): Promise<SunnahBooksRaw> {
  const url = `${SUNNAH_BASE}/collections/${collection}/books?limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Riyad books fetch failed (${res.status})`);
  return res.json();
}

async function fetchSunnahHadiths(
  collection: string,
  bookNumber: string,
): Promise<SunnahHadithRaw[]> {
  const url = `${SUNNAH_BASE}/collections/${collection}/books/${bookNumber}/hadiths?limit=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Riyad hadiths fetch failed (${res.status})`);
  const json = await res.json();
  return (json.data ?? []) as SunnahHadithRaw[];
}

function transformSunnahToSection(
  raw: SunnahHadithRaw[],
  sectionId: number,
  sectionName: string,
  hadithFirst: number,
  hadithLast: number,
  lang: "en" | "ar",
): SectionResponse {
  const hadiths: HadithItem[] = raw.map((h) => {
    const langData = h.hadith.find((x) => x.lang === lang);
    const enData   = h.hadith.find((x) => x.lang === "en");
    const arData   = h.hadith.find((x) => x.lang === "ar");
    const num      = parseInt(h.hadithNumber, 10) || 0;
    const rawGrades = (enData?.grades ?? langData?.grades ?? []);
    return {
      hadithnumber: num,
      arabicnumber: num,
      text: stripHtml(langData?.body ?? ""),
      arabicText: arData ? stripHtml(arData.body) : undefined,
      grades: rawGrades.map((g) => ({
        name: g.graded_by ?? "Unknown",
        grade: g.grade,
      })),
      reference: { book: sectionId - 1, hadith: num },
    };
  });

  return {
    metadata: {
      name: "Riyad as-Salihin",
      section: { [String(sectionId)]: sectionName },
      section_detail: {
        [String(sectionId)]: {
          hadithnumber_first: hadithFirst,
          hadithnumber_last:  hadithLast,
        },
      },
    },
    hadiths,
  };
}

/** Fetch a single section from sunnah.com, returning bilingual SectionResponses */
async function fetchSunnahSection(
  collection: string,
  sectionId: number,
): Promise<{ eng: SectionResponse; ara: SectionResponse }> {
  const bookNum = sunnahBookId(sectionId);

  const [booksData, hadiths] = await Promise.all([
    fetchSunnahBooks(collection),
    fetchSunnahHadiths(collection, bookNum),
  ]);

  const bookMeta = booksData.data.find((b) => b.bookNumber === bookNum);
  const enName   = bookMeta?.book.find((x) => x.lang === "en")?.name ?? `Chapter ${sectionId}`;
  const first    = bookMeta?.hadithStartNumber ?? (hadiths[0] ? parseInt(hadiths[0].hadithNumber, 10) : sectionId);
  const last     = bookMeta?.hadithEndNumber   ?? (hadiths[hadiths.length - 1] ? parseInt(hadiths[hadiths.length - 1].hadithNumber, 10) : sectionId);

  return {
    eng: transformSunnahToSection(hadiths, sectionId, enName, first, last, "en"),
    ara: transformSunnahToSection(hadiths, sectionId, enName, first, last, "ar"),
  };
}

/** Fetch English + Arabic sections in parallel for a given sectionId */
export async function fetchBilingualSection(
  book: HadithBook,
  sectionId: number,
): Promise<{ eng: SectionResponse; ara: SectionResponse | null }> {
  if (book.sunnahCollection) {
    const result = await fetchSunnahSection(book.sunnahCollection, sectionId);
    return result;
  }

  const [eng, ara] = await Promise.allSettled([
    fetchSection(book.engEdition, sectionId),
    fetchSection(book.araEdition, sectionId),
  ]);
  return {
    eng: eng.status === "fulfilled" ? eng.value : (() => { throw (eng as PromiseRejectedResult).reason; })(),
    ara: ara.status === "fulfilled" ? ara.value : null,
  };
}

/** Fetch a batch of section metadata (names + hadith ranges) in parallel */
export async function fetchSectionsBatch(
  edition: string,
  from: number,
  to: number,
  book?: HadithBook,
): Promise<Array<{ sectionId: number; name: string; meta: SectionMeta | null }>> {
  /* Use sunnah.com for Riyad as-Salihin — fetch all book metadata in one call */
  if (book?.sunnahCollection) {
    const booksData = await fetchSunnahBooks(book.sunnahCollection);
    const ids = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    return ids.map((sectionId) => {
      const bookNum  = sunnahBookId(sectionId);
      const bookMeta = booksData.data.find((b) => b.bookNumber === bookNum);
      if (!bookMeta) return { sectionId, name: `Chapter ${sectionId}`, meta: null };
      const enName = bookMeta.book.find((x) => x.lang === "en")?.name ?? `Chapter ${sectionId}`;
      return {
        sectionId,
        name: enName,
        meta: {
          hadithnumber_first: bookMeta.hadithStartNumber,
          hadithnumber_last:  bookMeta.hadithEndNumber,
        },
      };
    });
  }

  const ids = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const results = await Promise.allSettled(ids.map((id) => fetchSection(edition, id)));
  return results.map((r, i) => {
    const sectionId = ids[i];
    if (r.status === "rejected") return { sectionId, name: `Chapter ${sectionId}`, meta: null };
    const { metadata } = r.value;
    const name = metadata.section[String(sectionId)] ?? `Chapter ${sectionId}`;
    const meta = metadata.section_detail[String(sectionId)] ?? null;
    return { sectionId, name, meta };
  });
}

/** Grade color helper */
export function gradeColor(grade: string): string {
  const g = grade.toLowerCase();
  if (g.includes("sahih") || g.includes("authentic")) return "text-emerald-600 dark:text-emerald-400";
  if (g.includes("hasan") || g.includes("good")) return "text-sky-600 dark:text-sky-400";
  if (g.includes("da'if") || g.includes("daif") || g.includes("weak")) return "text-amber-600 dark:text-amber-400";
  if (g.includes("mawdu") || g.includes("fabricated")) return "text-destructive";
  return "text-muted-foreground";
}
