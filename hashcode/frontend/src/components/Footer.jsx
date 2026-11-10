import { Link } from 'react-router-dom';
import { Logo } from './Navbar.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo />
          <p>A home for developers to write, learn, and share knowledge with the community.</p>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Latest articles</Link>
          <Link to="/tags">Browse tags</Link>
        </div>
        <div className="footer-col">
          <h4>Write</h4>
          <Link to="/write">Start writing</Link>
          <Link to="/dashboard">Your dashboard</Link>
        </div>
        <div className="footer-col">
          <h4>Popular</h4>
          <Link to="/tags/react">#react</Link>
          <Link to="/tags/javascript">#javascript</Link>
          <Link to="/tags/nodejs">#nodejs</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} DevBlog. Built with React, Node.js & MongoDB.</span>
      </div>
    </footer>
  );
}
