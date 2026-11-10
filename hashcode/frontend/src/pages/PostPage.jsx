import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import CoverImage from '../components/CoverImage.jsx';
import TagList from '../components/TagList.jsx';
import AuthorLine from '../components/AuthorLine.jsx';
import Avatar from '../components/Avatar.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/StatusViews.jsx';
import { formatDate } from '../utils/format.js';

export default function PostPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let ignore = false; // if the user navigates away before the answer arrives
    setLoading(true);
    setError('');
    setNotFound(false);
    api
      .get(`/posts/${slug}`)
      .then((res) => {
        if (ignore) return;
        setPost(res.data.post);
        document.title = `${res.data.post.title} | DevBlog`;
        window.scrollTo(0, 0);
      })
      .catch((err) => {
        if (ignore) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError(getErrorMessage(err));
      })
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [slug, reload]);

  if (loading) return <Loader label="Loading article…" />;
  if (notFound) {
    return (
      <div className="container narrow">
        <EmptyState icon="🔎" title="Article not found" text="It may have been removed or is not published yet." actionLabel="Back to home" actionTo="/" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container narrow">
        <ErrorMessage message={error} onRetry={() => setReload((n) => n + 1)} />
      </div>
    );
  }

  const isOwner = user && post.author?._id === user._id;
  const edited = post.publishedAt && new Date(post.updatedAt) - new Date(post.publishedAt) > 60_000;

  return (
    <article className="article">
      <div className="container narrow">
        {post.status === 'draft' && (
          <div className="alert alert-warning">This is a draft. Only you can see it.</div>
        )}

        {post.coverImage && <CoverImage src={post.coverImage} title={post.title} className="article-cover" eager />}

        <header className="article-header">
          <TagList tags={post.tags} />
          <h1>{post.title}</h1>
          <div className="article-meta">
            <AuthorLine author={post.author} date={post.publishedAt || post.createdAt} readingTime={post.readingTime} size={44} />
            {isOwner && (
              <Link to={`/edit/${post._id}`} className="btn btn-outline btn-sm">
                ✎ Edit post
              </Link>
            )}
          </div>
          {edited && <p className="meta">Updated {formatDate(post.updatedAt)}</p>}
        </header>

        <MarkdownRenderer content={post.content} />

        <footer className="author-card">
          <Link to={`/u/${post.author.username}`}>
            <Avatar user={post.author} size={64} />
          </Link>
          <div>
            <span className="meta">Written by</span>
            <h3>
              <Link to={`/u/${post.author.username}`}>{post.author.name}</Link>
            </h3>
            {post.author.bio && <p>{post.author.bio}</p>}
            <Link to={`/u/${post.author.username}`} className="side-more">
              More from {post.author.name.split(' ')[0]} →
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
