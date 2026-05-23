import { useState, useEffect, useCallback } from "react";

/* ── Constants ─────────────────────────────────────────────── */
const STORAGE_KEY = "qiyam_reminders_v1";

export const SPECIAL_SURAHS = [
  {
    id: 18,
    name: "Al-Kahf",
    arabic: "الكهف",
    benefit: "Whoever recites it on Friday will have light shining for him until the next Friday",
    defaultTime: "10:00",
    defaultFrequency: "friday" as Frequency,
    icon: "🕌",
  },
  {
    id: 36,
    name: "Ya-Sin",
    arabic: "يس",
    benefit: "Heart of the Quran — recite in the morning",
    defaultTime: "06:30",
    defaultFrequency: "daily" as Frequency,
    icon: "🌅",
  },
  {
    id: 55,
    name: "Ar-Rahman",
    arabic: "الرحمن",
    benefit: "The Beneficent — especially recommended on Fridays",
    defaultTime: "13:00",
    defaultFrequency: "friday" as Frequency,
    icon: "✨",
  },
  {
    id: 56,
    name: "Al-Waqi'ah",
    arabic: "الواقعة",
    benefit: "Protection from poverty — recite every night",
    defaultTime: "21:00",
    defaultFrequency: "daily" as Frequency,
    icon: "🌙",
  },
  {
    id: 67,
    name: "Al-Mulk",
    arabic: "الملك",
    benefit: "Protection in the grave — recite before sleep",
    defaultTime: "22:00",
    defaultFrequency: "daily" as Frequency,
    icon: "⭐",
  },
];

export type Frequency = "daily" | "friday" | "weekends";

export interface ReminderEntry {
  enabled: boolean;
  time: string;       // "HH:MM" 24h
  frequency: Frequency;
  lastShownDate: string; // "YYYY-MM-DD"
}

export interface RemindersConfig {
  notificationsGranted: boolean;
  dailyRecitation: ReminderEntry;
  surahs: Record<number, ReminderEntry>;
}

/* ── Default config ────────────────────────────────────────── */
function defaultConfig(): RemindersConfig {
  const surahDefaults: Record<number, ReminderEntry> = {};
  SPECIAL_SURAHS.forEach(s => {
    surahDefaults[s.id] = {
      enabled: false,
      time: s.defaultTime,
      frequency: s.defaultFrequency,
      lastShownDate: "",
    };
  });
  return {
    notificationsGranted: false,
    dailyRecitation: { enabled: false, time: "07:00", frequency: "daily", lastShownDate: "" },
    surahs: surahDefaults,
  };
}

