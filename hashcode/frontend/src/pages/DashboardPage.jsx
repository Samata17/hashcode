import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/StatusViews.jsx';
import { formatDate } from '../utils/format.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null); // post currently being published/unpublished
  const [toDelete, setToDelete] = useState(null); // post waiting for delete confirmation
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/posts/mine');
      setPosts(res.data.posts);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Dashboard | DevBlog';
    load();
  }, [load]);

  async function toggleStatus(post) {
    const status = post.status === 'published' ? 'draft' : 'published';
    setBusyId(post._id);
    try {
      const res = await api.put(`/posts/${post._id}`, { status });
      setPosts((list) => list.map((p) => (p._id === post._id ? { ...p, ...res.data.post } : p)));
      showToast(status === 'published' ? 'Post published!' : 'Post moved to drafts.');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/posts/${toDelete._id}`);
      setPosts((list) => list.filter((p) => p._id !== toDelete._id));
      showToast('Post deleted.');
      setToDelete(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const counts = {
    all: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
  };
  const shown = filter === 'all' ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="meta">Manage your articles, {user.name.split(' ')[0]}.</p>
        </div>
        <Link to="/write" className="btn btn-primary">
          ✎ New article
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Total articles</span>
          <strong>{counts.all}</strong>
        </div>
        <div className="stat">
          <span>Published</span>
          <strong>{counts.published}</strong>
        </div>
        <div className="stat">
          <span>Drafts</span>
          <strong>{counts.draft}</strong>
        </div>
      </div>

      {loading && <Loader label="Loading your articles…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}

      {!loading && !error && posts.length === 0 && (
        <EmptyState
          icon="✍️"
          title="You haven't written anything yet"
          text="Your published articles and drafts will show up here."
          actionLabel="Write your first article"
          actionTo="/write"
        />
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <div className="tabs" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="count">{counts[f.key]}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={filter === 'draft' ? '🗂️' : '📢'}
              title={filter === 'draft' ? 'No drafts' : 'Nothing published yet'}
              text={filter === 'draft' ? 'Drafts you save will appear here.' : 'Publish a draft to share it with everyone.'}
            />
          ) : (
            <ul className="dash-list">
              {shown.map((post) => (
                <li key={post._id} className="dash-item">
                  <div className="dash-main">
                    <div className="dash-title-row">
                      <span className={`badge badge-${post.status}`}>{post.status === 'published' ? 'Published' : 'Draft'}</span>
                      <Link to={`/post/${post.slug}`} className="dash-title">
                        {post.title}
                      </Link>
                    </div>
                    <span className="meta">
                      {post.status === 'published' ? `Published ${formatDate(post.publishedAt)}` : `Last edited ${formatDate(post.updatedAt)}`}
                      {post.tags.length > 0 && ` · ${post.tags.map((t) => `#${t}`).join(' ')}`}
                    </span>
                  </div>
                  <div className="dash-actions">
                    <Link to={`/post/${post.slug}`} className="btn btn-ghost btn-sm">
                      {post.status === 'published' ? 'View' : 'Preview'}
                    </Link>
                    <Link to={`/edit/${post._id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                    <button type="button" className="btn btn-outline btn-sm" disabled={busyId === post._id} onClick={() => toggleStatus(post)}>
                      {busyId === post._id ? '…' : post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setToDelete(post)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this article?"
        message={toDelete ? `“${toDelete.title}” will be permanently deleted. This cannot be undone.` : ''}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
