import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePostFeed } from '../hooks/usePostFeed.js';
import PostCard from '../components/PostCard.jsx';
import PostGrid from '../components/PostGrid.jsx';
import Avatar from '../components/Avatar.jsx';
import { EmptyState, ErrorMessage, PostCardSkeleton } from '../components/StatusViews.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const tag = params.get('tag') || '';
  const isFiltered = Boolean(search || tag);

  const feed = usePostFeed({ search, tag });
  const [tags, setTags] = useState([]);

  useEffect(() => {
    document.title = 'DevBlog - Where developers share what they learn';
    api
      .get('/tags')
      .then((res) => setTags(res.data.tags))
      .catch(() => setTags([])); // the sidebar is optional; the feed shows any errors
  }, []);

  // Newest post becomes the "featured" one on the unfiltered homepage.
  const featured = !isFiltered ? feed.posts[0] : null;
  const rest = featured ? feed.posts.slice(1) : feed.posts;

  // Unique authors from the loaded posts, for the "Authors" sidebar box.
  const authors = useMemo(() => {
    const seen = new Map();
    feed.posts.forEach((p) => p.author && seen.set(p.author._id, p.author));
    return [...seen.values()].slice(0, 5);
  }, [feed.posts]);

  function selectTag(slug) {
    setParams(slug ? { tag: slug } : {});
  }

  return (
    <div className="container">
      {!user && !isFiltered && (
        <section className="hero">
          <div>
            <span className="hero-eyebrow">The developer community blog</span>
            <h1>
              Write. Learn. <span className="gradient-text">Share what you know.</span>
            </h1>
            <p>Read tutorials and stories from developers, or start your own blog in seconds. It's free.</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start writing
              </Link>
              <Link to="/tags" className="btn btn-outline btn-lg">
                Explore topics
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <pre>
              <span className="tk-k">const</span> dev = {'{'}
              {'\n'}  learn: <span className="tk-s">'every day'</span>,{'\n'}  share: <span className="tk-k">true</span>,
              {'\n'}  community: <span className="tk-s">'DevBlog'</span>
              {'\n'}
              {'}'};
            </pre>
          </div>
        </section>
      )}

      <div className="tag-filter" aria-label="Filter by tag">
        <button type="button" className={`filter-chip ${!tag ? 'active' : ''}`} onClick={() => selectTag('')}>
          All
        </button>
        {tags.slice(0, 10).map((t) => (
          <button
            type="button"
            key={t.slug}
            className={`filter-chip ${tag === t.slug ? 'active' : ''}`}
            onClick={() => selectTag(t.slug)}
          >
            #{t.slug}
          </button>
        ))}
      </div>

      <div className="home-layout">
        <main>
          {isFiltered && (
            <div className="feed-heading">
              <h1>{search ? `Results for “${search}”` : `#${tag}`}</h1>
              {!feed.loading && (
                <span className="meta">
                  {feed.total} {feed.total === 1 ? 'article' : 'articles'}
                </span>
              )}
              <Link to="/" className="btn btn-ghost btn-sm">
                Clear filter
              </Link>
            </div>
          )}

          {feed.error && <ErrorMessage message={feed.error} onRetry={feed.retry} />}

          {!feed.error && feed.loading && !isFiltered && (
            <div className="featured-wrap">
              <PostCardSkeleton />
            </div>
          )}

          {!feed.error && !feed.loading && feed.posts.length === 0 && (
            <EmptyState
              icon={isFiltered ? '🔍' : '✍️'}
              title={isFiltered ? 'No articles found' : 'No articles yet'}
              text={isFiltered ? 'Try a different search or tag.' : 'Be the first to publish something!'}
              actionLabel={isFiltered ? 'See all articles' : 'Write an article'}
              actionTo={isFiltered ? '/' : '/write'}
            />
          )}

          {!feed.error && featured && (
            <div className="featured-wrap">
              <PostCard post={featured} featured />
            </div>
          )}

          {!feed.error && (feed.loading || rest.length > 0) && (
            <>
              {!isFiltered && <h2 className="section-title">Latest articles</h2>}
              <PostGrid
                posts={rest}
                loading={feed.loading}
                hasMore={feed.hasMore}
                loadingMore={feed.loadingMore}
                onLoadMore={feed.loadMore}
              />
            </>
          )}
        </main>

        <aside className="sidebar">
          <div className="side-card cta-card">
            <h3>{user ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Join DevBlog'}</h3>
            <p>{user ? 'Got something you learned recently? Share it with the community.' : 'Create a free account to write articles and build your developer profile.'}</p>
            <Link to={user ? '/write' : '/register'} className="btn btn-primary btn-block">
              {user ? 'Write an article' : 'Create account'}
            </Link>
          </div>

          {tags.length > 0 && (
            <div className="side-card">
              <h3>Trending tags</h3>
              <ul className="side-tags">
                {tags.slice(0, 8).map((t) => (
                  <li key={t.slug}>
                    <Link to={`/tags/${t.slug}`}>#{t.slug}</Link>
                    <span className="count">{t.count}</span>
                  </li>
                ))}
              </ul>
              <Link to="/tags" className="side-more">
                See all tags →
              </Link>
            </div>
          )}

          {authors.length > 0 && (
            <div className="side-card">
              <h3>Authors</h3>
              <ul className="side-authors">
                {authors.map((a) => (
                  <li key={a._id}>
                    <Link to={`/u/${a.username}`}>
                      <Avatar user={a} size={36} />
                      <span>
                        <strong>{a.name}</strong>
                        <small>@{a.username}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
