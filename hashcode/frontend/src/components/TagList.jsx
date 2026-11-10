import { Link } from 'react-router-dom';

// A row of clickable tag chips: #react #javascript
export default function TagList({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <Link key={tag} to={`/tags/${tag}`} className="tag-chip">
          #{tag}
        </Link>
      ))}
    </div>
  );
}
