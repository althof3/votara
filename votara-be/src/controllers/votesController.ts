import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

// Temporary in-memory storage (replace with database later)
interface Vote {
  id: string;
  title: string;
  description: string;
  options: string[];
  createdBy: string;
  createdAt: Date;
  endDate: Date;
  votes: Record<string, string>; // userId -> optionIndex
}

const votes: Map<string, Vote> = new Map();

export const getAllVotes = async (req: Request, res: Response) => {
  const allVotes = Array.from(votes.values());
  
  res.status(200).json({
    status: 'success',
    data: {
      votes: allVotes,
      count: allVotes.length
    }
  });
};

export const getVoteById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const vote = votes.get(id);

  if (!vote) {
    throw new AppError('Vote not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: { vote }
  });
};

export const createVote = async (req: Request, res: Response) => {
  const { title, description, options, createdBy, endDate } = req.body;

  if (!title || !options || !Array.isArray(options) || options.length < 2) {
    throw new AppError('Invalid vote data. Title and at least 2 options required.', 400);
  }

  const id = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newVote: Vote = {
    id,
    title,
    description: description || '',
    options,
    createdBy: createdBy || 'anonymous',
    createdAt: new Date(),
    endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
    votes: {}
  };

  votes.set(id, newVote);
  logger.info(`New vote created: ${id} - ${title}`);

  res.status(201).json({
    status: 'success',
    data: { vote: newVote }
  });
};

export const castVote = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, optionIndex } = req.body;

  if (!userId || optionIndex === undefined) {
    throw new AppError('userId and optionIndex are required', 400);
  }

  const vote = votes.get(id);
  if (!vote) {
    throw new AppError('Vote not found', 404);
  }

  if (new Date() > vote.endDate) {
    throw new AppError('Voting has ended', 400);
  }

  if (optionIndex < 0 || optionIndex >= vote.options.length) {
    throw new AppError('Invalid option index', 400);
  }

  vote.votes[userId] = optionIndex.toString();
  logger.info(`Vote cast: ${userId} voted for option ${optionIndex} in vote ${id}`);

  res.status(200).json({
    status: 'success',
    message: 'Vote cast successfully'
  });
};

export const getVoteResults = async (req: Request, res: Response) => {
  const { id } = req.params;
  const vote = votes.get(id);

  if (!vote) {
    throw new AppError('Vote not found', 404);
  }

  const results = vote.options.map((option, index) => {
    const count = Object.values(vote.votes).filter(v => v === index.toString()).length;
    return {
      option,
      count,
      percentage: vote.votes && Object.keys(vote.votes).length > 0 
        ? (count / Object.keys(vote.votes).length) * 100 
        : 0
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      vote: {
        id: vote.id,
        title: vote.title,
        description: vote.description,
        endDate: vote.endDate
      },
      results,
      totalVotes: Object.keys(vote.votes).length
    }
  });
};

