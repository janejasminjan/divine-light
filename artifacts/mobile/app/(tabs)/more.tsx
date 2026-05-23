import { Ionicons } from "@expo/vector-icons";
import {
  useGetUserProfile,
  useUpdateUserProfile,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FONT_SIZES = ["small", "medium", "large", "extra_large"] as const;
type FontSize = (typeof FONT_SIZES)[number];

const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Al-Sudais" },
  { id: "ar.husary", name: "Al-Husary" },
  { id: "ar.minshawi", name: "Al-Minshawi" },
  { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly" },
];

const TRANSLATIONS = [
  { key: "en.sahih", label: "Sahih International (English)" },
  { key: "en.asad", label: "Muhammad Asad (English)" },
  { key: "en.pickthall", label: "Pickthall (English)" },
  { key: "ur.jawadi", label: "Jawadi (اردو)" },
  { key: "fr.hamidullah", label: "Hamidullah (Français)" },
  { key: "tr.diyanet", label: "Diyanet (Türkçe)" },
];

function SettingRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <Ionicons name={icon as any} size={18} color={colors.mutedForeground} />
      <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );
}

function PickerModal<T extends string>({
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  title: string;
  options: { id: T; name: string }[];
  value: T;
  onSelect: (v: T) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.modalOverlay]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
        {options.map((opt) => (
          <Pressable
            key={opt.id}
            style={({ pressed }) => [
              styles.modalOption,
              { backgroundColor: opt.id === value ? colors.primary + "1A" : "transparent", opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => { onSelect(opt.id); onClose(); }}
          >
            <Text style={[styles.modalOptionText, { color: opt.id === value ? colors.primary : colors.foreground }]}>
              {opt.name}
            </Text>
            {opt.id === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { data: profile, isLoading, refetch } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [showTranslationPicker, setShowTranslationPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  function update(fields: Parameters<typeof updateProfile.mutate>[0]) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    updateProfile.mutate(fields, { onSuccess: () => refetch() });
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const reciter = RECITERS.find((r) => r.id === profile?.preferredReciter) ?? RECITERS[0];
  const translation = TRANSLATIONS.find((t) => t.key === profile?.primaryTranslationLanguage) ?? TRANSLATIONS[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Text style={[styles.title, { color: colors.foreground }]}>More</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              {(profile?.displayName ?? "Q").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Pressable
                  onPress={() => {
                    if (nameInput.trim()) update({ displayName: nameInput.trim() });
                    setEditingName(false);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.nameRow}
                onPress={() => { setNameInput(profile?.displayName ?? ""); setEditingName(true); }}
              >
                <Text style={[styles.profileName, { color: colors.foreground }]}>
                  {profile?.displayName ?? "Learner"}
                </Text>
                <Ionicons name="pencil" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
            <Text style={[styles.profileLevel, { color: colors.mutedForeground }]}>
              {profile?.goal ?? "–"} · {profile?.level ?? "–"}
            </Text>
          </View>
        </View>

        {/* Reading settings */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>READING</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="text-outline" label="Font Size">
            <View style={styles.fontSizePicker}>
              {FONT_SIZES.map((size) => (
                <Pressable
                  key={size}
                  style={[
                    styles.fontSizeBtn,
                    {
                      backgroundColor: profile?.fontSizePreference === size ? colors.primary : colors.muted,
                    },
                  ]}
                  onPress={() => update({ fontSizePreference: size })}
                >
                  <Text
                    style={[
                      styles.fontSizeBtnText,
                      {
                        color:
                          profile?.fontSizePreference === size ? colors.primaryForeground : colors.foreground,
                        fontSize: size === "small" ? 9 : size === "medium" ? 11 : size === "large" ? 13 : 15,
                      },
                    ]}
                  >
                    A
                  </Text>
                </Pressable>
              ))}
            </View>
          </SettingRow>

          <SettingRow icon="musical-notes-outline" label="Reciter">
            <Pressable onPress={() => setShowReciterPicker(true)}>
              <Text style={[styles.pickerValue, { color: colors.primary }]}>{reciter.name}</Text>
            </Pressable>
          </SettingRow>

          <SettingRow icon="language-outline" label="Translation">
            <Pressable onPress={() => setShowTranslationPicker(true)}>
              <Text style={[styles.pickerValue, { color: colors.primary }]} numberOfLines={1}>
                {translation.label.split(" (")[0]}
              </Text>
            </Pressable>
          </SettingRow>

          <SettingRow icon="text" label="Transliteration">
            <Switch
              value={profile?.transliterationEnabled ?? true}
              onValueChange={(v) => update({ transliterationEnabled: v })}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.primaryForeground}
            />
          </SettingRow>
        </View>

        {/* Goal settings */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LEARNING GOAL</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["recite", "memorize", "understand", "all"] as const).map((goal) => (
            <Pressable
              key={goal}
              style={({ pressed }) => [
                styles.goalRow,
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => update({ goal })}
            >
              <Text
                style={[
                  styles.goalText,
                  { color: profile?.goal === goal ? colors.primary : colors.foreground },
                ]}
              >
                {goal.charAt(0).toUpperCase() + goal.slice(1)}
              </Text>
              {profile?.goal === goal && (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {showReciterPicker && (
        <PickerModal
          title="Choose Reciter"
          options={RECITERS}
          value={(profile?.preferredReciter ?? "ar.alafasy") as any}
          onSelect={(id) => update({ preferredReciter: id })}
          onClose={() => setShowReciterPicker(false)}
        />
      )}

      {showTranslationPicker && (
        <PickerModal
          title="Choose Translation"
          options={TRANSLATIONS.map((t) => ({ id: t.key as any, name: t.label }))}
          value={(profile?.primaryTranslationLanguage ?? "en.sahih") as any}
          onSelect={(key) => update({ primaryTranslationLanguage: key })}
          onClose={() => setShowTranslationPicker(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileLevel: { fontSize: 13, marginTop: 2, textTransform: "capitalize" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 8 },
  section: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: { flex: 1, fontSize: 14 },
  settingControl: { alignItems: "flex-end" },
  fontSizePicker: { flexDirection: "row", gap: 4 },
  fontSizeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  fontSizeBtnText: { fontWeight: "700" },
  pickerValue: { fontSize: 14, fontWeight: "600", maxWidth: 140 },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  goalText: { fontSize: 14, fontWeight: "500" },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  modalSheet: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    gap: 4,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionText: { fontSize: 14 },
});
