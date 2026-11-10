import { useState } from 'react';
import { colorFor } from '../utils/format.js';

// Shows a post's cover image. If there is none (or it fails to load),
// shows a colorful gradient with the post title instead, so cards never look broken.
// "eager" loads the image right away (use for images at the top of the page).
export default function CoverImage({ src, title, className = '', eager = false }) {
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      <img className={`cover ${className}`} src={src} alt="" loading={eager ? 'eager' : 'lazy'} onError={() => setBroken(true)} />
    );
  }
  const color = colorFor(title);
  return (
    <div className={`cover cover-fallback ${className}`} style={{ background: `linear-gradient(135deg, ${color}, #1e1b4b)` }}>
      <span>{title}</span>
    </div>
  );
}
