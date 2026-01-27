/**
 * Votara Smart Contract Integration
 *
 * This module provides functions to interact with the VotaraVoting smart contract.
 * It uses viem for blockchain interactions and is compatible with Privy wallet provider.
 */

import { createPublicClient, createWalletClient, custom, http, type Address, type Hash } from 'viem';
import { baseSepolia } from 'viem/chains';
import { VOTARA_ABI, type SemaphoreProof } from './votaraABI';

// Contract address from environment
export const VOTARA_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VOTARA_CONTRACT_ADDRESS || '') as Address;

// Chain configuration
const chain = baseSepolia;

/**
 * Get public client for reading contract
 * This is used for read-only operations (no wallet needed)
 */
export function getPublicClient() {
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Get wallet client for writing to contract
 * This uses the browser's Ethereum provider (injected by Privy, MetaMask, etc.)
 *
 * @throws Error if no Ethereum wallet is found
 */
export function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet found. Please connect your wallet first.');
  }

  return createWalletClient({
    chain,
    transport: custom(window.ethereum),
  });
}

/**
 * Activate a poll on-chain
 * @param pollId - Poll ID (bytes32)
 * @param groupId - Semaphore group ID
 * @param account - User's wallet address
 * @returns Transaction hash
 */
export async function activatePoll(
  pollId: `0x${string}`,
  groupId: bigint,
  account: Address
): Promise<Hash> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: VOTARA_CONTRACT_ADDRESS,
    abi: VOTARA_ABI,
    functionName: 'activatePoll',
    args: [pollId, groupId],
    account,
  });

  return hash;
}

/**
 * Cast a vote on-chain
 * @param pollId - Poll ID (bytes32)
 * @param optionIndex - Option index (0-255)
 * @param proof - Semaphore ZK proof
 * @param account - User's wallet address
 * @returns Transaction hash
 */
export async function castVote(
  pollId: `0x${string}`,
  optionIndex: number,
  proof: SemaphoreProof,
  account: Address
): Promise<Hash> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: VOTARA_CONTRACT_ADDRESS,
    abi: VOTARA_ABI,
    functionName: 'castVote',
    args: [pollId, optionIndex, proof],
    account,
  });

  return hash;
}

/**
 * Get vote count for a specific option
 * @param pollId - Poll ID (bytes32)
 * @param optionIndex - Option index (0-255)
 * @returns Vote count
 */
export async function getPollVotes(
  pollId: `0x${string}`,
  optionIndex: number
): Promise<bigint> {
  const publicClient = getPublicClient();

  const votes = await publicClient.readContract({
    address: VOTARA_CONTRACT_ADDRESS,
    abi: VOTARA_ABI,
    functionName: 'getPollVotes',
    args: [pollId, optionIndex],
  });

  return votes;
}

/**
 * Get poll info from contract
 * @param pollId - Poll ID (bytes32)
 * @returns Poll info (pollId, groupId)
 */
export async function getPollInfo(pollId: `0x${string}`) {
  const publicClient = getPublicClient();

  const pollInfo = await publicClient.readContract({
    address: VOTARA_CONTRACT_ADDRESS,
    abi: VOTARA_ABI,
    functionName: 'polls',
    args: [pollId],
  });

  return {
    pollId: pollInfo[0],
    groupId: pollInfo[1],
  };
}

/**
 * Wait for transaction confirmation
 * @param hash - Transaction hash
 * @returns Transaction receipt
 */
export async function waitForTransaction(hash: Hash) {
  const publicClient = getPublicClient();
  return await publicClient.waitForTransactionReceipt({ hash });
}

/**
 * Watch for PollActivated events
 */
export function watchPollActivated(
  callback: (pollId: `0x${string}`, groupId: bigint) => void
) {
  const publicClient = getPublicClient();

  return publicClient.watchContractEvent({
    address: VOTARA_CONTRACT_ADDRESS,
    abi: VOTARA_ABI,
    eventName: 'PollActivated',
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args.pollId && log.args.groupId !== undefined) {
          callback(log.args.pollId, log.args.groupId);
        }
      });
    },
  });
}

/**
 * Watch for VoteCast events
 */
export function watchVoteCast(
  callback: (pollId: `0x${string}`, optionIndex: number, nullifierHash: bigint) => void
) {
  const publicClient = getPublicClient();

  return publicClient.watchContractEvent({
    address: VOTARA_CONTRACT_ADDRESS,
    abi: VOTARA_ABI,
    eventName: 'VoteCast',
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args.pollId && log.args.optionIndex !== undefined && log.args.nullifierHash !== undefined) {
          callback(log.args.pollId, log.args.optionIndex, log.args.nullifierHash);
        }
      });
    },
  });
}

