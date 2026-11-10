import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { formatDate } from '../utils/format.js';

// "(avatar) Jane Doe · Oct 27, 2026 · 4 min read"
export default function AuthorLine({ author, date, readingTime, size = 36 }) {
  if (!author) return null;
  return (
    <div className="author-line">
      <Link to={`/u/${author.username}`} aria-label={`${author.name}'s profile`}>
        <Avatar user={author} size={size} />
      </Link>
      <div className="author-line-text">
        <Link to={`/u/${author.username}`} className="author-name">
          {author.name}
        </Link>
        <span className="meta">
          {formatDate(date)}
          {readingTime ? ` · ${readingTime} min read` : ''}
        </span>
      </div>
    </div>
  );
}
