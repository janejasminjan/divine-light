import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Search, Loader2, AlertTriangle,
  Languages, X, RefreshCw, Copy, Check, BookMarked, Share2, Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  bookById,
  fetchBilingualSection,
  gradeColor,
  type HadithItem,
  type SectionResponse,
} from "@/lib/hadith-api";

/* ── Copy button ─────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy hadith text"
      className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ── ShareHadithCard ─────────────────────────────────────────────
   Inline styles only — required for reliable html2canvas rendering.
   ─────────────────────────────────────────────────────────────── */
function ShareHadithCard({
  text, bookName, bookNumber, hadithNumber,
}: {
  text: string; bookName: string; bookNumber: number | undefined; hadithNumber: number;
}) {
  const truncated = text.length > 320 ? text.slice(0, 317) + "…" : text;
  const bookRef = bookNumber !== undefined ? `Book ${bookNumber}` : bookName;

  return (
    <div style={{
      width: 360, fontFamily: "Outfit, sans-serif",
      background: "linear-gradient(150deg, #f7f1e4 0%, #ede5ce 100%)",
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Top gradient bar */}
      <div style={{ height: 5, background: "linear-gradient(90deg, #1a4a52, #c9a84c 50%, #1a4a52)" }} />

      {/* Header row */}
      <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 700, color: "#1a4a52" }}>QIYAM</div>
          <div style={{ fontSize: 11, color: "#5a7a82", marginTop: 2 }}>Hadith #{hadithNumber}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#1a4a52", fontWeight: 600, maxWidth: 180, lineHeight: 1.3 }}>{bookName}</div>
          <div style={{ fontSize: 11, color: "#c9a84c", marginTop: 3 }}>{bookRef} · #{hadithNumber}</div>
        </div>
      </div>

      {/* Hairline separator */}
      <div style={{ height: 1, margin: "0 20px", background: "linear-gradient(90deg, transparent, rgba(26,74,82,.2), transparent)" }} />

      {/* Ornamental opener */}
      <div style={{ textAlign: "center", color: "#c9a84c", padding: "14px 0 4px", fontSize: 13, letterSpacing: 8 }}>◆ ◆ ◆</div>

      {/* Hadith text */}
      <div style={{ padding: "4px 20px 20px" }}>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: "#3a5560", fontStyle: "italic" }}>
          "{truncated}"
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div style={{ height: 5, background: "linear-gradient(90deg, #1a4a52, #c9a84c 50%, #1a4a52)" }} />
    </div>
  );
}

/* ── ShareHadithModal ────────────────────────────────────────── */
function ShareHadithModal({
  text, bookName, bookNumber, hadithNumber, onClose,
}: {
  text: string; bookName: string; bookNumber: number | undefined; hadithNumber: number;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const buildBlob = async (): Promise<Blob> => {
    if (!cardRef.current) throw new Error("no ref");
    const h2c = (await import("html2canvas")).default;
    const canvas = await h2c(cardRef.current, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: null, logging: false,
    });
    return new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => (b ? res(b) : rej(new Error("toBlob"))), "image/png")
    );
  };

  const filename = `qiyam-hadith-${hadithNumber}.png`;

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await buildBlob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${bookName} — Hadith #${hadithNumber}`,
          text: `"${text}"\n\n— ${bookName}${bookNumber !== undefined ? `, Book ${bookNumber}` : ""}, Hadith #${hadithNumber} | Qiyam`,
        });
      } else {
        downloadBlob(blob, filename);
      }
    } catch { /* cancelled */ } finally { setBusy(false); }
  };

  const handleDownload = async () => {
    setBusy(true);
    try { downloadBlob(await buildBlob(), filename); }
    catch { } finally { setBusy(false); }
  };

  const handleCopy = () => {
    const txt = `"${text}"\n\n— ${bookName}${bookNumber !== undefined ? `, Book ${bookNumber}` : ""}, Hadith #${hadithNumber} | Qiyam`;
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">

        {/* Header */}
        <div className="px-5 py-3.5 flex items-center gap-3 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground flex-1">Share Hadith Card</h2>
          <span className="text-xs text-muted-foreground">{bookName} · #{hadithNumber}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>✕</Button>
        </div>

        {/* Card preview */}
        <div className="bg-muted/20 py-5 px-4 flex justify-center overflow-x-auto">
          <div style={{ boxShadow: "0 8px 40px rgba(0,0,0,.22)", borderRadius: 16, flexShrink: 0 }}>
            <div ref={cardRef}>
              <ShareHadithCard
                text={text} bookName={bookName}
                bookNumber={bookNumber} hadithNumber={hadithNumber}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 grid grid-cols-3 gap-2">
          <Button onClick={handleShare} disabled={busy} className="gap-1.5">
            {busy
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Share2 className="h-3.5 w-3.5" />}
            {busy ? "…" : "Share"}
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={busy} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Save PNG
          </Button>
          <Button variant="ghost" onClick={handleCopy} className="gap-1.5 text-xs px-2">
            {copied
              ? <><Check className="h-3.5 w-3.5 text-primary" /> Copied!</>
              : "Copy Text"}
          </Button>
        </div>

        {/* iOS safe area */}
        <div className="pb-safe sm:pb-0" />
      </div>
    </div>
  );
}

