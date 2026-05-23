import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { useParams, Link, useSearch, useLocation } from "wouter";
import { useTranslationPreference } from "@/hooks/use-translation-preference";
import { saveDailyPosition } from "@/hooks/use-daily-position";
import { useQuranScript, QURAN_SCRIPTS, type QuranScriptId } from "@/hooks/use-quran-script";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAddToMemorizationPlan,
  useGetMemorizationPlan,
  getGetMemorizationPlanQueryKey,
  useCreateBookmark,
  useDeleteBookmark,
  useGetBookmarks,
  getGetBookmarksQueryKey,
  useGetUserProfile,
  getGetUserProfileQueryKey,
  useLogActivity,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, SkipBack, SkipForward, Square, Repeat, Repeat1,
  BookmarkPlus, BookmarkCheck, Brain, ChevronLeft, ChevronRight, Loader2,
  Eye, EyeOff, Languages, ChevronDown, Check, Type, CheckCircle2, Mic, Wand2,
  Share2, Download, Settings2, Minus, Plus, BookOpen, AlignJustify, Info, ALargeSmall,
  Hash, ChevronsUpDown,
} from "lucide-react";
import { SURAH_INFO } from "@/lib/surah-info";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  CommandDialog, CommandInput, CommandList, CommandItem, CommandEmpty,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  TajweedSettings, TajweedLegendBar, TajweedRulePopup,
} from "@/components/tajweed-settings";
import {
  getRuleFromElement, type TajweedRule, type TajweedThemeId,
} from "@/lib/tajweed-rules";

const AUTO_BOOKMARK_NOTE = "__daily_auto__";

/* ── Types ───────────────────────────────────────────────────── */
interface AlquranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface AlquranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: AlquranAyah[];
}

type RepeatMode = "none" | "ayah" | "surah";

/* ── Bismillah helpers ───────────────────────────────────────── */
// Arabic diacritics + full Uthmanic combining marks (no 'g' — for single-char test)
const DIAC_TEST = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/;
const DIAC_RE   = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;
// Normalise text for Bismillah comparison — unify Alef variants → ا, Farsi/Alef-maksura Yeh → ي
const ALEF_RE   = /[\u0622\u0623\u0625\u0671]/g;
const YEH_RE    = /[\u06CC\u0649]/g; // Farsi Yeh & Alef Maksura → ي
const BISMILLAH_BARE = 'بسم الله الرحمن الرحيم';

function normBare(s: string): string {
  return s.replace(DIAC_RE, '').replace(ALEF_RE, 'ا').replace(YEH_RE, 'ي').replace(/\u0640/g, '');
}
function normChar(ch: string): string {
  if (/[\u0622\u0623\u0625\u0671]/.test(ch)) return 'ا';
  if (/[\u06CC\u0649]/.test(ch)) return 'ي';
  return ch;
}

/** Strip the Bismillah prefix (بسم الله الرحمن الرحيم) from the beginning
 *  of an ayah text as returned by alquran.cloud (Uthmanic script). Uses a
 *  character-walk to handle any diacritic / Yeh variant correctly.      */
function stripBismillahPrefix(text: string): string {
  if (!normBare(text).trimStart().startsWith(BISMILLAH_BARE)) return text;

  let ti = 0, oi = 0;
  while (oi < text.length && ti < BISMILLAH_BARE.length) {
    const ch = text[oi];
    if (ch === '\u0640' || DIAC_TEST.test(ch)) { oi++; continue; }
    if (normChar(ch) === BISMILLAH_BARE[ti]) ti++;
    oi++;
  }
  // Skip trailing diacritics + whitespace
  while (oi < text.length && (DIAC_TEST.test(text[oi]) || /\s/.test(text[oi]) || text[oi] === '\u0640')) oi++;
  return text.slice(oi);
}

/* ── Translations catalogue ──────────────────────────────────── */
interface TranslationOption {
  key: string;
  label: string;
  lang: string;
  dir: "ltr" | "rtl";
}

const TRANSLATIONS: TranslationOption[] = [
  { key: "en.asad",          label: "Muhammad Asad",           lang: "English",  dir: "ltr" },
  { key: "en.sahih",         label: "Sahih International",     lang: "English",  dir: "ltr" },
  { key: "en.pickthall",     label: "Pickthall",               lang: "English",  dir: "ltr" },
  { key: "en.yusufali",      label: "Yusuf Ali",               lang: "English",  dir: "ltr" },
  { key: "ur.jawadi",        label: "Jawadi",                  lang: "اردو",     dir: "rtl" },
  { key: "ur.ahmedali",      label: "Ahmed Ali",               lang: "اردو",     dir: "rtl" },
  { key: "fr.hamidullah",    label: "Hamidullah",              lang: "Français", dir: "ltr" },
  { key: "es.bornez",        label: "Bornez",                  lang: "Español",  dir: "ltr" },
  { key: "tr.diyanet",       label: "Diyanet İşleri",          lang: "Türkçe",   dir: "ltr" },
  { key: "de.bubenheim",     label: "Bubenheim & Elyas",       lang: "Deutsch",  dir: "ltr" },
  { key: "id.indonesian",    label: "Indonesian Ministry",     lang: "Indonesia",dir: "ltr" },
  { key: "zh.majian",        label: "Ma Jian",                 lang: "中文",     dir: "ltr" },
];

/* ── Audio offsets ───────────────────────────────────────────── */
const SURAH_AYAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];
const SURAH_OFFSETS: number[] = [0];
for (let i = 0; i < SURAH_AYAH_COUNTS.length - 1; i++) {
  SURAH_OFFSETS.push(SURAH_OFFSETS[i] + SURAH_AYAH_COUNTS[i]);
}

/* ── Per-reciter CDN bitrate (some are 64 kbps-only on this CDN) */
const RECITER_BITRATE: Record<string, 64 | 128> = {
  "ar.abdurrahmaansudais": 64,
  "ar.abdullahbasfar":     64,
  "ar.hanirifai":          64,
  "ar.saoodshuraym":       64,
  "ar.minshawimujawwad":   64,
};

