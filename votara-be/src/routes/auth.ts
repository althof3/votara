import { Router, Request, Response } from 'express';
import { SiweMessage, generateNonce } from 'siwe';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import prisma from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'votara-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Get or create user in database
 * Only called during login, not on every request
 */
async function getOrCreateUser(address: string) {
  const normalizedAddress = address.toLowerCase();

  const user = await prisma.user.upsert({
    where: { address: normalizedAddress },
    update: {
      updatedAt: new Date(),
    },
    create: {
      address: normalizedAddress,
    },
  });

  return user;
}

/**
 * Generate JWT token for authenticated user
 */
function generateToken(address: string, chainId: number): string {
  return jwt.sign(
    {
      address: address.toLowerCase(),
      chainId,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

/**
 * GET /api/auth/nonce
 * Generate a nonce for SIWE authentication
 */
router.get('/nonce', (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    req.session.nonce = nonce;
    
    req.session.save((err) => {
      if (err) {
        logger.error('Error saving session:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate nonce',
        });
      }
      
      res.json({
        success: true,
        nonce,
      });
    });
  } catch (error) {
    logger.error('Error generating nonce:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce',
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify SIWE message and create session
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Message and signature are required',
      });
    }

    const siweMessage = new SiweMessage(message);
    
    // Verify the message
    const fields = await siweMessage.verify({
      signature,
      nonce: req.session.nonce,
    });

    if (!fields.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Create or update user in database (only on login)
    await getOrCreateUser(siweMessage.address);

    // Generate JWT token
    const token = generateToken(siweMessage.address, siweMessage.chainId);

    // Clear nonce from session
    req.session.nonce = undefined;

    req.session.save((err) => {
      if (err) {
        logger.error('Error saving session:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to create session',
        });
      }

      res.json({
        success: true,
        address: siweMessage.address,
        token, // Return JWT token to frontend
      });
    });
  } catch (error) {
    logger.error('Error verifying SIWE message:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Client-side logout (JWT is stateless, just return success)
 */
router.post('/logout', (_req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  // No server-side state to clear
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Verify JWT token and return user info
 */
router.get('/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string; chainId: number };

    res.json({
      success: true,
      address: decoded.address,
      chainId: decoded.chainId,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
});

export default router;

