import express from 'express';
import fs from 'fs';
import path from 'path';
import { Purchase } from '../../models/Purchase';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';
import { DEFAULT_VIDEO_ID } from '@/lib/catalog';

const router = express.Router();

router.get('/stream/:videoId', authenticate, async (req: AuthenticatedRequest, res) => {
  const { videoId } = req.params;

  const purchase = await Purchase.findOne({
    userId: req.user?.userId,
    videoId,
    status: 'completed',
  });

  if (!purchase) {
    return res.status(403).json({
      code: 'PURCHASE_REQUIRED',
      message: 'Access denied. This tutorial requires purchase.',
    });
  }

  const videoPath = path.resolve(__dirname, '../../assets/video.mp4');
  
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({
      code: 'VIDEO_UNAVAILABLE',
      message: 'Unable to load video. Please refresh the page.',
    });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-store',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-store',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

router.get('/access/:videoId', authenticate, async (req: AuthenticatedRequest, res) => {
  const purchase = await Purchase.findOne({
    userId: req.user?.userId,
    videoId: req.params.videoId || DEFAULT_VIDEO_ID,
    status: 'completed',
  });

  if (!purchase) {
    return res.status(403).json({
      code: 'PURCHASE_REQUIRED',
      message: 'Access denied. This tutorial requires purchase.',
    });
  }

  return res.json({ ok: true });
});

export default router;
