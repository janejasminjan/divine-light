import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Search, Loader2, AlertTriangle,
  BookMarked, X, RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  bookById,
  fetchSectionsBatch,
  type HadithBook,
} from "@/lib/hadith-api";

/* ── Section data ────────────────────────────────────────────── */
interface ChapterInfo {
  sectionId: number;
  name: string;
  hadithFirst: number | null;
  hadithLast: number | null;
  loaded: boolean;
  failed: boolean;
}

const PAGE_SIZE = 15;

function buildSkeleton(from: number, to: number): ChapterInfo[] {
  return Array.from({ length: to - from + 1 }, (_, i) => ({
    sectionId: from + i,
    name: `Chapter ${from + i}`,
    hadithFirst: null,
    hadithLast: null,
    loaded: false,
    failed: false,
  }));
}

/* ── Chapter row ─────────────────────────────────────────────── */
function ChapterRow({
  chapter,
  bookId,
  index,
}: {
  chapter: ChapterInfo;
  bookId: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link href={`/hadith/${bookId}/${chapter.sectionId}`}>
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted/60 cursor-pointer transition-all group border border-transparent hover:border-border">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors tabular-nums">
            {chapter.sectionId}
          </div>

          <div className="flex-1 min-w-0">
            {chapter.loaded ? (
              <>
                <p className="font-medium text-foreground text-sm leading-tight">{chapter.name}</p>
                {chapter.hadithFirst !== null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hadith {chapter.hadithFirst}–{chapter.hadithLast}
                  </p>
                )}
              </>
            ) : chapter.failed ? (
              <p className="text-sm text-muted-foreground/60 italic">Chapter {chapter.sectionId}</p>
            ) : (
              <>
                <Skeleton className="h-4 w-48 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </>
            )}
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-primary/60 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function HadithBook() {
  const { bookId } = useParams<{ bookId: string }>();
  const book: HadithBook | undefined = bookById(bookId ?? "");

  const [chapters,   setChapters]   = useState<ChapterInfo[]>([]);
  const [page,       setPage]       = useState(1); // 1-indexed
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState("");

  const totalPages = book ? Math.ceil(book.sectionCount / PAGE_SIZE) : 1;
  const pageFrom   = (page - 1) * PAGE_SIZE + 1;
  const pageTo     = book ? Math.min(page * PAGE_SIZE, book.sectionCount) : PAGE_SIZE;

  /* ── Load chapters for current page ─────────────────────────── */
  const loadPage = useCallback(
    async (targetPage: number) => {
      if (!book) return;
      setLoading(true);
      setError(null);
      const from = (targetPage - 1) * PAGE_SIZE + 1;
      const to   = Math.min(targetPage * PAGE_SIZE, book.sectionCount);

      /* Placeholder entries so layout doesn't jump */
      setChapters(buildSkeleton(from, to));

      try {
        const data = await fetchSectionsBatch(book.engEdition, from, to, book);
        setChapters(
          data.map(d => ({
            sectionId:  d.sectionId,
            name:       d.name,
            hadithFirst: d.meta?.hadithnumber_first ?? null,
            hadithLast:  d.meta?.hadithnumber_last ?? null,
            loaded:     d.meta !== null || d.name !== `Chapter ${d.sectionId}`,
            failed:     d.meta === null && d.name === `Chapter ${d.sectionId}`,
          }))
        );
      } catch {
        setError("Failed to load chapters. Please retry.");
      } finally {
        setLoading(false);
      }
    },
    [book]
  );

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  const goPage = (p: number) => {
    setPage(p);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Filter ──────────────────────────────────────────────────── */
  const filtered = search.trim()
    ? chapters.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        String(c.sectionId).includes(search.trim())
      )
    : chapters;

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-muted-foreground">Collection not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/hadith"><ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back to Hadith</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <Link href="/hadith">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2 -ml-0.5">
            <ChevronLeft className="h-3.5 w-3.5" /> All Collections
          </button>
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
            <BookMarked className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary leading-tight">{book.name}</h1>
            <p className="font-arabic text-base text-primary/70 mt-0.5" dir="rtl">{book.arabicName}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mt-1">{book.description}</p>

        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
            {book.hadithCount.toLocaleString()} hadiths
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
            {book.sectionCount} books / chapters
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
            {book.compiler}
          </span>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chapters by name or number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-9 bg-card"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => loadPage(page)} className="flex-shrink-0 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* ── Chapter list ──────────────────────────────────────── */}
      <div className="space-y-1">
        {filtered.map((chapter, i) => (
          <ChapterRow key={chapter.sectionId} chapter={chapter} bookId={book.id} index={i} />
        ))}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No chapters match "{search}".
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      {!search && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goPage(page - 1)}
            disabled={page <= 1 || loading}
            className="gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => goPage(p)}
                disabled={loading}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages || loading}
            className="gap-1.5"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
