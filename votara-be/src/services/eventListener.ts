import { parseAbiItem, type Log } from 'viem';
import { publicClient, votaraContract } from './blockchain';
import { logger } from '../utils/logger';
import prisma from '../db';

// Polling interval in milliseconds (4 seconds)
const POLLING_INTERVAL = 4000;

/**
 * Event listener for PollActivated events
 * Activates draft polls when they are activated on-chain
 * Uses polling instead of filters to support public RPC endpoints
 */
export async function startPollActivatedListener() {
  logger.info('🎧 Starting PollActivated event listener...');

  // Validate contract address
  if (!votaraContract.address || votaraContract.address === '0x') {
    logger.error('❌ Cannot start PollActivated listener: CONTRACT_ADDRESS is not set');
    throw new Error('CONTRACT_ADDRESS is required for event listeners');
  }

  let lastBlockChecked = 0n;
  let isPolling = true;

  // Get current block number to start from
  try {
    lastBlockChecked = await publicClient.getBlockNumber();
    logger.info(`📍 Starting PollActivated listener from block ${lastBlockChecked}`);
  } catch (error) {
    logger.error('❌ Failed to get current block number:', error);
    throw error;
  }

  // Poll for events every POLLING_INTERVAL
  const pollForEvents = async () => {
    if (!isPolling) return;

    try {
      const currentBlock = await publicClient.getBlockNumber();

      if (currentBlock > lastBlockChecked) {
        const logs = await publicClient.getLogs({
          address: votaraContract.address,
          event: parseAbiItem('event PollActivated(bytes32 indexed pollId, uint256 groupId)'),
          fromBlock: lastBlockChecked + 1n,
          toBlock: currentBlock,
        });

        for (const log of logs) {
          await handlePollActivatedEvent(log);
        }

        lastBlockChecked = currentBlock;
      }
    } catch (error) {
      logger.error('Error polling for PollActivated events:', error);
    }
  };

  // Start polling
  const intervalId = setInterval(pollForEvents, POLLING_INTERVAL);

  logger.info('✅ PollActivated event listener started (polling mode)');

  // Return unwatch function
  return () => {
    isPolling = false;
    clearInterval(intervalId);
    logger.info('🛑 PollActivated event listener stopped');
  };
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
 * Uses polling instead of filters to support public RPC endpoints
 */
export async function startVoteCastListener() {
  logger.info('🎧 Starting VoteCast event listener...');

  // Validate contract address
  if (!votaraContract.address || votaraContract.address === '0x') {
    logger.error('❌ Cannot start VoteCast listener: CONTRACT_ADDRESS is not set');
    throw new Error('CONTRACT_ADDRESS is required for event listeners');
  }

  let lastBlockChecked = 0n;
  let isPolling = true;

  // Get current block number to start from
  try {
    lastBlockChecked = await publicClient.getBlockNumber();
    logger.info(`📍 Starting VoteCast listener from block ${lastBlockChecked}`);
  } catch (error) {
    logger.error('❌ Failed to get current block number:', error);
    throw error;
  }

  // Poll for events every POLLING_INTERVAL
  const pollForEvents = async () => {
    if (!isPolling) return;

    try {
      const currentBlock = await publicClient.getBlockNumber();

      if (currentBlock > lastBlockChecked) {
        const logs = await publicClient.getLogs({
          address: votaraContract.address,
          event: parseAbiItem('event VoteCast(bytes32 indexed pollId, uint8 optionIndex, uint256 nullifierHash)'),
          fromBlock: lastBlockChecked + 1n,
          toBlock: currentBlock,
        });

        for (const log of logs) {
          await handleVoteCastEvent(log);
        }

        lastBlockChecked = currentBlock;
      }
    } catch (error) {
      logger.error('Error polling for VoteCast events:', error);
    }
  };

  // Start polling
  const intervalId = setInterval(pollForEvents, POLLING_INTERVAL);

  logger.info('✅ VoteCast event listener started (polling mode)');

  // Return unwatch function
  return () => {
    isPolling = false;
    clearInterval(intervalId);
    logger.info('🛑 VoteCast event listener stopped');
  };
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
 * Event listener for PollCreated events
 * Records poll creator when poll is created on-chain
 * Uses polling instead of filters to support public RPC endpoints
 */
export async function startPollCreatedListener() {
  logger.info('🎧 Starting PollCreated event listener...');

  // Validate contract address
  if (!votaraContract.address || votaraContract.address === '0x') {
    logger.error('❌ Cannot start PollCreated listener: CONTRACT_ADDRESS is not set');
    throw new Error('CONTRACT_ADDRESS is required for event listeners');
  }

  let lastBlockChecked = 0n;
  let isPolling = true;

  // Get current block number to start from
  try {
    lastBlockChecked = await publicClient.getBlockNumber();
    logger.info(`📍 Starting PollCreated listener from block ${lastBlockChecked}`);
  } catch (error) {
    logger.error('❌ Failed to get current block number:', error);
    throw error;
  }

  // Poll for events every POLLING_INTERVAL
  const pollForEvents = async () => {
    if (!isPolling) return;

    try {
      const currentBlock = await publicClient.getBlockNumber();

      if (currentBlock > lastBlockChecked) {
        const logs = await publicClient.getLogs({
          address: votaraContract.address,
          event: parseAbiItem('event PollCreated(bytes32 indexed pollId, address indexed creator)'),
          fromBlock: lastBlockChecked + 1n,
          toBlock: currentBlock,
        });

        for (const log of logs) {
          await handlePollCreatedEvent(log);
        }

        lastBlockChecked = currentBlock;
      }
    } catch (error) {
      logger.error('Error polling for PollCreated events:', error);
    }
  };

  // Start polling
  const intervalId = setInterval(pollForEvents, POLLING_INTERVAL);

  logger.info('✅ PollCreated event listener started (polling mode)');

  // Return unwatch function
  return () => {
    isPolling = false;
    clearInterval(intervalId);
    logger.info('🛑 PollCreated event listener stopped');
  };
}

/**
 * Handle PollCreated event
 * This event is emitted when createPoll() is called on smart contract
 * We use this to track the creator address on-chain
 */
async function handlePollCreatedEvent(log: Log) {
  try {
    const { args, transactionHash } = log as any;
    const { pollId, creator } = args;

    logger.info(`📡 PollCreated event detected: pollId=${pollId}, creator=${creator}, tx=${transactionHash}`);

    // Check if poll already exists in database
    const existingPoll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (existingPoll) {
      logger.info(`ℹ️  Poll ${pollId} already exists in database. Skipping creation.`);
      return;
    }

    // Note: We don't create the poll here because metadata (title, description, options)
    // should be created via API endpoint first. This event just confirms the creator on-chain.
    // The frontend flow should be:
    // 1. Call smart contract createPoll() -> emits PollCreated event
    // 2. Call backend API /polls to save metadata

    logger.info(`✅ PollCreated event processed for ${pollId} by creator ${creator}`);
  } catch (error) {
    logger.error('Error handling PollCreated event:', error);
  }
}

/**
 * Start all event listeners
 */
export async function startAllEventListeners() {
  const unwatchPollCreated = await startPollCreatedListener();
  const unwatchPollActivated = await startPollActivatedListener();
  const unwatchVoteCast = await startVoteCastListener();

  return {
    unwatchPollCreated,
    unwatchPollActivated,
    unwatchVoteCast,
  };
}

