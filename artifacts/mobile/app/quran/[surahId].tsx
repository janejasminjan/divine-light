import { Ionicons } from "@expo/vector-icons";
import {
  useAddToMemorizationPlan,
  useCreateBookmark,
  useDeleteBookmark,
  useGetBookmarks,
  useGetMemorizationPlan,
  useGetUserProfile,
  useUpdateUserProfile,
} from "@workspace/api-client-react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";
import { useAyahAudio } from "@/hooks/useAyahAudio";
import { fetchSurah, type AlquranSurahWithTranslation } from "@/lib/quran-api";
import { SURAH_LIST } from "@/lib/surah-list";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function AyahItem({
  ayah,
  translation,
  isBookmarked,
  isInPlan,
  showTranslation,
  arabicSize,
  isPlaying,
  onBookmark,
  onPlay,
  onAddToPlan,
}: {
  ayah: { numberInSurah: number; text: string };
  translation: string;
  isBookmarked: boolean;
  isInPlan: boolean;
  showTranslation: boolean;
  arabicSize: number;
  isPlaying: boolean;
  onBookmark: () => void;
  onPlay: () => void;
  onAddToPlan: (onSuccess: () => void, onError: () => void) => void;
}) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`${ayah.text}\n\n"${translation}"`);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleAddToPlan = () => {
    if (isInPlan) return;
    onAddToPlan(
      () => { setJustAdded(true); setTimeout(() => setJustAdded(false), 2000); },
      () => {}
    );
  };

  return (
    <View
      style={[
        styles.ayahContainer,
        {
          borderBottomColor: colors.border,
          backgroundColor: isPlaying ? colors.primary + "12" : "transparent",
        },
      ]}
    >
      {/* Ayah number badge */}
      <View style={styles.ayahTop}>
        <View style={[styles.ayahBadge, { backgroundColor: isPlaying ? colors.primary : colors.muted }]}>
          <Text style={[styles.ayahBadgeText, { color: isPlaying ? colors.primaryForeground : colors.mutedForeground }]}>
            {ayah.numberInSurah}
          </Text>
        </View>
        <View style={styles.ayahActions}>
          <Pressable
            onPress={onPlay}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle-outline"}
              size={20}
              color={isPlaying ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
          <Pressable
            onPress={handleCopy}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name={copied ? "checkmark-circle" : "copy-outline"}
              size={18}
              color={copied ? "#16A34A" : colors.mutedForeground}
            />
          </Pressable>
          <Pressable
            onPress={handleAddToPlan}
            disabled={isInPlan}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : isInPlan ? 0.5 : 1 }]}
          >
            <Ionicons
              name={isInPlan || justAdded ? "school" : "school-outline"}
              size={18}
              color={isInPlan || justAdded ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
          <Pressable
            onPress={onBookmark}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={isBookmarked ? colors.accent : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </View>

      {/* Arabic text */}
      <Text
        style={[
          styles.arabicText,
          { color: colors.foreground, fontSize: arabicSize, lineHeight: arabicSize * 1.9 },
        ]}
      >
        {ayah.text}
      </Text>

      {/* Translation */}
      {showTranslation && translation && (
        <Text style={[styles.translationText, { color: colors.mutedForeground }]}>
          {translation}
        </Text>
      )}
    </View>
  );
}

