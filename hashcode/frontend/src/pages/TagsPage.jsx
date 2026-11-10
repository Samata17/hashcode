import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import { EmptyState, ErrorMessage, Loader } from '../components/StatusViews.jsx';
import { colorFor } from '../utils/format.js';

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    api
      .get('/tags')
      .then((res) => setTags(res.data.tags))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    document.title = 'Tags | DevBlog';
    load();
  }, []);

  const shown = tags.filter((t) => `${t.name} ${t.slug}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Explore tags</h1>
          <p className="meta">Find articles about the technologies you care about.</p>
        </div>
        <input
          type="search"
          className="input tag-search"
          placeholder="Filter tags…"
          aria-label="Filter tags"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading && <Loader label="Loading tags…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && shown.length === 0 && (
        <EmptyState
          icon="#"
          title={tags.length ? 'No matching tags' : 'No tags yet'}
          text={tags.length ? 'Try a different word.' : 'Tags appear here once articles are published.'}
        />
      )}

      <div className="tag-grid">
        {shown.map((t) => (
          <Link key={t.slug} to={`/tags/${t.slug}`} className="tag-card" style={{ '--tag-color': colorFor(t.slug) }}>
            <h3>#{t.slug}</h3>
            {t.description && <p>{t.description}</p>}
            <span className="meta">
              {t.count} {t.count === 1 ? 'article' : 'articles'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
