import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../config/env";
import { User, type IUser } from "../../models/User";

export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
export const SESSION_DISCONNECT_GRACE_MS = 15 * 1000;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export type AuthTokenPayload = {
  userId: string;
  username: string;
  sessionId: string;
};

export const generateTempPassword = (length = 10): string => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: Math.floor(SESSION_DURATION_MS / 1000),
  });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
};

export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

export const hashResetToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
  };
};

const getSessionExpiryDate = () => {
  return new Date(Date.now() + SESSION_DURATION_MS);
};

const getSessionDisconnectGraceDate = () => {
  return new Date(Date.now() + SESSION_DISCONNECT_GRACE_MS);
};

const clearSessionFields = (user: IUser) => {
  user.activeSessionId = undefined;
  user.activeSessionStartedAt = undefined;
  user.activeSessionExpiresAt = undefined;
  user.activeSessionDisconnectAt = undefined;
};

export const clearPasswordResetFields = (user: IUser) => {
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
};

const clearExpiredSessionIfNeeded = async (user: IUser) => {
  if (
    user.activeSessionId &&
    ((user.activeSessionExpiresAt &&
      user.activeSessionExpiresAt.getTime() <= Date.now()) ||
      (user.activeSessionDisconnectAt &&
        user.activeSessionDisconnectAt.getTime() <= Date.now()))
  ) {
    clearSessionFields(user);
    await user.save();
  }
};

export const hasConflictingActiveSession = async (
  userId: string,
  currentSessionId?: string,
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    return true;
  }

  await clearExpiredSessionIfNeeded(user);

  if (!user.activeSessionId) {
    return false;
  }

  return user.activeSessionId !== currentSessionId;
};

export const getActiveSessionRemainingSeconds = async (
  userId: string,
): Promise<number> => {
  const user = await User.findById(userId);
  if (!user) {
    return 0;
  }

  await clearExpiredSessionIfNeeded(user);

  if (!user.activeSessionId || !user.activeSessionExpiresAt) {
    return 0;
  }

  const sessionDeadline = user.activeSessionDisconnectAt
    ? Math.min(
        user.activeSessionExpiresAt.getTime(),
        user.activeSessionDisconnectAt.getTime(),
      )
    : user.activeSessionExpiresAt.getTime();

  return Math.max(0, Math.ceil((sessionDeadline - Date.now()) / 1000));
};

export const startExclusiveSession = async (
  userId: string,
): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const sessionId = generateSessionId();
  user.activeSessionId = sessionId;
  user.activeSessionStartedAt = new Date();
  user.activeSessionExpiresAt = getSessionExpiryDate();
  user.activeSessionDisconnectAt = undefined;
  user.ipAddress = undefined;
  user.allowedIps = [];
  await user.save();

  return sessionId;
};

export const releaseActiveSession = async (
  userId: string,
  sessionId?: string,
) => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  await clearExpiredSessionIfNeeded(user);

  if (!user.activeSessionId) {
    return;
  }

  if (sessionId && user.activeSessionId !== sessionId) {
    return;
  }

  clearSessionFields(user);
  await user.save();
};

export const clearAllUserSessions = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  clearSessionFields(user);
  await user.save();
};

export const isSessionActive = async (
  userId: string,
  sessionId: string,
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    return false;
  }

  await clearExpiredSessionIfNeeded(user);

  return user.activeSessionId === sessionId;
};

export const touchActiveSession = async (
  userId: string,
  sessionId: string,
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  await clearExpiredSessionIfNeeded(user);

  if (user.activeSessionId !== sessionId) {
    return;
  }

  if (!user.activeSessionDisconnectAt) {
    return;
  }

  user.activeSessionDisconnectAt = undefined;
  await user.save();
};

export const markSessionDisconnecting = async (
  userId: string,
  sessionId: string,
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  await clearExpiredSessionIfNeeded(user);

  if (user.activeSessionId !== sessionId) {
    return;
  }

  user.activeSessionDisconnectAt = getSessionDisconnectGraceDate();
  await user.save();
};
