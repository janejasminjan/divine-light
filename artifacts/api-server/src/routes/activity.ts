import { Router } from "express";
import { db, activityLogsTable, usersTable, badgesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const STREAK_MILESTONES = [7, 30, 100, 365];
const MILESTONE_BADGES: Record<
  number,
  { id: string; name: string; description: string }
> = {
  7:   { id: "streak_7",   name: "Week Warrior",          description: "7-day streak achieved"   },
  30:  { id: "streak_30",  name: "Monthly Devotion",       description: "30-day streak achieved"  },
  100: { id: "streak_100", name: "Century of Commitment",  description: "100-day streak achieved" },
  365: { id: "streak_365", name: "Year of Dedication",     description: "365-day streak achieved" },
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

router.post("/activity", async (req, res) => {
  try {
    const bodySchema = z.object({
      minutes: z.number().int().min(1),
      activityType: z.enum(["reading", "memorization", "review", "listening"]),
    });

    const { minutes, activityType } = bodySchema.parse(req.body);
    const userId = req.resolvedUserId;
    const today = todayStr();

    const result = await db.transaction(async (tx) => {
      // Log the activity
      await tx.insert(activityLogsTable).values({
        userId,
        activityDate: today,
        activityType,
        minutes,
      });

      const [user] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) throw new Error("USER_NOT_FOUND");

      let newStreak = user.currentStreak;
      let streakUpdated = false;

      if (user.lastActivityDate !== today) {
        if (user.lastActivityDate === yesterdayStr()) {
          newStreak = user.currentStreak + 1;
        } else {
          newStreak = 1;
        }
        streakUpdated = true;
      }

      const newLongest = Math.max(user.longestStreak, newStreak);
      await tx
        .update(usersTable)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          totalMinutesPracticed: user.totalMinutesPracticed + minutes,
          lastActivityDate: today,
        })
        .where(eq(usersTable.id, userId));

      // Check badge milestones
      let newBadge = null;
      for (const milestone of STREAK_MILESTONES) {
        if (newStreak >= milestone && user.currentStreak < milestone) {
          const badgeDef = MILESTONE_BADGES[milestone];
          const existing = await tx
            .select()
            .from(badgesTable)
            .where(eq(badgesTable.userId, userId));
          const alreadyEarned = existing.some(
            (b) => b.badgeId === badgeDef.id,
          );
          if (!alreadyEarned) {
            const [inserted] = await tx
              .insert(badgesTable)
              .values({
                userId,
                badgeId: badgeDef.id,
                name: badgeDef.name,
                description: badgeDef.description,
              })
              .returning();
            newBadge = {
              id: inserted.badgeId,
              name: inserted.name,
              description: inserted.description,
              earnedAt: inserted.earnedAt.toISOString(),
            };
          }
        }
      }

      return { streakUpdated, currentStreak: newStreak, newBadge };
    });

    res.json(result);
  } catch (err: any) {
    if (err?.message === "USER_NOT_FOUND") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
