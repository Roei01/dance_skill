import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env';
import { User, type IUser } from '../../models/User';

export const MAX_ALLOWED_DEVICES = 3;

export type AuthTokenPayload = {
  userId: string;
  username: string;
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

const normalizeClientIp = (ip: string) => {
  const trimmed = ip.trim();

  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }

  return trimmed;
};

const buildAllowedIpList = (user: Pick<IUser, 'allowedIps' | 'ipAddress'> | null) => {
  const knownIps = [
    ...(user?.allowedIps ?? []),
    ...(user?.ipAddress ? [user.ipAddress] : []),
  ]
    .map(normalizeClientIp)
    .filter(Boolean);

  return Array.from(new Set(knownIps)).slice(0, MAX_ALLOWED_DEVICES);
};

export const checkIpAccess = async (userId: string, currentIp: string): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) return false;

  const normalizedCurrentIp = normalizeClientIp(currentIp);
  const allowedIps = buildAllowedIpList(user);

  if (allowedIps.includes(normalizedCurrentIp)) {
    if (
      user.ipAddress !== undefined ||
      allowedIps.length !== (user.allowedIps ?? []).length ||
      allowedIps.some((ip, index) => user.allowedIps?.[index] !== ip)
    ) {
      user.ipAddress = undefined;
      user.allowedIps = allowedIps;
      await user.save();
    }

    return true;
  }

  if (allowedIps.length >= MAX_ALLOWED_DEVICES) {
    return false;
  }

  user.ipAddress = undefined;
  user.allowedIps = [...allowedIps, normalizedCurrentIp];
  await user.save();
  return true;
};

export const getClientIp = (forwardedFor?: string | string[], fallback?: string) => {
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return normalizeClientIp(forwardedFor[0]);
  }

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return normalizeClientIp(forwardedFor.split(",")[0].trim());
  }

  if (fallback && fallback.length > 0) {
    return normalizeClientIp(fallback);
  }

  return "127.0.0.1";
};
