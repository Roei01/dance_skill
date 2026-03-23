import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env';
import { User, type IUser } from '../../models/User';

export const SESSION_DURATION_MS = 2 * 60 * 1000;

export type AuthTokenPayload = {
  userId: string;
  username: string;
  sessionId: string;
};

export const generateTempPassword = (length = 10): string => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
};

export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

const getSessionExpiryDate = () => {
  return new Date(Date.now() + SESSION_DURATION_MS);
};

const clearSessionFields = (user: IUser) => {
  user.activeSessionId = undefined;
  user.activeSessionStartedAt = undefined;
  user.activeSessionExpiresAt = undefined;
};

const clearExpiredSessionIfNeeded = async (user: IUser) => {
  if (
    user.activeSessionId &&
    user.activeSessionExpiresAt &&
    user.activeSessionExpiresAt.getTime() <= Date.now()
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

export const getActiveSessionRemainingSeconds = async (userId: string): Promise<number> => {
  const user = await User.findById(userId);
  if (!user) {
    return 0;
  }

  await clearExpiredSessionIfNeeded(user);

  if (!user.activeSessionId || !user.activeSessionExpiresAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((user.activeSessionExpiresAt.getTime() - Date.now()) / 1000),
  );
};

export const startExclusiveSession = async (userId: string): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const sessionId = generateSessionId();
  user.activeSessionId = sessionId;
  user.activeSessionStartedAt = new Date();
  user.activeSessionExpiresAt = getSessionExpiryDate();
  user.ipAddress = undefined;
  user.allowedIps = [];
  await user.save();

  return sessionId;
};

export const releaseActiveSession = async (userId: string, sessionId?: string) => {
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

export const isSessionActive = async (userId: string, sessionId: string): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) {
    return false;
  }

  await clearExpiredSessionIfNeeded(user);

  return user.activeSessionId === sessionId;
};

export const touchActiveSession = async (userId: string, sessionId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  await clearExpiredSessionIfNeeded(user);

  if (user.activeSessionId !== sessionId) {
    return;
  }

  user.activeSessionExpiresAt = getSessionExpiryDate();
  await user.save();
};
