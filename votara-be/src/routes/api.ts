import { Router } from 'express';
import votesRouter from './votes.js';

const router = Router();

// API routes
router.use('/votes', votesRouter);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Votara API',
    version: '1.0.0',
    description: 'Backend API for Votara - Farcaster voting application',
    endpoints: {
      health: '/health',
      votes: '/api/votes'
    }
  });
});

export default router;

