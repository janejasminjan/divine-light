import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { DHIKR_COLLECTIONS } from "@/lib/dhikr-data";

const ICON_COLOR_MAP: Record<string, string> = {
  mosque: "#16A34A",
  sunny: "#F59E0B",
  moon: "#6366F1",
  "hand-left": "#EC4899",
};

export default function DhikrScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const totalEntries = (collId: string) => {
    const coll = DHIKR_COLLECTIONS.find((c) => c.id === collId);
    if (!coll) return 0;
    return coll.sections.reduce((acc, s) => acc + s.entries.length, 0);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Dhikr & Dua</Text>
      <Text style={[styles.arabicTitle, { color: colors.primary }]}>الذكر والدعاء</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Daily remembrance and supplications
      </Text>

      <View style={styles.list}>
        {DHIKR_COLLECTIONS.map((collection) => {
          const iconColor = ICON_COLOR_MAP[collection.icon] ?? colors.primary;
          const entryCount = totalEntries(collection.id);

          return (
            <Pressable
              key={collection.id}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push(`/dhikr/${collection.id}`)}
            >
              <View style={[styles.iconContainer, { backgroundColor: iconColor + "1A" }]}>
                <Ionicons name={collection.icon as any} size={28} color={iconColor} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {collection.title}
                </Text>
                <Text style={[styles.cardArabic, { color: colors.primary }]}>
                  {collection.arabicTitle}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
                  {collection.subtitle}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                  {collection.sections.length} sections · {entryCount} du'as
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  arabicTitle: { fontSize: 20, fontWeight: "700", marginTop: 2 },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardArabic: { fontSize: 14, fontWeight: "600", marginTop: 1 },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  cardMeta: { fontSize: 11, marginTop: 4 },
});