/* ── Hadith card ─────────────────────────────────────────────── */
function HadithCard({
  hadith,
  arabicText,
  showArabic,
  index,
  highlight,
  bookName,
  onShare,
}: {
  hadith: HadithItem;
  arabicText: string | null;
  showArabic: boolean;
  index: number;
  highlight: string;
  bookName: string;
  onShare: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const topGrade = hadith.grades[0];

  /* Scroll-to-anchor support: /hadith/bukhari/1#h42 */
  useEffect(() => {
    if (ref.current && window.location.hash === `#h${hadith.hadithnumber}`) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, [hadith.hadithnumber]);

  /* Highlighted snippet helper */
  const highlightText = (text: string): React.ReactNode => {
    if (!highlight.trim()) return text;
    const re = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  return (
    <motion.div
      ref={ref}
      id={`h${hadith.hadithnumber}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className="group rounded-2xl border border-border bg-card hover:border-primary/20 transition-all overflow-hidden"
    >
      {/* Card header: reference + grade + copy */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-full bg-primary/10 text-primary text-xs font-bold tabular-nums">
            {hadith.hadithnumber}
          </span>
          {hadith.reference.book && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              Book {hadith.reference.book}, #{hadith.reference.hadith}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {hadith.grades.map((g, i) => (
            <span key={i} className={`text-[10px] font-semibold ${gradeColor(g.grade)}`}>
              {g.grade}{g.name ? ` (${g.name})` : ""}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onShare}
            title="Share as image card"
            className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <CopyBtn text={hadith.text} />
        </div>
      </div>

      {/* Arabic text */}
      <AnimatePresence>
        {showArabic && arabicText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p
              className="font-arabic text-xl leading-[2] text-foreground/90 text-right px-4 py-3 border-t border-border/50 bg-primary/[0.02]"
              dir="rtl"
            >
              {arabicText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* English text */}
      <p className="text-sm text-foreground/90 leading-[1.8] px-4 py-3 border-t border-border/50">
        {highlightText(hadith.text)}
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function HadithReader() {
  const { bookId, sectionId } = useParams<{ bookId: string; sectionId: string }>();
  const sectionNum = parseInt(sectionId ?? "1", 10);
  const book = bookById(bookId ?? "");

  const [engData,    setEngData]    = useState<SectionResponse | null>(null);
  const [araData,    setAraData]    = useState<SectionResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [showArabic, setShowArabic] = useState(false);
  const [search,     setSearch]     = useState("");
  const [shareHadith, setShareHadith] = useState<HadithItem | null>(null);

  const sectionName = engData?.metadata.section[String(sectionNum)] ?? `Chapter ${sectionNum}`;

  /* ── Load section ────────────────────────────────────────────── */
  const load = async () => {
    if (!book) return;
    setLoading(true);
    setError(null);
    try {
      const { eng, ara } = await fetchBilingualSection(book, sectionNum);
      setEngData(eng);
      setAraData(ara);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load hadiths.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEngData(null);
    setAraData(null);
    setSearch("");
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, sectionId]);

  /* ── Arabic text lookup ──────────────────────────────────────── */
  const araMap = new Map<number, string>();
  araData?.hadiths.forEach(h => { araMap.set(h.hadithnumber, h.text); });

  /* ── Filter ──────────────────────────────────────────────────── */
  const q = search.trim().toLowerCase();
  const hadiths = engData?.hadiths ?? [];
  const filtered = q
    ? hadiths.filter(h => h.text.toLowerCase().includes(q))
    : hadiths;

  const prevSection = sectionNum > 1 ? sectionNum - 1 : null;
  const nextSection = book && sectionNum < book.sectionCount ? sectionNum + 1 : null;

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
    <>
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
        <Link href="/hadith">
          <button className="hover:text-primary transition-colors">Hadith</button>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/hadith/${book.id}`}>
          <button className="hover:text-primary transition-colors">{book.name}</button>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{sectionName}</span>
      </div>

      {/* ── Section header ────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookMarked className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{book.name} · Chapter {sectionNum}</p>
            <h1 className="text-xl font-serif font-bold text-primary leading-tight">{sectionName}</h1>
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search within this chapter…"
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

        <Button
          variant={showArabic ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowArabic(v => !v)}
          className="gap-1.5 flex-shrink-0"
          disabled={!araData}
          title={araData ? "Toggle Arabic text" : "Arabic text unavailable"}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">Arabic</span>
        </Button>
      </div>

      {/* ── Loading ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin opacity-50" />
          <p className="text-sm">Loading hadiths…</p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={load} className="flex-shrink-0 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* ── Hadith list ───────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {/* Count */}
          {search && (
            <p className="text-xs text-muted-foreground px-1">
              {filtered.length} hadith{filtered.length === 1 ? "" : "s"} match "{search}"
            </p>
          )}

          {!search && engData && (
            <p className="text-xs text-muted-foreground px-1">
              {hadiths.length} hadith{hadiths.length === 1 ? "" : "s"}
              {araData ? " · Arabic text available" : " · Arabic text unavailable"}
            </p>
          )}

          <div className="space-y-4">
            {filtered.map((h, i) => (
              <HadithCard
                key={h.hadithnumber}
                hadith={h}
                arabicText={araMap.get(h.hadithnumber) ?? null}
                showArabic={showArabic}
                index={i}
                highlight={search}
                bookName={book.name}
                onShare={() => setShareHadith(h)}
              />
            ))}
          </div>

          {filtered.length === 0 && search && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hadiths match "{search}" in this chapter.
            </div>
          )}

          {hadiths.length === 0 && !search && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hadiths in this chapter.
            </div>
          )}
        </>
      )}

      {/* ── Chapter navigation ────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {prevSection ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/hadith/${book.id}/${prevSection}`}>
                <ChevronLeft className="h-3.5 w-3.5" /> Chapter {prevSection}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/hadith/${book.id}`}>
                <ChevronLeft className="h-3.5 w-3.5" /> All Chapters
              </Link>
            </Button>
          )}

          <span className="text-xs text-muted-foreground tabular-nums">
            {sectionNum} / {book.sectionCount}
          </span>

          {nextSection ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/hadith/${book.id}/${nextSection}`}>
                Chapter {nextSection} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/hadith/${book.id}`}>
                All Chapters <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>

    {/* ── Share Hadith Modal ───────────────────────────────────── */}
    {shareHadith && book && (
      <ShareHadithModal
        text={shareHadith.text}
        bookName={book.name}
        bookNumber={shareHadith.reference.book}
        hadithNumber={shareHadith.hadithnumber}
        onClose={() => setShareHadith(null)}
      />
    )}
    </>
  );
}
