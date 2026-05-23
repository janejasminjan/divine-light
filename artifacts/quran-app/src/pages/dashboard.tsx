import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetProgress, getGetProgressQueryKey, useGetDueReviews, useGetBookmarks, getGetBookmarksQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, BrainCircuit, History, Award, Loader2, Bell, BookOpen, GraduationCap, Bookmark, ExternalLink, ChevronRight, BookMarked, Sparkles, RefreshCw, TrendingUp, ScrollText, Quote } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useReminders } from "@/hooks/use-reminders";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyPosition, type DailyPosition } from "@/hooks/use-daily-position";
import { fetchSection, bookById } from "@/lib/hadith-api";

const SURAH_NAMES: Record<number, string> = {
  1:"Al-Fatiha",2:"Al-Baqara",3:"Ali 'Imran",4:"An-Nisa",5:"Al-Ma'ida",
  6:"Al-An'am",7:"Al-A'raf",8:"Al-Anfal",9:"At-Tawba",10:"Yunus",
  11:"Hud",12:"Yusuf",13:"Ar-Ra'd",14:"Ibrahim",15:"Al-Hijr",
  16:"An-Nahl",17:"Al-Isra",18:"Al-Kahf",19:"Maryam",20:"Ta-Ha",
  21:"Al-Anbiya",22:"Al-Hajj",23:"Al-Mu'minun",24:"An-Nur",25:"Al-Furqan",
  26:"Ash-Shu'ara",27:"An-Naml",28:"Al-Qasas",29:"Al-'Ankabut",30:"Ar-Rum",
  31:"Luqman",32:"As-Sajda",33:"Al-Ahzab",34:"Saba",35:"Fatir",
  36:"Ya-Sin",37:"As-Saffat",38:"Sad",39:"Az-Zumar",40:"Ghafir",
  41:"Fussilat",42:"Ash-Shura",43:"Az-Zukhruf",44:"Ad-Dukhan",45:"Al-Jathiya",
  46:"Al-Ahqaf",47:"Muhammad",48:"Al-Fath",49:"Al-Hujurat",50:"Qaf",
  51:"Adh-Dhariyat",52:"At-Tur",53:"An-Najm",54:"Al-Qamar",55:"Ar-Rahman",
  56:"Al-Waqi'a",57:"Al-Hadid",58:"Al-Mujadila",59:"Al-Hashr",60:"Al-Mumtahana",
  61:"As-Saf",62:"Al-Jumu'a",63:"Al-Munafiqun",64:"At-Taghabun",65:"At-Talaq",
  66:"At-Tahrim",67:"Al-Mulk",68:"Al-Qalam",69:"Al-Haqqa",70:"Al-Ma'arij",
  71:"Nuh",72:"Al-Jinn",73:"Al-Muzzammil",74:"Al-Muddaththir",75:"Al-Qiyama",
  76:"Al-Insan",77:"Al-Mursalat",78:"An-Naba",79:"An-Nazi'at",80:"Abasa",
  81:"At-Takwir",82:"Al-Infitar",83:"Al-Mutaffifin",84:"Al-Inshiqaq",85:"Al-Buruj",
  86:"At-Tariq",87:"Al-A'la",88:"Al-Ghashiya",89:"Al-Fajr",90:"Al-Balad",
  91:"Ash-Shams",92:"Al-Layl",93:"Ad-Duha",94:"Ash-Sharh",95:"At-Tin",
  96:"Al-'Alaq",97:"Al-Qadr",98:"Al-Bayyina",99:"Az-Zalzala",100:"Al-'Adiyat",
  101:"Al-Qari'a",102:"At-Takathur",103:"Al-'Asr",104:"Al-Humaza",105:"Al-Fil",
  106:"Quraysh",107:"Al-Ma'un",108:"Al-Kawthar",109:"Al-Kafirun",110:"An-Nasr",
  111:"Al-Masad",112:"Al-Ikhlas",113:"Al-Falaq",114:"An-Nas",
};

/* ── Curated pool of well-known ayahs ───────────────────────────
   Rotates daily — each element is { surahNum, ayahNum }.
   ─────────────────────────────────────────────────────────────── */
