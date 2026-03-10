import express from 'express';
import { User } from '../../models/User';
import { Purchase } from '../../models/Purchase';
import {
  checkIpAccess,
  comparePassword,
  generateToken,
  getClientIp,
} from '../services/auth';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';
import { DEFAULT_VIDEO_ID } from '../../lib/catalog';
import { authRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.post('/login', authRateLimiter, async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Username and password are required.',
    });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: 'Incorrect username or password.',
    });
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: 'Incorrect username or password.',
    });
  }

  const currentIp = getClientIp(req.headers["x-forwarded-for"], req.ip || req.socket.remoteAddress);
  const isAllowed = await checkIpAccess(String(user._id), currentIp);
  if (!isAllowed) {
    return res.status(403).json({
      code: 'IP_MISMATCH',
      message: 'This account can only be accessed from the original device.',
    });
  }

  const token = generateToken({ userId: String(user._id), username: user.username });
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  const purchases = await Purchase.find({
    userId: user._id,
    status: 'completed',
  }).lean();

  const ownedVideoIds = purchases.map((purchase) => String(purchase.videoId));

  res.json({
    token,
    user: {
      id: String(user._id),
      username: user.username,
      email: user.email,
    },
    access: {
      defaultVideo: ownedVideoIds.includes(DEFAULT_VIDEO_ID),
      videos: ownedVideoIds,
    },
  });
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?.userId).lean();

  if (!user) {
    return res.status(404).json({
      code: 'AUTH_REQUIRED',
      message: 'User not found.',
    });
  }

  const purchases = await Purchase.find({
    userId: user._id,
    status: 'completed',
  }).lean();

  const ownedVideoIds = purchases.map((purchase) => String(purchase.videoId));

  return res.json({
    user: {
      id: String(user._id),
      username: user.username,
      email: user.email,
    },
    access: {
      defaultVideo: ownedVideoIds.includes(DEFAULT_VIDEO_ID),
      videos: ownedVideoIds,
    },
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(204).send();
});

export default router;
