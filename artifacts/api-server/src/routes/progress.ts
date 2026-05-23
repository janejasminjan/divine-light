import { Router } from "express";
import {
  db,
  memorizationEntriesTable,
  activityLogsTable,
  badgesTable,
  usersTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();
const TOTAL_QURAN_AYAHS = 6236;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

router.get("/progress", async (req, res) => {
  try {
    const userId = req.resolvedUserId;
    const today = todayStr();

    const [userData] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const allEntries = await db
      .select()
      .from(memorizationEntriesTable)
      .where(eq(memorizationEntriesTable.userId, userId));

    const memorized = allEntries.filter((e) => e.status === "memorized").length;
    const dueReviews = allEntries.filter(
      (e) =>
        (e.status === "memorized" || e.status === "needs_review") &&
        e.nextReviewDate !== null &&
        e.nextReviewDate <= today,
    ).length;

    const surahMap: Record<number, { total: number; memorized: number }> = {};
    for (const entry of allEntries) {
      if (!surahMap[entry.surahId])
        surahMap[entry.surahId] = { total: 0, memorized: 0 };
      surahMap[entry.surahId].total++;
      if (entry.status === "memorized") surahMap[entry.surahId].memorized++;
    }
    const completedSurahs = Object.values(surahMap).filter(
      (s) => s.total > 0 && s.total === s.memorized,
    ).length;

    const badges = await db
      .select()
      .from(badgesTable)
      .where(eq(badgesTable.userId, userId));

    res.json({
      currentStreak: userData?.currentStreak ?? 0,
      longestStreak: userData?.longestStreak ?? 0,
      totalMemorizedAyahs: memorized,
      totalSurahsCompleted: completedSurahs,
      totalMinutesPracticed: userData?.totalMinutesPracticed ?? 0,
      ayahsDueForReview: dueReviews,
      totalAyahsInPlan: allEntries.length,
      percentageMemorized: parseFloat(
        ((memorized / TOTAL_QURAN_AYAHS) * 100).toFixed(2),
      ),
      badges: badges.map((b) => ({
        id: b.badgeId,
        name: b.name,
        description: b.description,
        earnedAt: b.earnedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get progress" });
  }
});

router.get("/progress/heatmap", async (req, res) => {
  try {
    const userId = req.resolvedUserId;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const startDate = twelveMonthsAgo.toISOString().split("T")[0];

    const logs = await db
      .select()
      .from(activityLogsTable)
      .where(
        and(
          eq(activityLogsTable.userId, userId),
          sql`${activityLogsTable.activityDate} >= ${startDate}`,
        ),
      );

    const dayMap: Record<string, { count: number; minutes: number }> = {};
    for (const log of logs) {
      if (!dayMap[log.activityDate])
        dayMap[log.activityDate] = { count: 0, minutes: 0 };
      dayMap[log.activityDate].count++;
      dayMap[log.activityDate].minutes += log.minutes;
    }

    const result = Object.entries(dayMap).map(([date, data]) => ({
      date,
      count: data.count,
      minutes: data.minutes,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get heatmap" });
  }
});

const SURAH_AYAH_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6,
};

router.get("/progress/surah-stats", async (req, res) => {
  try {
    const userId = req.resolvedUserId;
    const allEntries = await db
      .select()
      .from(memorizationEntriesTable)
      .where(eq(memorizationEntriesTable.userId, userId));

    const surahMap: Record<
      number,
      { memorized: number; inProgress: number }
    > = {};
    for (const entry of allEntries) {
      if (!surahMap[entry.surahId])
        surahMap[entry.surahId] = { memorized: 0, inProgress: 0 };
      if (entry.status === "memorized") surahMap[entry.surahId].memorized++;
      else if (entry.status === "in_progress")
        surahMap[entry.surahId].inProgress++;
    }

    const result = Object.entries(surahMap).map(([surahId, data]) => {
      const id = parseInt(surahId);
      const total = SURAH_AYAH_COUNTS[id] ?? 0;
      return {
        surahId: id,
        totalAyahs: total,
        memorizedAyahs: data.memorized,
        inProgressAyahs: data.inProgress,
        percentageMemorized:
          total > 0
            ? parseFloat(((data.memorized / total) * 100).toFixed(1))
            : 0,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get surah stats" });
  }
});

export default router;
