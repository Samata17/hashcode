import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from './StatusViews.jsx';

// Wrap a page with this to require login. Guests are sent to /login,
// and after logging in they come back to the page they wanted.
// (The backend ALSO checks the token - this is just for a nicer experience.)
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
