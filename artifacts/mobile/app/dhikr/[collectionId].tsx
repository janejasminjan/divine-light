import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { DHIKR_COLLECTIONS, type DhikrEntry, type DhikrSection } from "@/lib/dhikr-data";

function CounterButton({
  count,
  target,
  current,
  onPress,
}: {
  count: number;
  target: number;
  current: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progress = Math.min(current / target, 1);

  function handlePress() {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const done = current >= target;

  return (
    <View style={styles.counterWrapper}>
      {/* Circular progress ring */}
      <View style={styles.ringContainer}>
        <View
          style={[
            styles.ringBackground,
            { borderColor: colors.muted },
          ]}
        />
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            style={[
              styles.counterBtn,
              {
                backgroundColor: done ? colors.success : colors.primary,
              },
            ]}
            onPress={done ? undefined : handlePress}
          >
            {done ? (
              <Ionicons name="checkmark" size={36} color="#fff" />
            ) : (
              <>
                <Text style={styles.counterCurrent}>{current}</Text>
                <Text style={styles.counterTarget}>of {target}</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </View>

      {done && (
        <Text style={[styles.doneText, { color: colors.success }]}>
          Completed!
        </Text>
      )}
      {!done && (
        <Text style={[styles.tapText, { color: colors.mutedForeground }]}>
          Tap to count
        </Text>
      )}
    </View>
  );
}

export default function DhikrReaderScreen() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const collection = DHIKR_COLLECTIONS.find((c) => c.id === collectionId);

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeEntryIdx, setActiveEntryIdx] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [showTranslit, setShowTranslit] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!collection) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Collection not found</Text>
      </View>
    );
  }

  const activeSection: DhikrSection = collection.sections[activeSectionIdx];
  const activeEntry: DhikrEntry = activeSection.entries[activeEntryIdx];
  const currentCount = counts[activeEntry.id] ?? 0;
  const isDone = currentCount >= activeEntry.count;

  function increment() {
    if (isDone) return;
    setCounts((prev) => ({ ...prev, [activeEntry.id]: (prev[activeEntry.id] ?? 0) + 1 }));
  }

  function resetCurrent() {
    setCounts((prev) => ({ ...prev, [activeEntry.id]: 0 }));
  }

  async function copyText() {
    const text = `${activeEntry.arabic}\n\n${activeEntry.transliteration ?? ""}\n\n"${activeEntry.translation}"${activeEntry.source ? `\n— ${activeEntry.source}` : ""}`;
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {collection.title}
          </Text>
          <Text style={[styles.headerArabic, { color: colors.primary }]}>{collection.arabicTitle}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setShowTranslit((v) => !v)}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name="text-outline"
              size={18}
              color={showTranslit ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowTranslation((v) => !v)}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name="language-outline"
              size={18}
              color={showTranslation ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </View>

      {/* Section tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={[styles.tabsRow, { borderBottomColor: colors.border }]}
      >
        {collection.sections.map((section, idx) => (
          <Pressable
            key={section.id}
            style={[
              styles.tab,
              {
                borderBottomColor: activeSectionIdx === idx ? colors.primary : "transparent",
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => {
              setActiveSectionIdx(idx);
              setActiveEntryIdx(0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeSectionIdx === idx ? colors.primary : colors.mutedForeground },
              ]}
            >
              {section.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Main content */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Entry navigation */}
        {activeSection.entries.length > 1 && (
          <View style={styles.entryNav}>
            {activeSection.entries.map((entry, idx) => (
              <Pressable
                key={entry.id}
                style={[
                  styles.entryDot,
                  {
                    backgroundColor:
                      idx === activeEntryIdx ? colors.primary : colors.muted,
                    width: idx === activeEntryIdx ? 20 : 8,
                  },
                ]}
                onPress={() => setActiveEntryIdx(idx)}
              />
            ))}
          </View>
        )}

        {/* Arabic text */}
        <View style={[styles.arabicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {activeEntry.isQuran && (
            <View style={[styles.quranTag, { backgroundColor: colors.primary + "1A" }]}>
              <Text style={[styles.quranTagText, { color: colors.primary }]}>Quran</Text>
            </View>
          )}
          <Text style={[styles.arabicText, { color: colors.foreground }]}>
            {activeEntry.arabic}
          </Text>

          {showTranslit && activeEntry.transliteration && (
            <Text style={[styles.translitText, { color: colors.mutedForeground }]}>
              {activeEntry.transliteration}
            </Text>
          )}

          {showTranslation && (
            <Text style={[styles.translationText, { color: colors.foreground + "CC" }]}>
              "{activeEntry.translation}"
            </Text>
          )}

          {activeEntry.source && (
            <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
              — {activeEntry.source}
            </Text>
          )}

          <Pressable
            onPress={copyText}
            style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name={copied ? "checkmark-circle-outline" : "copy-outline"}
              size={16}
              color={copied ? colors.success : colors.mutedForeground}
            />
            <Text style={[styles.copyBtnText, { color: copied ? colors.success : colors.mutedForeground }]}>
              {copied ? "Copied" : "Copy"}
            </Text>
          </Pressable>
        </View>

        {/* Counter */}
        <CounterButton
          count={activeEntry.count}
          target={activeEntry.count}
          current={currentCount}
          onPress={increment}
        />

        {/* Reset */}
        {currentCount > 0 && (
          <Pressable
            onPress={resetCurrent}
            style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Reset</Text>
          </Pressable>
        )}

        {/* Section description */}
        {activeSection.description && (
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            {activeSection.description}
          </Text>
        )}

        {/* Next entry button */}
        {activeEntryIdx < activeSection.entries.length - 1 && isDone && (
          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => setActiveEntryIdx((i) => i + 1)}
          >
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  headerArabic: { fontSize: 13 },
  headerRight: { flexDirection: "row" },
  tabsRow: { borderBottomWidth: StyleSheet.hairlineWidth, maxHeight: 48 },
  tabsContainer: { paddingHorizontal: 12, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16, alignItems: "center" },
  entryNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 8,
  },
  entryDot: {
    height: 8,
    borderRadius: 4,
  },
  arabicCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  quranTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quranTagText: { fontSize: 11, fontWeight: "700" },
  arabicText: {
    fontSize: 28,
    lineHeight: 52,
    textAlign: "center",
    writingDirection: "rtl",
    fontWeight: "500",
  },
  translitText: { fontSize: 13, textAlign: "center", fontStyle: "italic" },
  translationText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  sourceText: { fontSize: 11, textAlign: "center" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  copyBtnText: { fontSize: 12 },
  counterWrapper: { alignItems: "center", gap: 12 },
  ringContainer: { position: "relative", alignItems: "center", justifyContent: "center" },
  ringBackground: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
  },
  counterBtn: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  counterCurrent: { fontSize: 42, fontWeight: "800", color: "#fff", lineHeight: 48 },
  counterTarget: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  doneText: { fontSize: 16, fontWeight: "700" },
  tapText: { fontSize: 13 },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  resetText: { fontSize: 13 },
  sectionDesc: { fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 20 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontWeight: "700" },
});
