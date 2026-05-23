import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import type { AuthUser as _AuthUser } from "../lib/auth";
import {
  db, usersTable, bookmarksTable, memorizationEntriesTable,
  reviewHistoryTable, activityLogsTable, badgesTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth";
import { GUEST_COOKIE } from "../middlewares/guestMiddleware";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }
  return value;
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
    isGuest: false,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        isGuest: false,
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      },
    })
    .returning();
  return user;
}

/* ── GET /api/auth/user ─────────────────────────────────────── */
router.get("/auth/user", async (req: Request, res: Response) => {
  let hasPendingGuestData = false;

  if (req.isAuthenticated()) {
    const guestId = req.cookies?.[GUEST_COOKIE];
    if (guestId && typeof guestId === "string" && guestId.startsWith("guest_")) {
      // Check if the guest user exists and has any data
      const [guestUser] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, guestId))
        .limit(1);
      hasPendingGuestData = !!guestUser;
    }
  }

  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
      hasPendingGuestData,
    }),
  );
});

/* ── GET /api/login ─────────────────────────────────────────── */
router.get("/login", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;
  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);

  res.redirect(redirectTo.href);
});

/* ── GET /api/callback ──────────────────────────────────────── */
router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch {
    res.redirect("/api/login");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("code_verifier", { path: "/" });
  res.clearCookie("nonce", { path: "/" });
  res.clearCookie("state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const dbUser = await upsertUser(claims as unknown as Record<string, unknown>);

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email ?? null,
      firstName: dbUser.firstName ?? null,
      lastName: dbUser.lastName ?? null,
      profileImageUrl: dbUser.profileImageUrl ?? null,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

/* ── GET /api/logout ────────────────────────────────────────── */
router.get("/logout", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const origin = getOrigin(req);

  const sid = getSessionId(req);
  await clearSession(res, sid);

  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: origin,
  });

  res.redirect(endSessionUrl.href);
});

/* ── POST /api/migrate-guest ────────────────────────────────── *
 * Atomically migrates all guest data into the authenticated
 * user's account. Reads the guest_id from the httpOnly cookie.
 * De-duplicates bookmarks and memorization entries.             */
router.post("/migrate-guest", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const guestId = req.cookies?.[GUEST_COOKIE];
  if (!guestId || typeof guestId !== "string" || !guestId.startsWith("guest_")) {
    res.json({ migrated: false, message: "No guest session found" });
    return;
  }

  const userId = req.user.id;
  if (guestId === userId) {
    res.json({ migrated: false, message: "Already authenticated" });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      // Verify guest user exists
      const [guestUser] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, guestId))
        .limit(1);

      if (!guestUser) return;

      // ── Transfer bookmarks (de-duplicate by surahId+ayahNumber) ──
      await tx.execute(
        sql`INSERT INTO bookmarks (user_id, surah_id, ayah_number, note, created_at)
            SELECT ${userId}, surah_id, ayah_number, note, created_at
            FROM bookmarks
            WHERE user_id = ${guestId}
            ON CONFLICT DO NOTHING`,
      );
      await tx
        .delete(bookmarksTable)
        .where(eq(bookmarksTable.userId, guestId));

      // ── Transfer memorization entries (de-duplicate by surahId+ayahNumber) ──
      await tx.execute(
        sql`INSERT INTO memorization_entries
              (user_id, surah_id, ayah_number, status, srs_interval, srs_ease_factor,
               next_review_date, review_count, last_review_date, created_at)
            SELECT ${userId}, surah_id, ayah_number, status, srs_interval, srs_ease_factor,
               next_review_date, review_count, last_review_date, created_at
            FROM memorization_entries
            WHERE user_id = ${guestId}
            ON CONFLICT DO NOTHING`,
      );
      // Point review history to the new entries then clean up
      await tx
        .delete(memorizationEntriesTable)
        .where(eq(memorizationEntriesTable.userId, guestId));

      // ── Transfer review history ──
      await tx
        .update(reviewHistoryTable)
        .set({ userId })
        .where(eq(reviewHistoryTable.userId, guestId));

      // ── Transfer activity logs ──
      await tx
        .update(activityLogsTable)
        .set({ userId })
        .where(eq(activityLogsTable.userId, guestId));

      // ── Transfer badges (de-duplicate by badgeId) ──
      await tx.execute(
        sql`INSERT INTO badges (user_id, badge_id, name, description, earned_at)
            SELECT ${userId}, badge_id, name, description, earned_at
            FROM badges
            WHERE user_id = ${guestId}
            ON CONFLICT DO NOTHING`,
      );
      await tx.delete(badgesTable).where(eq(badgesTable.userId, guestId));

      // ── Merge learning preferences (only if auth user hasn't onboarded) ──
      const [authUser] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (authUser && !authUser.onboardingCompleted && guestUser.onboardingCompleted) {
        await tx
          .update(usersTable)
          .set({
            goal: guestUser.goal,
            level: guestUser.level,
            dailyDurationMinutes: guestUser.dailyDurationMinutes,
            dailyAyahTarget: guestUser.dailyAyahTarget,
            currentStreak: guestUser.currentStreak,
            longestStreak: guestUser.longestStreak,
            totalMinutesPracticed: guestUser.totalMinutesPracticed,
            onboardingCompleted: guestUser.onboardingCompleted,
            tajweedHighlightingEnabled: guestUser.tajweedHighlightingEnabled,
            transliterationEnabled: guestUser.transliterationEnabled,
            primaryTranslationLanguage: guestUser.primaryTranslationLanguage,
            preferredReciter: guestUser.preferredReciter,
            fontSizePreference: guestUser.fontSizePreference,
            darkMode: guestUser.darkMode,
            lastReadSurahId: guestUser.lastReadSurahId,
            lastReadAyahId: guestUser.lastReadAyahId,
            lastActivityDate: guestUser.lastActivityDate,
          })
          .where(eq(usersTable.id, userId));
      } else if (authUser && guestUser.totalMinutesPracticed > 0) {
        // Always merge stats even if onboarding was completed
        await tx
          .update(usersTable)
          .set({
            totalMinutesPracticed:
              authUser.totalMinutesPracticed + guestUser.totalMinutesPracticed,
            longestStreak: Math.max(
              authUser.longestStreak,
              guestUser.longestStreak,
            ),
          })
          .where(eq(usersTable.id, userId));
      }

      // ── Delete guest user row ──
      await tx.delete(usersTable).where(eq(usersTable.id, guestId));
    });

    // Clear the guest cookie — migration is done
    res.clearCookie(GUEST_COOKIE, { path: "/" });
    res.json({ migrated: true, message: "Your guest data has been imported." });
  } catch (err) {
    req.log.error({ err }, "Guest migration failed");
    res.status(500).json({ error: "Migration failed. Please try again." });
  }
});

export default router;
