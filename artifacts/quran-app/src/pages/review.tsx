import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetDueReviews,
  getGetDueReviewsQueryKey,
  useSubmitReview,
  useLogActivity,
  getGetProgressQueryKey,
  useGetUserProfile,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Volume2, VolumeX, CheckCircle, XCircle, Minus, Star, History } from "lucide-react";

const SURAH_OFFSETS: number[] = [0];
const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

for (let i = 0; i < SURAH_AYAH_COUNTS.length - 1; i++) {
  SURAH_OFFSETS.push(SURAH_OFFSETS[i] + SURAH_AYAH_COUNTS[i]);
}

function getAudioUrl(surahId: number, ayahNumber: number, reciter: string) {
  const globalNum = SURAH_OFFSETS[surahId - 1] + ayahNumber;
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalNum}.mp3`;
}

type Rating = "easy" | "hard" | "forgot";

export default function Review() {
  const queryClient = useQueryClient();
  const { data: dueReviews, isLoading } = useGetDueReviews({
    query: { queryKey: getGetDueReviewsQueryKey() },
  });
  const { data: profile } = useGetUserProfile({
    query: { queryKey: getGetUserProfileQueryKey() },
  });
  const submitReview = useSubmitReview();
  const logActivity = useLogActivity();

  const reciter = profile?.preferredReciter ?? "ar.alafasy";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sessionStart] = useState(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ayahText, setAyahText] = useState<string | null>(null);
  const [ayahLoading, setAyahLoading] = useState(false);

  const reviews = dueReviews ?? [];
  const current = reviews[currentIndex];
  const total = reviews.length;

  /* ── Fetch Arabic text for the current ayah ─────────────── */
  useEffect(() => {
    if (!current) return;
    setAyahText(null);
    setAyahLoading(true);
    fetch(`https://api.alquran.cloud/v1/ayah/${current.surahId}:${current.ayahNumber}`)
      .then(r => r.json())
      .then(d => { if (d.code === 200) setAyahText(d.data.text); })
      .catch(() => {})
      .finally(() => setAyahLoading(false));
  }, [current?.surahId, current?.ayahNumber]);

  const playAudio = () => {
    if (!current) return;
    const url = getAudioUrl(current.surahId, current.ayahNumber, reciter);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
  };

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  const handleRate = (rating: Rating) => {
    if (!current) return;
    submitReview.mutate(
      { data: { entryId: current.id, rating } },
      {
        onSuccess: () => {
          if (currentIndex + 1 >= total) {
            const minutes = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));
            logActivity.mutate({ data: { minutes, activityType: "review" } });
            queryClient.invalidateQueries({ queryKey: getGetDueReviewsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
            setDone(true);
          } else {
            setCurrentIndex((i) => i + 1);
            setRevealed(false);
            audioRef.current?.pause();
            setPlaying(false);
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (total === 0 || done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-serif text-primary mb-2">
          {done ? "Session Complete!" : "All Caught Up!"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {done
            ? `You reviewed ${total} ayah${total !== 1 ? "s" : ""} today.`
            : "No ayahs are due for review right now. Check back tomorrow."}
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
            <History className="h-7 w-7" />
            Review Session
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {currentIndex + 1} of {total} ayahs
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {total - currentIndex - 1} remaining
        </span>
      </div>

      <Progress value={((currentIndex) / total) * 100} className="h-1.5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="overflow-hidden border-2 border-border">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Surah {current.surahId}</div>
                  <div className="text-lg font-semibold text-foreground">Ayah {current.ayahNumber}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded-full">
                    Reviewed {current.reviewCount}x
                  </span>
                </div>
              </div>

              {/* Audio */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant={playing ? "default" : "outline"}
                  onClick={playAudio}
                  className="gap-2 rounded-full px-8"
                >
                  {playing ? <Volume2 className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  {playing ? "Playing..." : "Play Recitation"}
                </Button>
              </div>

              {/* Reveal */}
              {!revealed ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Listen to the ayah, then try to recite it from memory.
                  </p>
                  <Button onClick={() => setRevealed(true)} variant="secondary" className="w-full">
                    Reveal Ayah
                  </Button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-primary/5 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-4">Surah {current.surahId}, Ayah {current.ayahNumber}</p>
                    {ayahLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-muted/60 rounded animate-pulse w-3/4 mx-auto" />
                        <div className="h-4 bg-muted/60 rounded animate-pulse w-1/2 mx-auto" />
                      </div>
                    ) : ayahText ? (
                      <p className="font-arabic text-2xl md:text-3xl leading-loose text-foreground" dir="rtl">
                        {ayahText}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Could not load ayah text.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-center text-muted-foreground">How well did you recall it?</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        onClick={() => handleRate("forgot")}
                        variant="outline"
                        className="flex-col h-auto py-3 gap-1 border-red-200 hover:bg-red-50 hover:border-red-400"
                        disabled={submitReview.isPending}
                      >
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-xs">Forgot</span>
                      </Button>
                      <Button
                        onClick={() => handleRate("hard")}
                        variant="outline"
                        className="flex-col h-auto py-3 gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-400"
                        disabled={submitReview.isPending}
                      >
                        <Minus className="h-5 w-5 text-orange-500" />
                        <span className="text-xs">Hard</span>
                      </Button>
                      <Button
                        onClick={() => handleRate("easy")}
                        variant="outline"
                        className="flex-col h-auto py-3 gap-1 border-green-200 hover:bg-green-50 hover:border-green-400"
                        disabled={submitReview.isPending}
                      >
                        <Star className="h-5 w-5 text-green-600" />
                        <span className="text-xs">Easy</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
