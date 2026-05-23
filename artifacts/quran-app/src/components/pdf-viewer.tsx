import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Download, ExternalLink, Loader2, AlertTriangle, Maximize2, Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  src: string;
  title?: string;
  downloadFilename?: string;
}

const ZOOM_STEP        = 0.25;
const ZOOM_MIN         = 0.25;
const ZOOM_MAX         = 4.0;
const SWIPE_THRESHOLD  = 40;  // px — minimum horizontal travel to trigger page turn
const LOCK_THRESHOLD   = 8;   // px — total movement before we lock gesture direction

export function PdfViewer({ src, downloadFilename = "document.pdf" }: PdfViewerProps) {
  const [numPages,    setNumPages]    = useState(0);
  const [pageNum,     setPageNum]     = useState(1);
  const [scale,       setScale]       = useState(1.0);
  const [autoFit,     setAutoFit]     = useState(false);
  const [zoomStr,     setZoomStr]     = useState("100");
  const [containerW,  setContainerW]  = useState(600);
  const [containerH,  setContainerH]  = useState(800);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  /* Two refs: outer wrapper for swipe, inner scrollable for size */
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);

  /* Ref-based mirror of numPages so swipe closure never goes stale */
  const numPagesRef  = useRef(0);
  useEffect(() => { numPagesRef.current = numPages; }, [numPages]);

  /* ── Measure the scrollable container ──────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width  > 0) setContainerW(width);
      if (height > 0) setContainerH(height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Swipe — direction-locked, attached in CAPTURE phase ───────
     Strategy:
       1. touchstart  → record origin
       2. touchmove   → once movement exceeds LOCK_THRESHOLD, commit to
                        "horizontal" or "vertical". For horizontal gestures
                        call preventDefault() so the browser never starts
                        a scroll — this is why the listener is NON-passive.
       3. touchend    → if locked horizontal and dx ≥ SWIPE_THRESHOLD → turn page
       4. touchcancel → reset (browser took over the gesture)
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let startX  = 0;
    let startY  = 0;
    let locked: "horizontal" | "vertical" | null = null;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      locked = null;
    };

    const onMove = (e: TouchEvent) => {
      if (locked) {
        /* Already decided — keep suppressing scroll for horizontal */
        if (locked === "horizontal") e.preventDefault();
        return;
      }
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx + dy < LOCK_THRESHOLD) return; /* not enough movement yet */

      if (dx >= dy) {
        locked = "horizontal";
        e.preventDefault(); /* prevent scroll from starting */
      } else {
        locked = "vertical"; /* let browser handle vertical scroll */
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (locked !== "horizontal") return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (dx > 0) {
        setPageNum((p) => Math.max(1, p - 1));           /* swipe right → prev */
      } else {
        setPageNum((p) => Math.min(numPagesRef.current, p + 1)); /* swipe left → next */
      }
      locked = null;
    };

    const onCancel = () => { locked = null; };

    /* capture:true — we see the event before any child element (including the pdf.js canvas) */
    /* onMove must be NON-passive so we can call preventDefault() */
    el.addEventListener("touchstart",  onStart,  { passive: true,  capture: true });
    el.addEventListener("touchmove",   onMove,   { passive: false, capture: true });
    el.addEventListener("touchend",    onEnd,    { passive: true,  capture: true });
    el.addEventListener("touchcancel", onCancel, { passive: true,  capture: true });

    return () => {
      el.removeEventListener("touchstart",  onStart,  { capture: true } as EventListenerOptions);
      el.removeEventListener("touchmove",   onMove,   { capture: true } as EventListenerOptions);
      el.removeEventListener("touchend",    onEnd,    { capture: true } as EventListenerOptions);
      el.removeEventListener("touchcancel", onCancel, { capture: true } as EventListenerOptions);
    };
  }, []);

  /* ── Keep zoom label in sync ────────────────────────────────── */
  useEffect(() => {
    if (!autoFit) setZoomStr(String(Math.round(scale * 100)));
  }, [scale, autoFit]);

  /* ── PDF load callbacks ─────────────────────────────────────── */
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    setLoading(false);
    setError(err.message ?? "Failed to load PDF.");
  }, []);

  /* ── Page navigation ────────────────────────────────────────── */
  const prev = useCallback(() => setPageNum((p) => Math.max(1, p - 1)), []);
  const next = useCallback(() => setPageNum((p) => Math.min(numPages, p + 1)), [numPages]);

  /* ── Zoom ───────────────────────────────────────────────────── */
  const zoomIn  = () => { setAutoFit(false); setScale((s) => Math.min(ZOOM_MAX, parseFloat((s + ZOOM_STEP).toFixed(2)))); };
  const zoomOut = () => { setAutoFit(false); setScale((s) => Math.max(ZOOM_MIN, parseFloat((s - ZOOM_STEP).toFixed(2)))); };

  const commitZoom = () => {
    const v = parseFloat(zoomStr);
    if (!isNaN(v) && v >= 25 && v <= 400) {
      setAutoFit(false);
      setScale(parseFloat((v / 100).toFixed(2)));
    } else {
      setZoomStr(String(Math.round(scale * 100)));
    }
  };

  const toggleAutoFit = () => {
    setAutoFit((f) => {
      if (!f) setZoomStr("Fit");
      else    setZoomStr(String(Math.round(scale * 100)));
      return !f;
    });
  };

  /* ── Derived page pixel size ────────────────────────────────── */
  const PAD       = 32;
  const pageWidth  = autoFit ? undefined : Math.max(80, (containerW - PAD) * scale);
  const pageHeight = autoFit ? Math.max(120, containerH - PAD) : undefined;

  return (
    /*
      No touch-action on the outer wrapper — we handle direction-locking
      ourselves in JS (onMove) and call preventDefault() for horizontal
      gestures before the browser can start a scroll.
      The inner scrollRef div gets touch-action: pan-y so the browser
      can still do native vertical scrolling when we don't intercept.
    */
    <div
      ref={wrapperRef}
      className="flex flex-col h-full"
    >
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40 flex-shrink-0">

        {/* Page navigation */}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={prev} disabled={pageNum <= 1 || loading}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[64px] text-center select-none tabular-nums">
          {loading ? "…" : `${pageNum} / ${numPages}`}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={next} disabled={pageNum >= numPages || loading}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Auto-fit toggle */}
        <Button
          variant={autoFit ? "secondary" : "ghost"}
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={toggleAutoFit}
          title={autoFit ? "Exit auto-fit" : "Fit page to screen"}
        >
          {autoFit ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Zoom out */}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={zoomOut} disabled={scale <= ZOOM_MIN || autoFit} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>

        {/* Editable zoom % */}
        {autoFit ? (
          <span className="text-xs text-muted-foreground w-10 text-center select-none">Fit</span>
        ) : (
          <input
            type="number"
            min={25} max={400} step={25}
            value={zoomStr}
            onChange={(e) => setZoomStr(e.target.value)}
            onBlur={commitZoom}
            onKeyDown={(e) => {
              if (e.key === "Enter") { commitZoom(); (e.target as HTMLInputElement).blur(); }
            }}
            className="w-12 h-6 text-center text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Type a zoom % and press Enter"
          />
        )}
        <span className="text-xs text-muted-foreground pr-0.5">%</span>

        {/* Zoom in */}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={zoomIn} disabled={scale >= ZOOM_MAX || autoFit} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Open / Download */}
        <Button asChild variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Open in new tab">
          <a href={src} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Download">
          <a href={src} download={downloadFilename}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* ── Scrollable page area ─────────────────────────────────── */}
      <div
        ref={scrollRef}
        className={`flex-1 bg-muted/30 flex flex-col items-center py-4 gap-4 ${
          autoFit ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
        }`}
        style={{ touchAction: "pan-y" }}
      >
        {error ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center max-w-sm mx-auto mt-12">
            <AlertTriangle className="h-10 w-10 text-destructive/60" />
            <p className="text-sm text-muted-foreground">Could not load the PDF.</p>
            <div className="flex gap-2 mt-1">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={src} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in browser
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={src} download={downloadFilename}>
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center gap-3 mt-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                <p className="text-sm">Loading booklet…</p>
              </div>
            }
            className="flex flex-col items-center gap-4"
          >
            <Page
              pageNumber={pageNum}
              width={pageWidth}
              height={pageHeight}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div
                  className="flex items-center justify-center"
                  style={{ width: pageWidth ?? 300, minHeight: 400 }}
                >
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                </div>
              }
              className="shadow-md rounded overflow-hidden"
            />
          </Document>
        )}
      </div>

      {/* ── Bottom nav bar ──────────────────────────────────────── */}
      {!loading && !error && numPages > 1 && (
        <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1"
            onClick={prev} disabled={pageNum <= 1}>
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            Page {pageNum} of {numPages}
          </span>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1"
            onClick={next} disabled={pageNum >= numPages}>
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
