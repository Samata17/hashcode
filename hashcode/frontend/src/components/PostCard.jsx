import { Link } from 'react-router-dom';
import CoverImage from './CoverImage.jsx';
import TagList from './TagList.jsx';
import AuthorLine from './AuthorLine.jsx';

// One article in a list/grid. "featured" makes a large horizontal version for the homepage.
export default function PostCard({ post, featured = false }) {
  const url = `/post/${post.slug}`;
  return (
    <article className={`post-card ${featured ? 'post-card-featured' : ''}`}>
      <Link to={url} className="post-card-cover" tabIndex={-1} aria-hidden="true">
        <CoverImage src={post.coverImage} title={post.title} eager={featured} />
      </Link>
      <div className="post-card-body">
        {featured && <span className="badge">★ Featured</span>}
        <TagList tags={post.tags} />
        <h2 className="post-card-title">
          <Link to={url}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
        <AuthorLine author={post.author} date={post.publishedAt} readingTime={post.readingTime} />
      </div>
    </article>
  );
}