function getAudioUrl(surahId: number, ayahNumber: number, reciter: string) {
  const bitrate = RECITER_BITRATE[reciter] ?? 128;
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${SURAH_OFFSETS[surahId - 1] + ayahNumber}.mp3`;
}

/* ── Tajweed helpers ─────────────────────────────────────────── */
type TajweedWord = { html: string; type: string };

function sanitizeTajweed(raw: string): string {
  return raw
    .replace(/<rule class="?([^">\s]+)"?>/g, '<span class="tj-$1">')
    .replace(/<\/rule>/g, '</span>');
}

function toEasternArabic(n: number): string {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
}

/* ── Nihāyat al-Āyah (۝) — traditional Uthmani end-of-verse marker ─
   Rendered as an SVG rosette matching classical mushaf typography.
   The number appears in Eastern Arabic numerals at the centre.
   ────────────────────────────────────────────────────────────────── */
function AyahMarker({ number }: { number: number }) {
  const eastern = toEasternArabic(number);
  const numLen  = number.toString().length;
  const fontSize = numLen >= 3 ? 6.8 : numLen === 2 ? 8.2 : 9.8;

  /* 8 petal tips on the outer ring — cardinal (N/S/E/W) are larger */
  const petals: { angle: number; big: boolean }[] = [
    { angle: 270, big: true  }, // N
    { angle: 90,  big: true  }, // S
    { angle: 0,   big: true  }, // E
    { angle: 180, big: true  }, // W
    { angle: 315, big: false }, // NE
    { angle: 45,  big: false }, // SE
    { angle: 225, big: false }, // SW
    { angle: 135, big: false }, // NW
  ];

  const cx = 18, cy = 18, R = 17; // viewBox 36×36, centre (18,18)

  const petalEl = petals.map(({ angle, big }) => {
    const rad  = (angle * Math.PI) / 180;
    const tipR = big ? R - 0.4 : R - 1.2;
    const tx = cx + tipR * Math.cos(rad);
    const ty = cy + tipR * Math.sin(rad);
    /* each petal is a small diamond pointing outward */
    const halfW = big ? 1.55 : 1.1;
    const halfH = big ? 3.0  : 2.1;
    /* perpendicular axis */
    const px = -Math.sin(rad);
    const py =  Math.cos(rad);
    /* radial axis */
    const rx = Math.cos(rad);
    const ry = Math.sin(rad);
    const innerR = big ? 11.8 : 12.4;
    const baseX = cx + innerR * Math.cos(rad);
    const baseY = cy + innerR * Math.sin(rad);
    const d = [
      `M ${tx} ${ty}`,
      `L ${baseX + halfW * px} ${baseY + halfW * py}`,
      /* inner point of petal — slightly recessed */
      `L ${cx + (innerR - halfH * 0.55) * rx} ${cy + (innerR - halfH * 0.55) * ry}`,
      `L ${baseX - halfW * px} ${baseY - halfW * py}`,
      "Z",
    ].join(" ");
    return <path key={angle} d={d} fill="currentColor" fillOpacity={big ? 0.78 : 0.58} />;
  });

  return (
    <span
      dir="ltr"
      aria-label={`End of ayah ${number}`}
      className="inline-block shrink-0 select-none text-primary mx-1.5"
      style={{ width: "1.55em", height: "1.55em", verticalAlign: "middle" }}
    >
      <svg viewBox="0 0 36 36" width="100%" height="100%" aria-hidden>
        {/* Outer guide ring — very faint */}
        <circle cx={cx} cy={cy} r={R - 0.5} fill="none"
          stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.22" />

        {/* Petal rosette */}
        {petalEl}

        {/* Mid ring separating petals from centre text area */}
        <circle cx={cx} cy={cy} r="11.0" fill="currentColor" fillOpacity="0.07"
          stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.60" />

        {/* Inner fill for contrast behind the numeral */}
        <circle cx={cx} cy={cy} r="9.6" fill="currentColor" fillOpacity="0.06" />

        {/* Eastern Arabic numeral */}
        <text
          x={cx} y={cy + fontSize * 0.38}
          textAnchor="middle"
          fontFamily="Amiri, Georgia, serif"
          fontSize={fontSize}
          fill="currentColor"
          fontWeight="700"
          letterSpacing="0"
        >
          {eastern}
        </text>
      </svg>
    </span>
  );
}

/* ── Download helper ─────────────────────────────────────────── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ── Canvas2D card renderer ──────────────────────────────────────
   Draws the share card directly onto an offscreen canvas. This
   avoids every html2canvas limitation (CORS fonts, CSS vars, etc.)
   because we use the browser's native text engine directly.
   ─────────────────────────────────────────────────────────────── */
async function generateCardBlob(props: {
  arabic: string; translation: string; surahName: string;
  surahNameAr: string; ayahNum: number; surahNum: number;
}): Promise<Blob> {
  await document.fonts.ready;

  const { arabic, translation, surahName, surahNameAr, ayahNum, surahNum } = props;
  const W   = 360;
  const PAD = 20;
  const IW  = W - PAD * 2;
  const DPR = 2;

  /* word-wrap helper — works for both LTR and RTL */
  function wrapLine(text: string, fontStr: string, maxW: number): string[] {
    const tmp = document.createElement("canvas");
    const mc  = tmp.getContext("2d")!;
    mc.font   = fontStr;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      if (cur && mc.measureText(candidate).width > maxW) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }

  const ARABIC_SZ  = 26;
  const ARABIC_LH  = ARABIC_SZ * 2.1;
  const TRANS_SZ   = 13;
  const TRANS_LH   = TRANS_SZ * 1.8;

  const arabicFont = `${ARABIC_SZ}px "Amiri", serif`;
  const transFont  = `italic ${TRANS_SZ}px "Outfit", sans-serif`;

  const arabicLines = wrapLine(arabic, arabicFont, IW);
  const transLines  = translation ? wrapLine(`"${translation}"`, transFont, IW) : [];

  const TOP_BAR    = 5;
  const HEADER_H   = 58;
  const DIV_H      = 1;
  const AR_TOP     = 22;
  const AR_BOT     = 8;
  const ORNAMENT_H = 36;
  const TRANS_H    = transLines.length ? 8 + transLines.length * TRANS_LH + 20 : 16;
  const BOT_BAR    = 5;

  const TOTAL_H =
    TOP_BAR + HEADER_H + DIV_H + AR_TOP +
    arabicLines.length * ARABIC_LH + AR_BOT +
    ORNAMENT_H + TRANS_H + BOT_BAR;

  const canvas  = document.createElement("canvas");
  canvas.width  = Math.round(W * DPR);
  canvas.height = Math.round(TOTAL_H * DPR);
  const ctx     = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  const accentGrad = () => {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "#1a4a52"); g.addColorStop(0.5, "#c9a84c"); g.addColorStop(1, "#1a4a52");
    return g;
  };

  let y = 0;

  /* background */
  const bg = ctx.createLinearGradient(0, 0, W * 0.7, TOTAL_H);
  bg.addColorStop(0, "#f7f1e4"); bg.addColorStop(1, "#ede5ce");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, TOTAL_H);

  /* top accent bar */
  ctx.fillStyle = accentGrad();
  ctx.fillRect(0, y, W, TOP_BAR);
  y += TOP_BAR;

  /* header */
  ctx.textBaseline = "top";

  ctx.font = `bold 10px "Outfit", sans-serif`;
  ctx.fillStyle = "#1a4a52";
  ctx.textAlign = "left";
  ctx.fillText("QIYAM", PAD, y + 14);

  ctx.font = `11px "Outfit", sans-serif`;
  ctx.fillStyle = "#5a7a82";
  ctx.fillText(`${surahName} · Ayah ${ayahNum}`, PAD, y + 30);

  ctx.font = `bold 16px "Amiri", serif`;
  ctx.fillStyle = "#1a4a52";
  ctx.textAlign = "right";
  ctx.fillText(surahNameAr, W - PAD, y + 14);

  ctx.font = `12px "Amiri", serif`;
  ctx.fillStyle = "#c9a84c";
  ctx.fillText(`${surahNum}:${ayahNum}`, W - PAD, y + 32);

  y += HEADER_H;

  /* hairline divider */
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  divGrad.addColorStop(0, "rgba(26,74,82,0)");
  divGrad.addColorStop(0.5, "rgba(26,74,82,0.22)");
  divGrad.addColorStop(1, "rgba(26,74,82,0)");
  ctx.fillStyle = divGrad;
  ctx.fillRect(PAD, y, IW, DIV_H);
  y += DIV_H + AR_TOP;

  /* Arabic text — RTL, right-aligned */
  ctx.font = arabicFont;
  ctx.fillStyle = "#1a2e33";
  ctx.textAlign = "right";
  (ctx as CanvasRenderingContext2D & { direction: string }).direction = "rtl";
  for (const line of arabicLines) {
    ctx.fillText(line, W - PAD, y);
    y += ARABIC_LH;
  }
  y += AR_BOT;
  (ctx as CanvasRenderingContext2D & { direction: string }).direction = "ltr";

  /* ornament — draw three diamonds with spacing */
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#c9a84c";
  ctx.textAlign = "center";
  ctx.fillText("◆  ◆  ◆", W / 2, y + 10);
  y += ORNAMENT_H;

  /* translation */
  if (transLines.length) {
    y += 8;
    ctx.font = transFont;
    ctx.fillStyle = "#3a5560";
    ctx.textAlign = "left";
    for (const line of transLines) {
      ctx.fillText(line, PAD, y);
      y += TRANS_LH;
    }
    y += 20;
  } else {
    y += 16;
  }

  /* bottom accent bar */
  ctx.fillStyle = accentGrad();
  ctx.fillRect(0, y, W, BOT_BAR);

  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error("toBlob"))), "image/png")
  );
}

/* ── ShareAyahCard ───────────────────────────────────────────────
   Preview only — PNG generation uses generateCardBlob() above.
   ─────────────────────────────────────────────────────────────── */
function ShareAyahCard({
  arabic, translation, surahName, surahNameAr, ayahNum, surahNum,
}: {
  arabic: string; translation: string; surahName: string;
  surahNameAr: string; ayahNum: number; surahNum: number;
}) {
  return (
    <div style={{
      width: 360, fontFamily: "Outfit, sans-serif",
      background: "linear-gradient(150deg, #f7f1e4 0%, #ede5ce 100%)",
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Top gradient bar */}
      <div style={{ height: 5, background: "linear-gradient(90deg, #1a4a52, #c9a84c 50%, #1a4a52)" }} />

      {/* Header row: branding left, surah name right */}
      <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 700, color: "#1a4a52" }}>QIYAM</div>
          <div style={{ fontSize: 11, color: "#5a7a82", marginTop: 2 }}>{surahName} · Ayah {ayahNum}</div>
        </div>
        <div style={{ textAlign: "right", direction: "rtl" }}>
          <div style={{ fontFamily: "Amiri, serif", fontSize: 16, color: "#1a4a52", fontWeight: 600 }}>{surahNameAr}</div>
          <div style={{ fontFamily: "Amiri, serif", fontSize: 12, color: "#c9a84c", marginTop: 2 }}>{surahNum}:{ayahNum}</div>
        </div>
      </div>

      {/* Hairline separator */}
      <div style={{ height: 1, margin: "0 20px", background: "linear-gradient(90deg, transparent, rgba(26,74,82,.2), transparent)" }} />

      {/* Arabic text */}
      <div style={{ padding: "20px 20px 8px", direction: "rtl", textAlign: "right" }}>
        <div style={{ fontFamily: "Amiri, serif", fontSize: 26, lineHeight: 2.0, color: "#1a2e33" }}>
          {arabic}
        </div>
      </div>

      {/* Ornamental divider */}
      <div style={{ textAlign: "center", color: "#c9a84c", padding: "8px 0", fontSize: 13, letterSpacing: 8 }}>
        ◆ ◆ ◆
      </div>

      {/* Translation */}
      {translation && (
        <div style={{ padding: "4px 20px 20px" }}>
          <div style={{ fontSize: 13, lineHeight: 1.75, color: "#3a5560", fontStyle: "italic" }}>
            "{translation}"
          </div>
        </div>
      )}

      {/* Bottom gradient bar */}
      <div style={{ height: 5, background: "linear-gradient(90deg, #1a4a52, #c9a84c 50%, #1a4a52)", marginTop: translation ? 0 : 16 }} />
    </div>
  );
}

/* ── ShareAyahModal ─────────────────────────────────────────── */
function ShareAyahModal({
  surahNum, ayahNum, arabic, translation, surahName, surahNameAr, onClose,
}: {
  surahNum: number; ayahNum: number; arabic: string; translation: string;
  surahName: string; surahNameAr: string; onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // Store clipboard reference before any navigator narrowing
  const clipboardRef = useRef(navigator.clipboard);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  /* Card props forwarded to the Canvas2D renderer */
  const cardProps = { arabic, translation, surahName, surahNameAr, ayahNum, surahNum };

  const handleShare = async () => {
    const shareText = `${arabic}${translation ? `\n\n"${translation}"` : ""}\n\n— ${surahName}, Ayah ${ayahNum} (${surahNum}:${ayahNum}) | Qiyam`;
    const shareTitle = `Quran ${surahNum}:${ayahNum}`;

    if ("share" in navigator) {
      setBusy(true);
      try {
        // Try to share the PNG card if the device supports file sharing
        const testFile = new File([], "t.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [testFile] })) {
          const blob = await generateCardBlob(cardProps);
          const file = new File([blob], `qiyam-${surahNum}-${ayahNum}.png`, { type: "image/png" });
          await navigator.share({ files: [file], title: shareTitle, text: shareText });
        } else {
          await navigator.share({ title: shareTitle, text: shareText });
        }
      } catch { /* user cancelled */ } finally { setBusy(false); }
    } else {
      // Desktop: copy text to clipboard and show feedback
      clipboardRef.current.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await generateCardBlob(cardProps);
      downloadBlob(blob, `qiyam-${surahNum}-${ayahNum}.png`);
    } catch (e) {
      console.warn("Save PNG failed:", e);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = () => {
    const txt = `${arabic}\n\n"${translation}"\n\n— ${surahName}, Ayah ${ayahNum} (${surahNum}:${ayahNum}) | Qiyam`;
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
          <h2 className="font-semibold text-sm text-foreground flex-1">Share Ayah Card</h2>
          <span className="text-xs text-muted-foreground">{surahName} · {surahNum}:{ayahNum}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>✕</Button>
        </div>

        {/* Card preview — shadow wrapper is outside capture target */}
        <div className="bg-muted/20 py-5 px-4 flex justify-center overflow-x-auto">
          <div style={{ boxShadow: "0 8px 40px rgba(0,0,0,.22)", borderRadius: 16, flexShrink: 0 }}>
            <div ref={cardRef}>
              <ShareAyahCard
                arabic={arabic} translation={translation}
                surahName={surahName} surahNameAr={surahNameAr}
                ayahNum={ayahNum} surahNum={surahNum}
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
            {busy ? "…" : ("share" in navigator ? "Share" : "Copy")}
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={busy} className="gap-1.5">
            {busy
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
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

/* ── SurahInfoModal ──────────────────────────────────────────── */
function SurahInfoModal({
  surah, onClose,
}: {
  surah: AlquranSurah;
  onClose: () => void;
}) {
  const info = SURAH_INFO[surah.number];

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const revelationColor =
    surah.revelationType === "Meccan"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-start gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Surah {surah.number}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${revelationColor}`}>
                {surah.revelationType}
              </span>
            </div>
            <h2 className="font-bold text-lg text-foreground leading-tight mt-0.5">
              {surah.englishName}
            </h2>
            <p className="text-sm text-muted-foreground">{surah.englishNameTranslation}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-arabic text-2xl text-primary leading-none">{surah.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{surah.numberOfAyahs} Ayahs</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 self-start" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Stats strip */}
        <div className="px-5 py-3 flex items-center gap-4 bg-muted/30 border-b border-border flex-shrink-0">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Ayahs</p>
            <p className="text-sm font-semibold text-foreground">{surah.numberOfAyahs}</p>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Revelation</p>
            <p className="text-sm font-semibold text-foreground">{surah.revelationType}</p>
          </div>
          {info && (
            <>
              <div className="w-px h-6 bg-border" />
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  {info.juz.length === 1 ? "Juz" : "Juz"}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {info.juz.length === 1
                    ? info.juz[0]
                    : `${info.juz[0]}–${info.juz[info.juz.length - 1]}`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {info?.nameOrigin && (
            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Name Origin
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{info.nameOrigin}</p>
            </section>
          )}

          {info?.theme && (
            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Themes &amp; Content
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{info.theme}</p>
            </section>
          )}

          {info?.context && (
            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Historical Context
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{info.context}</p>
            </section>
          )}

          {info?.notable && (
            <section className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1.5">
                Notable
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{info.notable}</p>
            </section>
          )}

          {!info && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No additional information available for this surah.
            </p>
          )}
        </div>

        {/* iOS safe area */}
        <div className="pb-safe sm:pb-0 flex-shrink-0" />
      </div>
    </div>
  );
}

