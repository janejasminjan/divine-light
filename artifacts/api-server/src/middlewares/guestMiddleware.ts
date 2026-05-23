import crypto from "crypto";
import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";

export const GUEST_COOKIE = "guest_id";
const GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

/**
 * Runs after authMiddleware. If the user is already authenticated via OIDC,
 * just sets req.resolvedUserId = req.user.id.
 *
 * Otherwise, reads (or creates) a guest_id cookie and ensures that guest user
 * row exists in the DB. Sets req.resolvedUserId to the guest ID so that all
 * route handlers can use req.resolvedUserId uniformly.
 */
export async function guestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.isAuthenticated()) {
    req.resolvedUserId = req.user.id;
    next();
    return;
  }

  let guestId = req.cookies?.[GUEST_COOKIE];

  // Validate guest cookie format
  if (!guestId || typeof guestId !== "string" || !guestId.startsWith("guest_")) {
    guestId = `guest_${crypto.randomUUID()}`;
    res.cookie(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: GUEST_COOKIE_MAX_AGE,
    });
  }

  // Ensure the guest user row exists (idempotent)
  try {
    await db
      .insert(usersTable)
      .values({ id: guestId, isGuest: true })
      .onConflictDoNothing();
  } catch {
    // If DB is temporarily unavailable, continue anyway
  }

  req.resolvedUserId = guestId;
  next();
}
