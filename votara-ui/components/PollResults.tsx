'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePolls } from '@/lib/hooks/usePolls';
import type { PollResultsResponse } from '@/lib/api/client';
import styles from './PollResults.module.css';

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
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Error: {error}</p>
        <button
          onClick={fetchResults}
          className={styles.backButton}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className={styles.container}>
        <p>No results available</p>
      </div>
    );
  }

  const { poll, results: voteResults, totalVotes } = results;

  const getBadgeClass = () => {
    switch (poll.status) {
      case 'ACTIVE':
        return styles.badgeActive;
      case 'DRAFT':
        return styles.badgePending;
      case 'ENDED':
        return styles.badgeCompleted;
      default:
        return styles.badgePending;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>{poll.title}</h2>
        {poll.description && (
          <p className={styles.description}>{poll.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalVotes}</div>
          <div className={styles.statLabel}>Total Votes</div>
        </div>
        <div className={styles.statCard}>
          <span className={`${styles.badge} ${getBadgeClass()}`}>
            {poll.status}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className={styles.results}>
        {voteResults.map((result) => {
          const percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;

          return (
            <div key={result.optionId} className={styles.resultItem}>
              <div className={styles.resultHeader}>
                <span className={styles.resultOption}>{result.optionLabel}</span>
                <span className={styles.resultPercentage}>
                  {result.votes} {result.votes === 1 ? 'vote' : 'votes'} ({percentage.toFixed(1)}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {totalVotes === 0 && (
        <div className={styles.empty}>
          <p>No votes yet. Be the first to vote!</p>
        </div>
      )}

      <button onClick={() => window.history.back()} className={styles.backButton}>
        Back to Poll
      </button>
    </div>
  );
}

