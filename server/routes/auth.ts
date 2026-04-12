import express from "express";
import { User } from "../../models/User";
import { Purchase } from "../../models/Purchase";
import {
  clearAllUserSessions,
  clearPasswordResetFields,
  comparePassword,
  generatePasswordResetToken,
  generateToken,
  getActiveSessionRemainingSeconds,
  hashPassword,
  hashResetToken,
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
import {
  sendPasswordResetBackupEmail,
  sendPasswordResetEmail,
} from "../services/email";
import { config } from "../config/env";
import { getGrantedPurchaseVideoReferences } from "../services/purchase";

const router = express.Router();

const forgotPasswordSuccessPayload = {
  ok: true,
  message: "אם קיים משתמש עבור המייל הזה, נשלח קישור לאיפוס סיסמה.",
};

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
    await releaseActiveSession(String(user._id));
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
    purchases.flatMap((purchase) => getGrantedPurchaseVideoReferences(purchase)),
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

router.post("/forgot-password", authRateLimiter, async (req, res) => {
  const { email } = req.body as { email?: string };
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Email is required.",
    });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(200).json(forgotPasswordSuccessPayload);
  }

  const { token, tokenHash, expiresAt } = generatePasswordResetToken();
  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();

  const resetLink = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await sendPasswordResetEmail({
    email: user.email,
    username: user.username,
    resetLink,
  });

  return res.status(200).json(forgotPasswordSuccessPayload);
});

router.get("/reset-password/validate", async (req, res) => {
  const token =
    typeof req.query.token === "string" ? req.query.token.trim() : "";

  if (!token) {
    return res.status(400).json({
      code: "RESET_TOKEN_INVALID",
      message: "Reset token is missing or invalid.",
    });
  }

  const tokenHash = hashResetToken(token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
  });

  if (
    !user ||
    !user.resetPasswordExpiresAt ||
    user.resetPasswordExpiresAt.getTime() <= Date.now()
  ) {
    return res.status(400).json({
      code: "RESET_TOKEN_INVALID",
      message: "Reset token is missing or invalid.",
    });
  }

  return res.status(200).json({ ok: true, valid: true });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body as {
    token?: string;
    password?: string;
  };

  if (!token || !password || password.trim().length < 8) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Token and a valid password are required.",
    });
  }

  const tokenHash = hashResetToken(token.trim());
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
  });

  if (
    !user ||
    !user.resetPasswordExpiresAt ||
    user.resetPasswordExpiresAt.getTime() <= Date.now()
  ) {
    return res.status(400).json({
      code: "RESET_TOKEN_INVALID",
      message: "Reset token is missing or invalid.",
    });
  }

  user.passwordHash = await hashPassword(password.trim());
  clearPasswordResetFields(user);
  await user.save();
  await clearAllUserSessions(String(user._id));
  await sendPasswordResetBackupEmail({
    email: user.email,
    username: user.username,
    password: password.trim(),
  });

  return res.status(200).json({
    ok: true,
    message: "הסיסמה עודכנה בהצלחה.",
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
    purchases.flatMap((purchase) => getGrantedPurchaseVideoReferences(purchase)),
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
