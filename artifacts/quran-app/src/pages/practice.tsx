import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetUserProfile,
  getGetUserProfileQueryKey,
  useAddToMemorizationPlan,
  useUpdateMemorizationEntry,
  useGetMemorizationPlan,
  getGetMemorizationPlanQueryKey,
  useLogActivity,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, RotateCcw, Volume2, Eye, EyeOff,
  ChevronRight, ChevronLeft, CheckCircle2, Repeat1,
  Repeat, Loader2, BookOpen, Layers, GraduationCap,
  X, ArrowRight, Info, AlertTriangle, Ban, CircleDot,
  ArrowLeftRight, Minus, PauseCircle, Link2, Hash,
} from "lucide-react";

/* ── Surah offsets for global ayah number ────────────────────────── */
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
function audioUrl(surahId: number, ayahNum: number, reciter: string) {
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${SURAH_OFFSETS[surahId - 1] + ayahNum}.mp3`;
}

/* ── Types ───────────────────────────────────────────────────────── */
interface AlquranAyah { number: number; text: string; numberInSurah: number; }
interface AlquranSurah {
  number: number; name: string; englishName: string;
  numberOfAyahs: number; revelationType: string; ayahs: AlquranAyah[];
}

type Phase = "listen" | "recite" | "rate";
type Rating = "again" | "good" | "perfect";

/* ── Word masking ────────────────────────────────────────────────── */
function maskWords(text: string, revealCount: number): React.ReactNode {
  const words = text.split(" ");
  return (
    <span>
      {words.map((w, i) => (
        <span key={i}>
          {i < revealCount ? (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-foreground"
            >
              {w}
            </motion.span>
          ) : (
            <span className="inline-block bg-primary/20 rounded text-transparent select-none" style={{ minWidth: `${w.length * 0.6}em` }}>
              {w}
            </span>
          )}{" "}
        </span>
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  SETUP SCREEN                                                      */
/* ══════════════════════════════════════════════════════════════════ */
interface SetupProps {
  onStart: (surahId: number, startAyah: number, count: number) => void;
}

function SetupScreen({ onStart }: SetupProps) {
  const [surahs, setSurahs] = useState<{ number: number; englishName: string; name: string; numberOfAyahs: number }[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [startAyah, setStartAyah] = useState(1);
  const [count, setCount] = useState(5);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then(r => r.json())
      .then(d => { if (d.code === 200) setSurahs(d.data); })
      .finally(() => setLoadingSurahs(false));
  }, []);

  const currentSurah = surahs.find(s => s.number === selectedSurah);
  const maxAyahs = currentSurah?.numberOfAyahs ?? 1;
  const maxCount = Math.min(10, maxAyahs - startAyah + 1);

  const filtered = surahs.filter(s =>
    s.englishName.toLowerCase().includes(search.toLowerCase()) ||
    String(s.number).includes(search)
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
          <GraduationCap className="h-7 w-7" />
          Practice Session
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose what you'd like to memorize today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Surah picker */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="text-sm font-semibold text-foreground mb-2">Choose Surah</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or number…"
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="overflow-y-auto max-h-72">
            {loadingSurahs ? (
              <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-primary opacity-40" /></div>
            ) : (
              filtered.map(s => (
                <button
                  key={s.number}
                  onClick={() => { setSelectedSurah(s.number); setStartAyah(1); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedSurah === s.number
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <span className={`text-xs font-bold w-6 ${selectedSurah === s.number ? "text-primary" : "text-muted-foreground"}`}>
                    {s.number}
                  </span>
                  <span className="flex-1 text-sm font-medium">{s.englishName}</span>
                  <span className="font-arabic text-base text-primary/70">{s.name}</span>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Options */}
        <div className="space-y-5">
          {currentSurah && (
            <Card>
              <CardContent className="pt-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{currentSurah.englishName}</div>
                    <div className="text-xs text-muted-foreground">{currentSurah.numberOfAyahs} ayahs · {currentSurah.revelationType}</div>
                  </div>
                  <span className="font-arabic text-2xl text-primary">{currentSurah.name}</span>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Start from Ayah</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                      onClick={() => setStartAyah(Math.max(1, startAyah - 1))}
                      disabled={startAyah <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-primary">{startAyah}</span>
                      <span className="text-sm text-muted-foreground"> / {maxAyahs}</span>
                    </div>
                    <Button
                      variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                      onClick={() => setStartAyah(Math.min(maxAyahs, startAyah + 1))}
                      disabled={startAyah >= maxAyahs}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Number of Ayahs to Practice</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 5, 7, 10].filter(n => n <= maxCount).map(n => (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                          count === n
                            ? "bg-primary text-primary-foreground shadow"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-secondary/10 border-secondary/30">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="text-sm font-semibold text-primary">How it works</div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex gap-2"><Volume2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" /><span><strong>Listen</strong> — full text shown, audio plays on loop</span></div>
                <div className="flex gap-2"><EyeOff className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" /><span><strong>Recite</strong> — text hidden, try from memory, reveal words gradually</span></div>
                <div className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" /><span><strong>Rate</strong> — self-assess and save progress to your plan</span></div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full text-base h-12"
            onClick={() => onStart(selectedSurah, startAyah, count)}
            disabled={!currentSurah}
          >
            Begin Practice <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  PRACTICE SESSION                                                  */
/* ══════════════════════════════════════════════════════════════════ */
interface SessionProps {
  surahId: number;
  startAyah: number;
  count: number;
  reciter: string;
  onFinish: (results: { ayah: number; rating: Rating }[]) => void;
  onExit: () => void;
}

function PracticeSession({ surahId, startAyah, count, reciter, onFinish, onExit }: SessionProps) {
  const [surah, setSurah] = useState<AlquranSurah | null>(null);
  const [translations, setTranslations] = useState<AlquranAyah[]>([]);
  const [loading, setLoading] = useState(true);

  const [ayahIndex, setAyahIndex] = useState(0);  // 0-based within session
  const [phase, setPhase] = useState<Phase>("listen");
  const [isPlaying, setIsPlaying] = useState(false);
  const [looping, setLooping] = useState(true);
  const [revealCount, setRevealCount] = useState<number | null>(null); // null = all revealed; during recite phase
  const [showTranslation, setShowTranslation] = useState(false);
  const [results, setResults] = useState<{ ayah: number; rating: Rating }[]>([]);
  const [listenCount, setListenCount] = useState(0); // how many times audio played

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load surah
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.asad`).then(r => r.json()),
    ]).then(([ar, en]) => {
      if (ar.code === 200) setSurah(ar.data);
      if (en.code === 200) setTranslations(en.data.ayahs);
    }).finally(() => setLoading(false));
  }, [surahId]);

  // Derived
  const ayahNumbers = Array.from({ length: count }, (_, i) => startAyah + i);
  const currentAyahNum = ayahNumbers[ayahIndex];
  const currentAyah = surah?.ayahs.find(a => a.numberInSurah === currentAyahNum);
  const currentTranslation = translations.find(a => a.numberInSurah === currentAyahNum)?.text ?? "";
  const wordCount = currentAyah ? currentAyah.text.split(" ").length : 0;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback((onEnd?: () => void) => {
    stopAudio();
    const url = audioUrl(surahId, currentAyahNum, reciter);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      onEnd?.();
    };
    audio.onerror = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
  }, [surahId, currentAyahNum, reciter, stopAudio]);

  // Auto-play when phase/ayah changes
  useEffect(() => {
    if (!surah || loading) return;
    stopAudio();
    setShowTranslation(false);

    if (phase === "listen") {
      setListenCount(0);
      setRevealCount(null);
      const playLoop = () => {
        if (!looping) return;
        setListenCount(c => c + 1);
        playAudio(() => playLoop());
      };
      // small delay for UX
      const t = setTimeout(() => playAudio(() => {
        setListenCount(1);
        if (looping) {
          const loop = () => playAudio(() => { setListenCount(c => c + 1); if (looping) loop(); });
          loop();
        }
      }), 300);
      return () => clearTimeout(t);
    }

    if (phase === "recite") {
      setRevealCount(0);
    }

    if (phase === "rate") {
      setRevealCount(null);
    }

    return () => stopAudio();
  }, [phase, ayahIndex, surah, loading]);

  // Cleanup on unmount
  useEffect(() => () => stopAudio(), []);

  const handlePhaseNext = () => {
    if (phase === "listen") {
      stopAudio();
      setPhase("recite");
    } else if (phase === "recite") {
      stopAudio();
      setPhase("rate");
    }
  };

  const handleRevealWord = () => {
    setRevealCount(c => Math.min((c ?? 0) + 1, wordCount));
  };

  const handleRevealAll = () => setRevealCount(wordCount);

  const handleRate = (rating: Rating) => {
    const newResults = [...results, { ayah: currentAyahNum, rating }];
    setResults(newResults);
    if (ayahIndex + 1 >= count) {
      stopAudio();
      onFinish(newResults);
    } else {
      setAyahIndex(i => i + 1);
      setPhase("listen");
    }
  };

  const phaseLabel: Record<Phase, string> = {
    listen: "Listen & Learn",
    recite: "Recite from Memory",
    rate: "How did you do?",
  };

  const phaseDescription: Record<Phase, string> = {
    listen: "Listen to the recitation and study the text.",
    recite: "Audio is off. Try to recite from memory, then reveal words to check.",
    rate: "Full ayah revealed. Rate your recall honestly.",
  };

  if (loading || !surah || !currentAyah) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
      </div>
    );
  }

  const progressPct = (ayahIndex / count) * 100;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { stopAudio(); onExit(); }}>
            <X className="h-4 w-4" />
          </Button>
          <div>
            <div className="text-sm font-semibold">{surah.englishName} · Ayah {currentAyahNum}</div>
            <div className="text-xs text-muted-foreground">{ayahIndex + 1} of {count} · {phaseLabel[phase]}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                r.rating === "perfect" ? "bg-green-500" :
                r.rating === "good" ? "bg-primary" : "bg-red-400"
              }`}
            />
          ))}
          {Array.from({ length: count - results.length }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-muted" />
          ))}
        </div>
      </div>

      <Progress value={progressPct} className="h-0.5 rounded-none" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-10 max-w-3xl mx-auto w-full">
        {/* Phase badge */}
        <div className="w-full mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${
              phase === "listen" ? "border-primary/40 text-primary bg-primary/5" :
              phase === "recite" ? "border-orange-400/40 text-orange-700 bg-orange-50" :
              "border-green-400/40 text-green-700 bg-green-50"
            }`}>
              {phase === "listen" && <Volume2 className="h-3 w-3 mr-1" />}
              {phase === "recite" && <EyeOff className="h-3 w-3 mr-1" />}
              {phase === "rate" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {phaseLabel[phase]}
            </Badge>
            {phase === "listen" && listenCount > 0 && (
              <span className="text-xs text-muted-foreground">{listenCount}× played</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{phaseDescription[phase]}</p>
        </div>

        {/* Arabic text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${ayahIndex}-${phase}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full"
          >
            <Card className={`w-full mb-5 border-2 transition-colors ${
              phase === "listen" ? "border-primary/20" :
              phase === "recite" ? "border-orange-200" :
              "border-green-200"
            }`}>
              <CardContent className="p-6 md:p-8 text-center space-y-4">
                {/* Ayah number badge */}
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {currentAyahNum}
                </div>

                {/* Arabic */}
                <div className="font-arabic text-3xl md:text-4xl leading-loose text-center" dir="rtl">
                  {phase === "recite" && revealCount !== null && revealCount < wordCount
                    ? maskWords(currentAyah.text, revealCount)
                    : (
                      <motion.span
                        initial={phase === "rate" ? { opacity: 0 } : {}}
                        animate={{ opacity: 1 }}
                        className="text-foreground"
                      >
                        {currentAyah.text}
                      </motion.span>
                    )
                  }
                </div>

                {/* Translation toggle */}
                <div>
                  {showTranslation ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground italic border-t pt-3 border-border/50 text-left"
                    >
                      {currentTranslation}
                    </motion.p>
                  ) : (
                    <button
                      onClick={() => setShowTranslation(true)}
                      className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
                    >
                      Show translation
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Controls per phase */}
        {phase === "listen" && (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant={isPlaying ? "default" : "outline"}
                onClick={() => {
                  if (isPlaying) { stopAudio(); }
                  else { playAudio(); }
                }}
                className="gap-2 rounded-full px-8 min-w-[160px]"
              >
                {isPlaying ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4 ml-0.5" /> Play</>}
              </Button>
              <Button
                size="icon"
                variant={looping ? "default" : "outline"}
                onClick={() => setLooping(l => !l)}
                title="Toggle loop"
                className="rounded-full h-10 w-10"
              >
                <Repeat1 className="h-4 w-4" />
              </Button>
              <Button
                size="icon" variant="outline"
                onClick={() => playAudio()}
                title="Replay from start"
                className="rounded-full h-10 w-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                {listenCount < 3
                  ? `Tip: listen at least 3 times before moving on (${listenCount}/3)`
                  : "When you're ready, move to the recitation phase."}
              </p>
              <Button
                onClick={handlePhaseNext}
                className="gap-2"
                variant={listenCount >= 2 ? "default" : "outline"}
              >
                Move to Recitation <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {phase === "recite" && (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => playAudio()}
                className="gap-2 rounded-full px-6"
              >
                <Volume2 className="h-4 w-4" /> Listen to Check
              </Button>
            </div>

            {/* Word reveal controls */}
            <div className="bg-muted/50 rounded-xl p-4 text-center space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                Progressive reveal — {revealCount === wordCount ? "all revealed" : `${revealCount} of ${wordCount} words shown`}
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 mb-1">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${((revealCount ?? 0) / wordCount) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={handleRevealWord}
                  disabled={(revealCount ?? 0) >= wordCount}
                  className="gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> Reveal Next Word
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={handleRevealAll}
                  disabled={(revealCount ?? 0) >= wordCount}
                >
                  Reveal All
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={handlePhaseNext} className="gap-2">
                Check My Answer <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {phase === "rate" && (
          <div className="w-full space-y-4">
            <p className="text-center text-sm font-medium text-foreground">
              How well did you recall this ayah?
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleRate("again")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center hover:border-red-400 transition-colors group"
              >
                <RotateCcw className="h-6 w-6 text-red-500" />
                <div className="text-sm font-semibold text-red-700">Again</div>
                <div className="text-xs text-red-500/70">Couldn't recall it</div>
              </button>

              <button
                onClick={() => handleRate("good")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center hover:border-primary transition-colors"
              >
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div className="text-sm font-semibold text-primary">Good</div>
                <div className="text-xs text-primary/60">Recalled with some help</div>
              </button>

              <button
                onClick={() => handleRate("perfect")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center hover:border-green-400 transition-colors"
              >
                <GraduationCap className="h-6 w-6 text-green-600" />
                <div className="text-sm font-semibold text-green-700">Perfect</div>
                <div className="text-xs text-green-600/70">Recalled fully from memory</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  RESULTS SCREEN                                                    */
/* ══════════════════════════════════════════════════════════════════ */
interface ResultsProps {
  surahId: number;
  results: { ayah: number; rating: Rating }[];
  onRestart: () => void;
  onExit: () => void;
}

function ResultsScreen({ surahId, results, onRestart, onExit }: ResultsProps) {
  const queryClient = useQueryClient();
  const addToPlan = useAddToMemorizationPlan();
  const updateEntry = useUpdateMemorizationEntry();
  const logActivity = useLogActivity();
  const { data: plan } = useGetMemorizationPlan({ surahId }, {
    query: { queryKey: getGetMemorizationPlanQueryKey({ surahId }) },
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const perfect = results.filter(r => r.rating === "perfect").length;
  const good = results.filter(r => r.rating === "good").length;
  const again = results.filter(r => r.rating === "again").length;
  const total = results.length;
  const minutes = Math.max(1, Math.round((total * 2.5)));

  const handleSave = async () => {
    setSaving(true);
    const newAyahs = results
      .filter(r => !plan?.find(e => e.ayahNumber === r.ayah))
      .map(r => r.ayah);

    if (newAyahs.length > 0) {
      await new Promise<void>((res, rej) =>
        addToPlan.mutate({ data: { surahId, ayahNumbers: newAyahs } }, { onSuccess: () => res(), onError: rej })
      ).catch(() => {});
    }

    // refresh plan to get ids
    await queryClient.invalidateQueries({ queryKey: getGetMemorizationPlanQueryKey({ surahId }) });
    const freshPlan = await queryClient.fetchQuery<{ id: number; ayahNumber: number; status: string }[]>({
      queryKey: getGetMemorizationPlanQueryKey({ surahId }),
    });

    // Update statuses based on ratings
    for (const r of results) {
      const entry = freshPlan?.find(e => e.ayahNumber === r.ayah);
      if (!entry) continue;
      const newStatus = r.rating === "perfect" ? "memorized"
        : r.rating === "good" ? "in_progress"
        : "not_started";
      if (entry.status !== newStatus) {
        await new Promise<void>(res =>
          updateEntry.mutate({ id: entry.id, data: { status: newStatus } }, { onSuccess: () => res(), onError: () => res() })
        );
      }
    }

    logActivity.mutate({ data: { minutes, activityType: "memorization" } });
    queryClient.invalidateQueries({ queryKey: getGetMemorizationPlanQueryKey({ surahId }) });
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 md:p-10 max-w-2xl mx-auto w-full text-center space-y-8">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4 }}>
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
      </motion.div>

      <div>
        <h2 className="text-3xl font-serif text-primary mb-1">Session Complete!</h2>
        <p className="text-muted-foreground">You practised {total} ayah{total !== 1 ? "s" : ""} from Surah {surahId}.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-3xl font-bold text-green-700">{perfect}</div>
            <div className="text-xs text-green-600 mt-0.5">Perfect</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="text-3xl font-bold text-primary">{good}</div>
            <div className="text-xs text-primary/70 mt-0.5">Good</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4 pb-3">
            <div className="text-3xl font-bold text-red-600">{again}</div>
            <div className="text-xs text-red-500 mt-0.5">Again</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 w-full">
        {results.map(r => (
          <div key={r.ayah} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-muted/40">
            <span className="text-muted-foreground">Ayah {r.ayah}</span>
            <span className={`font-medium ${
              r.rating === "perfect" ? "text-green-600" :
              r.rating === "good" ? "text-primary" : "text-red-500"
            }`}>
              {r.rating === "perfect" ? "Perfect" : r.rating === "good" ? "Good" : "Again"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full">
        {!saved ? (
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Saving progress…" : "Save to Memorization Plan"}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm py-2">
            <CheckCircle2 className="h-4 w-4" /> Progress saved!
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" /> Practice Again
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onExit}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  WAQF SIGNS GUIDE                                                  */
/* ══════════════════════════════════════════════════════════════════ */

interface WaqfSign {
  symbol: string;         // Arabic glyph shown large
  symbolClass?: string;   // extra tailwind on the symbol
  nameAr: string;         // Arabic name
  nameTranslit: string;   // transliteration
  nameEn: string;         // English label
  rule: string;           // one-sentence rule
  detail: string;         // extended explanation
  color: string;          // Tailwind color token (e.g. "red")
  bgClass: string;        // card background
  borderClass: string;    // card border
  badgeBg: string;        // badge background
  badgeText: string;      // badge text colour
  categoryLabel: string;  // e.g. "Compulsory Stop"
}

const WAQF_CATEGORIES: { label: string; description: string; icon: React.ReactNode; signs: WaqfSign[] }[] = [
  {
    label: "Compulsory Stop",
    description: "You must stop here. Continuing would alter or corrupt the meaning of the verse.",
    icon: <AlertTriangle className="h-4 w-4" />,
    signs: [
      {
        symbol: "م",
        nameAr: "وقف لازم",
        nameTranslit: "Waqf Lāzim",
        nameEn: "Compulsory Stop",
        rule: "Must stop here — continuing changes the meaning.",
        detail: "Also called Waqf Wājib (obligatory stop). If you continue past this mark, the meaning of the verse is distorted or becomes incorrect. Scholars agree stopping here is obligatory upon every reciter.",
        color: "red",
        bgClass: "bg-red-50 dark:bg-red-950/30",
        borderClass: "border-red-200 dark:border-red-800",
        badgeBg: "bg-red-100 dark:bg-red-900/50",
        badgeText: "text-red-700 dark:text-red-300",
        categoryLabel: "Must Stop",
      },
    ],
  },
  {
    label: "Forbidden Stop",
    description: "Stopping here is forbidden because it would produce incorrect or misleading meaning.",
    icon: <Ban className="h-4 w-4" />,
    signs: [
      {
        symbol: "لا",
        nameAr: "لا وقف هنا",
        nameTranslit: "Lā Waqfa Huna",
        nameEn: "No Stopping Here",
        rule: "Do NOT stop here — the meaning is incomplete or distorted if you pause.",
        detail: "If you need to stop due to necessity (e.g. out of breath), return to the last permissible stopping point before this sign and resume from there. Simply stopping and restarting at the لا mark without going back is incorrect.",
        color: "orange",
        bgClass: "bg-orange-50 dark:bg-orange-950/30",
        borderClass: "border-orange-200 dark:border-orange-800",
        badgeBg: "bg-orange-100 dark:bg-orange-900/50",
        badgeText: "text-orange-700 dark:text-orange-300",
        categoryLabel: "Forbidden",
      },
    ],
  },
  {
    label: "Permissible Stops",
    description: "Stopping is allowed, though the signs differ in whether stopping or continuing is preferred.",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    signs: [
      {
        symbol: "ج",
        nameAr: "وقف جائز",
        nameTranslit: "Waqf Jā'iz",
        nameEn: "Permissible Stop",
        rule: "Stopping and continuing are equally permissible.",
        detail: "The most common permissible-stop marker. Neither stopping nor continuing is preferred — both options are valid and carry equal weight. A complete meaning unit typically ends here.",
        color: "blue",
        bgClass: "bg-blue-50 dark:bg-blue-950/30",
        borderClass: "border-blue-200 dark:border-blue-800",
        badgeBg: "bg-blue-100 dark:bg-blue-900/50",
        badgeText: "text-blue-700 dark:text-blue-300",
        categoryLabel: "Equal Choice",
      },
      {
        symbol: "مج",
        nameAr: "وقف مجاز",
        nameTranslit: "Waqf Mujāz",
        nameEn: "Tolerated Stop",
        rule: "Stopping is permissible but slightly weaker than ج.",
        detail: "Similar to Waqf Jā'iz but the permission is less strong — it is tolerated rather than fully recommended. Some scholars prefer continuation at this mark.",
        color: "blue",
        bgClass: "bg-blue-50 dark:bg-blue-950/30",
        borderClass: "border-blue-200 dark:border-blue-800",
        badgeBg: "bg-blue-100 dark:bg-blue-900/50",
        badgeText: "text-blue-700 dark:text-blue-300",
        categoryLabel: "Tolerated",
      },
      {
        symbol: "ز",
        nameAr: "وقف مجوَّز",
        nameTranslit: "Waqf Mujawwaz",
        nameEn: "Permitted — Continue Preferred",
        rule: "Stopping is permitted, but continuing is the better choice.",
        detail: "The reciter may stop here if needed, but continuing the recitation produces a more complete and preferred reading. Think of it as 'you may stop, but please try not to.'",
        color: "sky",
        bgClass: "bg-sky-50 dark:bg-sky-950/30",
        borderClass: "border-sky-200 dark:border-sky-800",
        badgeBg: "bg-sky-100 dark:bg-sky-900/50",
        badgeText: "text-sky-700 dark:text-sky-300",
        categoryLabel: "Continue Preferred",
      },
      {
        symbol: "ص",
        nameAr: "وقف مرخَّص",
        nameTranslit: "Waqf Murakhkhas",
        nameEn: "Concession Stop",
        rule: "Allowed only as a concession (e.g. for breath in a long verse); continuing is preferred.",
        detail: "Used within long verses where it is physically difficult to continue without pausing for breath. The stop is granted as a concession, not because the meaning warrants it. Continuing without a stop is strongly preferred whenever possible.",
        color: "sky",
        bgClass: "bg-sky-50 dark:bg-sky-950/30",
        borderClass: "border-sky-200 dark:border-sky-800",
        badgeBg: "bg-sky-100 dark:bg-sky-900/50",
        badgeText: "text-sky-700 dark:text-sky-300",
        categoryLabel: "Concession Only",
      },
    ],
  },
  {
    label: "Preferred Direction",
    description: "One option is preferred over the other, though both are technically permissible.",
    icon: <CircleDot className="h-4 w-4" />,
    signs: [
      {
        symbol: "قلى",
        nameAr: "الوقف أولى",
        nameTranslit: "Al-Waqf Awlā",
        nameEn: "Stopping Preferred",
        rule: "Stopping is the better choice; continuing is still permitted.",
        detail: "Abbreviation of قيل: الوقف أولى — 'stopping is preferable'. The meaning is clearer when you stop, but the reciter has the option to continue. Scholars generally advise stopping here.",
        color: "amber",
        bgClass: "bg-amber-50 dark:bg-amber-950/30",
        borderClass: "border-amber-200 dark:border-amber-800",
        badgeBg: "bg-amber-100 dark:bg-amber-900/50",
        badgeText: "text-amber-700 dark:text-amber-300",
        categoryLabel: "Stop Preferred",
      },
      {
        symbol: "صلى",
        nameAr: "الوصل أولى",
        nameTranslit: "Al-Wasl Awlā",
        nameEn: "Continuing Preferred",
        rule: "Continuing (wasl) is the better choice; stopping is still permitted.",
        detail: "Abbreviation of قيل: الوصل أولى — 'continuation is preferable'. The reciter may stop if necessary, but the intended reading flows better without a stop. Often the grammar or meaning connects strongly to the next phrase.",
        color: "amber",
        bgClass: "bg-amber-50 dark:bg-amber-950/30",
        borderClass: "border-amber-200 dark:border-amber-800",
        badgeBg: "bg-amber-100 dark:bg-amber-900/50",
        badgeText: "text-amber-700 dark:text-amber-300",
        categoryLabel: "Continue Preferred",
      },
      {
        symbol: "ق",
        nameAr: "قيل عليه الوقف",
        nameTranslit: "Qīla ʿAlayhil Waqf",
        nameEn: "Some Scholars Allow Stop",
        rule: "Some scholars deemed stopping permissible here; it is debated.",
        detail: "This mark indicates scholarly disagreement — certain scholars permitted a stop here while others did not. It is a weaker form of permission. When in doubt, continuing is the safer option.",
        color: "amber",
        bgClass: "bg-amber-50 dark:bg-amber-950/30",
        borderClass: "border-amber-200 dark:border-amber-800",
        badgeBg: "bg-amber-100 dark:bg-amber-900/50",
        badgeText: "text-amber-700 dark:text-amber-300",
        categoryLabel: "Debated",
      },
    ],
  },
  {
    label: "Special Pauses",
    description: "Unique pause types that require a brief silence without lifting the breath.",
    icon: <PauseCircle className="h-4 w-4" />,
    signs: [
      {
        symbol: "ۛ",
        symbolClass: "text-4xl",
        nameAr: "سكتة",
        nameTranslit: "Saktah",
        nameEn: "Brief Silent Pause",
        rule: "Pause momentarily in complete silence — do not breathe or make a sound.",
        detail: "A Saktah (سكتة) is a very brief, soundless pause shorter than a full stop. Crucially, the reciter does NOT take a new breath during a Saktah — the breath is held. There are exactly 4 locations of Saktah in the Ḥafs ʿan ʿĀsim recitation: (1) Al-Kahf 18:1–2 between عِوَجًا and قَيِّمًا, (2) Yā-Sīn 36:52 between مَرْقَدِنَا and هَٰذَا, (3) Al-Qiyāmah 75:27 between مَنْ and رَاقٍ (the two words are split to avoid reading مَنْرَاقٍ as one word), and (4) Al-Muṭaffifīn 83:14 between كَلَّا and بَلْ رَانَ.",
        color: "purple",
        bgClass: "bg-purple-50 dark:bg-purple-950/30",
        borderClass: "border-purple-200 dark:border-purple-800",
        badgeBg: "bg-purple-100 dark:bg-purple-900/50",
        badgeText: "text-purple-700 dark:text-purple-300",
        categoryLabel: "Hold Breath",
      },
      {
        symbol: "وقفة",
        symbolClass: "text-2xl font-arabic",
        nameAr: "وقفة",
        nameTranslit: "Waqfa",
        nameEn: "Extended Silent Pause",
        rule: "A longer silent pause than Saktah — still without lifting the breath.",
        detail: "A Waqfa (وقفة) is similar to Saktah but the pause is noticeably longer. Like Saktah, the reciter holds the breath throughout — no new inhalation is taken. It appears in some mushafs to mark places where a meaningful separation is desired without fully stopping the recitation.",
        color: "purple",
        bgClass: "bg-purple-50 dark:bg-purple-950/30",
        borderClass: "border-purple-200 dark:border-purple-800",
        badgeBg: "bg-purple-100 dark:bg-purple-900/50",
        badgeText: "text-purple-700 dark:text-purple-300",
        categoryLabel: "Longer Pause",
      },
    ],
  },
  {
    label: "Linked / Embrace Stop",
    description: "Two places are marked together — you must stop at one of them but not both.",
    icon: <Link2 className="h-4 w-4" />,
    signs: [
      {
        symbol: "∴",
        nameAr: "معانقة",
        nameTranslit: "Muʿānaqah",
        nameEn: "Embracing / Linked Stop",
        rule: "Stop at ONE of the two marked points — never at both, never at neither.",
        detail: "Muʿānaqah (also called Murāqabah) appears as triangular dots (three dots arranged in a triangle, like ∴ or ∵) at two separate points in close proximity. The two stops are 'linked': if you stop at the first, you must continue through the second; if you continue past the first, you must stop at the second. Stopping at both or at neither is incorrect. The sign highlights a place of Quranic eloquence where the verse can be read with two valid meanings depending on where you divide it.",
        color: "indigo",
        bgClass: "bg-indigo-50 dark:bg-indigo-950/30",
        borderClass: "border-indigo-200 dark:border-indigo-800",
        badgeBg: "bg-indigo-100 dark:bg-indigo-900/50",
        badgeText: "text-indigo-700 dark:text-indigo-300",
        categoryLabel: "Stop at One",
      },
    ],
  },
  {
    label: "Section & Boundary Markers",
    description: "These mark structural divisions of the Quran — they are informational, not recitation-stop instructions.",
    icon: <Hash className="h-4 w-4" />,
    signs: [
      {
        symbol: "۝",
        nameAr: "نهاية الآية",
        nameTranslit: "Nihāyat al-Āyah",
        nameEn: "End of Ayah",
        rule: "Natural stopping point; it is Sunnah to pause briefly at each ayah's end.",
        detail: "The ornamental ayah marker (often a numbered medallion or rosette) marks the end of every verse. While it is not technically mandatory to stop here, pausing is the Prophetic practice (Sunnah). The Prophet ﷺ is reported to have stopped at the end of each ayah during his recitation.",
        color: "teal",
        bgClass: "bg-teal-50 dark:bg-teal-950/30",
        borderClass: "border-teal-200 dark:border-teal-800",
        badgeBg: "bg-teal-100 dark:bg-teal-900/50",
        badgeText: "text-teal-700 dark:text-teal-300",
        categoryLabel: "Sunnah Stop",
      },
      {
        symbol: "ع",
        nameAr: "ركوع",
        nameTranslit: "Rukūʿ",
        nameEn: "Prayer Section Marker",
        rule: "Marks a section of ~10 ayahs used in Tarāwīḥ and Tahajjud prayer divisions.",
        detail: "The Arabic letter ʿAyn (ع) marks the end of a Rukūʿ (section). The Quran is divided into 558 such sections to aid those who recite specific portions in each unit of prayer. This is a structural marker only — it does not prescribe or forbid stopping at that point.",
        color: "teal",
        bgClass: "bg-teal-50 dark:bg-teal-950/30",
        borderClass: "border-teal-200 dark:border-teal-800",
        badgeBg: "bg-teal-100 dark:bg-teal-900/50",
        badgeText: "text-teal-700 dark:text-teal-300",
        categoryLabel: "Section Divider",
      },
      {
        symbol: "۩",
        nameAr: "آية سجدة",
        nameTranslit: "Āyat Sajdah",
        nameEn: "Prostration Verse",
        rule: "Perform a prostration (Sajdat al-Tilāwah) when reading or hearing this verse.",
        detail: "There are 15 places of prostration (Sajdah) in the Quran (14 according to some scholars). When a reciter reads or hears one of these verses, it is obligatory (or highly recommended, depending on the school of law) to perform a Sajdah of Tilāwah — a single prostration outside of the regular prayer.",
        color: "teal",
        bgClass: "bg-teal-50 dark:bg-teal-950/30",
        borderClass: "border-teal-200 dark:border-teal-800",
        badgeBg: "bg-teal-100 dark:bg-teal-900/50",
        badgeText: "text-teal-700 dark:text-teal-300",
        categoryLabel: "Prostration",
      },
    ],
  },
];

const GENERAL_RULES = [
  {
    title: "Ayah-End Pause (Sunnah)",
    body: "The Prophet ﷺ used to stop at the end of every ayah, even if the meaning flowed into the next. Pausing at each ۝ is therefore Sunnah and the preferred style of recitation.",
  },
  {
    title: "Stopping in Necessity (Iḍṭirārī Waqf)",
    body: "If you run out of breath mid-verse where stopping is forbidden (لا) or inappropriate, return to the nearest valid stop point before that mark. Do not simply resume from the لا itself — go back and re-read from the previous permissible point.",
  },
  {
    title: "No Sign Present",
    body: "When no waqf sign appears, apply your understanding of Arabic grammar: stop after a grammatically and semantically complete phrase. Avoid stopping in the middle of iḍāfah (possessive constructions), after prepositions, or where the subject and its verb are separated.",
  },
  {
    title: "Types of Stop by Quality",
    body: "Scholars classify natural stops into four quality levels: Waqf Tāmm (complete — perfect meaning and grammar), Waqf Kāfī (sufficient — meaning complete, grammar continues), Waqf Ḥasan (good — partial meaning, often at ayah ends), and Waqf Qabīḥ (ugly — incomplete or distorted meaning, to be avoided).",
  },
  {
    title: "Mushafs May Differ",
    body: "Different published mushafs (e.g. Madinah, Indo-Pak, Warsh) may use slightly different waqf symbols or placement. The signs shown here follow the Madinah mushaf convention (Ḥafs ʿan ʿĀsim), the most widely distributed edition worldwide.",
  },
];

function WaqfSignsGuide() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary flex items-center gap-2">
          <BookOpen className="h-6 w-6 flex-shrink-0" />
          Waqf — Stop &amp; Pause Signs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Waqf (وقف) means "stopping" in Arabic. The Quran uses a rich system of symbols to guide reciters on
          exactly where and how to pause, breathe, and continue — preserving both the correct meaning and the
          beauty of Quranic recitation (Tajweed).
        </p>
      </div>

      {/* Quick-reference strip */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Reference</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {WAQF_CATEGORIES.flatMap(c => c.signs).map(s => (
            <div
              key={s.symbol}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 ${s.bgClass} ${s.borderClass} border`}
            >
              <span className={`font-arabic text-xl leading-none font-bold ${s.badgeText} ${s.symbolClass ?? ""}`}>
                {s.symbol}
              </span>
              <div className="min-w-0">
                <div className={`text-xs font-semibold ${s.badgeText} truncate`}>{s.nameTranslit}</div>
                <div className="text-xs text-muted-foreground truncate">{s.categoryLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category sections */}
      {WAQF_CATEGORIES.map(cat => (
        <div key={cat.label} className="space-y-3">
          {/* Category header */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{cat.icon}</span>
            <h2 className="text-base font-semibold text-foreground">{cat.label}</h2>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">{cat.description}</p>

          {/* Signs */}
          <div className="space-y-3">
            {cat.signs.map(sign => {
              const isOpen = expanded === sign.symbol + sign.nameTranslit;
              return (
                <motion.div
                  key={sign.symbol + sign.nameTranslit}
                  layout
                  className={`rounded-xl border ${sign.bgClass} ${sign.borderClass} overflow-hidden`}
                >
                  {/* Collapsed / always-visible row */}
                  <button
                    className="w-full flex items-start gap-4 p-4 text-left"
                    onClick={() => setExpanded(isOpen ? null : sign.symbol + sign.nameTranslit)}
                  >
                    {/* Symbol */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${sign.badgeBg} border ${sign.borderClass}`}>
                      <span className={`font-arabic font-bold leading-none ${sign.badgeText} ${sign.symbolClass ?? "text-3xl"}`}>
                        {sign.symbol}
                      </span>
                    </div>

                    {/* Names + rule */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-sm text-foreground">{sign.nameTranslit}</span>
                        <span className="font-arabic text-base text-foreground/80">{sign.nameAr}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sign.badgeBg} ${sign.badgeText}`}>
                          {sign.categoryLabel}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">{sign.rule}</p>
                    </div>

                    {/* Expand toggle */}
                    <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`border-t ${sign.borderClass} px-4 py-4`}>
                          <p className="text-sm text-foreground/80 leading-relaxed">{sign.detail}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Saktah locations callout */}
      <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <PauseCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-sm text-purple-800 dark:text-purple-200">
            The 4 Saktah Locations (Ḥafs ʿan ʿĀsim)
          </h3>
        </div>
        <div className="space-y-2">
          {[
            { ref: "Al-Kahf 18:1–2", ar: "عِوَجًا ۛ قَيِّمًا", note: "Between عِوَجًا and قَيِّمًا. Prevents reading as 'straight crookedness.'" },
            { ref: "Yā-Sīn 36:52", ar: "مَرْقَدِنَا ۛ هَٰذَا", note: "Between مَرْقَدِنَا and هَٰذَا. Separates the disbelievers' cry from the reply." },
            { ref: "Al-Qiyāmah 75:27", ar: "مَنْ ۛ رَاقٍ", note: "Between مَنْ and رَاقٍ. Prevents مَنْرَاقٍ being read as one compound word." },
            { ref: "Al-Muṭaffifīn 83:14", ar: "كَلَّا ۛ بَلْ رَانَ", note: "Between كَلَّا and بَلْ رَانَ. Prevents بَلْ رَانَ being read as بَلَّ رَانَ." },
          ].map(loc => (
            <div key={loc.ref} className="rounded-lg bg-white/60 dark:bg-white/5 border border-purple-100 dark:border-purple-800 p-3 flex gap-3">
              <div className="font-arabic text-base text-purple-800 dark:text-purple-200 leading-relaxed dir-rtl text-right w-40 flex-shrink-0" dir="rtl">
                {loc.ar}
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">{loc.ref}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{loc.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Rules */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">General Recitation Rules</h2>
        </div>
        <div className="space-y-2">
          {GENERAL_RULES.map(rule => (
            <div key={rule.title} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-sm font-semibold text-foreground mb-1">{rule.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{rule.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Waqf signs are scholarly guidance (ijtihādī) — when in doubt, consult a qualified Tajweed teacher.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  ROOT COMPONENT                                                    */
/* ══════════════════════════════════════════════════════════════════ */
type Screen = "setup" | "session" | "results";

type Tab = "practice" | "waqf";

export default function Practice() {
  const { data: profile } = useGetUserProfile({ query: { queryKey: getGetUserProfileQueryKey() } });
  const reciter = profile?.preferredReciter ?? "ar.alafasy";

  const [tab, setTab] = useState<Tab>("practice");
  const [screen, setScreen] = useState<Screen>("setup");
  const [config, setConfig] = useState<{ surahId: number; startAyah: number; count: number } | null>(null);
  const [results, setResults] = useState<{ ayah: number; rating: Rating }[]>([]);

  const handleStart = (surahId: number, startAyah: number, count: number) => {
    setConfig({ surahId, startAyah, count });
    setScreen("session");
  };

  const handleFinish = (res: { ayah: number; rating: Rating }[]) => {
    setResults(res);
    setScreen("results");
  };

  /* Active session / results — no tab bar, full screen */
  if (screen === "session" && config) {
    return (
      <PracticeSession
        surahId={config.surahId}
        startAyah={config.startAyah}
        count={config.count}
        reciter={reciter}
        onFinish={handleFinish}
        onExit={() => setScreen("setup")}
      />
    );
  }

  if (screen === "results" && config) {
    return (
      <ResultsScreen
        surahId={config.surahId}
        results={results}
        onRestart={() => setScreen("session")}
        onExit={() => setScreen("setup")}
      />
    );
  }

  /* Setup / Waqf guide — show tab bar */
  return (
    <div className="flex flex-col min-h-screen">
      {/* Tab switcher */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex max-w-4xl mx-auto px-4">
          <button
            onClick={() => setTab("practice")}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "practice"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Memorize
          </button>
          <button
            onClick={() => setTab("waqf")}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "waqf"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Stop &amp; Pause Signs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "practice" ? (
            <motion.div
              key="practice"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
            >
              <SetupScreen onStart={handleStart} />
            </motion.div>
          ) : (
            <motion.div
              key="waqf"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <WaqfSignsGuide />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
