const KEY = "qiyam_daily_position";

export interface DailyPosition {
  surahId: number;
  ayahNumber: number;
  surahName: string;
  savedAt: string;
}

export function getDailyPosition(): DailyPosition | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DailyPosition) : null;
  } catch {
    return null;
  }
}

export function saveDailyPosition(pos: Omit<DailyPosition, "savedAt">) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...pos, savedAt: new Date().toISOString() }));
  } catch {}
}

export function clearDailyPosition() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
