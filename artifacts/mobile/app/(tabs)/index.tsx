import { Ionicons } from "@expo/vector-icons";
import {
  useGetProgress,
  useGetUserProfile,
  useGetDueReviews,
  useGetBookmarks,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useGetUserProfile();
  const { data: progress, isLoading: progressLoading, refetch: refetchProgress } = useGetProgress();
  const { data: dueReviews, refetch: refetchDue } = useGetDueReviews();
  const { data: bookmarks } = useGetBookmarks();

  const isLoading = profileLoading || progressLoading;
  const isRefreshing = false;

  function handleRefresh() {
    refetchProfile();
    refetchProgress();
    refetchDue();
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const displayName = profile?.displayName ?? "Learner";
  const streak = progress?.currentStreak ?? 0;
  const memorized = progress?.totalMemorizedAyahs ?? 0;
  const dueCount = dueReviews?.length ?? 0;
  const bookmarkCount = bookmarks?.length ?? 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
      ]}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{displayName}</Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="flame" size={16} color={colors.primaryForeground} />
          <Text style={[styles.streakText, { color: colors.primaryForeground }]}>{streak}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Streak" value={`${streak} days`} icon="flame" color="#F59E0B" />
            <StatCard label="Memorized" value={`${memorized} ayahs`} icon="book" color={colors.primary} />
            <StatCard label="Due Reviews" value={dueCount} icon="refresh-circle" color="#8B5CF6" />
            <StatCard label="Bookmarks" value={bookmarkCount} icon="bookmark" color="#EC4899" />
          </View>

          {/* Quick actions */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Start</Text>

          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => router.push("/(tabs)/quran")}
          >
            <View>
              <Text style={[styles.quickCardTitle, { color: colors.primaryForeground }]}>
                Continue Reading
              </Text>
              <Text style={[styles.quickCardSub, { color: colors.primaryForeground + "BB" }]}>
                {profile?.lastReadSurahId
                  ? `Last read Surah ${profile.lastReadSurahId}`
                  : "Start with Al-Fatihah"}
              </Text>
            </View>
            <Ionicons name="book-outline" size={32} color={colors.primaryForeground + "99"} />
          </Pressable>

          {dueCount > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.reviewCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push("/(tabs)/memorize")}
            >
              <View style={[styles.reviewIcon, { backgroundColor: "#8B5CF6" + "22" }]}>
                <Ionicons name="refresh-circle" size={22} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewTitle, { color: colors.foreground }]}>
                  {dueCount} ayah{dueCount !== 1 ? "s" : ""} due for review
                </Text>
                <Text style={[styles.reviewSub, { color: colors.mutedForeground }]}>
                  Tap to start your SRS session
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}

          {/* Progress summary */}
          {progress && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Memorization Progress
              </Text>
              <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.progressRow}>
                  <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                    Total in plan
                  </Text>
                  <Text style={[styles.progressValue, { color: colors.foreground }]}>
                    {progress.totalAyahsInPlan} ayahs
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.min(progress.percentageMemorized, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPercent, { color: colors.mutedForeground }]}>
                  {progress.percentageMemorized.toFixed(1)}% memorized
                </Text>
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  greeting: { fontSize: 13, marginBottom: 2 },
  name: { fontSize: 26, fontWeight: "700" },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: { fontSize: 15, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    minWidth: "44%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  quickCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickCardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  quickCardSub: { fontSize: 13 },
  reviewCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  reviewIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  reviewTitle: { fontSize: 14, fontWeight: "600" },
  reviewSub: { fontSize: 12, marginTop: 2 },
  progressCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 8 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 13 },
  progressValue: { fontSize: 13, fontWeight: "600" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressPercent: { fontSize: 12, textAlign: "center" },
});
