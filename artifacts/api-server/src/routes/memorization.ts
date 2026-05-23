import { Router } from "express";
import {
  db,
  memorizationEntriesTable,
  reviewHistoryTable,
  usersTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatEntry(entry: any) {
  return {
    ...entry,
    createdAt:
      entry.createdAt instanceof Date
        ? entry.createdAt.toISOString()
        : entry.createdAt,
    lastReviewDate: entry.lastReviewDate ?? null,
    nextReviewDate: entry.nextReviewDate ?? null,
  };
}

router.get("/memorization/plan", async (req, res) => {
  try {
    const surahId = req.query.surahId
      ? parseInt(req.query.surahId as string)
      : undefined;
    const status = req.query.status as string | undefined;

    const entries = await db
      .select()
      .from(memorizationEntriesTable)
      .where(
        and(
          eq(memorizationEntriesTable.userId, req.resolvedUserId),
          surahId
            ? eq(memorizationEntriesTable.surahId, surahId)
            : undefined,
          status
            ? eq(memorizationEntriesTable.status, status)
            : undefined,
        ),
      );

    res.json(entries.map(formatEntry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get memorization plan" });
  }
});

router.post("/memorization/plan", async (req, res) => {
  try {
    const bodySchema = z.object({
      surahId: z.number().int(),
      ayahNumbers: z.array(z.number().int()),
    });

    const { surahId, ayahNumbers } = bodySchema.parse(req.body);
    const userId = req.resolvedUserId;

    const results = [];
    for (const ayahNumber of ayahNumbers) {
      const existing = await db
        .select()
        .from(memorizationEntriesTable)
        .where(
          and(
            eq(memorizationEntriesTable.userId, userId),
            eq(memorizationEntriesTable.surahId, surahId),
            eq(memorizationEntriesTable.ayahNumber, ayahNumber),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        results.push(existing[0]);
        continue;
      }

      const inserted = await db
        .insert(memorizationEntriesTable)
        .values({
          userId,
          surahId,
          ayahNumber,
          status: "not_started",
          srsInterval: 1,
          srsEaseFactor: 2.5,
          reviewCount: 0,
          nextReviewDate: todayStr(),
        })
        .returning();

      results.push(inserted[0]);
    }

    res.json(results.map(formatEntry));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/memorization/plan/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const bodySchema = z.object({
      status: z.enum(["not_started", "in_progress", "memorized", "needs_review"]),
    });

    const { status } = bodySchema.parse(req.body);
    const updates: any = { status };
    if (status === "memorized") {
      updates.nextReviewDate = todayStr();
      updates.srsInterval = 1;
    }

    const updated = await db
      .update(memorizationEntriesTable)
      .set(updates)
      .where(
        and(
          eq(memorizationEntriesTable.id, id),
          eq(memorizationEntriesTable.userId, req.resolvedUserId),
        ),
      )
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json(formatEntry(updated[0]));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/memorization/srs/due", async (req, res) => {
  try {
    const today = todayStr();
    const due = await db
      .select()
      .from(memorizationEntriesTable)
      .where(
        and(
          eq(memorizationEntriesTable.userId, req.resolvedUserId),
          sql`${memorizationEntriesTable.status} IN ('memorized', 'needs_review')`,
          sql`${memorizationEntriesTable.nextReviewDate} <= ${today}`,
        ),
      );

    res.json(due.map(formatEntry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get due reviews" });
  }
});

router.post("/memorization/srs/review", async (req, res) => {
  try {
    const bodySchema = z.object({
      entryId: z.number().int(),
      rating: z.enum(["easy", "hard", "forgot"]),
    });

    const { entryId, rating } = bodySchema.parse(req.body);
    const userId = req.resolvedUserId;

    const result = await db.transaction(async (tx) => {
      const entries = await tx
        .select()
        .from(memorizationEntriesTable)
        .where(
          and(
            eq(memorizationEntriesTable.id, entryId),
            eq(memorizationEntriesTable.userId, userId),
          ),
        )
        .limit(1);

      if (entries.length === 0) {
        throw new Error("ENTRY_NOT_FOUND");
      }

      const entry = entries[0];
      let newInterval = entry.srsInterval;
      let newEaseFactor = entry.srsEaseFactor;
      let newStatus = entry.status;

      // SM-2 algorithm adaptation
      if (rating === "easy") {
        newInterval = Math.round(entry.srsInterval * entry.srsEaseFactor);
        newEaseFactor = Math.min(entry.srsEaseFactor + 0.15, 3.0);
        newStatus = "memorized";
      } else if (rating === "hard") {
        newInterval = Math.max(1, Math.round(entry.srsInterval * 0.5));
        newEaseFactor = Math.max(entry.srsEaseFactor - 0.15, 1.3);
        newStatus = "needs_review";
      } else {
        newInterval = 1;
        newEaseFactor = Math.max(entry.srsEaseFactor - 0.2, 1.3);
        newStatus = "needs_review";
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + newInterval);
      const nextReviewDate = nextDate.toISOString().split("T")[0];

      // Insert review history and update entry atomically
      await tx.insert(reviewHistoryTable).values({
        userId,
        entryId,
        rating,
        interval: newInterval,
      });

      const [updated] = await tx
        .update(memorizationEntriesTable)
        .set({
          status: newStatus,
          srsInterval: newInterval,
          srsEaseFactor: newEaseFactor,
          nextReviewDate,
          reviewCount: entry.reviewCount + 1,
          lastReviewDate: todayStr(),
        })
        .where(eq(memorizationEntriesTable.id, entryId))
        .returning();

      return updated;
    });

    res.json(formatEntry(result));
  } catch (err: any) {
    if (err?.message === "ENTRY_NOT_FOUND") {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
