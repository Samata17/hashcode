import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { usePostFeed } from '../hooks/usePostFeed.js';
import PostGrid from '../components/PostGrid.jsx';
import { EmptyState, ErrorMessage } from '../components/StatusViews.jsx';
import { colorFor } from '../utils/format.js';

export default function TagPage() {
  const { slug } = useParams();
  const [tag, setTag] = useState(null);
  const feed = usePostFeed({ tag: slug });

  useEffect(() => {
    document.title = `#${slug} | DevBlog`;
    setTag(null);
    api
      .get(`/tags/${slug}`)
      .then((res) => setTag(res.data.tag))
      .catch(() => setTag(null)); // header falls back to just the slug
  }, [slug]);

  return (
    <div className="container">
      <div className="tag-hero" style={{ '--tag-color': colorFor(slug) }}>
        <h1>#{tag?.name || slug}</h1>
        {tag?.description && <p>{tag.description}</p>}
        {!feed.loading && (
          <span className="meta">
            {feed.total} published {feed.total === 1 ? 'article' : 'articles'}
          </span>
        )}
      </div>

      {feed.error && <ErrorMessage message={feed.error} onRetry={feed.retry} />}
      {!feed.error && !feed.loading && feed.posts.length === 0 && (
        <EmptyState icon="#" title="No articles with this tag yet" text="Why not write the first one?" actionLabel="Write an article" actionTo="/write" />
      )}
      {!feed.error && (
        <PostGrid
          posts={feed.posts}
          loading={feed.loading}
          hasMore={feed.hasMore}
          loadingMore={feed.loadingMore}
          onLoadMore={feed.loadMore}
        />
      )}
      <p className="back-link">
        <Link to="/tags">← All tags</Link>
      </p>
    </div>
  );
}