function AudioBar({
  isPlaying,
  isLoading,
  currentAyahIndex,
  positionMs,
  durationMs,
  totalAyahs,
  onToggle,
  onNext,
  onPrev,
  onStop,
  onSeek,
}: {
  isPlaying: boolean;
  isLoading: boolean;
  currentAyahIndex: number;
  positionMs: number;
  durationMs: number;
  totalAyahs: number;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  onSeek: (ms: number) => void;
}) {
  const colors = useColors();
  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const barWidth = useRef(0);

  return (
    <View style={[styles.audioBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {/* Progress bar (tappable) */}
      <Pressable
        style={styles.progressTrackHit}
        onLayout={(e) => { barWidth.current = e.nativeEvent.layout.width; }}
        onPress={(e) => {
          if (barWidth.current > 0 && durationMs > 0) {
            const ratio = e.nativeEvent.locationX / barWidth.current;
            onSeek(ratio * durationMs);
          }
        }}
      >
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { flexGrow: progress, backgroundColor: colors.primary }]} />
          <View style={{ flexGrow: 1 - progress }} />
        </View>
      </Pressable>

      {/* Times */}
      <View style={styles.progressTimes}>
        <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{formatMs(positionMs)}</Text>
        <Text style={[styles.ayahCounter, { color: colors.mutedForeground }]}>
          Ayah {currentAyahIndex + 1} / {totalAyahs}
        </Text>
        <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{formatMs(durationMs)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.audioControls}>
        <Pressable
          onPress={onPrev}
          disabled={currentAyahIndex <= 0}
          style={({ pressed }) => [styles.controlBtn, { opacity: pressed || currentAyahIndex <= 0 ? 0.4 : 1 }]}
        >
          <Ionicons name="play-skip-back" size={22} color={colors.foreground} />
        </Pressable>

        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [styles.playBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Ionicons name={isPlaying ? "pause" : "play"} size={22} color={colors.primaryForeground} />
          )}
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={currentAyahIndex >= totalAyahs - 1}
          style={({ pressed }) => [styles.controlBtn, { opacity: pressed || currentAyahIndex >= totalAyahs - 1 ? 0.4 : 1 }]}
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.foreground} />
        </Pressable>

        <Pressable
          onPress={onStop}
          style={({ pressed }) => [styles.controlBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="stop-circle-outline" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

export default function SurahReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);

  const surahNum = parseInt(surahId ?? "1", 10);
  const surahMeta = SURAH_LIST.find((s) => s.id === surahNum);

  const { data: profile } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();
  const { data: bookmarks, refetch: refetchBookmarks } = useGetBookmarks();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const { data: memorizationPlan, refetch: refetchPlan } = useGetMemorizationPlan({ surahId: surahNum });
  const addToMemorizationPlan = useAddToMemorizationPlan();

  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg: string, isError = false) => {
    setToast({ msg, isError });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [toastOpacity]);

  const [showTranslation, setShowTranslation] = useState(true);
  const translationKey = profile?.primaryTranslationLanguage ?? "en.sahih";
  const reciter = profile?.preferredReciter ?? "ar.alafasy";

  const arabicFontSize = {
    small: 22,
    medium: 26,
    large: 30,
    extra_large: 36,
  }[profile?.fontSizePreference ?? "medium"] ?? 26;

  const { data: surahData, isLoading, error } = useQuery<AlquranSurahWithTranslation>({
    queryKey: ["surah", surahNum, translationKey],
    queryFn: () => fetchSurah(surahNum, translationKey),
    staleTime: 1000 * 60 * 60,
  });

  const ayahRefs = surahData?.ayahs.map((a) => ({ numberInSurah: a.numberInSurah, number: a.number })) ?? [];
  const audio = useAyahAudio(ayahRefs, reciter);

  useEffect(() => {
    if (surahNum) {
      updateProfile.mutate({ lastReadSurahId: surahNum });
    }
  }, [surahNum]);

  useEffect(() => {
    return () => {
      audio.stop();
    };
  }, [surahNum]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const showAudioBar = audio.currentAyahIndex >= 0;

  const isBookmarked = useCallback(
    (ayahNum: number) =>
      bookmarks?.some((b) => b.surahId === surahNum && b.ayahNumber === ayahNum) ?? false,
    [bookmarks, surahNum]
  );

  const isInPlan = useCallback(
    (ayahNum: number) =>
      memorizationPlan?.some((e) => e.surahId === surahNum && e.ayahNumber === ayahNum) ?? false,
    [memorizationPlan, surahNum]
  );

  function handleAddToPlan(ayahNum: number, onSuccess: () => void, onError: () => void) {
    addToMemorizationPlan.mutate(
      { data: { surahId: surahNum, ayahNumbers: [ayahNum] } },
      {
        onSuccess: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          refetchPlan();
          showToast("Added to memorization plan");
          onSuccess();
        },
        onError: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showToast("Failed to add — please try again", true);
          onError();
        },
      }
    );
  }

  function handleBookmark(ayahNum: number) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = bookmarks?.find((b) => b.surahId === surahNum && b.ayahNumber === ayahNum);
    if (existing) {
      deleteBookmark.mutate({ id: existing.id }, { onSuccess: () => refetchBookmarks() });
    } else {
      createBookmark.mutate(
        { surahId: surahNum, ayahNumber: ayahNum },
        { onSuccess: () => refetchBookmarks() }
      );
    }
  }

  function handleAyahPlay(index: number) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (audio.currentAyahIndex === index) {
      audio.togglePlayPause();
    } else {
      audio.play(index);
    }
  }

  const showBismillah = surahNum !== 1 && surahNum !== 9;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {surahMeta?.transliteration ?? `Surah ${surahNum}`}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {surahMeta?.ayahs} ayahs · {surahMeta?.type}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {surahData && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (showAudioBar && audio.isPlaying) {
                  audio.togglePlayPause();
                } else if (showAudioBar) {
                  audio.togglePlayPause();
                } else {
                  audio.play(0);
                }
              }}
              style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons
                name={showAudioBar && audio.isPlaying ? "pause-circle" : "play-circle-outline"}
                size={24}
                color={showAudioBar ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
          )}
          <Pressable
            onPress={() => setShowTranslation((v) => !v)}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name={showTranslation ? "language" : "language-outline"}
              size={22}
              color={showTranslation ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading surah...
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            Failed to load surah
          </Text>
        </View>
      )}

      {surahData && (
        <FlatList
          ref={listRef}
          data={surahData.ayahs}
          keyExtractor={(item) => item.numberInSurah.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad + (showAudioBar ? 160 : 32) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Surah name plate */}
              <View style={[styles.namePlate, { backgroundColor: colors.primary }]}>
                <Text style={[styles.namePlateArabic, { color: colors.primaryForeground }]}>
                  {surahMeta?.name}
                </Text>
                <Text style={[styles.namePlateEnglish, { color: colors.primaryForeground + "BB" }]}>
                  {surahMeta?.translation}
                </Text>
              </View>

              {showBismillah && (
                <View style={styles.bismillahContainer}>
                  <Text style={[styles.bismillahText, { color: colors.primary, fontSize: arabicFontSize * 0.85 }]}>
                    {BISMILLAH}
                  </Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => {
            const translationAyah = surahData.translationAyahs.find(
              (t) => t.numberInSurah === item.numberInSurah
            );
            return (
              <AyahItem
                ayah={item}
                translation={translationAyah?.text ?? ""}
                isBookmarked={isBookmarked(item.numberInSurah)}
                isInPlan={isInPlan(item.numberInSurah)}
                showTranslation={showTranslation}
                arabicSize={arabicFontSize}
                isPlaying={audio.currentAyahIndex === index}
                onBookmark={() => handleBookmark(item.numberInSurah)}
                onPlay={() => handleAyahPlay(index)}
                onAddToPlan={(onSuccess, onError) => handleAddToPlan(item.numberInSurah, onSuccess, onError)}
              />
            );
          }}
        />
      )}

      {showAudioBar && (
        <AudioBar
          isPlaying={audio.isPlaying}
          isLoading={audio.isLoading}
          currentAyahIndex={audio.currentAyahIndex}
          positionMs={audio.positionMs}
          durationMs={audio.durationMs}
          totalAyahs={ayahRefs.length}
          onToggle={audio.togglePlayPause}
          onNext={audio.playNext}
          onPrev={audio.playPrev}
          onStop={audio.stop}
          onSeek={audio.seekTo}
        />
      )}

      {toast !== null && (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: toast.isError ? colors.destructive : colors.foreground,
              bottom: bottomPad + (showAudioBar ? 168 : 32),
              opacity: toastOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={toast.isError ? "alert-circle" : "checkmark-circle"}
            size={16}
            color={colors.background}
          />
          <Text style={[styles.toastText, { color: colors.background }]}>{toast.msg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 6 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  listContent: { paddingHorizontal: 16 },
  namePlate: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginVertical: 16,
    gap: 6,
  },
  namePlateArabic: { fontSize: 32, fontWeight: "700" },
  namePlateEnglish: { fontSize: 14 },
  bismillahContainer: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  bismillahText: { fontWeight: "700", textAlign: "center", lineHeight: 50 },
  ayahContainer: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  ayahTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ayahBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  ayahBadgeText: { fontSize: 12, fontWeight: "600" },
  ayahActions: { flexDirection: "row", gap: 4 },
  arabicText: { textAlign: "right", writingDirection: "rtl", fontWeight: "400" },
  translationText: { fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  audioBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTrackHit: {
    paddingVertical: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    flexDirection: "row",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: { fontSize: 11 },
  ayahCounter: { fontSize: 12, fontWeight: "600" },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
  },
  controlBtn: { padding: 6 },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: { fontSize: 13, fontWeight: "600" },
});
