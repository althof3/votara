import { useState, useCallback } from 'react';
import {
  pollsApi,
  type Poll,
  type PollResultsResponse,
  type CreatePollRequest,
} from '../api/client';

export function usePolls() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new poll
   */
  const createPoll = useCallback(async (data: CreatePollRequest): Promise<Poll | null> => {
    setLoading(true);
    setError(null);
    try {
      const poll = await pollsApi.create(data);
      return poll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);



  /**
   * Get poll results
   */
  const getPollResults = useCallback(async (pollId: string): Promise<PollResultsResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const results = await pollsApi.getResults(pollId);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get poll results';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all polls with pagination
   */
  const getAllPolls = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'ENDED';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await pollsApi.getAll(params);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get polls';
      setError(errorMessage);
      return { polls: [], pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasMore: false } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get poll by ID
   */
  const getPollById = useCallback(async (pollId: string): Promise<Poll | null> => {
    setLoading(true);
    setError(null);
    try {
      const poll = await pollsApi.getById(pollId);
      return poll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get poll';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createPoll,
    getPollResults,
    getAllPolls,
    getPollById,
  };
}

