import { Router, Request, Response } from 'express';
import { SiweMessage, generateNonce } from 'siwe';
import jwt from 'jsonwebtoken';
import { verifySiweMessage } from 'viem/siwe';
import { CHAIN, publicClient } from '../services/blockchain';
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
 * Returns a JWT-signed nonce (stateless, no session needed)
 */
router.get('/nonce', (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();

    // Sign nonce as JWT with short expiry (5 minutes)
    // This makes it stateless - no need to store in session
    const signedNonce = jwt.sign(
      { nonce },
      JWT_SECRET,
      { expiresIn: '50m' }
    );

    res.json({
      success: true,
      nonce,
      signedNonce, // Frontend must send this back for verification
    });
  } catch (error: unknown) {
    logger.error('Error generating nonce:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce',
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify SIWE message and return JWT token
 * Stateless - uses signed nonce instead of session
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature, signedNonce } = req.body;

    if (!message || !signature || !signedNonce) {
      return res.status(400).json({
        success: false,
        error: 'Message, signature, and signedNonce are required',
      });
    }

    // Verify and decode the signed nonce
    let nonce: string;
    try {
      const decoded = jwt.verify(signedNonce, JWT_SECRET) as { nonce: string };
      nonce = decoded.nonce;
    } catch (error: unknown) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired nonce',
      });
    }

    const siweMessage = new SiweMessage(message);

    // Debug logging
    logger.info('Verifying SIWE signature:', {
      address: siweMessage.address,
      nonce: siweMessage.nonce,
      expectedNonce: nonce,
      chainId: siweMessage.chainId,
      signatureLength: signature.length,
    });

    // Verify nonce matches
    if (siweMessage.nonce !== nonce) {
      logger.error('Nonce mismatch:', {
        messageNonce: siweMessage.nonce,
        expectedNonce: nonce,
      });
      return res.status(401).json({
        success: false,
        error: 'Nonce mismatch',
      });
    }

    // Verify the SIWE message signature
    // For smart wallets (like Coinbase Smart Wallet), we need to use verifyMessage
    // which supports both EOA (ECDSA) and Smart Wallet (ERC-1271) signatures
    const messageToVerify = siweMessage.prepareMessage();

    logger.info('Message to verify:', messageToVerify);
    logger.info('Signature:', signature);
    logger.info('Expected address:', siweMessage.address);

    let isValid = false;

    isValid = await verifySiweMessage(publicClient, {
      message: messageToVerify,
      signature: signature as `0x${string}`,
    });

    logger.info('verifySiweMessage result:' + isValid.toString());

    if (!isValid) {
      isValid = await publicClient.verifyMessage({
        address: siweMessage.address as `0x${string}`,
        message: messageToVerify,
        signature: signature as `0x${string}`,
      });
      if (isValid) {
        logger.info('Signature verification successful for address:', siweMessage.address);
      } else {
        logger.error('Signature verification failed for address:', siweMessage.address);
        return res.status(401).json({
          success: false,
          error: 'Invalid signature',
        });
      }
    }

    // Create or update user in database (only on login)
    await getOrCreateUser(siweMessage.address);

    // Generate JWT token for authentication
    const token = generateToken(siweMessage.address, siweMessage.chainId);

    res.json({
      success: true,
      address: siweMessage.address,
      token, // Return JWT token to frontend
    });
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
});

export default router;

