/**
 * Custom hook for voting on polls
 */

import { useState, useCallback } from 'react';
import { castVote, waitForTransaction } from '../contracts/votaraContract';
import type { SemaphoreProof } from '../contracts/votaraABI';
import type { Address } from 'viem';

export function useVoting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /**
   * Cast a vote on a poll
   * @param pollId - Poll ID (bytes32)
   * @param optionIndex - Option index (0-255)
   * @param proof - Semaphore ZK proof
   * @param account - User's wallet address
   * @returns Success status
   */
  const vote = useCallback(
    async (
      pollId: `0x${string}`,
      optionIndex: number,
      proof: SemaphoreProof,
      account: Address
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        // Submit vote to smart contract
        const hash = await castVote(pollId, optionIndex, proof, account);
        setTxHash(hash);

        // Wait for confirmation
        await waitForTransaction(hash);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to cast vote';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setTxHash(null);
  }, []);

  return {
    vote,
    loading,
    error,
    txHash,
    reset,
  };
}

