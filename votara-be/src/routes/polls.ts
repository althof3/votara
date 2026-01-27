import { Router } from 'express';
import {
  createPoll,
  createPollGroup,
  getPollResults,
  getAllPolls,
  getPollById,
  updatePoll,
} from '../controllers/pollsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/polls
 * @desc    Create a new poll
 * @access  Private (requires auth)
 */
router.post('/', authMiddleware, createPoll);

/**
 * @route   GET /api/polls
 * @desc    Get all polls
 * @access  Public
 */
router.get('/', getAllPolls);

/**
 * @route   GET /api/polls/:pollId
 * @desc    Get poll by ID
 * @access  Public
 */
router.get('/:pollId', getPollById);

/**
 * @route   GET /api/polls/:pollId/results
 * @desc    Get poll results
 * @access  Public
 */
router.get('/:pollId/results', getPollResults);

/**
 * @route   POST /api/polls/:pollId/create-group
 * @desc    Create Semaphore group for poll with eligible voters
 * @access  Private (only creator)
 */
router.post('/:pollId/create-group', authMiddleware, createPollGroup);

/**
 * @route   PUT /api/polls/:pollId
 * @desc    Update a poll (only DRAFT polls)
 * @access  Private (only creator)
 */
router.put('/:pollId', authMiddleware, updatePoll);

export default router;

