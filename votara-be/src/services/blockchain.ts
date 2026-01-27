import { createPublicClient, http, type Address, type Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { logger } from '../utils/logger';
import contractAbi from '../config/VotaraVoting.abi.json';

// Get configuration from environment
const CHAIN = process.env.CHAIN === 'base' ? base : baseSepolia;
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || '') as Address;

if (!CONTRACT_ADDRESS) {
  logger.warn('⚠️  CONTRACT_ADDRESS not set in environment variables');
}

/**
 * Public client for reading from blockchain
 */
export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

/**
 * Contract configuration
 */
export const votaraContract = {
  address: CONTRACT_ADDRESS,
  abi: contractAbi,
} as const;

/**
 * Check if poll exists on-chain
 */
export async function pollExistsOnChain(pollId: Hash): Promise<boolean> {
  try {
    const exists = await publicClient.readContract({
      ...votaraContract,
      functionName: 'pollExists',
      args: [pollId],
    });
    return exists as boolean;
  } catch (error) {
    logger.error('Error checking poll existence on-chain:', error);
    return false;
  }
}

/**
 * Get poll group ID from chain
 */
export async function getPollGroupId(pollId: Hash): Promise<bigint | null> {
  try {
    const groupId = await publicClient.readContract({
      ...votaraContract,
      functionName: 'getPollGroupId',
      args: [pollId],
    });
    return groupId as bigint;
  } catch (error) {
    logger.error('Error getting poll group ID:', error);
    return null;
  }
}

/**
 * Get vote count for a specific option
 */
export async function getVoteCount(pollId: Hash, optionIndex: number): Promise<bigint> {
  try {
    const count = await publicClient.readContract({
      ...votaraContract,
      functionName: 'getVoteCount',
      args: [pollId, BigInt(optionIndex)],
    });
    return count as bigint;
  } catch (error) {
    logger.error('Error getting vote count:', error);
    return BigInt(0);
  }
}

/**
 * Get total number of polls
 */
export async function getTotalPolls(): Promise<bigint> {
  try {
    const total = await publicClient.readContract({
      ...votaraContract,
      functionName: 'getTotalPolls',
      args: [],
    });
    return total as bigint;
  } catch (error) {
    logger.error('Error getting total polls:', error);
    return BigInt(0);
  }
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash: Hash) {
  try {
    return await publicClient.getTransactionReceipt({ hash: txHash });
  } catch (error) {
    logger.error('Error getting transaction receipt:', error);
    return null;
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(txHash: Hash, confirmations = 1) {
  try {
    return await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations,
    });
  } catch (error) {
    logger.error('Error waiting for transaction:', error);
    throw error;
  }
}

export { CHAIN, CONTRACT_ADDRESS };

