import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="DevBlog home">
      <span className="logo-mark" aria-hidden="true">
        &lt;/&gt;
      </span>
      <span className="logo-text">
        Dev<span>Blog</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu
  const [userMenuOpen, setUserMenuOpen] = useState(false); // avatar dropdown
  const userMenuRef = useRef(null);

  // Keep the search box in sync with the URL, and close menus when the page changes.
  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  // Close the avatar dropdown when clicking anywhere else.
  useEffect(() => {
    function onClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?search=${encodeURIComponent(q)}` : '/');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Logo />

        <form className="search" role="search" onSubmit={handleSearch}>
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search articles…"
            aria-label="Search articles by title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <button
          type="button"
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>
          <NavLink to="/tags" className="nav-link">
            Tags
          </NavLink>

          {loading ? null : user ? (
            <>
              <NavLink to="/dashboard" className="nav-link">
                Dashboard
              </NavLink>
              <Link to="/write" className="btn btn-primary btn-sm">
                ✎ Write
              </Link>
              <div className="user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-menu-button"
                  aria-label="Account menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((o) => !o)}
                >
                  <Avatar user={user} size={34} />
                </button>
                {/* Desktop: shown when the avatar is clicked. Mobile: always shown inside the menu (see CSS). */}
                <div className={`dropdown ${userMenuOpen ? 'open' : ''}`}>
                  <div className="dropdown-header">
                    <strong>{user.name}</strong>
                    <span>@{user.username}</span>
                  </div>
                  <Link to={`/u/${user.username}`}>My profile</Link>
                  <Link to="/settings">Edit profile</Link>
                  <button type="button" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
