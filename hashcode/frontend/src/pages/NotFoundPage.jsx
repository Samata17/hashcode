import { useEffect } from 'react';
import { EmptyState } from '../components/StatusViews.jsx';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found | DevBlog';
  }, []);
  return (
    <div className="container narrow">
      <EmptyState icon="🧭" title="404 - Page not found" text="The page you're looking for doesn't exist." actionLabel="Go home" actionTo="/" />
    </div>
  );
}
