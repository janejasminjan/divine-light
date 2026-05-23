import { Ionicons } from "@expo/vector-icons";
import {
  useGetDueReviews,
  useGetMemorizationPlan,
  useGetProgress,
  useSubmitReview,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { fetchAyah, AlquranAyahFull } from "@/lib/quran-api";
import { SURAH_LIST } from "@/lib/surah-list";

type Rating = "easy" | "hard" | "forgot";

function ReviewCard({
  entry,
  onRate,
}: {
  entry: { id: number; surahId: number; ayahNumber: number };
  onRate: (rating: Rating) => void;
}) {
  const colors = useColors();
  const [revealed, setRevealed] = useState(false);
  const [ayahData, setAyahData] = useState<AlquranAyahFull | null>(null);
  const [ayahLoading, setAyahLoading] = useState(true);
  const [ayahError, setAyahError] = useState(false);
  const surah = SURAH_LIST.find((s) => s.id === entry.surahId);

  useEffect(() => {
    let cancelled = false;
    setAyahLoading(true);
    setAyahError(false);
    setAyahData(null);
    fetchAyah(entry.surahId, entry.ayahNumber)
      .then((data) => {
        if (!cancelled) {
          setAyahData(data);
          setAyahLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAyahError(true);
          setAyahLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [entry.surahId, entry.ayahNumber]);

  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.reviewHeader}>
        <Text style={[styles.reviewSurah, { color: colors.mutedForeground }]}>
          {surah?.transliteration ?? `Surah ${entry.surahId}`} · Ayah {entry.ayahNumber}
        </Text>
        <Text style={[styles.reviewArabicSurah, { color: colors.primary }]}>
          {surah?.name ?? ""}
        </Text>
      </View>

      <View style={[styles.reviewAyahBox, { backgroundColor: colors.muted }]}>
        {ayahLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : ayahError ? (
          <Text style={[styles.ayahRef, { color: colors.mutedForeground }]}>
            Could not load ayah text.
          </Text>
        ) : !revealed ? (
          <Pressable
            style={({ pressed }) => [styles.revealBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              setRevealed(true);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="eye-outline" size={22} color={colors.primary} />
            <Text style={[styles.revealText, { color: colors.primary }]}>Tap to reveal</Text>
          </Pressable>
        ) : (
          <View style={styles.ayahContent}>
            <Text style={[styles.arabicText, { color: colors.foreground }]}>
              {ayahData?.arabicText}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.translationText, { color: colors.mutedForeground }]}>
              {ayahData?.translationText}
            </Text>
          </View>
        )}
      </View>

      {revealed && !ayahLoading && (
        <View style={styles.rateRow}>
          {(["forgot", "hard", "easy"] as Rating[]).map((r) => {
            const config = {
              forgot: { color: "#EF4444", label: "Forgot", icon: "close-circle" },
              hard: { color: "#F59E0B", label: "Hard", icon: "alert-circle" },
              easy: { color: "#16A34A", label: "Easy", icon: "checkmark-circle" },
            }[r];
            return (
              <Pressable
                key={r}
                style={({ pressed }) => [
                  styles.rateBtn,
                  { backgroundColor: config.color + "22", borderColor: config.color, opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onRate(r);
                }}
              >
                <Ionicons name={config.icon as any} size={20} color={config.color} />
                <Text style={[styles.rateBtnText, { color: config.color }]}>{config.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function MemorizeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { data: dueReviews, isLoading: dueLoading, refetch: refetchDue } = useGetDueReviews();
  const { data: plan, isLoading: planLoading, refetch: refetchPlan } = useGetMemorizationPlan({});
  const { data: progress } = useGetProgress();
  const submitReview = useSubmitReview();

  const [currentIdx, setCurrentIdx] = useState(0);

  const isLoading = dueLoading || planLoading;

  const dueList = dueReviews ?? [];
  const currentEntry = dueList[currentIdx];

  function handleRate(rating: Rating) {
    if (!currentEntry) return;
    submitReview.mutate(
      { entryId: currentEntry.id, rating },
      {
        onSuccess: () => {
          if (currentIdx < dueList.length - 1) {
            setCurrentIdx((i) => i + 1);
          } else {
            Alert.alert("Session Complete!", "You've reviewed all due ayahs.");
            refetchDue();
            setCurrentIdx(0);
          }
        },
      }
    );
  }

  const memorizedAyahs = plan?.filter((e) => e.status === "memorized").length ?? 0;
  const inProgressAyahs = plan?.filter((e) => e.status === "in_progress").length ?? 0;
  const needsReview = plan?.filter((e) => e.status === "needs_review").length ?? 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => { refetchDue(); refetchPlan(); }}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Memorization</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Spaced repetition review
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Plan overview */}
          <View style={styles.statsRow}>
            <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.miniStatVal, { color: "#16A34A" }]}>{memorizedAyahs}</Text>
              <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>Memorized</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.miniStatVal, { color: "#F59E0B" }]}>{inProgressAyahs}</Text>
              <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>In Progress</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.miniStatVal, { color: "#8B5CF6" }]}>{dueList.length}</Text>
              <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>Due Today</Text>
            </View>
          </View>

          {/* SRS Review session */}
          {dueList.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Review Session
                </Text>
                <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                  {currentIdx + 1} / {dueList.length}
                </Text>
              </View>

              {currentEntry && (
                <ReviewCard
                  key={currentEntry.id}
                  entry={currentEntry}
                  onRate={handleRate}
                />
              )}
            </>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                All caught up!
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                No reviews due today. Keep up the great work.
              </Text>
            </View>
          )}

          {/* Plan list */}
          {plan && plan.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>
                My Plan
              </Text>
              {plan.slice(0, 20).map((entry) => {
                const surah = SURAH_LIST.find((s) => s.id === entry.surahId);
                const statusColor = {
                  memorized: "#16A34A",
                  in_progress: "#F59E0B",
                  needs_review: "#8B5CF6",
                  not_started: colors.mutedForeground,
                }[entry.status];

                return (
                  <View
                    key={entry.id}
                    style={[styles.planRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.planText, { color: colors.foreground }]}>
                      {surah?.transliteration ?? `Surah ${entry.surahId}`} {entry.surahId}:{entry.ayahNumber}
                    </Text>
                    <Text style={[styles.planStatus, { color: statusColor }]}>
                      {entry.status.replace("_", " ")}
                    </Text>
                  </View>
                );
              })}
              {plan.length > 20 && (
                <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
                  +{plan.length - 20} more entries
                </Text>
              )}
            </>
          )}

          {(!plan || plan.length === 0) && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
              <Ionicons name="book-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No plan yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Add ayahs to memorize from the Quran reader.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 2, marginBottom: 8 },
  statsRow: { flexDirection: "row", gap: 10 },
  miniStat: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  miniStatVal: { fontSize: 22, fontWeight: "700" },
  miniStatLabel: { fontSize: 11 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionCount: { fontSize: 13 },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
  },
  reviewSurah: { fontSize: 13 },
  reviewArabicSurah: { fontSize: 16, fontWeight: "700" },
  reviewAyahBox: {
    minHeight: 100,
    margin: 12,
    marginTop: 0,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  revealBtn: { alignItems: "center", gap: 8 },
  revealText: { fontSize: 14, fontWeight: "600" },
  ayahRef: { fontSize: 15, textAlign: "center" },
  ayahContent: { width: "100%", alignItems: "center", gap: 12 },
  arabicText: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "right",
    lineHeight: 44,
    writingDirection: "rtl",
    width: "100%",
  },
  divider: { height: 1, width: "100%", opacity: 0.5 },
  translationText: { fontSize: 13, textAlign: "center", lineHeight: 20, fontStyle: "italic" },
  rateRow: { flexDirection: "row", gap: 8, padding: 12, paddingTop: 4 },
  rateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  rateBtnText: { fontSize: 13, fontWeight: "700" },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  planText: { flex: 1, fontSize: 13 },
  planStatus: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  moreText: { textAlign: "center", fontSize: 12, marginTop: 4 },
});
