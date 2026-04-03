import express from "express";
import { User } from "../../models/User";
import { Purchase } from "../../models/Purchase";
import {
  comparePassword,
  generateToken,
  getActiveSessionRemainingSeconds,
  hasConflictingActiveSession,
  markSessionDisconnecting,
  releaseActiveSession,
  SESSION_DURATION_MS,
  startExclusiveSession,
  verifyToken,
} from "../services/auth";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/authenticate";
import { DEFAULT_VIDEO_SLUG } from "../../lib/catalog";
import { authRateLimiter } from "../middleware/rateLimit";
import { resolveOwnedVideoSlugs } from "../services/videos";

const router = express.Router();

router.post("/login", authRateLimiter, async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Username and password are required.",
    });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({
      code: "INVALID_CREDENTIALS",
      message: "Incorrect username or password.",
    });
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      code: "INVALID_CREDENTIALS",
      message: "Incorrect username or password.",
    });
  }

  let currentSessionId: string | undefined;
  const existingToken =
    req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (typeof existingToken === "string" && existingToken.length > 0) {
    try {
      const decoded = verifyToken(existingToken);
      if (decoded.userId === String(user._id)) {
        currentSessionId = decoded.sessionId;
      }
    } catch {
      currentSessionId = undefined;
    }
  }

  const hasActiveSession = await hasConflictingActiveSession(
    String(user._id),
    currentSessionId,
  );

  if (hasActiveSession) {
    const retryAfterSeconds = await getActiveSessionRemainingSeconds(
      String(user._id),
    );

    return res.status(409).json({
      code: "SESSION_ALREADY_ACTIVE",
      message:
        retryAfterSeconds > 0
          ? `יש כבר משתמש מחובר לחשבון הזה. אם המכשיר הקודם נסגר, נסו שוב.`
          : "יש כבר משתמש מחובר לחשבון הזה.",
      retryAfterSeconds,
    });
  }

  const sessionId = await startExclusiveSession(String(user._id));
  const token = generateToken({
    userId: String(user._id),
    username: user.username,
    sessionId,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS,
  });

  const purchases = await Purchase.find({
    userId: user._id,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .lean();

  const ownedVideoIds = await resolveOwnedVideoSlugs(
    purchases.map((purchase) => purchase.videoId),
  );

  res.json({
    token,
    user: {
      id: String(user._id),
      username: user.username,
      email: user.email,
    },
    sessionExpiresAt: user.activeSessionExpiresAt?.toISOString() ?? null,
    access: {
      defaultVideo: ownedVideoIds.includes(DEFAULT_VIDEO_SLUG),
      videos: ownedVideoIds,
      videoOrder: ownedVideoIds,
    },
  });
});

router.get("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?.userId).lean();

  if (!user) {
    return res.status(404).json({
      code: "AUTH_REQUIRED",
      message: "User not found.",
    });
  }

  const purchases = await Purchase.find({
    userId: user._id,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .lean();

  const ownedVideoIds = await resolveOwnedVideoSlugs(
    purchases.map((purchase) => purchase.videoId),
  );

  return res.json({
    user: {
      id: String(user._id),
      username: user.username,
      email: user.email,
    },
    sessionExpiresAt: user.activeSessionExpiresAt?.toISOString() ?? null,
    access: {
      defaultVideo: ownedVideoIds.includes(DEFAULT_VIDEO_SLUG),
      videos: ownedVideoIds,
      videoOrder: ownedVideoIds,
    },
  });
});

router.post("/heartbeat", authenticate, (_req, res) => {
  return res.status(204).send();
});

router.post("/disconnect", async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (typeof token === "string" && token.length > 0) {
    try {
      const decoded = verifyToken(token);
      await markSessionDisconnecting(decoded.userId, decoded.sessionId);
    } catch {
      // Ignore invalid tokens during tab close or page leave.
    }
  }

  return res.status(204).send();
});

router.post("/logout", async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (typeof token === "string" && token.length > 0) {
    try {
      const decoded = verifyToken(token);
      await releaseActiveSession(decoded.userId, decoded.sessionId);
    } catch {
      // Always clear the cookie even if the session token is already invalid.
    }
  }

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(204).send();
});

export default router;
