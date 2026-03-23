import { Request, Response, NextFunction } from 'express';
import {
  verifyToken,
  isSessionActive,
  touchActiveSession,
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
    if (!decoded.sessionId) {
      return res.status(401).json({
        code: 'AUTH_REQUIRED',
        message: 'Invalid or expired token',
      });
    }

    const isAllowed = await isSessionActive(decoded.userId, decoded.sessionId);

    if (!isAllowed) {
      return res.status(401).json({
        code: 'AUTH_REQUIRED',
        message: 'Your session is no longer active. Please login again.',
      });
    }

    await touchActiveSession(decoded.userId, decoded.sessionId);
    req.user = decoded;
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
