import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  useGetProgress,
  getGetProgressQueryKey,
  useGetActivityHeatmap,
  getGetActivityHeatmapQueryKey,
  useGetSurahStats,
  getGetSurahStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame, Brain, Award, Clock, TrendingUp } from "lucide-react";

const SURAH_NAMES: Record<number, string> = {
  1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa",
  5: "Al-Ma'idah", 6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal",
  9: "At-Tawbah", 10: "Yunus", 36: "Ya-Sin", 55: "Ar-Rahman",
  56: "Al-Waqi'ah", 67: "Al-Mulk", 78: "An-Naba", 112: "Al-Ikhlas",
  113: "Al-Falaq", 114: "An-Nas",
};

function getSurahName(id: number) {
  return SURAH_NAMES[id] ?? `Surah ${id}`;
}

function getHeatmapColor(count: number) {
  if (count === 0) return "bg-muted/50";
  if (count === 1) return "bg-primary/20";
  if (count === 2) return "bg-primary/40";
  if (count <= 4) return "bg-primary/70";
  return "bg-primary";
}

export default function ProgressPage() {
  const { data: progress, isLoading: loadingProgress } = useGetProgress({
    query: { queryKey: getGetProgressQueryKey() },
  });
  const { data: heatmap, isLoading: loadingHeatmap } = useGetActivityHeatmap({
    query: { queryKey: getGetActivityHeatmapQueryKey() },
  });
  const { data: surahStats, isLoading: loadingSurahs } = useGetSurahStats({
    query: { queryKey: getGetSurahStatsQueryKey() },
  });

  /* Measure the heatmap container so cells fill width without scrolling */
  const heatmapRef = useRef<HTMLDivElement>(null);
  const [heatmapW, setHeatmapW] = useState(0);
  useEffect(() => {
    const el = heatmapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeatmapW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (loadingProgress || loadingHeatmap || loadingSurahs) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const p = progress ?? {
    currentStreak: 0, longestStreak: 0, totalMemorizedAyahs: 0,
    totalSurahsCompleted: 0, totalMinutesPracticed: 0,
    ayahsDueForReview: 0, totalAyahsInPlan: 0, percentageMemorized: 0, badges: [],
  };

  // Build heatmap — last 12 months
  const heatmapMap: Record<string, number> = {};
  heatmap?.forEach((d) => { heatmapMap[d.date] = d.count; });

  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const str = d.toISOString().split("T")[0];
    days.push({ date: str, count: heatmapMap[str] ?? 0 });
  }

  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
          <TrendingUp className="h-7 w-7" />
          Your Progress
        </h1>
        <p className="text-muted-foreground">A complete picture of your Hifz journey.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Current Streak", value: `${p.currentStreak}d`, sub: `Best: ${p.longestStreak}d`, icon: Flame, color: "text-orange-500" },
          { label: "Memorized", value: `${p.totalMemorizedAyahs}`, sub: `${p.percentageMemorized}% of Quran`, icon: Brain, color: "text-primary" },
          { label: "Time Practiced", value: `${Math.floor(p.totalMinutesPracticed / 60)}h`, sub: `${p.totalMinutesPracticed % 60}m total`, icon: Clock, color: "text-secondary" },
          { label: "Surahs Done", value: `${p.totalSurahsCompleted}`, sub: "Fully memorized", icon: Award, color: "text-green-600" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground/70">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      {p.badges && p.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-secondary" />
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {p.badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center gap-1 bg-secondary/10 rounded-xl p-4 text-center min-w-[100px]"
                >
                  <Award className="h-8 w-8 text-secondary" />
                  <div className="text-sm font-medium text-foreground">{badge.name}</div>
                  <div className="text-xs text-muted-foreground">{badge.description}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Heatmap</CardTitle>
          <CardDescription>Your practice activity over the past 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ref div fills the card width; cells are sized to fit without scrolling */}
          <div ref={heatmapRef} className="w-full">
            {heatmapW > 0 && (() => {
              const gap = 2;
              const cellSize = Math.max(4, Math.floor((heatmapW - (weeks.length - 1) * gap) / weeks.length));
              return (
                <div
                  className="flex"
                  style={{ gap }}
                >
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col" style={{ gap }}>
                      {week.map((day) => (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                          className={`rounded-sm transition-colors ${getHeatmapColor(day.count)}`}
                          style={{ width: cellSize, height: cellSize }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 5].map((n) => (
              <div key={n} className={`w-3 h-3 rounded-sm ${getHeatmapColor(n)}`} />
            ))}
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-surah stats */}
      {surahStats && surahStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-Surah Progress</CardTitle>
            <CardDescription>Memorization completion by Surah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {surahStats
              .sort((a, b) => b.percentageMemorized - a.percentageMemorized)
              .map((stat) => (
                <div key={stat.surahId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">
                      {getSurahName(stat.surahId)}
                      <span className="text-muted-foreground font-normal ml-1">(Surah {stat.surahId})</span>
                    </span>
                    <span className="text-muted-foreground">
                      {stat.memorizedAyahs}/{stat.totalAyahs}
                    </span>
                  </div>
                  <Progress value={stat.percentageMemorized} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
