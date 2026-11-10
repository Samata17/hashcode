import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import PostGrid from '../components/PostGrid.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/StatusViews.jsx';
import { formatDate } from '../utils/format.js';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [data, setData] = useState(null); // { user, posts }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    setNotFound(false);
    api
      .get(`/users/${username}`)
      .then((res) => {
        if (ignore) return;
        setData(res.data);
        document.title = `${res.data.user.name} | DevBlog`;
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
  }, [username, reload]);

  if (loading) return <Loader label="Loading profile…" />;
  if (notFound) {
    return (
      <div className="container narrow">
        <EmptyState icon="👤" title="User not found" text="This profile doesn't exist." actionLabel="Back to home" actionTo="/" />
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

  const { user, posts } = data;
  const isMe = me && me.username === user.username;

  return (
    <div className="container">
      <section className="profile-header">
        <Avatar user={user} size={112} />
        <div className="profile-info">
          <h1>{user.name}</h1>
          <span className="meta">@{user.username}</span>
          <p className="profile-bio">{user.bio || (isMe ? 'You have not written a bio yet.' : 'This author has not written a bio yet.')}</p>
          <div className="profile-stats">
            <span>
              <strong>{posts.length}</strong> {posts.length === 1 ? 'article' : 'articles'}
            </span>
            <span>Joined {formatDate(user.createdAt)}</span>
          </div>
        </div>
        {isMe && (
          <Link to="/settings" className="btn btn-outline">
            Edit profile
          </Link>
        )}
      </section>

      <h2 className="section-title">Published articles</h2>
      {posts.length === 0 ? (
        <EmptyState
          icon="✍️"
          title="No published articles yet"
          text={isMe ? 'Your published articles will appear here.' : undefined}
          actionLabel={isMe ? 'Write your first article' : undefined}
          actionTo={isMe ? '/write' : undefined}
        />
      ) : (
        <PostGrid posts={posts} loading={false} />
      )}
    </div>
  );
}
