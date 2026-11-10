import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Loader } from './components/StatusViews.jsx';
import HomePage from './pages/HomePage.jsx';
import TagsPage from './pages/TagsPage.jsx';
import TagPage from './pages/TagPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// The article page and the editor include the Markdown + code highlighting libraries,
// which are large. "lazy" downloads that code only when one of these pages is opened.
const PostPage = lazy(() => import('./pages/PostPage.jsx'));
const EditorPage = lazy(() => import('./pages/EditorPage.jsx'));

// Every page of the site and its URL.
export default function App() {
  return (
    <div className="app">
      <Navbar />
      <div className="page">
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:slug" element={<PostPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/tags/:slug" element={<TagPage />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Private pages - must be logged in */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/write" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
