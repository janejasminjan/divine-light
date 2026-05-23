import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { AppShell } from "@/components/quran/app-shell";
import { AudioPlayer } from "@/components/quran/audio-player";
import { AyahCard } from "@/components/quran/ayah-card";
import { MemorizationPanel } from "@/components/quran/memorization-panel";
import { ReaderControls } from "@/components/quran/reader-controls";
import {
  surahAyahsQueryOptions,
  surahsQueryOptions,
  type ReciterEdition,
  type SupportedLanguage,
} from "@/lib/quran-api";
import {
  isBookmarked,
  useBookmarks,
  useMemorizationProgress,
  useReadingProgress,
  useUserSettings,
} from "@/lib/quran-storage";
import { useMemo, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  ayah: fallback(z.number().int().min(1), 1).default(1),
  lang: fallback(z.enum(["en.asad", "fr.hamidullah", "ur.jalandhry"]), "en.asad").default(
    "en.asad",
  ),
  reciter: fallback(
    z.enum(["ar.alafasy", "ar.husary", "ar.abdurrahmaansudais"]),
    "ar.alafasy",
  ).default("ar.alafasy"),
});

export const Route = createFileRoute("/surah/$surahId")({
  head: () => ({
    meta: [
      { title: "Surah Reader — Quran Companion" },
      {
        name: "description",
        content: "Read each surah with Arabic text, translation, transliteration, and recitation.",
      },
      { property: "og:title", content: "Surah Reader" },
      {
        property: "og:description",
        content: "A focused Quran reading and memorization experience.",
      },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({
    lang: search.lang,
    reciter: search.reciter,
  }),
  loader: async ({ context, deps, params }) => {
    const surahNumber = Number(params.surahId);
    if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      throw notFound();
    }

    await context.queryClient.ensureQueryData(surahsQueryOptions);
    return context.queryClient.ensureQueryData(surahAyahsQueryOptions(surahNumber, deps.lang, deps.reciter));
  },
  component: SurahReaderPage,
});

function SurahReaderPage() {
  const navigate = useNavigate({ from: "/surah/$surahId" });
  const { surahId } = Route.useParams();
  const { ayah, lang, reciter } = Route.useSearch();
  const surahNumber = Number(surahId);

  const { data: surahs } = useSuspenseQuery(surahsQueryOptions);
  const { data: ayahs } = useSuspenseQuery(surahAyahsQueryOptions(surahNumber, lang, reciter));

  const currentSurah = surahs.find((surah) => surah.number === surahNumber);
  const clampedAyah = Math.min(Math.max(1, ayah), ayahs.length);

  const [bookmarks, setBookmarks] = useBookmarks();
  const [settings, setSettings] = useUserSettings();
  const [, setReadingProgress] = useReadingProgress();
  const [, setMemorizationProgress] = useMemorizationProgress();

  const [hideWords, setHideWords] = useState(false);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(Math.min(10, ayahs.length));
  const [repeatCount, setRepeatCount] = useState(3);
  const [playingAyah, setPlayingAyah] = useState(clampedAyah);

  const currentPlaying = ayahs[Math.max(0, playingAyah - 1)];

  const filteredAyahs = useMemo(() => {
    const safeFrom = Math.min(fromAyah, toAyah);
    const safeTo = Math.max(fromAyah, toAyah);
    return ayahs.filter((item) => item.numberInSurah >= safeFrom && item.numberInSurah <= safeTo);
  }, [ayahs, fromAyah, toAyah]);

  const updateSearch = (next: { ayah?: number; lang?: SupportedLanguage; reciter?: ReciterEdition }) => {
    const nextLang = next.lang ?? lang;
    const nextReciter = next.reciter ?? reciter;
    const nextAyah = next.ayah ?? clampedAyah;

    navigate({
      search: {
        ayah: nextAyah,
        lang: nextLang,
        reciter: nextReciter,
      },
    });

    setReadingProgress({
      surahNumber,
      ayahNumber: nextAyah,
      updatedAt: new Date().toISOString(),
    });
  };

  const toggleBookmark = (ayahNumber: number, ayahText: string) => {
    if (!currentSurah) return;

    setBookmarks((current) => {
      if (isBookmarked(current, surahNumber, ayahNumber)) {
        return current.filter((item) => {
          return !(item.surahNumber === surahNumber && item.ayahNumber === ayahNumber);
        });
      }

      return [
        ...current,
        {
          surahNumber,
          ayahNumber,
          surahEnglishName: currentSurah.englishName,
          ayahText,
          createdAt: new Date().toISOString(),
        },
      ];
    });
  };

  if (!currentSurah) {
    throw notFound();
  }

  return (
    <AppShell
      title={`${currentSurah.englishName} (${currentSurah.name})`}
      subtitle={`${currentSurah.englishNameTranslation} · ${currentSurah.numberOfAyahs} ayahs`}
    >
      <div className="space-y-4">
        <ReaderControls
          language={lang}
          reciter={reciter}
          showTranslation={settings.showTranslation}
          showTransliteration={settings.showTransliteration}
          onLanguageChange={(value) => {
            setSettings((current) => ({ ...current, language: value }));
            updateSearch({ lang: value, ayah: 1 });
          }}
          onReciterChange={(value) => {
            setSettings((current) => ({ ...current, reciter: value }));
            updateSearch({ reciter: value });
          }}
          onToggleTranslation={(checked) => {
            setSettings((current) => ({ ...current, showTranslation: checked }));
          }}
          onToggleTransliteration={(checked) => {
            setSettings((current) => ({ ...current, showTransliteration: checked }));
          }}
        />

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
              <label className="text-xs text-muted-foreground">Jump to ayah</label>
              <input
                type="number"
                min={1}
                max={ayahs.length}
                value={clampedAyah}
                onChange={(event) => updateSearch({ ayah: Number(event.target.value) })}
                className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => updateSearch({ ayah: Math.max(1, clampedAyah - 1) })}
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => updateSearch({ ayah: Math.min(ayahs.length, clampedAyah + 1) })}
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
              >
                Next
              </button>
            </div>

            {filteredAyahs.map((item) => (
              <AyahCard
                key={item.numberInSurah}
                ayahNumber={item.numberInSurah}
                arabicText={item.text}
                translation={item.translation}
                transliteration={item.transliteration}
                showTranslation={settings.showTranslation}
                showTransliteration={settings.showTransliteration}
                hiddenMode={hideWords}
                isBookmarked={isBookmarked(bookmarks, surahNumber, item.numberInSurah)}
                onPlay={() => setPlayingAyah(item.numberInSurah)}
                onToggleBookmark={() => toggleBookmark(item.numberInSurah, item.translation)}
              />
            ))}
          </div>

          <div className="space-y-4">
            <AudioPlayer
              currentAudio={currentPlaying?.audio ?? ""}
              currentLabel={`Ayah ${playingAyah}`}
              repeatCount={repeatCount}
              onRepeatCountChange={setRepeatCount}
            />

            <MemorizationPanel
              fromAyah={fromAyah}
              toAyah={toAyah}
              hideWords={hideWords}
              onFromAyahChange={(value) => setFromAyah(Math.max(1, Math.min(value, ayahs.length)))}
              onToAyahChange={(value) => setToAyah(Math.max(1, Math.min(value, ayahs.length)))}
              onToggleHideWords={setHideWords}
              onSaveProgress={() => {
                setMemorizationProgress({
                  surahNumber,
                  fromAyah,
                  toAyah,
                  lastCompletedAyah: clampedAyah,
                  updatedAt: new Date().toISOString(),
                });
              }}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}