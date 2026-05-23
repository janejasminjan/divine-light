import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SUNNAH_BASE    = "https://api.sunnah.com/v1";
const SUNNAH_API_KEY = "SqD712P3E82xnwOAEOkGd5JZH8s9wRR24TqNFzjk";

/** GET /api/hadith-proxy/collections/:collection/books */
router.get("/hadith-proxy/collections/:collection/books", async (req, res) => {
  const { collection } = req.params;
  const limit = req.query["limit"] ?? 50;
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
    const { collection, bookNumber } = req.params;
    const limit = req.query["limit"] ?? 1000;
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
