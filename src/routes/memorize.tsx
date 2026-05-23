import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/quran/app-shell";
import { surahsQueryOptions } from "@/lib/quran-api";
import { useMemorizationProgress, useUserSettings } from "@/lib/quran-storage";

export const Route = createFileRoute("/memorize")({
  head: () => ({
    meta: [
      { title: "Memorization — Quran Companion" },
      {
        name: "description",
        content: "Track and practice your Quran memorization with repeat and hide-word modes.",
      },
      { property: "og:title", content: "Quran Memorization" },
      { property: "og:description", content: "Practice and track ayah memorization progress." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(surahsQueryOptions),
  component: MemorizePage,
});

function MemorizePage() {
  const { data: surahs } = useSuspenseQuery(surahsQueryOptions);
  const [memorizationProgress] = useMemorizationProgress();
  const [settings] = useUserSettings();

  return (
    <AppShell title="Memorization" subtitle="Build consistency with focused repetition.">
      <section className="mb-5 rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-medium">Current session</h2>
        {memorizationProgress ? (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              Surah {memorizationProgress.surahNumber} · Ayahs {memorizationProgress.fromAyah}-
              {memorizationProgress.toAyah}
            </p>
            <p className="mt-1">Last completed ayah: {memorizationProgress.lastCompletedAyah}</p>
            <Link
              to="/surah/$surahId"
              params={{ surahId: String(memorizationProgress.surahNumber) }}
              search={{
                ayah: memorizationProgress.lastCompletedAyah,
                lang: settings.language,
                reciter: settings.reciter,
              }}
              className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Resume memorization
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No memorization session saved yet. Open a surah and save a session.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-medium">Start new practice</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {surahs.map((surah) => (
            <li key={surah.number}>
              <Link
                to="/surah/$surahId"
                params={{ surahId: String(surah.number) }}
                search={{ ayah: 1, lang: settings.language, reciter: settings.reciter }}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-accent"
              >
                <span className="text-sm">{surah.englishName}</span>
                <span className="text-xs text-muted-foreground">{surah.numberOfAyahs} ayahs</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}