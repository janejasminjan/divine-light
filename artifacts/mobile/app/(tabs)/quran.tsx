import { Ionicons } from "@expo/vector-icons";
import { useGetBookmarks, useGetUserProfile } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { SURAH_LIST, type SurahMeta } from "@/lib/surah-list";

function SurahRow({
  surah,
  isLastRead,
  onPress,
}: {
  surah: SurahMeta;
  isLastRead: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.surahRow,
        {
          backgroundColor: isLastRead ? colors.primary + "12" : "transparent",
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.surahNumber, { backgroundColor: colors.muted }]}>
        <Text style={[styles.surahNumberText, { color: colors.mutedForeground }]}>
          {surah.id}
        </Text>
      </View>
      <View style={styles.surahMeta}>
        <Text style={[styles.surahTranslit, { color: colors.foreground }]}>
          {surah.transliteration}
        </Text>
        <Text style={[styles.surahTranslation, { color: colors.mutedForeground }]}>
          {surah.translation} · {surah.ayahs} ayahs · {surah.type}
        </Text>
      </View>
      <Text style={[styles.surahArabic, { color: colors.primary }]}>{surah.name}</Text>
    </Pressable>
  );
}

export default function QuranScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data: profile } = useGetUserProfile();
  const lastReadSurahId = profile?.lastReadSurahId;

  const filtered = useMemo(() => {
    if (!query.trim()) return SURAH_LIST;
    const q = query.toLowerCase();
    return SURAH_LIST.filter(
      (s) =>
        s.transliteration.toLowerCase().includes(q) ||
        s.translation.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.id.toString().includes(q)
    );
  }, [query]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Quran</Text>
        <Text style={[styles.arabicTitle, { color: colors.primary }]}>القرآن الكريم</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrapper, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search surah..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        renderItem={({ item }) => (
          <SurahRow
            surah={item}
            isLastRead={item.id === lastReadSurahId}
            onPress={() => router.push(`/quran/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontWeight: "700" },
  arabicTitle: { fontSize: 20, fontWeight: "700" },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  surahNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumberText: { fontSize: 13, fontWeight: "600" },
  surahMeta: { flex: 1 },
  surahTranslit: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  surahTranslation: { fontSize: 12 },
  surahArabic: { fontSize: 18, fontWeight: "700" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
});
