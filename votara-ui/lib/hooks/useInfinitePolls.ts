import { useState, useEffect, useCallback, useRef } from 'react';
import { pollsApi, type Poll, type PaginationMeta } from '../api/client';

interface UseInfinitePollsOptions {
  limit?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'ENDED';
  enabled?: boolean;
}

export function useInfinitePolls(options: UseInfinitePollsOptions = {}) {
  const { limit = 10, status, enabled = true } = options;

  const [polls, setPolls] = useState<Poll[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Ref to track if we're already fetching
  const isFetchingRef = useRef(false);

  /**
   * Fetch polls for a specific page
   */
  const fetchPolls = useCallback(async (page: number, append = false) => {
    if (isFetchingRef.current || !enabled) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await pollsApi.getAll({
        page,
        limit,
        status,
      });

      if (append) {
        // Append to existing polls (infinite scroll)
        setPolls((prev) => [...prev, ...response.polls]);
      } else {
        // Replace polls (initial load or refresh)
        setPolls(response.polls);
      }

      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch polls';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      isFetchingRef.current = false;
    }
  }, [limit, status, enabled]);

  /**
   * Load initial polls
   */
  useEffect(() => {
    if (enabled) {
      fetchPolls(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, limit, status]); // Re-fetch when filters change (fetchPolls excluded to prevent loop)

  /**
   * Load more polls (for infinite scrolling)
   */
  const loadMore = useCallback(() => {
    if (!pagination?.hasMore || loading || isFetchingRef.current) {
      return;
    }

    const nextPage = currentPage + 1;
    fetchPolls(nextPage, true);
  }, [pagination, loading, currentPage, fetchPolls]);

  /**
   * Refresh polls (reset to page 1)
   */
  const refresh = useCallback(() => {
    setPolls([]);
    setPagination(null);
    setCurrentPage(1);
    fetchPolls(1, false);
  }, [fetchPolls]);

  /**
   * Check if element is in viewport (for auto-loading)
   */
  const observerRef = useCallback((node: HTMLElement | null) => {
    if (!node || !pagination?.hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [pagination, loading, loadMore]);

  return {
    polls,
    pagination,
    loading,
    initialLoading,
    error,
    hasMore: pagination?.hasMore ?? false,
    loadMore,
    refresh,
    observerRef,
  };
}

