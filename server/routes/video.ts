import express from "express";
import fs from "fs";
import path from "path";
import { Purchase } from "../../models/Purchase";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/authenticate";
import {
  getAcceptedPurchaseVideoIds,
  getActiveVideoDocumentBySlug,
} from "../services/videos";

const router = express.Router();
const CLOUDINARY_PREVIEW_URL =
  "https://res.cloudinary.com/ddcdws24e/video/upload/f_auto,q_auto/9F67D997-37AB-423E-9BB1-D12FB8D53455_2_hh0lu8.mp4";

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
      "Cache-Control": "no-store",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
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
    return res.status(404).json({
      code: "VIDEO_UNAVAILABLE",
      message: "Unable to load hero video.",
    });
  }

  return streamVideoFile(
    res,
    heroVideoPath,
    getVideoContentType(heroVideoPath),
    req.headers.range,
  );
});

router.get(
  "/stream/:videoId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const videoIdParam = Array.isArray(req.params.videoId)
      ? req.params.videoId[0]
      : req.params.videoId;
    const video = await getActiveVideoDocumentBySlug(videoIdParam);

    if (!video) {
      return res.status(404).json({
        code: "VIDEO_UNAVAILABLE",
        message: "Unable to load video. Please refresh the page.",
      });
    }

    const purchase = await Purchase.findOne({
      userId: req.user?.userId,
      videoId: { $in: getAcceptedPurchaseVideoIds(video) },
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
    );
  },
);

router.get(
  "/access/:videoId",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const videoIdParam = Array.isArray(req.params.videoId)
      ? req.params.videoId[0]
      : req.params.videoId;
    const video = await getActiveVideoDocumentBySlug(videoIdParam);

    if (!video) {
      return res.status(404).json({
        code: "VIDEO_UNAVAILABLE",
        message: "Unable to load video. Please refresh the page.",
      });
    }

    const purchase = await Purchase.findOne({
      userId: req.user?.userId,
      videoId: { $in: getAcceptedPurchaseVideoIds(video) },
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
