import { pgTable, serial, varchar, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memorizationEntriesTable = pgTable("memorization_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  surahId: integer("surah_id").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  status: text("status").notNull().default("not_started"),
  srsInterval: integer("srs_interval").notNull().default(1),
  srsEaseFactor: real("srs_ease_factor").notNull().default(2.5),
  nextReviewDate: text("next_review_date"),
  reviewCount: integer("review_count").notNull().default(0),
  lastReviewDate: text("last_review_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewHistoryTable = pgTable("review_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  entryId: integer("entry_id").notNull(),
  rating: text("rating").notNull(),
  interval: integer("interval").notNull(),
  reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
});

export const insertMemorizationEntrySchema = createInsertSchema(memorizationEntriesTable).omit({ id: true, createdAt: true });
export type InsertMemorizationEntry = z.infer<typeof insertMemorizationEntrySchema>;
export type MemorizationEntry = typeof memorizationEntriesTable.$inferSelect;

export const insertReviewHistorySchema = createInsertSchema(reviewHistoryTable).omit({ id: true, reviewedAt: true });
export type InsertReviewHistory = z.infer<typeof insertReviewHistorySchema>;
export type ReviewHistory = typeof reviewHistoryTable.$inferSelect;
