import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { AppShell } from "@/components/quran/app-shell";
import { searchAyahsQueryOptions, type SupportedLanguage } from "@/lib/quran-api";
import { z } from "zod";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  lang: fallback(z.enum(["en.asad", "fr.hamidullah", "ur.jalandhry"]), "en.asad").default(
    "en.asad",
  ),
});

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Quran Search — Quran Companion" },
      { name: "description", content: "Search Quran ayahs by keyword, surah, and meaning." },
      { property: "og:title", content: "Quran Search" },
      { property: "og:description", content: "Find ayahs quickly across the Quran." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ q: search.q, lang: search.lang }),
  loader: ({ context, deps }) => {
    if (deps.q.trim()) {
      return context.queryClient.ensureQueryData(searchAyahsQueryOptions(deps.q, deps.lang));
    }
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate({ from: "/search" });
  const { q, lang } = Route.useSearch();
  const { data } = useSuspenseQuery(searchAyahsQueryOptions(q, lang));

  const handleQueryChange = (value: string) => {
    navigate({ search: { q: value, lang } });
  };

  const handleLanguageChange = (value: SupportedLanguage) => {
    navigate({ search: { q, lang: value } });
  };

  return (
    <AppShell title="Search" subtitle="Find ayahs instantly across all surahs.">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={q}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search by keyword"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <select
            value={lang}
            onChange={(event) => handleLanguageChange(event.target.value as SupportedLanguage)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="en.asad">English</option>
            <option value="fr.hamidullah">French</option>
            <option value="ur.jalandhry">Urdu</option>
          </select>
        </div>

        <ul className="mt-4 space-y-3">
          {!q.trim() ? (
            <li className="text-sm text-muted-foreground">Type a keyword to start searching.</li>
          ) : null}

          {data?.map((result) => (
            <li key={`${result.surahNumber}-${result.numberInSurah}`}>
              <Link
                to="/surah/$surahId"
                params={{ surahId: String(result.surahNumber) }}
                search={{ ayah: result.numberInSurah, lang }}
                className="block rounded-md border border-border p-3 hover:bg-accent"
              >
                <p className="text-xs text-muted-foreground">
                  {result.surahEnglishName} ({result.surahNumber}:{result.numberInSurah})
                </p>
                <p className="mt-1 text-sm">{result.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}