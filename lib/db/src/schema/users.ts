import {
  pgTable, varchar, text, integer, boolean, timestamp, real,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  /* ── Auth identity ────────────────────────────────────────────
     text PK: OIDC `sub` claim for authenticated users,
              `guest_<uuid>` for guest sessions.           */
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isGuest: boolean("is_guest").notNull().default(false),

  /* ── Learning preferences ─────────────────────────────────── */
  displayName: text("display_name"),
  goal: text("goal").notNull().default("all"),
  level: text("level").notNull().default("beginner"),
  dailyDurationMinutes: integer("daily_duration_minutes").notNull().default(15),
  dailyAyahTarget: integer("daily_ayah_target").notNull().default(3),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalMinutesPracticed: integer("total_minutes_practiced").notNull().default(0),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  tajweedHighlightingEnabled: boolean("tajweed_highlighting_enabled").notNull().default(false),
  transliterationEnabled: boolean("transliteration_enabled").notNull().default(false),
  primaryTranslationLanguage: text("primary_translation_language").notNull().default("en"),
  preferredReciter: text("preferred_reciter").notNull().default("ar.alafasy"),
  fontSizePreference: text("font_size_preference").notNull().default("medium"),
  darkMode: boolean("dark_mode").notNull().default(false),
  lastReadSurahId: integer("last_read_surah_id"),
  lastReadAyahId: integer("last_read_ayah_id"),
  lastActivityDate: text("last_activity_date"),

  /* ── Timestamps ───────────────────────────────────────────── */
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
