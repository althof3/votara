import { Router } from 'express';
import pollsRouter from './polls';

const router = Router();

// API routes
router.use('/polls', pollsRouter);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    name: 'Votara API',
    version: '1.0.0',
    description: 'Backend API for Votara - Farcaster voting application',
    endpoints: {
      health: '/health',
      polls: '/api/polls'
    }
  });
});

export default router;