/* ── Word-timing support map (qurancdn reciter IDs) ─────────── */
type WordTiming  = [number, number]; // [start_ms, end_ms] — absolute within surah audio
// Per-verse timing entry from QuranCDN
type VerseTimingEntry = { from: number; to: number; segments: WordTiming[] };
// Full surah timing payload: audio URL + per-verse map
type SurahTimingData = { audioUrl: string; verses: Record<string, VerseTimingEntry> } | null;

const TIMING_RECITER_MAP: Record<string, number> = {
  "ar.alafasy":              7,
  "ar.abdurrahmaansudais":   1,
  "ar.husary":               3,
  "ar.minshawi":             4,
  "ar.shaatree":            11,
  "ar.mahermuaiqly":        10,
  "ar.saoodshuraym":         9,
};

/* ── Reciters catalogue ──────────────────────────────────────── */
const RECITERS = [
  { id: "ar.alafasy",           name: "Mishary Alafasy"        },
  { id: "ar.abdurrahmaansudais", name: "Al-Sudais"             },
  { id: "ar.abdullahbasfar",    name: "Abdullah Basfar"        },
  { id: "ar.husary",            name: "Al-Husary"              },
  { id: "ar.minshawi",          name: "Al-Minshawi"            },
  { id: "ar.muhammadayyoub",    name: "Muhammad Ayyoub"        },
  { id: "ar.shaatree",          name: "Abu Bakr Al-Shatri"     },
  { id: "ar.mahermuaiqly",      name: "Maher Al-Muaiqly"       },
  { id: "ar.saoodshuraym",      name: "Saud Al-Shuraim"        },
  { id: "ar.ahmedajamy",        name: "Ahmed Al-Ajamy"         },
  { id: "ar.hanirifai",         name: "Hani Ar-Rifai"          },
  { id: "ar.hudhaify",          name: "Ali Al-Hudhaifi"        },
  { id: "ar.muhammadjibreel",   name: "Muhammad Jibreel"       },
  { id: "ar.minshawimujawwad",  name: "Al-Minshawi (Mujawwad)" },
  { id: "ar.husarymujawwad",    name: "Al-Husary (Mujawwad)"   },
];

