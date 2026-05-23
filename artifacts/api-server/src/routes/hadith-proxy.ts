import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const SUNNAH_BASE    = "https://api.sunnah.com/v1";
const SUNNAH_API_KEY = process.env.SUNNAH_API_KEY;

const booksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const hadithsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

function requireAuthenticatedUser(req: Parameters<typeof router.get>[1] extends (...args: infer A) => unknown ? A[0] : never, res: Parameters<typeof router.get>[1] extends (...args: infer A) => unknown ? A[1] : never): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }

  if (!SUNNAH_API_KEY) {
    req.log.error("SUNNAH_API_KEY is not configured");
    res.status(503).json({ error: "Hadith service temporarily unavailable" });
    return false;
  }

  return true;
}

/** GET /api/hadith-proxy/collections/:collection/books */
router.get("/hadith-proxy/collections/:collection/books", async (req, res) => {
  if (!requireAuthenticatedUser(req, res)) {
    return;
  }

  const { collection } = req.params;
  const { limit } = booksQuerySchema.parse(req.query);
  const url = `${SUNNAH_BASE}/collections/${encodeURIComponent(collection)}/books?limit=${limit}`;
  try {
    const upstream = await fetch(url, { headers: { "x-api-key": SUNNAH_API_KEY } });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    req.log.error({ err }, "sunnah.com books proxy error");
    res.status(502).json({ error: "Failed to reach sunnah.com" });
  }
});

/** GET /api/hadith-proxy/collections/:collection/books/:bookNumber/hadiths */
router.get(
  "/hadith-proxy/collections/:collection/books/:bookNumber/hadiths",
  async (req, res) => {
    if (!requireAuthenticatedUser(req, res)) {
      return;
    }

    const { collection, bookNumber } = req.params;
    const { limit } = hadithsQuerySchema.parse(req.query);
    const url = `${SUNNAH_BASE}/collections/${encodeURIComponent(collection)}/books/${encodeURIComponent(bookNumber)}/hadiths?limit=${limit}`;
    try {
      const upstream = await fetch(url, { headers: { "x-api-key": SUNNAH_API_KEY } });
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    } catch (err) {
      req.log.error({ err }, "sunnah.com hadiths proxy error");
      res.status(502).json({ error: "Failed to reach sunnah.com" });
    }
  }
);

export default router;
