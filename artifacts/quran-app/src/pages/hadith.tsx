import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText, Search, ChevronRight, X, Loader2,
  AlertTriangle, BookMarked,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HADITH_BOOKS,
  type HadithBook,
  type HadithItem,
  type SectionResponse,
  fetchSection,
  gradeColor,
} from "@/lib/hadith-api";

/* ── Types ───────────────────────────────────────────────────── */
interface SearchResult {
  book: HadithBook;
  sectionId: number;
  sectionName: string;
  hadith: HadithItem;
}

/* ── Collection card ─────────────────────────────────────────── */
function BookCard({ book, index }: { book: HadithBook; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/hadith/${book.id}`}>
        <div className="group relative rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer overflow-hidden">
          <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${book.color} to-transparent`} />

          <div className="p-5 flex gap-4 items-start">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
              <BookMarked className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground leading-tight">{book.name}</h2>
                  <p className="font-arabic text-base text-primary/80 leading-tight mt-0.5" dir="rtl">
                    {book.arabicName}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 flex-shrink-0 group-hover:text-primary/60 transition-colors" />
              </div>

              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                {book.description}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                  {book.hadithCount.toLocaleString()} hadiths
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                  {book.sectionCount} books
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                  {book.compiler}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Search result item ──────────────────────────────────────── */
function SearchResultItem({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const { book, sectionId, sectionName, hadith } = result;
  const snippet = hadith.text.length > 200 ? hadith.text.slice(0, 200) + "…" : hadith.text;
  const topGrade = hadith.grades[0];
  return (
    <Link href={`/hadith/${book.id}/${sectionId}#h${hadith.hadithnumber}`} onClick={onClick}>
      <div className="group flex gap-4 px-4 py-3.5 rounded-xl hover:bg-muted/60 cursor-pointer transition-all border border-transparent hover:border-border">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors tabular-nums">
          {hadith.hadithnumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold text-primary">{book.name}</span>
            <span className="text-xs text-muted-foreground">· {sectionName}</span>
            {topGrade && (
              <span className={`text-[10px] font-medium ${gradeColor(topGrade.grade)}`}>
                {topGrade.grade}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{snippet}</p>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function HadithHome() {
  const [, navigate] = useLocation();

  /* ── Search state ─────────────────────────────────────────── */
  const [query,         setQuery]         = useState("");
  const [selectedBook,  setSelectedBook]  = useState<string>("all");
  const [searching,     setSearching]     = useState(false);
  const [results,       setResults]       = useState<SearchResult[]>([]);
  const [searchDone,    setSearchDone]    = useState(false);
  const [searchError,   setSearchError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isSearchMode = query.trim().length >= 2;

  /* ── Run search ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isSearchMode) {
      setResults([]);
      setSearchDone(false);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const books = selectedBook === "all"
      ? HADITH_BOOKS
      : HADITH_BOOKS.filter(b => b.id === selectedBook);

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setResults([]);
    setSearchDone(false);
    setSearchError(null);
    setSearching(true);

    const q = query.trim().toLowerCase();
    const MAX_RESULTS = 40;
    let found = 0;

    async function searchAll() {
      try {
        for (const book of books) {
          if (abort.signal.aborted || found >= MAX_RESULTS) break;
          /* search first 15 sections only for speed */
          const limit = Math.min(book.sectionCount, 15);
          const ids = Array.from({ length: limit }, (_, i) => i + 1);
          const settled = await Promise.allSettled(
            ids.map(id => fetchSection(book.engEdition, id))
          );
          if (abort.signal.aborted) break;
          const batch: SearchResult[] = [];
          settled.forEach((r, i) => {
            if (r.status !== "fulfilled" || found + batch.length >= MAX_RESULTS) return;
            const data: SectionResponse = r.value;
            const sectionId = ids[i];
            const sectionName = data.metadata.section[String(sectionId)] ?? `Chapter ${sectionId}`;
            data.hadiths.forEach(h => {
              if (found + batch.length >= MAX_RESULTS) return;
              if (h.text.toLowerCase().includes(q)) {
                batch.push({ book, sectionId, sectionName, hadith: h });
              }
            });
          });
          found += batch.length;
          if (batch.length > 0) {
            setResults(prev => [...prev, ...batch]);
          }
        }
      } catch {
        if (!abort.signal.aborted) setSearchError("Search failed. Please try again.");
      } finally {
        if (!abort.signal.aborted) {
          setSearching(false);
          setSearchDone(true);
        }
      }
    }

    /* Debounce 400 ms */
    const t = setTimeout(() => searchAll(), 400);
    return () => { clearTimeout(t); abort.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedBook]);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-serif font-bold text-primary">Hadith</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Narrations of the Prophet ﷺ — browse collections or search across thousands of hadiths.
        </p>
        <p className="font-arabic text-lg text-primary/70 leading-relaxed mt-1" dir="rtl">
          وَمَا يَنطِقُ عَنِ الْهَوَىٰ · إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ
        </p>
        <p className="text-xs text-muted-foreground italic">
          "Nor does he speak of his own whim — it is nothing but revelation revealed." — 53:3–4
        </p>
      </div>

      {/* ── Search bar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across hadiths…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 pr-9 bg-card"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collection filter — shown while searching */}
        <AnimatePresence>
          {isSearchMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap overflow-hidden"
            >
              <span className="text-xs text-muted-foreground">Filter:</span>
              {[{ id: "all", name: "All collections" }, ...HADITH_BOOKS].map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBook(b.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedBook === b.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Search results ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isSearchMode ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {/* Status line */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-1">
              {searching && <Loader2 className="h-3 w-3 animate-spin" />}
              {searching
                ? `Searching${results.length > 0 ? ` — ${results.length} found so far…` : "…"}`
                : searchDone
                  ? results.length > 0
                    ? `${results.length} result${results.length === 1 ? "" : "s"}${results.length >= 40 ? " (showing first 40)" : ""}`
                    : "No results found"
                  : ""}
              {searchError && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {searchError}
                </span>
              )}
            </div>

            {results.map((r, i) => (
              <SearchResultItem
                key={`${r.book.id}-${r.sectionId}-${r.hadith.hadithnumber}`}
                result={r}
                onClick={() => setQuery("")}
              />
            ))}

            {searchDone && results.length === 0 && !searchError && (
              <div className="text-center py-12 space-y-2">
                <p className="text-muted-foreground text-sm">
                  No hadiths matched "{query}"
                  {selectedBook !== "all" && " in the selected collection"}.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Try different keywords or search across all collections.
                </p>
              </div>
            )}
          </motion.div>
        ) : (

          /* ── Collection grid ────────────────────────────────── */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {HADITH_BOOKS.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ────────────────────────────────────────────── */}
      {!isSearchMode && (
        <p className="text-xs text-muted-foreground/60 text-center leading-relaxed px-4">
          Data sourced from the open hadith dataset by Fawaz Ahmed — English translations
          from established scholarly editions. Arabic text included where available.
        </p>
      )}
    </div>
  );
}