/* ── Reciter picker dropdown ─────────────────────────────────── */
function ReciterPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = RECITERS.find(r => r.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
        title="Change reciter"
      >
        <Mic className="h-3 w-3 text-primary flex-shrink-0" />
        <span className="max-w-[72px] truncate hidden sm:inline">{selected?.name ?? "Reciter"}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 right-0 z-40 bg-popover border border-border rounded-xl shadow-lg w-52 max-h-72 overflow-y-auto">
            <div className="p-1.5 space-y-0.5">
              {RECITERS.map(r => (
                <button
                  key={r.id}
                  onClick={() => { onChange(r.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${
                    value === r.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <span className="truncate">{r.name}</span>
                  {value === r.id && <Check className="h-3 w-3 flex-shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const FONT_SIZE_MAP: Record<string, string> = {
  small: "text-xl",
  medium: "text-2xl md:text-3xl",
  large: "text-3xl md:text-4xl",
  extra_large: "text-4xl md:text-5xl",
};

/* ── Per-reader font size steps ─────────────────────────────────
   Index 0 = smallest … 4 = largest.
   Defaults: Arabic → 1 (small), Translation → 1 (sm).
   ────────────────────────────────────────────────────────────── */
const ARABIC_SIZES = [
  "text-xl",
  "text-2xl md:text-3xl",
  "text-3xl md:text-4xl",
  "text-4xl md:text-5xl",
  "text-5xl md:text-6xl",
] as const;

const TRANSLATION_SIZES = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
] as const;

const SIZE_LABELS = ["XS", "S", "M", "L", "XL"] as const;

/* ── Inline font-size picker (Aa button → popover) ───────────── */
function FontSizePicker({
  arabicIdx, onArabicChange,
  translationIdx, onTranslationChange,
}: {
  arabicIdx: number; onArabicChange: (i: number) => void;
  translationIdx: number; onTranslationChange: (i: number) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost" size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          title="Adjust font sizes"
        >
          <ALargeSmall className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-52 p-3 space-y-3.5">
        <SizeRow
          label="Arabic"
          idx={arabicIdx}
          total={ARABIC_SIZES.length}
          onChange={onArabicChange}
        />
        <div className="border-t border-border/40 pt-3">
          <SizeRow
            label="Translation"
            idx={translationIdx}
            total={TRANSLATION_SIZES.length}
            onChange={onTranslationChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SizeRow({
  label, idx, total, onChange,
}: {
  label: string; idx: number; total: number; onChange: (i: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="text-[10px] text-muted-foreground font-medium">{SIZE_LABELS[idx]}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline" size="icon" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.max(0, idx - 1))}
          disabled={idx === 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <div className="flex flex-1 justify-center gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`rounded-full transition-colors ${
                i === idx
                  ? "bg-primary w-2.5 h-2.5"
                  : "bg-muted-foreground/25 hover:bg-muted-foreground/50 w-1.5 h-1.5 mt-0.5"
              }`}
            />
          ))}
        </div>
        <Button
          variant="outline" size="icon" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.min(total - 1, idx + 1))}
          disabled={idx === total - 1}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

/* ── View mode ───────────────────────────────────────────────── */
type ViewMode = "verse" | "reading";

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center bg-muted/50 rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => onChange("verse")}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
          value === "verse"
            ? "bg-background shadow-sm text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Verse by Verse"
      >
        <AlignJustify className="h-3 w-3" />
        <span className="hidden sm:inline">Verses</span>
      </button>
      <button
        onClick={() => onChange("reading")}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
          value === "reading"
            ? "bg-background shadow-sm text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Reading View"
      >
        <BookOpen className="h-3 w-3" />
        <span className="hidden sm:inline">Reading</span>
      </button>
    </div>
  );
}

/* ── Reading View Panel ──────────────────────────────────────────
   Renders the whole surah as continuous flowing Arabic text.
   No translation. No card layout. Tajweed + audio sync supported.
   ─────────────────────────────────────────────────────────────── */
interface ReadingViewPanelProps {
  surah: AlquranSurah;
  surahNum: number;
  scriptInfo: { fontClass: string };
  arabicSizeClass: string;
  tajweedEnabled: boolean;
  tajweedData: Record<number, TajweedWord[]>;
  tajweedTapExplain: boolean;
  activeAyah: number | null;
  activeWordIndex: number;
  surahTimingData: SurahTimingData;
  selectedAyah: number | null;
  setSelectedAyah: (n: number | null) => void;
  onRuleTap: (rule: TajweedRule) => void;
}

const ReadingViewPanel = memo(function ReadingViewPanel({
  surah, surahNum, scriptInfo, arabicSizeClass,
  tajweedEnabled, tajweedData, tajweedTapExplain,
  activeAyah, activeWordIndex, surahTimingData,
  selectedAyah, setSelectedAyah, onRuleTap,
}: ReadingViewPanelProps) {
  // Scroll active ayah into view during audio playback
  useEffect(() => {
    if (!activeAyah) return;
    document
      .querySelector(`[data-rv-ayah="${activeAyah}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeAyah]);

  const filteredAyahs = useMemo(
    () => surah.ayahs.filter(a => !(surahNum === 1 && a.numberInSurah === 1)),
    [surah.ayahs, surahNum],
  );

  return (
    <div className="px-5 sm:px-10 md:px-16 py-8 max-w-3xl mx-auto" style={{ overflowX: "clip" }}>
      {/* Bismillah */}
      {surahNum !== 9 && (
        <p
          className={`${scriptInfo.fontClass} text-2xl text-primary text-center leading-[2.4] mb-8 break-words`}
          dir="rtl"
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {/* Continuous flowing Quran text — all ayahs as one RTL paragraph */}
      <p
        className={`${scriptInfo.fontClass} ${arabicSizeClass} leading-[3.2] text-foreground break-words`}
        dir="rtl"
      >
        {filteredAyahs.map(ayah => {
          const isActive   = activeAyah  === ayah.numberInSurah;
          const isSelected = selectedAyah === ayah.numberInSurah;
          const displayText =
            surahNum !== 1 && surahNum !== 9 && ayah.numberInSurah === 1
              ? stripBismillahPrefix(ayah.text)
              : ayah.text;
          const tjWords  = tajweedData[ayah.numberInSurah];
          const verseKey = `${surahNum}:${ayah.numberInSurah}`;
          const timings  = surahTimingData?.verses[verseKey]?.segments;
          const words    = displayText.trim().split(/\s+/).filter(Boolean);

          let wordNodes: React.ReactNode;
          if (tajweedEnabled && tjWords) {
            const wordTokens = tjWords.filter(w => w.type === "word");
            wordNodes = wordTokens.map((w, i) => {
              const lit = isActive && activeWordIndex === i;
              return (
                <span
                  key={i}
                  className={`inline transition-colors duration-75 ${
                    lit ? "text-primary bg-primary/15 rounded px-[0.2em] py-[0.5em]" : ""
                  }`}
                  onClick={tajweedTapExplain ? (e) => {
                    const rule = getRuleFromElement(
                      e.target as HTMLElement,
                      e.currentTarget as HTMLElement,
                    );
                    if (rule) { e.stopPropagation(); onRuleTap(rule); }
                  } : undefined}
                  dangerouslySetInnerHTML={{
                    __html: w.html + (i < wordTokens.length - 1 ? " " : ""),
                  }}
                />
              );
            });
          } else if (timings?.length) {
            wordNodes = words.map((word, i) => {
              const lit = isActive && activeWordIndex === i;
              return (
                <span
                  key={i}
                  className={`inline transition-all duration-75 ${
                    lit ? "text-primary bg-primary/15 rounded px-[0.2em] py-[0.5em]" : ""
                  }`}
                >
                  {word}{i < words.length - 1 ? " " : ""}
                </span>
              );
            });
          } else {
            wordNodes = displayText;
          }

          return (
            <span
              key={ayah.numberInSurah}
              data-rv-ayah={ayah.numberInSurah}
              onClick={() => setSelectedAyah(isSelected ? null : ayah.numberInSurah)}
              className={`cursor-pointer transition-colors ${
                isActive ? "text-secondary" : isSelected ? "text-primary" : ""
              }`}
            >
              {wordNodes}
              <AyahMarker number={ayah.numberInSurah} />
              {"\u00A0"}
            </span>
          );
        })}
      </p>
    </div>
  );
});

/* ── Script style selector ───────────────────────────────────── */
function ScriptPicker({
  value,
  onChange,
}: {
  value: QuranScriptId;
  onChange: (id: QuranScriptId) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = QURAN_SCRIPTS.find(s => s.id === value) ?? QURAN_SCRIPTS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
      >
        <Type className="h-3.5 w-3.5 text-primary" />
        <span>{selected.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-40 bg-popover border border-border rounded-xl shadow-lg min-w-[280px] overflow-hidden">
            <div className="p-2 space-y-1">
              {QURAN_SCRIPTS.map(script => (
                <button
                  key={script.id}
                  onClick={() => { onChange(script.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    value === script.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{script.label}</span>
                    {value === script.id && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{script.region}</div>
                  <div className="text-xs text-muted-foreground/60">{script.description}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Language selector dropdown ──────────────────────────────── */
function TranslationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = TRANSLATIONS.find(t => t.key === value) ?? TRANSLATIONS[0];

  // Group by language
  const groups = TRANSLATIONS.reduce<Record<string, TranslationOption[]>>((acc, t) => {
    if (!acc[t.lang]) acc[t.lang] = [];
    acc[t.lang].push(t);
    return acc;
  }, {});

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
      >
        <Languages className="h-3.5 w-3.5 text-primary" />
        <span className="max-w-[140px] truncate">{selected.lang} — {selected.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute right-0 z-50 mt-1 w-64 rounded-xl border border-border bg-background shadow-lg overflow-hidden"
            >
              <div className="max-h-72 overflow-y-auto py-1">
                {Object.entries(groups).map(([lang, options]) => (
                  <div key={lang}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 bg-muted/30">
                      {lang}
                    </div>
                    {options.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { onChange(opt.key); setOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors ${
                          opt.key === value ? "bg-primary/8 text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {opt.key === value && <span className="text-primary text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Go to Surah dialog ──────────────────────────────────────── */
interface MinimalSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
}

function GoToSurahDialog({
  open,
  onOpenChange,
  currentSurahNum,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentSurahNum: number;
}) {
  const [surahs, setSurahs] = useState<MinimalSurah[]>([]);
  const [query, setQuery] = useState("");
  const fetchedRef = useRef(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetch("https://api.alquran.cloud/v1/surah")
      .then(r => r.json())
      .then(d => { if (d.data) { setSurahs(d.data); fetchedRef.current = true; } })
      .catch(() => {});
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    const num = parseInt(q);
    return surahs.filter(s =>
      (!isNaN(num) && s.number === num) ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(query.trim())
    );
  }, [surahs, query]);

  return (
    <CommandDialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setQuery(""); }}>
      <CommandInput
        placeholder="Search by name or number…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[min(60vh,420px)]">
        <CommandEmpty>
          {surahs.length === 0
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</span>
            : "No surah found."}
        </CommandEmpty>
        {filtered.map(s => (
          <CommandItem
            key={s.number}
            value={`${s.number} ${s.englishName} ${s.englishNameTranslation}`}
            onSelect={() => { onOpenChange(false); navigate(`/quran/${s.number}`); }}
            className={s.number === currentSurahNum ? "bg-primary/5" : ""}
          >
            <span className="w-8 text-muted-foreground text-xs font-mono shrink-0">{s.number}</span>
            <span className="flex-1 min-w-0">
              <span className="font-medium">{s.englishName}</span>
              <span className="text-muted-foreground text-xs ml-1.5">· {s.englishNameTranslation}</span>
            </span>
            <span className="font-arabic text-base text-primary ml-2 shrink-0">{s.name}</span>
            {s.number === currentSurahNum && <Check className="h-3.5 w-3.5 text-primary ml-1 shrink-0" />}
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  Main Component                                                */
/* ══════════════════════════════════════════════════════════════ */
export default function QuranReading() {
  const { surahId } = useParams<{ surahId: string }>();
  const surahNum = parseInt(surahId ?? "1");
  const search = useSearch();
  const params = new URLSearchParams(search);
  const targetAyah = params.get("ayah");
  const isDailyMode = params.get("mode") === "daily";
  const queryClient = useQueryClient();

  const [surah, setSurah] = useState<AlquranSurah | null>(null);
  const [translationAyahs, setTranslationAyahs] = useState<AlquranAyah[]>([]);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const { translationKey, setTranslationKey } = useTranslationPreference();
  const { scriptId, setScriptId, scriptInfo } = useQuranScript();
  const [showTranslation, setShowTranslation] = useState(true);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionStartRef = useRef(Date.now());

  // Word-by-word highlighting
  const [surahTimingData, setSurahTimingData] = useState<SurahTimingData>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const surahTimingDataRef = useRef<SurahTimingData>(null);
  const activeWordIdxRef   = useRef<number | null>(null);
  const rafRef             = useRef<number>(0);

  // Persistent audio element reused across ayahs for the QuranCDN surah-file
  // path. Keeping the same element means the browser retains its network buffer
  // between ayahs, so seeks are instant instead of triggering a stall-and-resume
  // that sounds like the first word is played twice.
  const surahAudioRef    = useRef<HTMLAudioElement | null>(null);
  const surahAudioUrlRef = useRef<string>("");

  // Surah completion — shown only after last ayah finishes or user scrolls to the end
  const [surahCompleted, setSurahCompleted] = useState(false);
  const endSentinelRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useGetUserProfile({ query: { queryKey: getGetUserProfileQueryKey() } });
  const { data: plan } = useGetMemorizationPlan({ surahId: surahNum }, {
    query: { queryKey: getGetMemorizationPlanQueryKey({ surahId: surahNum }) },
  });
  const { data: bookmarks } = useGetBookmarks({ query: { queryKey: getGetBookmarksQueryKey() } });
  const addToMemorization = useAddToMemorizationPlan();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const logActivity = useLogActivity();
  const manuallyBookmarkedRef = useRef(false);

  const [localReciter, setLocalReciter] = useState<string>("ar.alafasy");
  useEffect(() => {
    if (profile?.preferredReciter) setLocalReciter(profile.preferredReciter);
  }, [profile?.preferredReciter]);
  const fontSizeClass = FONT_SIZE_MAP[profile?.fontSizePreference ?? "medium"] ?? "text-2xl md:text-3xl";
  const selectedTranslation = TRANSLATIONS.find(t => t.key === translationKey) ?? TRANSLATIONS[0];

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try { return (localStorage.getItem("qiyam_view_mode") as ViewMode) ?? "verse"; } catch { return "verse"; }
  });

  const [arabicFontIdx, setArabicFontIdx] = useState(() => {
    try { return parseInt(localStorage.getItem("qiyam_arabic_sz") ?? "1", 10) || 1; } catch { return 1; }
  });
  const [translationFontIdx, setTranslationFontIdx] = useState(() => {
    try { return parseInt(localStorage.getItem("qiyam_trans_sz") ?? "1", 10) || 1; } catch { return 1; }
  });

  const arabicSizeClass    = ARABIC_SIZES[arabicFontIdx]      ?? ARABIC_SIZES[1];
  const translationSizeClass = TRANSLATION_SIZES[translationFontIdx] ?? TRANSLATION_SIZES[1];

  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("qiyam_tajweed") !== "false"; } catch { return true; }
  });
  const [tajweedTheme, setTajweedTheme] = useState<TajweedThemeId>(() => {
    try { return (localStorage.getItem("qiyam_tj_theme") as TajweedThemeId) || "vivid"; } catch { return "vivid"; }
  });
  const [tajweedLegend, setTajweedLegend] = useState(() => {
    try { return localStorage.getItem("qiyam_tj_legend") !== "false"; } catch { return true; }
  });
  const [tajweedTapExplain, setTajweedTapExplain] = useState(() => {
    try { return localStorage.getItem("qiyam_tj_tap") !== "false"; } catch { return true; }
  });
  const [tajweedLearning, setTajweedLearning] = useState(false);
  const [tajweedFocusRule, setTajweedFocusRule] = useState<string | null>(null);
  const [tajweedSettingsOpen, setTajweedSettingsOpen] = useState(false);
  const [surahInfoOpen, setSurahInfoOpen] = useState(false);
  const [activeTjRule, setActiveTjRule] = useState<TajweedRule | null>(null);
  const [tajweedData, setTajweedData] = useState<Record<number, TajweedWord[]>>({});
  const [shareAyahNum, setShareAyahNum] = useState<number | null>(null);
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  const [ayahJumperOpen, setAyahJumperOpen] = useState(false);
  const [ayahJumpInput, setAyahJumpInput] = useState("");

  /* ── Fetch Arabic ─────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    setSurah(null);
    setSelectedAyah(null);
    setActiveAyah(null);
    stopAudio();

    fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/${scriptInfo.apiEdition}`)
      .then(r => r.json())
      .then(d => { if (d.code === 200) setSurah(d.data); })
      .finally(() => setLoading(false));
  }, [surahNum, scriptInfo.apiEdition]);

  /* ── Fetch translation whenever key or surah changes ─────── */
  useEffect(() => {
    setTranslationLoading(true);
    setTranslationAyahs([]);
    fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/${translationKey}`)
      .then(r => r.json())
      .then(d => { if (d.code === 200) setTranslationAyahs(d.data.ayahs); })
      .finally(() => setTranslationLoading(false));
  }, [surahNum, translationKey]);

  /* ── Fetch Tajweed word data from QuranCDN ─────────────────── */
  useEffect(() => {
    if (!tajweedEnabled) { setTajweedData({}); return; }
    setTajweedData({});
    fetch(
      `https://api.qurancdn.com/api/qdc/verses/by_chapter/${surahNum}?words=true&word_fields=char_type_name,text_uthmani_tajweed&per_page=300`
    )
      .then(r => r.json())
      .then(d => {
        const map: Record<number, TajweedWord[]> = {};
        for (const v of d.verses ?? []) {
          const n = parseInt(v.verse_number);
          map[n] = (v.words ?? []).map((w: Record<string, string>) => ({
            html: sanitizeTajweed(w.text_uthmani_tajweed ?? ""),
            type: w.char_type_name ?? "word",
          }));
        }
        setTajweedData(map);
      })
      .catch(() => setTajweedData({}));
  }, [surahNum, tajweedEnabled]);

  /* ── Scroll to target ayah from ?ayah= query param ─────── */
  useEffect(() => {
    if (!targetAyah || !surah) return;
    const num = parseInt(targetAyah);
    if (isNaN(num)) return;
    setSelectedAyah(num);
    // Wait a tick for the DOM to render, then scroll
    const id = setTimeout(() => {
      document.getElementById(`ayah-${num}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    return () => clearTimeout(id);
  }, [targetAyah, surah?.number]);

  /* ── Track active ayah: sync selection + auto-scroll ───────── */
  // When playback advances to a new ayah, keep selectedAyah in step so the
  // action bar always reflects what is playing, and scroll it into view.
  useEffect(() => {
    if (activeAyah === null) return;
    setSelectedAyah(activeAyah);
    // Small delay so the DOM has committed the highlight before scrolling
    const id = setTimeout(() => {
      document.getElementById(`ayah-${activeAyah}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    return () => clearTimeout(id);
  }, [activeAyah]);

  /* ── Reset surah completion when changing surahs ───────────── */
  useEffect(() => {
    setSurahCompleted(false);
  }, [surahNum]);

  /* ── IntersectionObserver: mark complete when bottom sentinel is visible */
  useEffect(() => {
    const el = endSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSurahCompleted(true); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [surahNum]);

  /* ── Daily mode: save position + auto-bookmark when ayah selected */
  useEffect(() => {
    if (!isDailyMode || !surah || selectedAyah === null) return;
    saveDailyPosition({ surahId: surahNum, ayahNumber: selectedAyah, surahName: surah.englishName });
    handleAutoBookmarkRef.current(selectedAyah);
  }, [isDailyMode, selectedAyah, surahNum, surah?.englishName]);

  /* ── Daily mode: IntersectionObserver for scroll tracking ─ */
  useEffect(() => {
    if (!isDailyMode || !surah) return;
    let saveTimer: ReturnType<typeof setTimeout>;
    let lastSaved: number | null = null;
    let observer: IntersectionObserver;

    const setup = () => {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible.length === 0) return;
          const num = parseInt(visible[0].target.id.replace("ayah-", ""), 10);
          if (!isNaN(num) && num !== lastSaved) {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
              lastSaved = num;
              saveDailyPosition({ surahId: surahNum, ayahNumber: num, surahName: surah.englishName });
              handleAutoBookmarkRef.current(num);
            }, 2000);
          }
        },
        { threshold: [0.4, 0.8] }
      );
      document.querySelectorAll('[id^="ayah-"]').forEach(el => observer.observe(el));
    };

    const t = setTimeout(setup, 150);
    return () => { clearTimeout(t); clearTimeout(saveTimer); observer?.disconnect(); };
  }, [isDailyMode, surahNum, surah?.number]);

  /* ── Log activity on unmount ─────────────────────────────── */
  useEffect(() => {
    return () => {
      const minutes = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000));
      logActivity.mutate({ data: { minutes, activityType: "reading" } });
    };
  }, []);

  /* ── Fetch word-level timing data for current surah ─────── */
  useEffect(() => {
    // Discard the persistent surah audio element whenever the surah or reciter
    // changes — we need a fresh element for the new file/reciter.
    if (surahAudioRef.current) {
      surahAudioRef.current.pause();
      surahAudioRef.current.removeAttribute("src");
      surahAudioRef.current.load();
      surahAudioRef.current = null;
      surahAudioUrlRef.current = "";
    }

    const timingId = TIMING_RECITER_MAP[localReciter];
    if (!timingId || scriptInfo.id !== "uthmani") {
      setSurahTimingData(null);
      surahTimingDataRef.current = null;
      return;
    }
    fetch(
      `https://api.qurancdn.com/api/qdc/audio/reciters/${timingId}/audio_files?chapter_number=${surahNum}&segments=true`
    )
      .then(r => r.json())
      .then((data: {
        audio_files?: {
          audio_url?: string;
          verse_timings?: {
            verse_key: string;
            timestamp_from: number;
            timestamp_to: number;
            segments?: [number, number, number][];
          }[];
        }[];
      }) => {
        const audioFile = data.audio_files?.[0];
        if (!audioFile?.audio_url || !audioFile.verse_timings?.length) {
          setSurahTimingData(null);
          surahTimingDataRef.current = null;
          return;
        }
        const verses: Record<string, VerseTimingEntry> = {};
        for (const vt of audioFile.verse_timings) {
          if (!vt.verse_key) continue;
          // segments: [word_index, start_ms, end_ms][] (word_index is 1-based).
          // Group by word_index so that reciters who split a word into two timing
          // entries (e.g. tarteel pause mid-word) are merged into one span.
          const rawSegs = (vt.segments ?? []).filter(s => s.length >= 3);
          const segMap = new Map<number, [number, number]>();
          for (const [wIdx, start, end] of rawSegs) {
            if (!segMap.has(wIdx)) {
              segMap.set(wIdx, [start, end]);
            } else {
              const prev = segMap.get(wIdx)!;
              segMap.set(wIdx, [Math.min(prev[0], start), Math.max(prev[1], end)]);
            }
          }
          // For verse 1 of surahs 2-114 (except 9) the API prepends 4 Bismillah
          // word entries (word_index 1-4) that are stripped from displayText.
          // Skip those so word index 0 in our array → first actual verse word.
          const bismillahOffset =
            surahNum !== 1 && surahNum !== 9 && vt.verse_key === `${surahNum}:1`
              ? 4 : 0;
          const segments: WordTiming[] = [...segMap.entries()]
            .sort(([a], [b]) => a - b)
            .filter(([idx]) => idx > bismillahOffset)
            .map(([, timing]) => timing);
          verses[vt.verse_key] = {
            from: vt.timestamp_from,
            to:   vt.timestamp_to,
            segments,
          };
        }
        const result: SurahTimingData = { audioUrl: audioFile.audio_url, verses };
        setSurahTimingData(result);
        surahTimingDataRef.current = result;
      })
      .catch(() => {
        setSurahTimingData(null);
        surahTimingDataRef.current = null;
      });
  }, [surahNum, localReciter, scriptInfo.id]);

  /* ── Audio ───────────────────────────────────────────────── */
  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (audioRef.current) {
      const old = audioRef.current;
      // Null the ref FIRST so any in-flight async callbacks (loadedmetadata,
      // seeked, doPlay) see audioRef.current !== old and bail out immediately.
      audioRef.current = null;
      old.pause();
      old.onended = null;
      old.ontimeupdate = null;
      // Only abort the network load for per-ayah (islamic.network) elements.
      // The persistent surah audio element (surahAudioRef) is kept alive so
      // the browser preserves its buffer for instant seeks on the next play.
      if (old !== surahAudioRef.current) {
        old.removeAttribute("src");
        old.load();
      }
    }
    setIsPlaying(false);
    setActiveAyah(null);
    setActiveWordIndex(null);
    activeWordIdxRef.current = null;
  }, []);

  const playAyah = useCallback((ayahNumber: number) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended    = null;
      audioRef.current.ontimeupdate = null;
    }

    const verseKey    = `${surahNum}:${ayahNumber}`;
    const timingData  = surahTimingDataRef.current;
    const verseTiming = timingData?.verses[verseKey] ?? null;

    // ── Choose / reuse audio element ──────────────────────────────────────
    // For the QuranCDN surah-file path we reuse a single persistent element
    // across all ayahs. Keeping the same element means the browser retains its
    // network buffer between verses, so seeks are instantaneous rather than
    // triggering a buffering stall that sounds like the first word plays twice.
    let audio: HTMLAudioElement;
    if (verseTiming) {
      const surahUrl = timingData!.audioUrl;
      if (surahAudioRef.current && surahAudioUrlRef.current === surahUrl) {
        // Reuse the existing element — just pause before seeking.
        audio = surahAudioRef.current;
        audio.pause();
      } else {
        // First play for this surah+reciter: create a fresh element.
        if (surahAudioRef.current) {
          surahAudioRef.current.pause();
          surahAudioRef.current.removeAttribute("src");
          surahAudioRef.current.load();
        }
        audio = new Audio(surahUrl);
        audio.preload = "auto";
        surahAudioRef.current    = audio;
        surahAudioUrlRef.current = surahUrl;
      }
    } else {
      // Per-ayah islamic.network fallback: always a fresh element.
      audio = new Audio(getAudioUrl(surahNum, ayahNumber, localReciter));
    }
    audio.playbackRate = speed;
    audioRef.current = audio;

    setActiveAyah(ayahNumber);
    setIsPlaying(true);
    setActiveWordIndex(null);
    activeWordIdxRef.current = null;

    // Shared "advance to next" logic used by both code paths
    const advance = () => {
      if (repeatMode === "ayah") {
        playAyah(ayahNumber);
      } else {
        const next = ayahNumber + 1;
        if (surah && next <= surah.numberOfAyahs) {
          playAyah(next);
        } else if (repeatMode === "surah") {
          playAyah(1);
        } else {
          setSurahCompleted(true);
          stopAudio();
        }
      }
    };

    if (verseTiming) {
      // ── QuranCDN surah audio: seek to verse start, stop at verse end ──
      //
      // Guard every async callback: if the audio element has been replaced
      // (stopAudio() or a new playAyah() call happened while we were seeking),
      // bail out immediately so the stale callback doesn't restart playback.
      const doPlay = () => {
        if (audioRef.current !== audio) return;
        audio.play().catch(() => { if (audioRef.current === audio) stopAudio(); });
      };

      const doSeek = () => {
        if (audioRef.current !== audio) return;
        const targetSec = verseTiming.from / 1000;
        // Attach the seeked listener BEFORE setting currentTime so we never
        // miss the event, and avoid the unreliable `audio.seeking` check
        // (Chrome can return false for in-buffer seeks even before currentTime
        // has actually updated, causing play() to fire from position 0).
        // Special-case: if we're already at the target (e.g. first ayah of
        // surah, from = 0) the browser won't fire seeked — call doPlay directly.
        if (Math.abs(audio.currentTime - targetSec) < 0.05) {
          doPlay();
        } else {
          audio.addEventListener("seeked", doPlay, { once: true });
          audio.currentTime = targetSec;
        }
      };

      const seekAndPlay = () => {
        if (audioRef.current !== audio) return;
        doSeek();
      };

      if (audio.readyState >= 1) {
        seekAndPlay();
      } else {
        audio.addEventListener("loadedmetadata", seekAndPlay, { once: true });
        audio.load();
      }

      // ── RAF-based word highlight (replaces ontimeupdate) ───────────────
      // requestAnimationFrame polls at ~60 fps so even short words (~100 ms)
      // are highlighted correctly, with no lag.
      const tick = () => {
        // Stop if this audio element has been replaced
        if (audioRef.current !== audio) return;

        const absMs = audio.currentTime * 1000;

        // Verse boundary reached → advance to next ayah
        if (absMs > 0 && absMs >= verseTiming.to) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
          audio.pause();
          setIsPlaying(false);
          setActiveWordIndex(null);
          activeWordIdxRef.current = null;
          advance();
          return;
        }

        // Word-level highlight using absolute timestamps
        if (!audio.paused) {
          const segs = verseTiming.segments;
          let newIdx: number | null = null;
          for (let i = 0; i < segs.length; i++) {
            if (absMs >= segs[i][0] && absMs < segs[i][1]) { newIdx = i; break; }
          }
          if (newIdx !== activeWordIdxRef.current) {
            activeWordIdxRef.current = newIdx;
            setActiveWordIndex(newIdx);
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // ── islamic.network per-ayah audio (no word timing) ──────────────
      audio.onended = advance;
      audio.play().catch(() => stopAudio());
    }
  }, [surahNum, localReciter, speed, repeatMode, surah, stopAudio]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (activeAyah && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        playAyah(selectedAyah ?? 1);
      }
    }
  };

  const skipNext = () => {
    if (!surah) return;
    const next = (activeAyah ?? 0) + 1;
    if (next <= surah.numberOfAyahs) playAyah(next);
  };

  const skipPrev = () => {
    const prev = (activeAyah ?? 2) - 1;
    if (prev >= 1) playAyah(prev);
  };

  const cycleRepeat = () => {
    setRepeatMode(m => m === "none" ? "ayah" : m === "ayah" ? "surah" : "none");
  };

  /* ── Ayah actions ────────────────────────────────────────── */
  const handleAddToMemorization = () => {
    if (selectedAyah === null) return;
    addToMemorization.mutate(
      { data: { surahId: surahNum, ayahNumbers: [selectedAyah] } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMemorizationPlanQueryKey({ surahId: surahNum }) }) }
    );
  };

  const handleBookmark = () => {
    if (selectedAyah === null) return;
    // Manual bookmark — disable auto-bookmarking for this session
    manuallyBookmarkedRef.current = true;
    createBookmark.mutate(
      { data: { surahId: surahNum, ayahNumber: selectedAyah } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBookmarksQueryKey() }) }
    );
  };

  const handleAutoBookmark = useCallback((ayahNumber: number) => {
    if (!isDailyMode || manuallyBookmarkedRef.current) return;
    const existing = bookmarks?.find(b => b.note === AUTO_BOOKMARK_NOTE);
    // Same position already saved — nothing to do
    if (existing && existing.surahId === surahNum && existing.ayahNumber === ayahNumber) return;
    const createNew = () => {
      createBookmark.mutate(
        { data: { surahId: surahNum, ayahNumber, note: AUTO_BOOKMARK_NOTE } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBookmarksQueryKey() }) }
      );
    };
    if (existing) {
      deleteBookmark.mutate(
        { id: existing.id },
        { onSuccess: createNew }
      );
    } else {
      createNew();
    }
  }, [isDailyMode, bookmarks, surahNum, createBookmark, deleteBookmark, queryClient]);

  // Keep a stable ref so IntersectionObserver closure always uses latest version
  const handleAutoBookmarkRef = useRef(handleAutoBookmark);
  useEffect(() => { handleAutoBookmarkRef.current = handleAutoBookmark; }, [handleAutoBookmark]);

  // Auto-bookmark is excluded from the "Saved" indicator — only manual bookmarks count
  const isBookmarked = (n: number) =>
    bookmarks?.some(b => b.surahId === surahNum && b.ayahNumber === n && b.note !== AUTO_BOOKMARK_NOTE);
  const isInPlan = (n: number) => plan?.some(e => e.ayahNumber === n);
  const getTranslation = (n: number) => translationAyahs.find(t => t.numberInSurah === n)?.text ?? "";

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load surah. Please check your connection and try again.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back to surah list */}
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Link href="/quran"><ChevronLeft className="h-4 w-4" /></Link>
            </Button>
            {/* Previous surah */}
            {surahNum > 1 && (
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground" title={`Surah ${surahNum - 1}`}>
                <Link href={`/quran/${surahNum - 1}${isDailyMode ? "?mode=daily" : ""}`}>
                  <SkipBack className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <button
              className="min-w-0 text-left rounded-md px-1.5 py-1 -mx-1.5 -my-1 hover:bg-muted/50 transition-colors group/surahbtn"
              onClick={() => setSurahPickerOpen(true)}
              title="Go to surah…"
            >
              <div className="font-semibold text-foreground text-sm truncate flex items-center gap-1">
                {surah.englishName}
                <span className="text-muted-foreground font-normal text-xs">· {surah.englishNameTranslation}</span>
                <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0 opacity-50 group-hover/surahbtn:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs text-muted-foreground">{surah.numberOfAyahs} Ayahs · {surah.revelationType}</div>
              {isDailyMode && (
                <span className="inline-flex items-center text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">
                  Daily Recitation — position auto-saved
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Next surah */}
            {surahNum < 114 && (
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title={`Surah ${surahNum + 1}`}>
                <Link href={`/quran/${surahNum + 1}${isDailyMode ? "?mode=daily" : ""}`}>
                  <SkipForward className="h-4 w-4" />
                </Link>
              </Button>
            )}

            <span className={`${scriptInfo.fontClass} text-xl text-primary hidden sm:block ml-1`}>{surah.name}</span>

            {/* Surah info */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSurahInfoOpen(true)}
              title="Surah information"
            >
              <Info className="h-4 w-4" />
            </Button>

            {/* Tajweed settings */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 relative ${tajweedEnabled ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setTajweedSettingsOpen(true)}
              title="Tajweed settings"
            >
              <Wand2 className="h-4 w-4" />
              {tajweedLearning && tajweedEnabled && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-secondary" />
              )}
            </Button>

            {/* Translation toggle — verse-by-verse mode only */}
            {viewMode === "verse" && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showTranslation ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setShowTranslation(s => !s)}
              title={showTranslation ? "Hide translation" : "Show translation"}
            >
              {showTranslation ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            )}

            {/* Go to ayah */}
            {viewMode === "verse" && surah && (
            <Popover open={ayahJumperOpen} onOpenChange={v => { setAyahJumperOpen(v); if (!v) setAyahJumpInput(""); }}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Go to ayah…"
                >
                  <Hash className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-52 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Jump to ayah <span className="text-foreground">(1 – {surah.numberOfAyahs})</span>
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={surah.numberOfAyahs}
                    placeholder="Ayah #"
                    value={ayahJumpInput}
                    onChange={e => setAyahJumpInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const num = parseInt(ayahJumpInput);
                        if (!isNaN(num) && num >= 1 && num <= surah.numberOfAyahs) {
                          setAyahJumperOpen(false);
                          setAyahJumpInput("");
                          setSelectedAyah(num);
                          setTimeout(() => {
                            document.getElementById(`ayah-${num}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 50);
                        }
                      }
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => {
                      const num = parseInt(ayahJumpInput);
                      if (!isNaN(num) && num >= 1 && num <= surah.numberOfAyahs) {
                        setAyahJumperOpen(false);
                        setAyahJumpInput("");
                        setSelectedAyah(num);
                        setTimeout(() => {
                          document.getElementById(`ayah-${num}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 50);
                      }
                    }}
                  >
                    Go
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            )}
          </div>
        </div>

        {/* Reading options bar */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <ViewToggle
            value={viewMode}
            onChange={v => {
              setViewMode(v);
              try { localStorage.setItem("qiyam_view_mode", v); } catch {}
            }}
          />
          <div className="h-4 w-px bg-border" />
          <ScriptPicker value={scriptId} onChange={setScriptId} />
          {viewMode === "verse" && showTranslation && (
            <>
              <div className="h-4 w-px bg-border" />
              <TranslationPicker value={translationKey} onChange={setTranslationKey} />
              {translationLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </>
          )}
          <div className="ml-auto">
            <FontSizePicker
              arabicIdx={arabicFontIdx}
              onArabicChange={i => {
                setArabicFontIdx(i);
                try { localStorage.setItem("qiyam_arabic_sz", String(i)); } catch {}
              }}
              translationIdx={translationFontIdx}
              onTranslationChange={i => {
                setTranslationFontIdx(i);
                try { localStorage.setItem("qiyam_trans_sz", String(i)); } catch {}
              }}
            />
          </div>
        </div>

        {/* Tajweed legend bar — compact color key */}
        {tajweedEnabled && tajweedLegend && (
          <TajweedLegendBar themeId={tajweedTheme} />
        )}
      </div>

      {/* ── Ayah selection indicator (compact) ───────────────── */}
      <AnimatePresence>
        {selectedAyah !== null && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-primary/5 border-b border-primary/15 px-4 py-1.5 flex items-center justify-between gap-2"
          >
            <span className="text-xs text-primary/70 font-medium">
              Ayah {selectedAyah} selected — actions appear below the verse
            </span>
            <Button size="sm" variant="ghost" onClick={() => { setSelectedAyah(null); stopAudio(); }} className="h-6 w-6 p-0 text-muted-foreground">
              ✕
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Share Ayah Modal ──────────────────────────────────── */}
      {shareAyahNum !== null && surah && (() => {
        const ayahObj = surah.ayahs.find(a => a.numberInSurah === shareAyahNum);
        const arabic = ayahObj
          ? (surahNum !== 1 && surahNum !== 9 && shareAyahNum === 1
              ? stripBismillahPrefix(ayahObj.text)
              : ayahObj.text)
          : "";
        return (
          <ShareAyahModal
            surahNum={surahNum}
            ayahNum={shareAyahNum}
            arabic={arabic}
            translation={getTranslation(shareAyahNum)}
            surahName={surah.englishName}
            surahNameAr={surah.name}
            onClose={() => setShareAyahNum(null)}
          />
        );
      })()}

      {/* ── Surah Info Modal ──────────────────────────────────── */}
      {surahInfoOpen && surah && (
        <SurahInfoModal surah={surah} onClose={() => setSurahInfoOpen(false)} />
      )}

      {/* ── Go to Surah dialog ─────────────────────────────────── */}
      <GoToSurahDialog
        open={surahPickerOpen}
        onOpenChange={setSurahPickerOpen}
        currentSurahNum={surahNum}
      />

      {/* ── Tajweed settings sheet ─────────────────────────────── */}
      <TajweedSettings
        open={tajweedSettingsOpen}
        onOpenChange={setTajweedSettingsOpen}
        enabled={tajweedEnabled}
        onEnabledChange={v => {
          setTajweedEnabled(v);
          try { localStorage.setItem("qiyam_tajweed", String(v)); } catch {}
        }}
        theme={tajweedTheme}
        onThemeChange={v => {
          setTajweedTheme(v);
          try { localStorage.setItem("qiyam_tj_theme", v); } catch {}
        }}
        legendVisible={tajweedLegend}
        onLegendVisibleChange={v => {
          setTajweedLegend(v);
          try { localStorage.setItem("qiyam_tj_legend", String(v)); } catch {}
        }}
        tapExplain={tajweedTapExplain}
        onTapExplainChange={v => {
          setTajweedTapExplain(v);
          try { localStorage.setItem("qiyam_tj_tap", String(v)); } catch {}
        }}
        learningMode={tajweedLearning}
        onLearningModeChange={v => {
          setTajweedLearning(v);
          if (!v) setTajweedFocusRule(null);
        }}
        focusRule={tajweedFocusRule}
        onFocusRuleChange={setTajweedFocusRule}
        onReset={() => {
          setTajweedEnabled(true);
          setTajweedTheme("vivid");
          setTajweedLegend(true);
          setTajweedTapExplain(true);
          setTajweedLearning(false);
          setTajweedFocusRule(null);
          try {
            localStorage.removeItem("qiyam_tajweed");
            localStorage.removeItem("qiyam_tj_theme");
            localStorage.removeItem("qiyam_tj_legend");
            localStorage.removeItem("qiyam_tj_tap");
          } catch {}
        }}
      />

      {/* ── Tajweed rule explanation popup ─────────────────────── */}
      {activeTjRule && (
        <TajweedRulePopup rule={activeTjRule} onClose={() => setActiveTjRule(null)} />
      )}

      {/* ── Ayah list ─────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto pb-44 md:pb-28"
        style={{ overflowX: "clip" }}
        data-tj-theme={tajweedEnabled ? tajweedTheme : undefined}
        data-tj-focus={tajweedEnabled && tajweedLearning && tajweedFocusRule ? tajweedFocusRule : undefined}
      >
        {viewMode === "verse" && (<>
        {/* Bismillah — shown for every surah except At-Tawbah (9) */}
        {surahNum !== 9 && (
          <div className="text-center py-5 px-4 border-b border-border/50">
            <span className={`${scriptInfo.fontClass} text-2xl text-primary leading-loose`} dir="rtl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
          </div>
        )}

        <div className="divide-y divide-border/40">
          {surah.ayahs
            // For Al-Fatiha: Ayah 1 IS the Bismillah — skip it from the numbered list
            .filter(ayah => !(surahNum === 1 && ayah.numberInSurah === 1))
            .map((ayah) => {
            const isActive = activeAyah === ayah.numberInSurah;
            const isSelected = selectedAyah === ayah.numberInSurah;
            const translationText = getTranslation(ayah.numberInSurah);

            // For all other surahs (not 1 or 9), Ayah 1 has the Bismillah prepended by the API — strip it
            const displayText =
              surahNum !== 1 && surahNum !== 9 && ayah.numberInSurah === 1
                ? stripBismillahPrefix(ayah.text)
                : ayah.text;

            return (
              <motion.div
                key={ayah.numberInSurah}
                id={`ayah-${ayah.numberInSurah}`}
                initial={false}
                onClick={() => {
                  if (isSelected) {
                    setSelectedAyah(null);
                    stopAudio();
                  } else {
                    setSelectedAyah(ayah.numberInSurah);
                    playAyah(ayah.numberInSurah);
                  }
                }}
                className={`group/ayah relative px-4 md:px-10 py-6 cursor-pointer transition-colors ${
                  isActive || isSelected
                    ? "bg-primary/5"
                    : "hover:bg-muted/40"
                }`}
              >
                {/* Arabic text — full width, right-to-left */}
                <div dir="rtl" style={{ width: "100%" }}>
                  <p
                    className={`${scriptInfo.fontClass} leading-[2.2] text-foreground ${arabicSizeClass}`}
                    style={{ overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal" }}
                  >
                    {(() => {
                      const verseKey    = `${surahNum}:${ayah.numberInSurah}`;
                      // QuranCDN segments are 1-indexed per-verse (no bismillah offset needed)
                      const timings     = surahTimingData?.verses[verseKey]?.segments;
                      const words       = displayText.trim().split(/\s+/).filter(Boolean);

                      // ── Tajweed word-level rendering ──────────────────────
                      const tjWords = tajweedData[ayah.numberInSurah];
                      if (tajweedEnabled && tjWords) {
                        const wordTokens = tjWords.filter(w => w.type === "word");
                        return wordTokens.map((w, i) => {
                          const lit = isActive && activeWordIndex === i;
                          return (
                            <span
                              key={i}
                              className={`inline transition-colors duration-75 ${
                                lit ? "text-primary" : ""
                              }`}
                              onClick={tajweedTapExplain ? (e) => {
                                const wrapEl = e.currentTarget as HTMLElement;
                                const rule = getRuleFromElement(e.target as HTMLElement, wrapEl);
                                if (rule) {
                                  e.stopPropagation();
                                  setActiveTjRule(rule);
                                }
                              } : undefined}
                              dangerouslySetInnerHTML={{
                                __html: w.html + (i < wordTokens.length - 1 ? " " : ""),
                              }}
                            />
                          );
                        });
                      }

                      // ── Word-by-word timing highlight (no tajweed) ─────────
                      return timings?.length ? (
                        words.map((word, i) => {
                          const lit = isActive && activeWordIndex === i;
                          return (
                            <span
                              key={i}
                              className={`inline transition-colors duration-75 ${
                                lit ? "text-primary" : ""
                              }`}
                            >
                              {word}{i < words.length - 1 ? " " : ""}
                            </span>
                          );
                        })
                      ) : (
                        displayText
                      );
                    })()}
                    {/* Ornamental ayah end marker */}
                    <AyahMarker number={ayah.numberInSurah} />
                  </p>
                </div>

                {/* Translation — LTR below Arabic */}
                <AnimatePresence initial={false}>
                  {showTranslation && translationText && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                      dir={selectedTranslation.dir}
                    >
                      <div className={`mt-3 pt-3 border-t border-border/30 leading-relaxed text-muted-foreground ${translationSizeClass} ${
                        selectedTranslation.dir === "rtl" ? "font-arabic text-right" : "text-left"
                      }`}>
                        <span className="text-xs font-medium text-muted-foreground/50 mr-1 not-italic">
                          {ayah.numberInSurah}.
                        </span>
                        {translationLoading ? (
                          <span className="inline-block w-32 h-3 bg-muted/60 rounded animate-pulse" />
                        ) : translationText}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Inline action bar — expands when this ayah is selected */}
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 pt-3 mt-2 border-t border-primary/15 flex-wrap">
                        {isPlaying && activeAyah === ayah.numberInSurah ? (
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => { audioRef.current?.pause(); setIsPlaying(false); }}
                            className="h-7 text-xs gap-1.5 text-primary"
                          >
                            <Pause className="h-3 w-3" /> Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => playAyah(ayah.numberInSurah)}
                            className="h-7 text-xs gap-1.5"
                          >
                            <Play className="h-3 w-3" /> Play
                          </Button>
                        )}
                        <Button
                          size="sm" variant="ghost" onClick={handleBookmark}
                          disabled={isBookmarked(ayah.numberInSurah)}
                          className="h-7 text-xs gap-1.5"
                        >
                          {isBookmarked(ayah.numberInSurah)
                            ? <><BookmarkCheck className="h-3 w-3 text-primary" /> Saved</>
                            : <><BookmarkPlus className="h-3 w-3" /> Bookmark</>}
                        </Button>
                        <Button
                          size="sm" variant="ghost" onClick={handleAddToMemorization}
                          disabled={isInPlan(ayah.numberInSurah)}
                          className="h-7 text-xs gap-1.5"
                        >
                          <Brain className="h-3 w-3" />
                          {isInPlan(ayah.numberInSurah) ? "In Plan" : "Memorize"}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => setShareAyahNum(ayah.numberInSurah)}
                          className="h-7 text-xs gap-1.5"
                        >
                          <Share2 className="h-3 w-3" /> Share
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => { setSelectedAyah(null); stopAudio(); }}
                          className="h-7 w-7 p-0 text-muted-foreground ml-auto"
                          title="Deselect"
                        >
                          ✕
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Per-ayah quick share icon (top-right corner) ──── */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShareAyahNum(ayah.numberInSurah); }}
                  className={`absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full
                    hover:bg-muted/70 transition-all duration-150
                    ${isSelected || isActive
                      ? "text-muted-foreground/60"
                      : "text-transparent group-hover/ayah:text-muted-foreground/40"}
                  `}
                  title={`Share Ayah ${ayah.numberInSurah}`}
                  aria-label={`Share Ayah ${ayah.numberInSurah}`}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* ── End-of-surah sentinel + navigation ──────────────── */}
        <div ref={endSentinelRef} className="h-1 w-full" aria-hidden />

        {surahCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="py-10 px-6 flex flex-col items-center gap-5 border-t border-border/50"
          >
            <div className="flex flex-col items-center gap-1.5 text-center">
              <CheckCircle2 className="h-8 w-8 text-primary/60" />
              <p className="text-sm font-semibold text-foreground">
                End of {surah.englishName}
              </p>
              <p className="text-xs text-muted-foreground">
                {surah.englishNameTranslation} · {surah.numberOfAyahs} Ayahs
              </p>
            </div>

            <div className="flex items-center gap-3">
              {surahNum > 1 && (
                <Button asChild variant="outline" className="gap-1.5">
                  <Link href={`/quran/${surahNum - 1}${isDailyMode ? "?mode=daily" : ""}`}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous Surah
                  </Link>
                </Button>
              )}
              {surahNum < 114 && (
                <Button asChild className="gap-1.5">
                  <Link href={`/quran/${surahNum + 1}${isDailyMode ? "?mode=daily" : ""}`}>
                    Next Surah
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
        </>)}
        {viewMode === "reading" && (
          <ReadingViewPanel
            surah={surah}
            surahNum={surahNum}
            scriptInfo={scriptInfo}
            arabicSizeClass={arabicSizeClass}
            tajweedEnabled={tajweedEnabled}
            tajweedData={tajweedData}
            tajweedTapExplain={tajweedTapExplain}
            activeAyah={activeAyah}
            activeWordIndex={activeWordIndex}
            surahTimingData={surahTimingData}
            selectedAyah={selectedAyah}
            setSelectedAyah={setSelectedAyah}
            onRuleTap={setActiveTjRule}
          />
        )}
      </div>

      {/* ── Audio Player ──────────────────────────────────────── */}
      {/* Fixed bar: left tracks --sidebar-offset from layout.tsx  */}
      {/* so it always spans exactly the content column width.     */}
      <div
        className="fixed bottom-14 md:bottom-0 right-0 z-30 bg-background/98 backdrop-blur-md border-t border-border shadow-[0_-1px_12px_rgba(0,0,0,0.06)]"
        style={{ left: "var(--sidebar-offset, 0px)", transition: "left 300ms ease-in-out" }}
      >
        <div className="max-w-2xl mx-auto">

          {/* ── Mobile info strip (hidden on md+) ─────────────── */}
          <div className="flex md:hidden items-center justify-center px-4 pt-2.5 pb-0.5 min-h-[28px]">
            {activeAyah ? (
              <span className="text-[11px] font-medium text-foreground/70 truncate">
                {surah.englishName} · Ayah {activeAyah} of {surah.numberOfAyahs}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground/80 tracking-wide">
                Tap an ayah or press play to begin
              </span>
            )}
          </div>

          {/* ── Controls row ──────────────────────────────────── */}
          <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3">

            {/* Transport controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={skipPrev}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md flex-shrink-0"
                onClick={togglePlay}
              >
                {isPlaying
                  ? <Pause className="h-4 w-4" />
                  : <Play  className="h-4 w-4 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={skipNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={stopAudio}>
                <Square className="h-3 w-3" />
              </Button>
            </div>

            {/* Desktop-only: centred ayah info */}
            <div className="hidden md:flex flex-1 justify-center items-center min-w-0 px-2">
              {activeAyah ? (
                <span className="text-xs text-muted-foreground truncate">
                  {surah.englishName} · Ayah {activeAyah} / {surah.numberOfAyahs}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Tap an ayah or press play
                </span>
              )}
            </div>

            {/* Spacer — pushes aux controls right on mobile */}
            <div className="flex-1 md:hidden" />

            {/* Auxiliary controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${repeatMode !== "none" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={cycleRepeat}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === "ayah"
                  ? <Repeat1 className="h-4 w-4" />
                  : <Repeat  className="h-4 w-4" />}
              </Button>
              {repeatMode !== "none" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 hidden sm:inline-flex">
                  {repeatMode === "ayah" ? "1×" : "∞"}
                </Badge>
              )}
              <ReciterPicker value={localReciter} onChange={id => { setLocalReciter(id); stopAudio(); }} />
              <select
                value={speed}
                onChange={e => {
                  const s = parseFloat(e.target.value);
                  setSpeed(s);
                  if (audioRef.current) audioRef.current.playbackRate = s;
                }}
                className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
              >
                <option value={0.5}>0.5×</option>
                <option value={0.75}>0.75×</option>
                <option value={1.0}>1×</option>
                <option value={1.25}>1.25×</option>
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