/* ── Helpers ───────────────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function currentHHMM() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function isFriday() { return new Date().getDay() === 5; }
function isWeekend() { const d = new Date().getDay(); return d === 5 || d === 6; }

function frequencyMatches(freq: Frequency): boolean {
  if (freq === "daily") return true;
  if (freq === "friday") return isFriday();
  if (freq === "weekends") return isWeekend();
  return false;
}

function isWithinWindow(targetTime: string, windowMinutes = 30): boolean {
  const [th, tm] = targetTime.split(":").map(Number);
  const now = new Date();
  const targetMins = th * 60 + tm;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return Math.abs(nowMins - targetMins) <= windowMinutes;
}

function loadConfig(): RemindersConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing keys
    const def = defaultConfig();
    return {
      ...def,
      ...parsed,
      dailyRecitation: { ...def.dailyRecitation, ...(parsed.dailyRecitation ?? {}) },
      surahs: { ...def.surahs, ...(parsed.surahs ?? {}) },
    };
  } catch {
    return defaultConfig();
  }
}

function saveConfig(cfg: RemindersConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function showNotification(title: string, body: string, surahId?: number) {
  if (Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: surahId ? `surah-${surahId}` : "daily-recitation",
    silent: false,
  });
  n.onclick = () => {
    window.focus();
    n.close();
    if (surahId) {
      window.history.pushState({}, "", `/quran/${surahId}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      window.history.pushState({}, "", "/quran");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };
}

/* ══════════════════════════════════════════════════════════ */
/*  Hook                                                       */
/* ══════════════════════════════════════════════════════════ */
export function useReminders() {
  const [config, setConfigState] = useState<RemindersConfig>(loadConfig);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );

  const persist = useCallback((cfg: RemindersConfig) => {
    saveConfig(cfg);
    setConfigState(cfg);
  }, []);

  /* Request browser notification permission */
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermissionState(result);
    persist({ ...config, notificationsGranted: result === "granted" });
    return result;
  }, [config, persist]);

  /* Update daily recitation reminder */
  const setDailyRecitation = useCallback((patch: Partial<ReminderEntry>) => {
    const updated = { ...config, dailyRecitation: { ...config.dailyRecitation, ...patch } };
    persist(updated);
  }, [config, persist]);

  /* Update a specific surah reminder */
  const setSurahReminder = useCallback((surahId: number, patch: Partial<ReminderEntry>) => {
    const updated = {
      ...config,
      surahs: {
        ...config.surahs,
        [surahId]: { ...config.surahs[surahId], ...patch },
      },
    };
    persist(updated);
  }, [config, persist]);

  /* Test notification */
  const sendTestNotification = useCallback(() => {
    showNotification("🕌 Qiyam Reminder", "This is a test notification from Qiyam.");
  }, []);

  /* Mark shown today */
  const markShown = useCallback((key: "daily" | number) => {
    const today = todayStr();
    if (key === "daily") {
      persist({ ...config, dailyRecitation: { ...config.dailyRecitation, lastShownDate: today } });
    } else {
      persist({
        ...config,
        surahs: {
          ...config.surahs,
          [key]: { ...config.surahs[key], lastShownDate: today },
        },
      });
    }
  }, [config, persist]);

  /* Check & fire due reminders */
  const checkReminders = useCallback(() => {
    if (permissionState !== "granted") return;
    const cfg = loadConfig(); // fresh read
    const today = todayStr();

    // Daily recitation
    const dr = cfg.dailyRecitation;
    if (dr.enabled && dr.lastShownDate !== today && frequencyMatches(dr.frequency) && isWithinWindow(dr.time)) {
      showNotification("📖 Time to Recite!", "Your daily Quran recitation reminder.");
      saveConfig({ ...cfg, dailyRecitation: { ...dr, lastShownDate: today } });
      setConfigState(loadConfig());
    }

    // Special surahs
    SPECIAL_SURAHS.forEach(s => {
      const sr = cfg.surahs[s.id];
      if (!sr) return;
      if (sr.enabled && sr.lastShownDate !== today && frequencyMatches(sr.frequency) && isWithinWindow(sr.time)) {
        showNotification(
          `${s.icon} Surah ${s.name} Reminder`,
          s.benefit,
          s.id
        );
        const updated = { ...cfg, surahs: { ...cfg.surahs, [s.id]: { ...sr, lastShownDate: today } } };
        saveConfig(updated);
        setConfigState(loadConfig());
      }
    });
  }, [permissionState]);

  /* Poll every 60 seconds while app is open */
  useEffect(() => {
    checkReminders(); // on mount
    const interval = setInterval(checkReminders, 60_000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  /* Sync permission state when it changes externally */
  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermissionState(Notification.permission);
  }, []);

  /* Which reminders are due today (for dashboard cards) */
  const dueToday = (() => {
    const today = todayStr();
    const due: { type: "daily" | number; label: string; icon: string }[] = [];

    if (
      config.dailyRecitation.enabled &&
      config.dailyRecitation.lastShownDate !== today &&
      frequencyMatches(config.dailyRecitation.frequency)
    ) {
      due.push({ type: "daily", label: "Daily Recitation", icon: "📖" });
    }

    SPECIAL_SURAHS.forEach(s => {
      const sr = config.surahs[s.id];
      if (sr?.enabled && sr.lastShownDate !== today && frequencyMatches(sr.frequency)) {
        due.push({ type: s.id, label: `Surah ${s.name}`, icon: s.icon });
      }
    });

    return due;
  })();

  return {
    config,
    permissionState,
    requestPermission,
    setDailyRecitation,
    setSurahReminder,
    sendTestNotification,
    dueToday,
    checkReminders,
  };
}
