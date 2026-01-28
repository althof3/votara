import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'votara-jwt-secret-change-in-production';

// JWT payload interface
interface JWTPayload {
  address: string;
  chainId: number;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        chainId?: number;
      };
    }
  }
}

/**
 * Auth middleware - verifies JWT token and attaches user to request
 * No database hit - just verifies JWT signature
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Attach user to request (from JWT payload, no DB hit)
    req.user = {
      address: decoded.address.toLowerCase(),
      chainId: decoded.chainId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 * No database hit - just verifies JWT if present
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = {
        address: decoded.address.toLowerCase(),
        chainId: decoded.chainId,
      };
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};

