'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePolls } from '@/lib/hooks/usePolls';
import type { PollResultsResponse } from '@/lib/api/polls';

interface PollResultsProps {
  pollId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function PollResults({ pollId, autoRefresh = false, refreshInterval = 5000 }: PollResultsProps) {
  const { getPollResults, loading } = usePolls();
  const [results, setResults] = useState<PollResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const data = await getPollResults(pollId);
      if (data) {
        setResults(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    }
  }, [pollId, getPollResults]);

  useEffect(() => {
    fetchResults();

    if (autoRefresh) {
      const interval = setInterval(fetchResults, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchResults, autoRefresh, refreshInterval]);

  if (loading && !results) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchResults}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No results available</p>
      </div>
    );
  }

  const { poll, results: voteResults, totalVotes } = results;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold">{poll.title}</h2>
          <button
            onClick={fetchResults}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? '↻' : 'Refresh'}
          </button>
        </div>
        {poll.description && (
          <p className="text-gray-600">{poll.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            poll.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            poll.status === 'ENDED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {poll.status}
          </span>
          <span className="text-sm text-gray-500">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {voteResults.map((result) => {
          const percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;

          return (
            <div key={result.optionId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{result.optionLabel}</span>
                <span className="text-sm text-gray-600">
                  {result.votes} {result.votes === 1 ? 'vote' : 'votes'} ({percentage.toFixed(1)}%)
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {totalVotes === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No votes yet. Be the first to vote!</p>
        </div>
      )}

      {/* Poll Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Start Time</p>
            <p className="font-medium">{new Date(poll.startTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">End Time</p>
            <p className="font-medium">{new Date(poll.endTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Poll ID</p>
            <p className="font-mono text-xs">{poll.id.slice(0, 10)}...{poll.id.slice(-8)}</p>
          </div>
          <div>
            <p className="text-gray-500">Group ID</p>
            <p className="font-mono text-xs">{poll.groupId}</p>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Auto-refreshing every {refreshInterval / 1000} seconds
        </div>
      )}
    </div>
  );
}