const AYAH_POOL: { surahNum: number; ayahNum: number }[] = [
  { surahNum: 2,  ayahNum: 255 }, // Ayat al-Kursi
  { surahNum: 2,  ayahNum: 286 }, // Allah does not burden a soul…
  { surahNum: 3,  ayahNum: 8   }, // Our Lord, let not our hearts deviate…
  { surahNum: 3,  ayahNum: 26  }, // Say: Owner of Sovereignty…
  { surahNum: 3,  ayahNum: 160 }, // If Allah helps you, none can overcome you…
  { surahNum: 3,  ayahNum: 173 }, // Allah is sufficient for us…
  { surahNum: 9,  ayahNum: 51  }, // Nothing will happen to us except what Allah has decreed…
  { surahNum: 13, ayahNum: 11  }, // Allah will not change a people's condition…
  { surahNum: 13, ayahNum: 28  }, // In the remembrance of Allah do hearts find rest
  { surahNum: 14, ayahNum: 7   }, // If you are grateful, I will surely increase you…
  { surahNum: 17, ayahNum: 80  }, // My Lord, cause me to enter a sound entrance…
  { surahNum: 18, ayahNum: 10  }, // Our Lord, grant us mercy and ease our affairs…
  { surahNum: 20, ayahNum: 114 }, // My Lord, increase me in knowledge
  { surahNum: 22, ayahNum: 46  }, // Have they not traveled through the land…
  { surahNum: 24, ayahNum: 35  }, // Allah is the Light of the heavens and earth
  { surahNum: 25, ayahNum: 63  }, // The servants of the Most Merciful…
  { surahNum: 29, ayahNum: 69  }, // Those who strive for Us, We will guide them…
  { surahNum: 33, ayahNum: 21  }, // In the Messenger an excellent example
  { surahNum: 39, ayahNum: 10  }, // The patient will be given their reward without account
  { surahNum: 39, ayahNum: 53  }, // Do not despair of the mercy of Allah
  { surahNum: 40, ayahNum: 60  }, // Call upon Me; I will respond to you
  { surahNum: 41, ayahNum: 30  }, // Those who say "Our Lord is Allah" then remain firm…
  { surahNum: 49, ayahNum: 13  }, // O mankind, We created you from male and female…
  { surahNum: 51, ayahNum: 56  }, // I created jinn and humans only to worship Me
  { surahNum: 55, ayahNum: 13  }, // So which of the favors of your Lord would you deny?
  { surahNum: 57, ayahNum: 4   }, // He is with you wherever you are
  { surahNum: 65, ayahNum: 3   }, // Whoever relies upon Allah, He is sufficient for him
  { surahNum: 67, ayahNum: 2   }, // Who created death and life to test you
  { surahNum: 93, ayahNum: 5   }, // Your Lord will give you, and you will be satisfied
  { surahNum: 94, ayahNum: 5   }, // Indeed, with hardship will be ease
  { surahNum: 103, ayahNum: 1  }, // By time — mankind is in loss
  { surahNum: 112, ayahNum: 1  }, // Say: He is Allah, One
];

