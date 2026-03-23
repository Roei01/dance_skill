import express from "express";
import fs from "fs";
import path from "path";
import { Purchase } from "../../models/Purchase";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/authenticate";
import { DEFAULT_VIDEO_ID } from "../../lib/catalog";

const router = express.Router();
const CLOUDINARY_PREVIEW_URL =
  "https://res.cloudinary.com/ddcdws24e/video/upload/f_auto,q_auto/9F67D997-37AB-423E-9BB1-D12FB8D53455_2_hh0lu8.mp4";
const CLOUDINARY_HERO_VIDEO_URL =
  "https://res.cloudinary.com/ddcdws24e/video/upload/f_auto,q_auto/%D7%A1%D7%A8%D7%98%D7%95%D7%9F_%D7%A4%D7%AA%D7%99%D7%97%D7%94_%D7%A9%D7%9C_%D7%94%D7%90%D7%AA%D7%A8_cyyn1d.mp4";
const NO_STORE_CACHE_CONTROL = "no-store";
const HERO_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

const getVideoContentType = (videoPath: string) => {
  const ext = path.extname(videoPath).toLowerCase();

  if (ext === ".mov") {
    return "video/quicktime";
  }

  return "video/mp4";
};

const streamVideoFile = (
  res: express.Response,
  videoPath: string,
  contentType: string,
  range?: string,
  cacheControl = NO_STORE_CACHE_CONTROL,
) => {
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
};

router.get("/preview", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.redirect(CLOUDINARY_PREVIEW_URL);
});

router.get("/hero", (req, res) => {
  const heroVideoPath = path.resolve(__dirname, "../assets/gif.mp4");

  if (!fs.existsSync(heroVideoPath)) {
    res.setHeader("Cache-Control", HERO_CACHE_CONTROL);
    return res.redirect(CLOUDINARY_HERO_VIDEO_URL);
  }

  return streamVideoFile(
    res,
    heroVideoPath,
    getVideoContentType(heroVideoPath),
    req.headers.range,
    HERO_CACHE_CONTROL,
  );
});

router.get(
  "/stream/:videoId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const { videoId } = req.params;

    const purchase = await Purchase.findOne({
      userId: req.user?.userId,
      videoId,
      status: "completed",
    });

    if (!purchase) {
      return res.status(403).json({
        code: "PURCHASE_REQUIRED",
        message: "Access denied. This tutorial requires purchase.",
      });
    }

    const videoPath = path.resolve(__dirname, "../assets/video.mp4");

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        code: "VIDEO_UNAVAILABLE",
        message: "Unable to load video. Please refresh the page.",
      });
    }

    return streamVideoFile(
      res,
      videoPath,
      getVideoContentType(videoPath),
      req.headers.range,
      NO_STORE_CACHE_CONTROL,
    );
  },
);

router.get(
  "/access/:videoId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const purchase = await Purchase.findOne({
      userId: req.user?.userId,
      videoId: req.params.videoId || DEFAULT_VIDEO_ID,
      status: "completed",
    });

    if (!purchase) {
      return res.status(403).json({
        code: "PURCHASE_REQUIRED",
        message: "Access denied. This tutorial requires purchase.",
      });
    }

    return res.json({ ok: true });
  },
);

export default router;
