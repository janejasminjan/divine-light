import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetMemorizationPlan,
  getGetMemorizationPlanQueryKey,
  useUpdateMemorizationEntry,
  useGetProgress,
  getGetProgressQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, BookOpen, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground", icon: Circle },
  in_progress: { label: "In Progress", color: "bg-secondary/20 text-secondary-foreground", icon: Clock },
  memorized: { label: "Memorized", color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  needs_review: { label: "Needs Review", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
};

type EntryStatus = keyof typeof STATUS_CONFIG;

export default function Memorize() {
  const queryClient = useQueryClient();
  const { data: plan, isLoading } = useGetMemorizationPlan(undefined, {
    query: { queryKey: getGetMemorizationPlanQueryKey() },
  });
  const { data: progress } = useGetProgress({ query: { queryKey: getGetProgressQueryKey() } });
  const updateEntry = useUpdateMemorizationEntry();

  const [filter, setFilter] = useState<string>("all");

  const filtered = plan?.filter((e) => filter === "all" || e.status === filter) ?? [];

  const handleStatusChange = (id: number, newStatus: EntryStatus) => {
    updateEntry.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMemorizationPlanQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
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

  const statusCounts = {
    not_started: plan?.filter((e) => e.status === "not_started").length ?? 0,
    in_progress: plan?.filter((e) => e.status === "in_progress").length ?? 0,
    memorized: plan?.filter((e) => e.status === "memorized").length ?? 0,
    needs_review: plan?.filter((e) => e.status === "needs_review").length ?? 0,
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
          <Brain className="h-7 w-7" />
          Memorization Plan
        </h1>
        <p className="text-muted-foreground">Track your Hifz journey one ayah at a time.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(STATUS_CONFIG) as EntryStatus[]).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-all ${filter === status ? "border-primary shadow-md" : "hover:border-primary/50"}`}
              onClick={() => setFilter(filter === status ? "all" : status)}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">{statusCounts[status]}</span>
                </div>
                <div className="text-xs text-muted-foreground">{cfg.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plan && plan.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {statusCounts.memorized} of {plan.length} ayahs memorized
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter("all")}
            className={filter !== "all" ? "text-primary border-primary" : ""}
          >
            {filter === "all" ? "All Ayahs" : "Show All"}
          </Button>
        </div>
      )}

      {plan && plan.length > 0 && (
        <Progress
          value={(statusCounts.memorized / plan.length) * 100}
          className="h-2"
        />
      )}

      {/* Entries */}
      {filtered.length === 0 && plan?.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-lg text-primary mb-2">Your memorization plan is empty</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Browse the Quran and add ayahs to begin your Hifz journey.
          </p>
          <Button asChild>
            <Link href="/quran">
              <BookOpen className="h-4 w-4 mr-2" /> Browse Quran
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No ayahs with status "{STATUS_CONFIG[filter as EntryStatus]?.label ?? filter}".
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((entry) => {
              const cfg = STATUS_CONFIG[entry.status as EntryStatus];
              const Icon = cfg?.icon ?? Circle;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  layout
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {entry.surahId}
                        </div>
                        <div>
                          <div className="font-medium text-sm">Surah {entry.surahId}, Ayah {entry.ayahNumber}</div>
                          {entry.lastReviewDate && (
                            <div className="text-xs text-muted-foreground">
                              Reviewed {entry.reviewCount}x · Last: {entry.lastReviewDate}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg?.color}`}>
                          {cfg?.label}
                        </span>
                        <select
                          value={entry.status}
                          onChange={(e) => handleStatusChange(entry.id, e.target.value as EntryStatus)}
                          className="text-xs border rounded px-2 py-1 bg-background text-foreground border-border"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="memorized">Memorized</option>
                          <option value="needs_review">Needs Review</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
