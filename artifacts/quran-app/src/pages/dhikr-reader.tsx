import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Languages, ZoomIn, ZoomOut, AlertTriangle, Check, BookOpen, Search, X, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/pdf-viewer";
import { DHIKR_COLLECTIONS, getCollection, type DhikrEntry, type DhikrSection } from "@/lib/dhikr-data";

/* ── Font size steps ──────────────────────────────────────────── */
const FONT_SIZES = [
  { label: "S",  arabic: "text-2xl",  lineHeight: "leading-[2.8]" },
  { label: "M",  arabic: "text-3xl",  lineHeight: "leading-[3.0]" },
  { label: "L",  arabic: "text-4xl",  lineHeight: "leading-[3.2]" },
];
const FONT_KEY      = "qiyam_dhikr_fontsize";
const TRANSLIT_KEY  = "qiyam_dhikr_translit";
const TRANSLATE_KEY = "qiyam_dhikr_translation";

/* ── Counter helpers ──────────────────────────────────────────── */
function useCounters() {
  const [counters, setCounters] = useState<Record<string, number>>({});
  const increment = useCallback((id: string, max: number) => {
    setCounters((prev) => ({
      ...prev,
      [id]: Math.min((prev[id] ?? 0) + 1, max),
    }));
  }, []);
  const reset = useCallback((id: string) => {
    setCounters((prev) => ({ ...prev, [id]: 0 }));
  }, []);
  return { counters, increment, reset };
}

/* ══════════════════════════════════════════════════════════════ */
/*  Entry card                                                    */
/* ══════════════════════════════════════════════════════════════ */
interface EntryCardProps {
  entry: DhikrEntry;
  index: number;
  fontSizeIdx: number;
  showTranslit: boolean;
  showTranslation: boolean;
  count: number;
  onIncrement: () => void;
  onReset: () => void;
}

