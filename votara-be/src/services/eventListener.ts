import { parseAbiItem, type Log } from 'viem';
import { publicClient, votaraContract } from './blockchain';
import { logger } from '../utils/logger';
import prisma from '../db';

/**
 * Event listener for PollActivated events
 * Activates draft polls when they are activated on-chain
 */
export async function startPollActivatedListener() {
  logger.info('🎧 Starting PollActivated event listener...');

  const unwatch = publicClient.watchEvent({
    address: votaraContract.address,
    event: parseAbiItem('event PollActivated(bytes32 indexed pollId, uint256 groupId)'),
    onLogs: async (logs) => {
      for (const log of logs) {
        await handlePollActivatedEvent(log);
      }
    },
    onError: (error) => {
      logger.error('Error in PollActivated listener:', error);
    },
  });

  logger.info('✅ PollActivated event listener started');
  return unwatch;
}

/**
 * Handle PollActivated event
 */
async function handlePollActivatedEvent(log: Log) {
  try {
    const { args, transactionHash } = log as any;
    const { pollId, groupId } = args;

    logger.info(`📡 PollActivated event detected: pollId=${pollId}, groupId=${groupId}, tx=${transactionHash}`);

    // Find draft poll in database
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      logger.warn(`⚠️  Poll ${pollId} not found in database. Skipping activation.`);
      return;
    }

    if (poll.status === 'ACTIVE') {
      logger.info(`ℹ️  Poll ${pollId} already active. Skipping.`);
      return;
    }

    // Update poll to ACTIVE status and set groupId
    await prisma.poll.update({
      where: { id: pollId },
      data: {
        status: 'ACTIVE',
        groupId: groupId.toString(),
        contractTxHash: transactionHash,
        updatedAt: new Date(),
      },
    });

    logger.info(`✅ Poll ${pollId} activated successfully! GroupId: ${groupId}, Tx: ${transactionHash}`);
  } catch (error) {
    logger.error('Error handling PollCreated event:', error);
  }
}

/**
 * Event listener for VoteCast events
 * Records votes when they are cast on-chain
 */
export async function startVoteCastListener() {
  logger.info('🎧 Starting VoteCast event listener...');

  const unwatch = publicClient.watchEvent({
    address: votaraContract.address,
    event: parseAbiItem('event VoteCast(bytes32 indexed pollId, uint8 optionIndex, uint256 nullifierHash)'),
    onLogs: async (logs) => {
      for (const log of logs) {
        await handleVoteCastEvent(log);
      }
    },
    onError: (error) => {
      logger.error('Error in VoteCast listener:', error);
    },
  });

  logger.info('✅ VoteCast event listener started');
  return unwatch;
}

/**
 * Handle VoteCast event
 */
async function handleVoteCastEvent(log: Log) {
  try {
    const { args, transactionHash } = log as any;
    const { pollId, optionIndex, nullifierHash } = args;

    logger.info(`📡 VoteCast event detected: pollId=${pollId}, option=${optionIndex}, tx=${transactionHash}`);

    // Check if vote already recorded
    const existingVote = await prisma.pollVote.findUnique({
      where: { nullifierHash: `0x${nullifierHash.toString(16)}` },
    });

    if (existingVote) {
      logger.info(`ℹ️  Vote with nullifier ${nullifierHash} already recorded. Skipping.`);
      return;
    }

    // Record vote in database (anonymous - no voter address)
    await prisma.pollVote.create({
      data: {
        pollId,
        optionIndex: Number(optionIndex),
        nullifierHash: `0x${nullifierHash.toString(16)}`,
      },
    });

    logger.info(`✅ Vote recorded for poll ${pollId}, option ${optionIndex}`);
  } catch (error) {
    logger.error('Error handling VoteCast event:', error);
  }
}

/**
 * Start all event listeners
 */
export async function startAllEventListeners() {
  const unwatchPollActivated = await startPollActivatedListener();
  const unwatchVoteCast = await startVoteCastListener();

  return {
    unwatchPollActivated,
    unwatchVoteCast,
  };
}

