import PostCard from './PostCard.jsx';
import { PostCardSkeleton } from './StatusViews.jsx';

// A responsive grid of post cards, plus skeletons while loading and a "Load more" button.
export default function PostGrid({ posts, loading, hasMore, loadingMore, onLoadMore }) {
  if (loading) {
    return (
      <div className="post-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="post-grid">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
      {hasMore && (
        <div className="load-more">
          <button type="button" className="btn btn-outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more articles'}
          </button>
        </div>
      )}
    </>
  );
}
