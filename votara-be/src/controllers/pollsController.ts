import { Request, Response } from 'express';
import prisma from '../db';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { createGroupWithMembers } from '../services/semaphore';
import type { Address } from 'viem';
import { v4 as uuidv4 } from 'uuid';
import { keccak256, toBytes } from 'viem';

// Validation schemas
const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  options: z.array(z.object({
    id: z.number().int().min(0).max(255),
    label: z.string().min(1),
  })).min(2).max(256),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

const createGroupSchema = z.object({
  eligibleAddresses: z.array(z.string()).min(1),
});

const updatePollSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

/**
 * Create a new poll (as DRAFT)
 * Requires authentication
 * Poll will be activated later via activatePoll endpoint
 */
export const createPoll = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const validatedData = createPollSchema.parse(req.body);

    // Generate poll ID using UUID v4 + keccak256 (cryptographically secure)
    const pollId = keccak256(toBytes(uuidv4()));

    // Create poll as DRAFT (groupId will be set when activated)
    const createdPoll = await prisma.poll.create({
      data: {
        id: pollId,
        groupId: '0', // Placeholder, will be set when activated
        title: validatedData.title,
        description: validatedData.description,
        options: validatedData.options,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        status: 'DRAFT', // Start as draft
        createdBy: req.user.address,
      },
    });

    logger.info(`Poll created as DRAFT by ${req.user.address}: ${createdPoll.id}`);

    res.status(201).json({
      success: true,
      data: createdPoll,
      message: 'Poll created as draft. Call /activate to make it live on the blockchain.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error creating poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create poll',
    });
  }
};

/**
 * Get poll results
 */
export const getPollResults = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;

    // Get poll details with votes
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: true,
      },
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found',
      });
    }

    // Count votes per option
    const options = poll.options as Array<{ id: number; label: string }>;
    const voteCounts: Record<number, number> = {};

    // Initialize vote counts for all options
    options.forEach((option) => {
      voteCounts[option.id] = 0;
    });

    // Count votes from database
    poll.votes.forEach((vote) => {
      if (voteCounts[vote.optionIndex] !== undefined) {
        voteCounts[vote.optionIndex]++;
      }
    });

    res.json({
      success: true,
      data: {
        poll: {
          id: poll.id,
          groupId: poll.groupId,
          title: poll.title,
          description: poll.description,
          options: poll.options,
          startTime: poll.startTime,
          endTime: poll.endTime,
          status: poll.status,
          contractTxHash: poll.contractTxHash,
          createdBy: poll.createdBy,
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt,
        },
        results: options.map((option) => ({
          optionId: option.id,
          optionLabel: option.label,
          votes: voteCounts[option.id] || 0,
        })),
        totalVotes: poll.votes.length,
      },
    });
  } catch (error) {
    logger.error('Error getting poll results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get poll results',
    });
  }
};

/**
 * Get all polls with pagination (for infinite scrolling)
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 10, max: 50)
 * - status: filter by status (optional)
 */
export const getAllPolls = async (req: Request, res: Response) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 items per page
    const status = req.query.status as string | undefined;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && ['DRAFT', 'ACTIVE', 'ENDED'].includes(status)) {
      where.status = status;
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.poll.count({ where });

    // Get paginated polls
    const polls = await prisma.poll.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    res.json({
      success: true,
      data: polls,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    logger.error('Error getting all polls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get polls',
    });
  }
};

/**
 * Get single poll by ID
 */
export const getPollById = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found',
      });
    }

    res.json({
      success: true,
      data: poll,
    });
  } catch (error) {
    logger.error('Error getting poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get poll',
    });
  }
};

/**
 * Update poll
 * Only creator can update
 */
export const updatePoll = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { pollId } = req.params;
    const validatedData = updatePollSchema.parse(req.body);

    // Get poll
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found',
      });
    }

    // Validate creator
    if (poll.createdBy.toLowerCase() !== req.user.address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Only poll creator can update this poll',
      });
    }

    // Validate poll status - only DRAFT polls can be updated
    if (poll.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Only draft polls can be updated. This poll is already active or ended.',
      });
    }

    // Update poll
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    logger.info(`Poll updated by ${req.user.address}: ${pollId}`);

    res.json({
      success: true,
      data: updatedPoll,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error updating poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update poll',
    });
  }
};



/**
 * Create Semaphore group for a poll
 * This endpoint creates a Semaphore group with eligible voters
 * Frontend will then call activatePoll on smart contract with the returned groupId
 */
export const createPollGroup = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { pollId } = req.params;
    const validatedData = createGroupSchema.parse(req.body);

    // Get poll from database
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found',
      });
    }

    // Check if user is the creator
    if (poll.createdBy !== req.user.address) {
      return res.status(403).json({
        success: false,
        error: 'Only poll creator can create group for the poll',
      });
    }

    // Check if poll is already active
    if (poll.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Poll is already active',
      });
    }

    logger.info(`🔐 Creating Semaphore group for poll ${pollId} with ${validatedData.eligibleAddresses.length} eligible voters...`);

    // Create Semaphore group with eligible voters
    const { groupId, addMembersTxHash, identityCommitments } = await createGroupWithMembers(
      validatedData.eligibleAddresses as Address[]
    );

    logger.info(`✅ Semaphore group created: ${groupId}, tx: ${addMembersTxHash}`);

    // Save identity commitments to database
    const groupMembersArray = identityCommitments.map(c => c.toString());
    await prisma.poll.update({
      where: { id: pollId },
      data: {
        groupMembers: groupMembersArray,
      },
    });

    logger.info(`💾 Saved ${groupMembersArray.length} identity commitments to database`);

    res.json({
      success: true,
      data: {
        pollId,
        groupId: groupId.toString(),
        semaphoreGroupTxHash: addMembersTxHash,
        eligibleVotersCount: validatedData.eligibleAddresses.length,
        groupMembers: groupMembersArray,
      },
      message: 'Semaphore group created. Now call activatePoll on smart contract with this groupId.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('Error creating poll group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create poll group',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

