/**
 * Custom hook for creating and activating polls
 */

import { useState, useCallback } from 'react';
import {
  pollsApi,
  type CreatePollRequest,
  type CreateGroupRequest,
  type UpdatePollRequest,
  type Poll,
  type CreateGroupResponse,
} from '../api/client';
import { activatePoll, waitForTransaction } from '../contracts/votaraContract';
import type { Address } from 'viem';

export function usePollCreation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'idle' | 'creating' | 'group' | 'activating' | 'done'>('idle');

  /**
   * Step 1: Create draft poll
   */
  const createDraftPoll = useCallback(
    async (data: CreatePollRequest): Promise<Poll | null> => {
      setLoading(true);
      setError(null);
      setCurrentStep('creating');

      try {
        const poll = await pollsApi.create(data);
        setCurrentStep('idle');
        return poll;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
        setError(errorMessage);
        setCurrentStep('idle');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Step 2: Create Semaphore group with eligible voters
   */
  const createGroup = useCallback(
    async (pollId: string, eligibleAddresses: string[]): Promise<CreateGroupResponse | null> => {
      setLoading(true);
      setError(null);
      setCurrentStep('group');

      try {
        const groupData: CreateGroupRequest = { eligibleAddresses };
        const response = await pollsApi.createGroup(pollId, groupData);
        setCurrentStep('idle');
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
        setError(errorMessage);
        setCurrentStep('idle');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Step 3: Activate poll on smart contract
   */
  const activatePollOnChain = useCallback(
    async (pollId: `0x${string}`, groupId: bigint, account: Address): Promise<boolean> => {
      setLoading(true);
      setError(null);
      setCurrentStep('activating');

      try {
        // Call smart contract
        const hash = await activatePoll(pollId, groupId, account);

        // Wait for confirmation
        await waitForTransaction(hash);

        setCurrentStep('done');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to activate poll';
        setError(errorMessage);
        setCurrentStep('idle');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Update draft poll
   */
  const updateDraftPoll = useCallback(
    async (pollId: string, data: UpdatePollRequest): Promise<Poll | null> => {
      setLoading(true);
      setError(null);

      try {
        const poll = await pollsApi.update(pollId, data);
        return poll;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update poll';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Complete flow: Create draft → Create group → Activate on-chain
   */
  const createAndActivatePoll = useCallback(
    async (
      pollData: CreatePollRequest,
      eligibleAddresses: string[],
      account: Address
    ): Promise<{ success: boolean; pollId?: string; error?: string }> => {
      try {
        // Step 1: Create draft poll
        const poll = await createDraftPoll(pollData);
        if (!poll) {
          return { success: false, error: error || 'Failed to create poll' };
        }

        // Step 2: Create Semaphore group
        const groupResponse = await createGroup(poll.id, eligibleAddresses);
        if (!groupResponse) {
          return { success: false, error: error || 'Failed to create group', pollId: poll.id };
        }

        // Step 3: Activate on smart contract
        const activated = await activatePollOnChain(
          poll.id as `0x${string}`,
          BigInt(groupResponse.groupId),
          account
        );

        if (!activated) {
          return { success: false, error: error || 'Failed to activate poll', pollId: poll.id };
        }

        return { success: true, pollId: poll.id };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create and activate poll';
        return { success: false, error: errorMessage };
      }
    },
    [createDraftPoll, createGroup, activatePollOnChain, error]
  );

  return {
    createDraftPoll,
    createGroup,
    activatePollOnChain,
    updateDraftPoll,
    createAndActivatePoll,
    loading,
    error,
    currentStep,
  };
}

