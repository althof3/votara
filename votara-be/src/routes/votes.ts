import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as votesController from '../controllers/votesController.js';

const router = Router();

// Get all votes
router.get('/', asyncHandler(votesController.getAllVotes));

// Get vote by ID
router.get('/:id', asyncHandler(votesController.getVoteById));

// Create new vote
router.post('/', asyncHandler(votesController.createVote));

// Cast a vote
router.post('/:id/cast', asyncHandler(votesController.castVote));

// Get vote results
router.get('/:id/results', asyncHandler(votesController.getVoteResults));

export default router;

