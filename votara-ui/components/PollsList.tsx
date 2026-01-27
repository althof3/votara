'use client';

import { useInfinitePolls } from '@/lib/hooks/useInfinitePolls';
import type { Poll } from '@/lib/api/polls';

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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={refresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No polls found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {status ? `${status} Polls` : 'All Polls'}
        </h2>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {/* Polls Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>

      {/* Loading More Indicator */}
      {loading && !initialLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !loading && (
        <div ref={observerRef} className="flex justify-center py-4">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Load More
          </button>
        </div>
      )}

      {/* End of List */}
      {!hasMore && polls.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No more polls to load
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <div className="text-center text-sm text-gray-500">
          Showing {polls.length} of {pagination.totalCount} polls
        </div>
      )}
    </div>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const voteCount = poll._count?.votes ?? 0;
  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    ENDED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[poll.status]}`}>
          {poll.status}
        </span>
        <span className="text-sm text-gray-500">
          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 line-clamp-2">{poll.title}</h3>

      {/* Description */}
      {poll.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{poll.description}</p>
      )}

      {/* Options Count */}
      <div className="text-sm text-gray-500 mb-3">
        {poll.options.length} options
      </div>

      {/* View Button */}
      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        View Poll
      </button>
    </div>
  );
}