/* ── useAyahOfDay ───────────────────────────────────────────── */
function useAyahOfDay() {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const { surahNum, ayahNum } = AYAH_POOL[dayIndex % AYAH_POOL.length];

  return useQuery({
    queryKey: ["ayah-of-day", surahNum, ayahNum],
    queryFn: async () => {
      const res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/editions/quran-uthmani,en.sahih`
      );
      const data = await res.json();
      if (data.code !== 200) throw new Error("Failed to fetch ayah of the day");
      const [arabic, english] = data.data as Array<{
        text: string;
        surah: { name: string; englishName: string; number: number };
        numberInSurah: number;
      }>;
      return {
        surahNum: arabic.surah.number,
        ayahNum: arabic.numberInSurah,
        arabic: arabic.text,
        translation: english.text,
        surahName: arabic.surah.englishName,
        surahNameAr: arabic.surah.name,
      };
    },
    staleTime: 1000 * 60 * 60, // cache for 1 hour
    retry: 2,
  });
}

/* ── AyahOfDayCard ──────────────────────────────────────────── */
function AyahOfDayCard() {
  const { data, isLoading, isError, refetch, isFetching } = useAyahOfDay();
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-card to-muted/40">
        {/* Top gradient bar */}
        <div className="h-[3px] bg-gradient-to-r from-primary via-secondary to-primary" />

        <CardContent className="pt-5 pb-5 px-5 md:px-7">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-primary leading-none">Ayah of the Day</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{dateLabel}</div>
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isLoading ? (
            /* Skeleton */
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-muted/50 rounded-md w-4/5 ml-auto" />
              <div className="h-8 bg-muted/50 rounded-md w-3/5 ml-auto" />
              <div className="flex justify-center my-4">
                <div className="h-3 bg-muted/30 rounded w-16" />
              </div>
              <div className="h-4 bg-muted/30 rounded w-full" />
              <div className="h-4 bg-muted/30 rounded w-5/6" />
              <div className="h-4 bg-muted/30 rounded w-2/3" />
            </div>
          ) : isError ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <p>Could not load today's ayah.</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : data ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${data.surahNum}-${data.ayahNum}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {/* Arabic text */}
                <div dir="rtl" className="text-right mb-4">
                  <p className="font-arabic text-[1.65rem] md:text-[2rem] leading-[2.1] text-foreground">
                    {data.arabic}
                  </p>
                </div>

                {/* Ornamental divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border/60" />
                  <span className="text-secondary/60 text-xs tracking-[0.6em]">◆</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border/60" />
                </div>

                {/* Translation */}
                <p className="text-sm text-muted-foreground leading-relaxed italic mb-5">
                  "{data.translation}"
                </p>

                {/* Footer: reference + CTA */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-arabic text-base text-muted-foreground/70">{data.surahNameAr}</span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {data.surahName} {data.surahNum}:{data.ayahNum}
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5 shrink-0">
                    <Link href={`/quran/${data.surahNum}?ayah=${data.ayahNum}`}>
                      Read in Quran
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Hadith-of-the-day pool ─────────────────────────────────────
   Only CDN-backed books (no riyadussalihin) so fetchSection works.
   We show the first hadith from each section.
   ─────────────────────────────────────────────────────────────── */
const HADITH_POOL: { bookId: string; sectionId: number; topic: string }[] = [
  { bookId: "bukhari",  sectionId: 1,  topic: "Actions by intentions"         },
  { bookId: "bukhari",  sectionId: 3,  topic: "Knowledge & learning"           },
  { bookId: "bukhari",  sectionId: 10, topic: "Times of prayer"                },
  { bookId: "bukhari",  sectionId: 56, topic: "Striving in Allah's cause"      },
  { bookId: "bukhari",  sectionId: 73, topic: "Good manners & character"       },
  { bookId: "bukhari",  sectionId: 78, topic: "Seeking permission & conduct"   },
  { bookId: "muslim",   sectionId: 1,  topic: "Faith & its fundamentals"       },
  { bookId: "muslim",   sectionId: 2,  topic: "Purity & purification"          },
  { bookId: "muslim",   sectionId: 4,  topic: "The call to prayer"             },
  { bookId: "tirmidhi", sectionId: 1,  topic: "Purification & prayer"          },
  { bookId: "tirmidhi", sectionId: 38, topic: "Virtues & character"            },
  { bookId: "abudawud", sectionId: 1,  topic: "Purification essentials"        },
  { bookId: "nasai",    sectionId: 1,  topic: "Purity of heart & worship"      },
  { bookId: "ibnmajah", sectionId: 1,  topic: "Foundations of belief"         },
  { bookId: "malik",    sectionId: 1,  topic: "Times of prayer"                },
];

/* ── useHadithOfDay ─────────────────────────────────────────── */
function useHadithOfDay() {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const entry = HADITH_POOL[dayIndex % HADITH_POOL.length];
  const book  = bookById(entry.bookId);

  return {
    entry,
    book,
    ...useQuery({
      queryKey: ["hadith-of-day", entry.bookId, entry.sectionId],
      queryFn: async () => {
        const section = await fetchSection(book!.engEdition, entry.sectionId);
        const hadith  = section.hadiths[0];
        if (!hadith) throw new Error("No hadiths in section");
        const sectionName =
          section.metadata.section[String(entry.sectionId)] ?? entry.topic;
        return {
          text:         hadith.text,
          hadithNumber: hadith.hadithnumber,
          bookName:     book!.name,
          sectionId:    entry.sectionId,
          sectionName,
          grades:       hadith.grades,
        };
      },
      staleTime: 1000 * 60 * 60,
      retry: 2,
      enabled: !!book,
    }),
  };
}

/* ── HadithOfDayCard ────────────────────────────────────────── */
function HadithOfDayCard() {
  const { entry, book, data, isLoading, isError, refetch, isFetching } = useHadithOfDay();
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const readHref = data
    ? `/hadith/${entry.bookId}/${data.sectionId}#h${data.hadithNumber}`
    : `/hadith/${entry.bookId}/${entry.sectionId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <Card className="overflow-hidden border-secondary/25 bg-gradient-to-br from-card to-muted/40">
        {/* Top gradient bar */}
        <div className="h-[3px] bg-gradient-to-r from-secondary via-primary to-secondary" />

        <CardContent className="pt-5 pb-5 px-5 md:px-7">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-secondary/10 flex items-center justify-center">
                <Quote className="h-3.5 w-3.5 text-secondary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-secondary leading-none">Hadith of the Day</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{dateLabel}</div>
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted/50 rounded-md w-full" />
              <div className="h-4 bg-muted/50 rounded-md w-11/12" />
              <div className="h-4 bg-muted/50 rounded-md w-4/5" />
              <div className="h-4 bg-muted/30 rounded-md w-2/3 mt-2" />
            </div>
          ) : isError ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <p>Could not load today's hadith.</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : data ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${entry.bookId}-${entry.sectionId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {/* Hadith text */}
                <p className="text-sm text-foreground leading-relaxed mb-5 line-clamp-5">
                  "{data.text}"
                </p>

                {/* Footer: reference + CTA */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{data.bookName}</span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {data.sectionName} · #{data.hadithNumber}
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1 border-secondary/30 text-secondary hover:bg-secondary/5 shrink-0">
                    <Link href={readHref}>
                      Read in Hadith
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── Trending Surahs data ───────────────────────────────────── */
const POPULAR_SURAHS = [
  { num: 1,   name: "Al-Fatiha",   tag: "Recited in every prayer",   arabic: "الفاتحة"  },
  { num: 36,  name: "Ya-Sin",      tag: "Heart of the Quran",        arabic: "يس"       },
  { num: 67,  name: "Al-Mulk",     tag: "Nightly protection",        arabic: "الملك"    },
  { num: 18,  name: "Al-Kahf",     tag: "Friday recitation",         arabic: "الكهف"    },
  { num: 55,  name: "Ar-Rahman",   tag: "Favors of the Lord",        arabic: "الرحمن"   },
  { num: 56,  name: "Al-Waqi'a",   tag: "Blessing & provision",      arabic: "الواقعة"  },
  { num: 2,   name: "Al-Baqarah",  tag: "Longest surah",             arabic: "البقرة"   },
  { num: 112, name: "Al-Ikhlas",   tag: "Equal to ⅓ of Quran",       arabic: "الإخلاص"  },
  { num: 93,  name: "Ad-Duha",     tag: "Surah of comfort",          arabic: "الضحى"    },
  { num: 94,  name: "Ash-Sharh",   tag: "Relief after hardship",     arabic: "الشرح"    },
  { num: 103, name: "Al-'Asr",     tag: "Surah on time & success",   arabic: "العصر"    },
  { num: 114, name: "An-Nas",      tag: "Refuge from evil",          arabic: "الناس"    },
] as const;

/* ── Trending Hadiths data ──────────────────────────────────── */
const POPULAR_HADITHS = [
  { bookId: "bukhari",        section: 1,  bookName: "Sahih al-Bukhari",   topic: "Actions by intentions",      emoji: "🌟" },
  { bookId: "bukhari",        section: 2,  bookName: "Sahih al-Bukhari",   topic: "Knowledge & its virtue",     emoji: "📚" },
  { bookId: "muslim",         section: 1,  bookName: "Sahih Muslim",       topic: "Pillars of Islam & Faith",   emoji: "🕌" },
  { bookId: "riyadussalihin", section: 1,  bookName: "Riyad as-Salihin",   topic: "Sincerity & intention",      emoji: "💎" },
  { bookId: "riyadussalihin", section: 2,  bookName: "Riyad as-Salihin",   topic: "Repentance & seeking mercy", emoji: "🤲" },
  { bookId: "tirmidhi",       section: 1,  bookName: "Jami at-Tirmidhi",   topic: "Purification & prayer",      emoji: "✨" },
  { bookId: "bukhari",        section: 78, bookName: "Sahih al-Bukhari",   topic: "Good manners & conduct",     emoji: "🌿" },
  { bookId: "abudawud",       section: 1,  bookName: "Sunan Abu Dawud",    topic: "Purification essentials",    emoji: "💧" },
  { bookId: "malik",          section: 1,  bookName: "Muwatta Malik",      topic: "Times of prayer",            emoji: "🕐" },
] as const;

/* ── TrendingSurahsSection ──────────────────────────────────── */
function TrendingSurahsSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          Popular Surahs
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 gap-1">
          <Link href="/quran">Browse all <ChevronRight className="h-3 w-3" /></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {POPULAR_SURAHS.map((s, i) => (
          <Link key={s.num} href={`/quran/${s.num}`} className={i >= 4 ? "hidden sm:block" : ""}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03] transition-all cursor-pointer group p-3.5 space-y-2 h-full"
            >
              {/* Number badge + Arabic */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {s.num}
                </span>
                <span className="font-arabic text-base text-muted-foreground/70 group-hover:text-primary/70 transition-colors">
                  {s.arabic}
                </span>
              </div>
              {/* Name */}
              <div>
                <div className="text-sm font-semibold text-foreground leading-tight">{s.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{s.tag}</div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── TrendingHadithsSection ─────────────────────────────────── */
function TrendingHadithsSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ScrollText className="h-4 w-4 text-secondary" />
          Popular Hadiths
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 gap-1">
          <Link href="/hadith">Browse all <ChevronRight className="h-3 w-3" /></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {POPULAR_HADITHS.map((h, i) => (
          <Link key={`${h.bookId}-${h.section}`} href={`/hadith/${h.bookId}/${h.section}`} className={i >= 4 ? "hidden sm:block" : ""}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card hover:border-secondary/40 hover:bg-secondary/[0.03] transition-all cursor-pointer group p-3.5 space-y-2 h-full"
            >
              {/* Emoji + section badge */}
              <div className="flex items-center justify-between">
                <span className="text-xl">{h.emoji}</span>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                  Ch. {h.section}
                </span>
              </div>
              {/* Topic */}
              <div>
                <div className="text-sm font-semibold text-foreground leading-tight">{h.topic}</div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{h.bookName}</div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: progress, isLoading: isLoadingProgress } = useGetProgress({ query: { queryKey: getGetProgressQueryKey() }});
  const { data: dueReviews, isLoading: isLoadingReviews } = useGetDueReviews();
  const { data: bookmarks } = useGetBookmarks({ query: { queryKey: getGetBookmarksQueryKey() } });
  const { dueToday, config } = useReminders();
  const [dailyPos, setDailyPos] = useState<DailyPosition | null>(null);
  useEffect(() => { setDailyPos(getDailyPosition()); }, []);

  if (isLoadingProgress || isLoadingReviews) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const p = progress || {
    currentStreak: 0,
    longestStreak: 0,
    totalMemorizedAyahs: 0,
    totalSurahsCompleted: 0,
    totalMinutesPracticed: 0,
    ayahsDueForReview: 0,
    totalAyahsInPlan: 0,
    percentageMemorized: 0,
    badges: []
  };

  const dueCount = dueReviews?.length || 0;
  const anyRemindersEnabled = config.dailyRecitation.enabled || Object.values(config.surahs).some(s => s.enabled);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Your daily progress and stats.</p>
      </div>

      {/* ── Ayah of the Day ──────────────────────────────────── */}
      <AyahOfDayCard />

      {/* ── Hadith of the Day ────────────────────────────────── */}
      <HadithOfDayCard />

      {/* ── Trending Surahs ──────────────────────────────────── */}
      <TrendingSurahsSection />

      {/* ── Trending Hadiths ─────────────────────────────────── */}
      <TrendingHadithsSection />

      {/* Reminder cards for due surahs */}
      <AnimatePresence>
        {dueToday.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bell className="h-4 w-4 text-secondary" />
              Today's Reminders
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {dueToday.map((item) => {
                const href = item.type === "daily" ? "/quran" : `/quran/${item.type}`;
                const label = item.type === "daily" ? "Open Quran" : "Read Now";
                return (
                  <motion.div key={String(item.type)} layout>
                    <Card className="border-secondary/30 bg-secondary/5 hover:border-secondary/50 transition-colors">
                      <CardContent className="flex items-center gap-3 pt-4 pb-3">
                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground">Due today</div>
                        </div>
                        <Button asChild size="sm" variant="ghost" className="flex-shrink-0 text-xs h-7 text-primary">
                          <Link href={href}>{label} →</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Recitation — Continue Reading */}
      <Card className={`border-primary/25 ${dailyPos ? "bg-primary/[0.03]" : ""}`}>
        <CardContent className="flex items-center gap-4 pt-4 pb-4">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookMarked className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {dailyPos ? (
              <>
                <div className="font-semibold text-sm text-foreground">Continue Daily Recitation</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {SURAH_NAMES[dailyPos.surahId] ?? `Surah ${dailyPos.surahId}`}
                  <span className="mx-1.5">·</span>
                  Ayah {dailyPos.ayahNumber}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-sm text-foreground">Daily Recitation</div>
                <div className="text-xs text-muted-foreground mt-0.5">Read a few verses each day — your position is saved automatically</div>
              </>
            )}
          </div>
          <Button asChild size="sm" className="flex-shrink-0">
            <Link href={dailyPos
              ? `/quran/${dailyPos.surahId}?ayah=${dailyPos.ayahNumber}&mode=daily`
              : `/quran/1?mode=daily`}>
              {dailyPos ? "Continue →" : "Start →"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{p.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Longest: {p.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memorized</CardTitle>
            <BrainCircuit className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{p.totalMemorizedAyahs} Ayahs</div>
            <p className="text-xs text-muted-foreground">
              {p.percentageMemorized}% of Quran
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Time Practiced</CardTitle>
            <History className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(p.totalMinutesPracticed / 60)}h {p.totalMinutesPracticed % 60}m</div>
            <p className="text-xs text-muted-foreground">
              Total dedication
            </p>
          </CardContent>
        </Card>

        <Card className={dueCount > 0 ? "border-secondary border-2" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
            <Award className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueCount} Ayahs</div>
            {dueCount > 0 ? (
              <Button asChild size="sm" className="w-full mt-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link href="/review">Start Review</Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                All caught up for today!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Memorization progress */}
        <Card>
          <CardHeader>
            <CardTitle>Memorization Plan Progress</CardTitle>
            <CardDescription>Your target vs current state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total In Plan</span>
                <span className="font-medium">{p.totalAyahsInPlan} Ayahs</span>
              </div>
              <Progress value={p.totalAyahsInPlan > 0 ? (p.totalMemorizedAyahs / p.totalAyahsInPlan) * 100 : 0} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/practice"><GraduationCap className="h-3.5 w-3.5 mr-1.5" />Practice</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/memorize"><BrainCircuit className="h-3.5 w-3.5 mr-1.5" />Manage Plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump straight into your practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start gap-3">
              <Link href="/quran">
                <BookOpen className="h-4 w-4 text-primary" />
                Browse & Read the Quran
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-3">
              <Link href="/practice">
                <GraduationCap className="h-4 w-4 text-primary" />
                Start a Memorization Session
              </Link>
            </Button>
            {!anyRemindersEnabled && (
              <Button asChild variant="ghost" className="w-full justify-start gap-3 text-muted-foreground text-sm">
                <Link href="/reminders">
                  <Bell className="h-4 w-4" />
                  Set up daily reminders →
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookmarks */}
      {bookmarks && bookmarks.length > 0 && (() => {
        const recent = [...bookmarks]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bookmark className="h-4 w-4 text-primary" />
                Recent Bookmarks
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 gap-1">
                <Link href="/bookmarks">View all <ChevronRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
              {recent.map((bm) => {
                const surahName = SURAH_NAMES[bm.surahId] ?? `Surah ${bm.surahId}`;
                return (
                  <Link key={bm.id} href={`/quran/${bm.surahId}?ayah=${bm.ayahNumber}`}>
                    <Card className="hover:border-primary/40 hover:bg-muted/30 transition-colors cursor-pointer h-full">
                      <CardContent className="flex items-center gap-3 pt-3 pb-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{bm.surahId}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{surahName}</div>
                          <div className="text-xs text-muted-foreground">Ayah {bm.ayahNumber}</div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