function EntryCard({
  entry, index, fontSizeIdx, showTranslit, showTranslation, count, onIncrement, onReset,
}: EntryCardProps) {
  const sz      = FONT_SIZES[fontSizeIdx];
  const done    = count >= entry.count;
  const pct     = entry.count > 1 ? Math.min(count / entry.count, 1) : (done ? 1 : 0);

  /* Flagged entry — no arabic text, just a review notice */
  if (entry.flagged) {
    return (
      <div className="rounded-2xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/20 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">
              Pending manual entry
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-500 leading-relaxed">
              {entry.flagNote ?? entry.translation}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${
        done
          ? "border-primary/30 bg-primary/[0.03]"
          : "border-border bg-card"
      }`}
    >
      {/* Progress bar (top) */}
      {entry.count > 1 && (
        <div className="h-[3px] bg-border/50 relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Top row: index badge + repeat count + done mark */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <div className="flex items-center gap-2">
            {entry.count > 1 && (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                done
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary/15 text-secondary-foreground"
              }`}>
                × {entry.count}
              </span>
            )}
            {done && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-primary/15 p-1"
              >
                <Check className="h-3 w-3 text-primary" />
              </motion.span>
            )}
            {entry.isQuran && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Quran
              </span>
            )}
          </div>
        </div>

        {/* Arabic text */}
        <p
          dir="rtl"
          lang="ar"
          className={`font-arabic ${sz.arabic} ${sz.lineHeight} text-foreground text-right leading-loose`}
        >
          {entry.arabic}
        </p>

        {/* Transliteration */}
        <AnimatePresence>
          {showTranslit && entry.transliteration && (
            <motion.p
              key="translit"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{   opacity: 0, height: 0 }}
              className="text-sm italic text-muted-foreground leading-relaxed"
            >
              {entry.transliteration}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Translation */}
        <AnimatePresence>
          {showTranslation && (
            <motion.p
              key="translation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{   opacity: 0, height: 0 }}
              className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3"
            >
              {entry.translation}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Source + Counter row */}
        <div className="flex items-center justify-between pt-1">
          {entry.source ? (
            <p className="text-[11px] text-muted-foreground/60 truncate max-w-[55%]">
              {entry.source}
            </p>
          ) : (
            <span />
          )}

          {entry.count === 1 ? (
            /* Simple done button for single-recite entries */
            <button
              onClick={onIncrement}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                done
                  ? "bg-primary/15 text-primary cursor-default"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {done ? "✓ Done" : "Mark done"}
            </button>
          ) : (
            /* Tap-to-count for repeated entries */
            <button
              onClick={onIncrement}
              className={`group flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all select-none ${
                done
                  ? "bg-primary/15 text-primary cursor-default"
                  : "bg-secondary/20 text-secondary-foreground hover:bg-secondary/40 active:scale-95"
              }`}
            >
              <span className="tabular-nums">
                {count} / {entry.count}
              </span>
              {!done && (
                <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  tap ↑
                </span>
              )}
            </button>
          )}
        </div>

        {/* Reset link (shows when partially or fully done) */}
        {count > 0 && (
          <div className="flex justify-end">
            <button
              onClick={onReset}
              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  Section                                                       */
/* ══════════════════════════════════════════════════════════════ */
interface SectionBlockProps {
  section: DhikrSection;
  fontSizeIdx: number;
  showTranslit: boolean;
  showTranslation: boolean;
  counters: Record<string, number>;
  onIncrement: (id: string, max: number) => void;
  onReset: (id: string) => void;
}

function SectionBlock({ section, fontSizeIdx, showTranslit, showTranslation, counters, onIncrement, onReset }: SectionBlockProps) {
  return (
    <div id={`section-${section.id}`} className="scroll-mt-36 space-y-4">
      {/* Section header */}
      <div className="flex items-baseline gap-3">
        <h2 className="font-semibold text-foreground text-base">{section.title}</h2>
        {section.arabicTitle && (
          <span className="font-arabic text-lg text-primary/70" dir="rtl">
            {section.arabicTitle}
          </span>
        )}
      </div>
      {section.description && (
        <p className="text-xs text-muted-foreground -mt-2">{section.description}</p>
      )}

      {section.entries.map((entry, idx) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          index={idx}
          fontSizeIdx={fontSizeIdx}
          showTranslit={showTranslit}
          showTranslation={showTranslation}
          count={counters[entry.id] ?? 0}
          onIncrement={() => onIncrement(entry.id, entry.count)}
          onReset={() => onReset(entry.id)}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  Reader page                                                   */
/* ══════════════════════════════════════════════════════════════ */
export default function DhikrReader() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const collection = getCollection(collectionId ?? "");

  /* Settings — persisted */
  const [fontSizeIdx, setFontSizeIdx] = useState<number>(() => {
    const stored = localStorage.getItem(FONT_KEY);
    const n = Number(stored);
    return isNaN(n) || n < 0 || n >= FONT_SIZES.length ? 1 : n;
  });
  const [showTranslit, setShowTranslit] = useState<boolean>(() => {
    return localStorage.getItem(TRANSLIT_KEY) !== "false";
  });
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    return localStorage.getItem(TRANSLATE_KEY) !== "false";
  });
  const [activeSection, setActiveSection] = useState<string>("");
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchOpen, setSearchOpen]       = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* Counter */
  const { counters, increment, reset } = useCounters();

  /* Sync to localStorage */
  useEffect(() => { localStorage.setItem(FONT_KEY,      String(fontSizeIdx));  }, [fontSizeIdx]);
  useEffect(() => { localStorage.setItem(TRANSLIT_KEY,  String(showTranslit)); }, [showTranslit]);
  useEffect(() => { localStorage.setItem(TRANSLATE_KEY, String(showTranslation)); }, [showTranslation]);

  /* Focus search input when opened */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  /* Filtered entries for search — match against arabic, transliteration, translation */
  const searchResults = useMemo<Array<{ entry: DhikrEntry; sectionTitle: string }>>(() => {
    if (!collection || !searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const results: Array<{ entry: DhikrEntry; sectionTitle: string }> = [];
    for (const section of collection.sections) {
      for (const entry of section.entries) {
        const haystack = [
          entry.arabic,
          entry.transliteration ?? "",
          entry.translation,
          entry.source ?? "",
        ].join(" ").toLowerCase();
        if (haystack.includes(q)) {
          results.push({ entry, sectionTitle: section.title });
        }
      }
    }
    return results;
  }, [collection, searchQuery]);

  const isSearching = searchOpen && searchQuery.trim().length > 0;

  /* Set initial active section */
  useEffect(() => {
    if (collection?.sections[0]) setActiveSection(collection.sections[0].id);
  }, [collection]);

  /* Scroll to section */
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* Intersection observer to track active section while scrolling */
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    if (!collection) return;
    observerRef.current?.disconnect();
    const entries = collection.sections.map((s) => document.getElementById(`section-${s.id}`)).filter(Boolean) as HTMLElement[];
    observerRef.current = new IntersectionObserver(
      (obs) => {
        const visible = obs.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace("section-", "");
          setActiveSection(id);
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    entries.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [collection]);

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Collection not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dhikr">Back to Dhikr</Link>
        </Button>
      </div>
    );
  }

  /* ── PDF viewer mode ─────────────────────────────────────────── */
  if (collection.pdfPath) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Sticky header — same style as normal reader */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -ml-1">
              <Link href="/dhikr">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground text-sm truncate leading-tight">
                {collection.title}
              </h1>
              <p className="text-xs text-muted-foreground font-arabic truncate">
                {collection.arabicTitle}
              </p>
            </div>
          </div>
          {/* Subtitle strip */}
          <div className="px-4 pb-2.5 flex items-center gap-2">
            <span className="text-lg">{collection.icon}</span>
            <div>
              <p className="text-xs font-medium text-primary">{collection.subtitle}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{collection.description}</p>
            </div>
          </div>
        </div>

        {/* Canvas PDF viewer fills remaining height */}
        <div className="flex-1 min-h-0">
          <PdfViewer
            src={collection.pdfPath}
            title={collection.title}
            downloadFilename="Aurad-e-Fathiya.pdf"
          />
        </div>
      </div>
    );
  }

  /* Overall session progress */
  const totalGoal    = collection.sections.flatMap((s) => s.entries).filter((e) => !e.flagged).reduce((a, e) => a + e.count, 0);
  const totalDone    = collection.sections.flatMap((s) => s.entries).filter((e) => !e.flagged).reduce((a, e) => a + Math.min(counters[e.id] ?? 0, e.count), 0);
  const progressPct  = totalGoal > 0 ? (totalDone / totalGoal) * 100 : 0;

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        {/* Title row */}
        <AnimatePresence mode="wait">
          {searchOpen ? (
            /* ── Search input row ─────────────────────────────── */
            <motion.div
              key="search-row"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 px-4 py-3"
            >
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search duas by keyword…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="rounded-full p-1 hover:bg-muted transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </motion.div>
          ) : (
            /* ── Normal title row ─────────────────────────────── */
            <motion.div
              key="title-row"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -ml-1">
                <Link href="/dhikr">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-foreground text-sm truncate leading-tight">
                  {collection.icon} {collection.title}
                </h1>
                <p className="font-arabic text-sm text-primary/70 leading-tight" dir="rtl">
                  {collection.arabicTitle}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Search */}
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  title="Search duas"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
                {/* Font size */}
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  title="Decrease font"
                  disabled={fontSizeIdx === 0}
                  onClick={() => setFontSizeIdx((i) => Math.max(0, i - 1))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  title="Increase font"
                  disabled={fontSizeIdx === FONT_SIZES.length - 1}
                  onClick={() => setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                {/* Transliteration toggle */}
                <button
                  title={showTranslit ? "Hide transliteration" : "Show transliteration"}
                  onClick={() => setShowTranslit((v) => !v)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium italic tracking-wide transition-colors ${
                    showTranslit
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  abc
                </button>
                {/* Translation toggle */}
                <button
                  title={showTranslation ? "Hide translation" : "Show translation"}
                  onClick={() => setShowTranslation((v) => !v)}
                  className={`rounded-lg p-1.5 transition-colors ${
                    showTranslation
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Languages className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session progress bar — hide during search */}
        {totalGoal > 0 && !searchOpen && (
          <div className="px-4 pb-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary/50 rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 26 }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
              {totalDone}/{totalGoal}
            </span>
          </div>
        )}

        {/* Section tabs — hide during search */}
        {!searchOpen && (
          <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
            {collection.sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeSection === sec.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-10 pb-16">

        <AnimatePresence mode="wait">
          {isSearching ? (
            /* ── Search results ─────────────────────────────── */
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <p className="text-xs text-muted-foreground">
                {searchResults.length === 0
                  ? `No results for "${searchQuery}"`
                  : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} for "${searchQuery}"`}
              </p>

              {searchResults.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Search className="h-10 w-10 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    Try a different keyword, transliteration, or Quran reference.
                  </p>
                </div>
              )}

              {searchResults.map(({ entry, sectionTitle }, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {/* Section label */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 pl-0.5">
                    {sectionTitle}
                  </p>
                  <EntryCard
                    entry={entry}
                    index={i}
                    fontSizeIdx={fontSizeIdx}
                    showTranslit={showTranslit}
                    showTranslation={showTranslation}
                    count={counters[entry.id] ?? 0}
                    onIncrement={() => increment(entry.id, entry.count)}
                    onReset={() => reset(entry.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* ── Normal section view ────────────────────────── */
            <motion.div
              key="section-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-10"
            >
              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
                {collection.description}
              </p>

              {/* Sections */}
              {collection.sections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  fontSizeIdx={fontSizeIdx}
                  showTranslit={showTranslit}
                  showTranslation={showTranslation}
                  counters={counters}
                  onIncrement={increment}
                  onReset={reset}
                />
              ))}

              {/* Closing note */}
              <div className="text-center py-6 space-y-1">
                <div className="font-arabic text-2xl text-primary/60 leading-loose" dir="rtl">
                  آمِينَ
                </div>
                <p className="text-xs text-muted-foreground">May Allah accept.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
