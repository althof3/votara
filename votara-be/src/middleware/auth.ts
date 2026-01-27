import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import prisma from '../db';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
        privyUserId: string;
        farcasterFid?: string;
        email?: string;
      };
    }
  }
}

/**
 * Verify Privy JWT token
 */
async function verifyPrivyToken(token: string): Promise<any> {
  try {
    const response = await axios.get('https://auth.privy.io/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'privy-app-id': process.env.PRIVY_APP_ID || '',
      },
    });

    return response.data;
  } catch (error) {
    logger.error('Error verifying Privy token:', error);
    return null;
  }
}

/**
 * Get or create user from Privy data
 */
async function getOrCreateUser(privyUser: any) {
  // Extract wallet address
  const wallet = privyUser.linked_accounts?.find(
    (account: any) => account.type === 'wallet'
  );

  if (!wallet) {
    throw new Error('No wallet linked to Privy account');
  }

  const address = wallet.address.toLowerCase();

  // Extract Farcaster info
  const farcaster = privyUser.linked_accounts?.find(
    (account: any) => account.type === 'farcaster'
  );

  // Upsert user (create or update)
  const user = await prisma.user.upsert({
    where: { address },
    update: {
      farcasterFid: farcaster?.fid?.toString(),
      email: privyUser.email?.address,
      updatedAt: new Date(),
    },
    create: {
      address,
      privyUserId: privyUser.id,
      farcasterFid: farcaster?.fid?.toString(),
      email: privyUser.email?.address,
    },
  });

  return user;
}

/**
 * Auth middleware - verifies JWT and attaches user to request
 */
export const authMiddleware = async (
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

    // Verify token with Privy
    const privyUser = await verifyPrivyToken(token);

    if (!privyUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Get or create user in database
    const user = await getOrCreateUser(privyUser);

    // Attach user to request
    req.user = {
      address: user.address,
      privyUserId: user.privyUserId!,
      farcasterFid: user.farcasterFid || undefined,
      email: user.email || undefined,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const privyUser = await verifyPrivyToken(token);

      if (privyUser) {
        const user = await getOrCreateUser(privyUser);
        req.user = {
          address: user.address,
          privyUserId: user.privyUserId!,
          farcasterFid: user.farcasterFid || undefined,
          email: user.email || undefined,
        };
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};

