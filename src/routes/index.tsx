import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/quran/app-shell";
import { surahsQueryOptions } from "@/lib/quran-api";
import { useReadingProgress, useUserSettings } from "@/lib/quran-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quran Companion — Reading, Learning & Memorization" },
      {
        name: "description",
        content:
          "Read Quran with translation, transliteration, recitation audio, bookmarks, search, and memorization tools.",
      },
      { property: "og:title", content: "Quran Companion" },
      {
        property: "og:description",
        content: "A calm Quran app for reading, listening, and memorization.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(surahsQueryOptions),
  component: Index,
});

function Index() {
  const { data: surahs } = useSuspenseQuery(surahsQueryOptions);
  const [readingProgress] = useReadingProgress();
  const [settings] = useUserSettings();

  return (
    <AppShell title="Quran Companion" subtitle="Read, learn, listen, and memorize with focus.">
      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-medium">Continue reading</h2>
          {readingProgress ? (
            <Link
              to="/surah/$surahId"
              params={{ surahId: String(readingProgress.surahNumber) }}
              search={{
                ayah: readingProgress.ayahNumber,
                lang: settings.language,
                reciter: settings.reciter,
              }}
              className="mt-2 block rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
            >
              Surah {readingProgress.surahNumber}, Ayah {readingProgress.ayahNumber}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Start a surah to save progress.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-medium">Daily reminder</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            “And whoever relies upon Allah - then He is sufficient for him.” (65:3)
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-2 sm:p-3">
        <h2 className="px-2 pb-2 pt-1 text-base font-medium">All Surahs</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {surahs.map((surah) => (
            <li key={surah.number}>
              <Link
                to="/surah/$surahId"
                params={{ surahId: String(surah.number) }}
                search={{ lang: settings.language, reciter: settings.reciter }}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{surah.englishName}</p>
                  <p className="text-xs text-muted-foreground">{surah.englishNameTranslation}</p>
                </div>
                <p className="text-right text-sm" lang="ar" dir="rtl">
                  {surah.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
