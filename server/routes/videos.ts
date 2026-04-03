import express from "express";
import {
  getActiveVideoBySlug,
  listActiveVideoCards,
  listActiveVideos,
} from "../services/videos";

const router = express.Router();

router.get("/", async (req, res) => {
  const view = req.query.view === "card" ? "card" : "full";
  const videos =
    view === "card" ? await listActiveVideoCards() : await listActiveVideos();

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res.json(videos);
});

router.get("/:slug", async (req, res) => {
  const video = await getActiveVideoBySlug(req.params.slug);

  if (!video) {
    return res.status(404).json({
      code: "VIDEO_UNAVAILABLE",
      message: "Video not found.",
    });
  }

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res.json(video);
});

export default router;
