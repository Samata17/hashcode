import { Logo } from './Navbar.jsx';

// The shared two-column frame for the login and register pages.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="container auth-wrap">
      <div className="auth-card">
        <div className="auth-side" aria-hidden="true">
          <Logo />
          <h2>Join a community of developers who learn in public.</h2>
          <ul>
            <li>✓ Write with Markdown and code highlighting</li>
            <li>✓ Save drafts until you're ready</li>
            <li>✓ Build your public developer profile</li>
          </ul>
        </div>
        <div className="auth-main">
          <h1>{title}</h1>
          {subtitle && <p className="meta">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
