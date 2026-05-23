import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/quran/app-shell";
import { useBookmarks, useUserSettings } from "@/lib/quran-storage";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — Quran Companion" },
      { name: "description", content: "Revisit your saved Quran ayahs and continue learning." },
      { property: "og:title", content: "Quran Bookmarks" },
      { property: "og:description", content: "Keep your favorite ayahs close." },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useBookmarks();
  const [settings] = useUserSettings();

  const removeBookmark = (surahNumber: number, ayahNumber: number) => {
    setBookmarks((current) => {
      return current.filter((item) => {
        return !(item.surahNumber === surahNumber && item.ayahNumber === ayahNumber);
      });
    });
  };

  return (
    <AppShell title="Bookmarks" subtitle="Your saved ayahs for reflection and review.">
      <section className="rounded-lg border border-border bg-card p-4">
        {bookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookmarks yet. Save ayahs from the reader.</p>
        ) : (
          <ul className="space-y-3">
            {bookmarks
              .slice()
              .reverse()
              .map((bookmark) => (
                <li
                  key={`${bookmark.surahNumber}-${bookmark.ayahNumber}-${bookmark.createdAt}`}
                  className="rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      to="/surah/$surahId"
                      params={{ surahId: String(bookmark.surahNumber) }}
                      search={{
                        ayah: bookmark.ayahNumber,
                        lang: settings.language,
                        reciter: settings.reciter,
                      }}
                      className="text-sm font-medium hover:underline"
                    >
                      {bookmark.surahEnglishName} ({bookmark.surahNumber}:{bookmark.ayahNumber})
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeBookmark(bookmark.surahNumber, bookmark.ayahNumber)}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{bookmark.ayahText}</p>
                </li>
              ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}