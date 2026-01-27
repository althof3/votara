'use client';

import { useInfinitePolls } from '@/lib/hooks/useInfinitePolls';
import type { Poll } from '@/lib/api/polls';
import styles from './PollsList.module.css';

interface PollsListProps {
  status?: 'DRAFT' | 'ACTIVE' | 'ENDED';
  limit?: number;
}

export function PollsList({ status, limit = 10 }: PollsListProps) {
  const {
    polls,
    pagination,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    observerRef,
  } = useInfinitePolls({ status, limit });

  if (initialLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p className={styles.errorTitle}>Error: {error}</p>
        <button
          onClick={refresh}
          className={styles.loadMoreButton}
        >
          Retry
        </button>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No polls found</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Polls Grid */}
      <div className={styles.grid}>
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>

      {/* Loading More Indicator */}
      {loading && !initialLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !loading && (
        <div ref={observerRef} className={styles.loadMore}>
          <button
            onClick={loadMore}
            className={styles.loadMoreButton}
          >
            Load More
          </button>
        </div>
      )}

      {/* End of List */}
      {!hasMore && polls.length > 0 && (
        <div className={styles.empty}>
          No more polls to load
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <div className={styles.empty}>
          Showing {polls.length} of {pagination.totalCount} polls
        </div>
      )}
    </div>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const voteCount = poll._count?.votes ?? 0;

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
    <div className={styles.card}>
      {/* Status Badge */}
      <div className={styles.cardHeader}>
        <span className={`${styles.badge} ${getBadgeClass()}`}>
          {poll.status}
        </span>
        <span className={styles.cardFooter}>
          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      {/* Title */}
      <h3 className={styles.cardTitle}>{poll.title}</h3>

      {/* Description */}
      {poll.description && (
        <p className={styles.cardDescription}>{poll.description}</p>
      )}

      {/* Options Count */}
      <div className={styles.cardFooter}>
        {poll.options.length} options
      </div>
    </div>
  );
}

