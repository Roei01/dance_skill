import { Request, Response, NextFunction } from 'express';
import {
  verifyToken,
  checkIpAccess,
  getClientIp,
  type AuthTokenPayload,
} from '../services/auth';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 'AUTH_REQUIRED',
      message: 'Authentication required',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;

    const currentIp = getClientIp(req.headers["x-forwarded-for"], req.ip || req.socket.remoteAddress);
    const isAllowed = await checkIpAccess(decoded.userId, currentIp as string);

    if (!isAllowed) {
      return res.status(403).json({
        code: 'IP_MISMATCH',
        message: 'This account can be used on up to 3 devices only.',
      });
    }

    next();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Your session expired. Please login again.',
      });
    }

    return res.status(401).json({
      code: 'AUTH_REQUIRED',
      message: 'Invalid or expired token',
    });
  }
};
