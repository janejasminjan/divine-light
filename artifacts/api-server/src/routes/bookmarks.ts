import { Router } from "express";
import { db, bookmarksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function formatBookmark(b: any) {
  return {
    ...b,
    createdAt:
      b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    note: b.note ?? null,
  };
}

router.get("/bookmarks", async (req, res) => {
  try {
    const bookmarks = await db
      .select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, req.resolvedUserId));
    res.json(bookmarks.map(formatBookmark));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get bookmarks" });
  }
});

router.post("/bookmarks", async (req, res) => {
  try {
    const bodySchema = z.object({
      surahId: z.number().int(),
      ayahNumber: z.number().int(),
      note: z.string().max(500).optional(),
    });

    const body = bodySchema.parse(req.body);

    const inserted = await db
      .insert(bookmarksTable)
      .values({ userId: req.resolvedUserId, ...body })
      .returning();

    res.json(formatBookmark(inserted[0]));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/bookmarks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Enforce ownership: only delete the bookmark if it belongs to this user
    await db
      .delete(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.id, id),
          eq(bookmarksTable.userId, req.resolvedUserId),
        ),
      );
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
});

export default router;
