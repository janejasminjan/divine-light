import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/users/profile", async (req, res) => {
  try {
    const userId = req.resolvedUserId;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json({
      ...user,
      createdAt: user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.put("/users/profile", async (req, res) => {
  try {
    const updateSchema = z.object({
      displayName: z.string().optional(),
      goal: z.enum(["recite", "memorize", "understand", "all"]).optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      dailyDurationMinutes: z.number().int().optional(),
      dailyAyahTarget: z.number().int().min(1).max(20).optional(),
      tajweedHighlightingEnabled: z.boolean().optional(),
      transliterationEnabled: z.boolean().optional(),
      primaryTranslationLanguage: z.string().optional(),
      preferredReciter: z.string().optional(),
      fontSizePreference: z
        .enum(["small", "medium", "large", "extra_large"])
        .optional(),
      darkMode: z.boolean().optional(),
      lastReadSurahId: z.number().int().optional(),
      lastReadAyahId: z.number().int().optional(),
    });

    const body = updateSchema.parse(req.body);
    const userId = req.resolvedUserId;

    const updated = await db
      .update(usersTable)
      .set(body)
      .where(eq(usersTable.id, userId))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json({
      ...updated[0],
      createdAt: updated[0].createdAt instanceof Date
        ? updated[0].createdAt.toISOString()
        : updated[0].createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/users/onboarding", async (req, res) => {
  try {
    const bodySchema = z.object({
      displayName: z.string().optional(),
      goal: z.enum(["recite", "memorize", "understand", "all"]),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      dailyDurationMinutes: z.number().int(),
    });

    const body = bodySchema.parse(req.body);
    const userId = req.resolvedUserId;
    const tajweedDefault = body.level === "beginner";

    const updated = await db
      .update(usersTable)
      .set({
        ...body,
        onboardingCompleted: true,
        tajweedHighlightingEnabled: tajweedDefault,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json({
      ...updated[0],
      createdAt: updated[0].createdAt instanceof Date
        ? updated[0].createdAt.toISOString()
        : updated[0].createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
