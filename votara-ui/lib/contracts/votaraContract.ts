/**
 * Votara Smart Contract Integration - MOCKED
 */

import { type Address, type Hash } from 'viem';
import { type SemaphoreProof } from './votaraABI';

// Contract address from environment
export const VOTARA_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as Address;

/**
 * MOCK: Get public client
 */
export function getPublicClient() {
  return {};
}

/**
 * MOCK: Get wallet client
 */
export function getWalletClient() {
  return {};
}

/**
 * MOCK: Create a poll on-chain
 */
export async function createPoll(
  pollId: `0x${string}`,
  account: Address
): Promise<Hash> {
  console.log('MOCK: createPoll', { pollId, account });
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `0xmocktxhash${Math.random().toString(16).slice(2)}` as Hash;
}

/**
 * MOCK: Activate a poll on-chain
 */
export async function activatePoll(
  pollId: `0x${string}`,
  groupId: bigint,
  account: Address
): Promise<Hash> {
  console.log('MOCK: activatePoll', { pollId, groupId, account });
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `0xmocktxhash${Math.random().toString(16).slice(2)}` as Hash;
}

/**
 * MOCK: Cast a vote on-chain
 */
export async function castVote(
  pollId: `0x${string}`,
  optionIndex: number,
  proof: SemaphoreProof,
  account: Address
): Promise<Hash> {
  console.log('MOCK: castVote', { pollId, optionIndex, account });
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `0xmocktxhash${Math.random().toString(16).slice(2)}` as Hash;
}

/**
 * MOCK: Get vote count for a specific option
 */
export async function getPollVotes(
  _pollId: `0x${string}`,
  _optionIndex: number
): Promise<bigint> {
  return BigInt(Math.floor(Math.random() * 100));
}

/**
 * MOCK: Get poll info from contract
 */
export async function getPollInfo(pollId: `0x${string}`) {
  return {
    pollId: pollId,
    groupId: BigInt(1),
  };
}

/**
 * MOCK: Wait for transaction confirmation
 */
export async function waitForTransaction(hash: Hash) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status: 'success', transactionHash: hash };
}

/**
 * MOCK: Watch for PollActivated events
 */
export function watchPollActivated(
  _callback: (pollId: `0x${string}`, groupId: bigint) => void
) {
  return () => {}; // No-op cleanup
}

/**
 * MOCK: Watch for VoteCast events
 */
export function watchVoteCast(
  _callback: (pollId: `0x${string}`, optionIndex: number, nullifierHash: bigint) => void
) {
  return () => {}; // No-op cleanup
}
