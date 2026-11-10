import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '../api/client.js';

const PAGE_SIZE = 9;

// Loads published posts from GET /api/posts with optional filters,
// and supports a "Load more" button. Used by the home page and tag pages.
export function usePostFeed({ search = '', tag = '', author = '' } = {}) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0); // ignore answers from old, outdated requests

  const fetchPage = useCallback(
    async (pageNumber) => {
      const id = ++requestId.current;
      const res = await api.get('/posts', {
        params: { search: search || undefined, tag: tag || undefined, author: author || undefined, page: pageNumber, limit: PAGE_SIZE },
      });
      return id === requestId.current ? res.data : null;
    },
    [search, tag, author]
  );

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPage(1);
      if (!data) return;
      setPosts(data.posts);
      setPage(1);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  // Reload whenever the filters change
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await fetchPage(page + 1);
      if (!data) return;
      setPosts((prev) => [...prev, ...data.posts]);
      setPage(page + 1);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }

  return { posts, total, loading, loadingMore, error, hasMore: page < totalPages, loadMore, retry: loadFirstPage };
}
