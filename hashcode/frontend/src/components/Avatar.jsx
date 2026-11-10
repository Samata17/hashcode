import { useState } from 'react';
import { colorFor, initials } from '../utils/format.js';

// Shows the user's photo, or their initials in a colored circle if there's no photo
// (or the photo fails to load).
export default function Avatar({ user, size = 36 }) {
  const [broken, setBroken] = useState(false);
  const name = user?.name || '?';
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (user?.avatar && !broken) {
    return (
      <img className="avatar" src={user.avatar} alt={name} style={style} onError={() => setBroken(true)} />
    );
  }
  return (
    <span className="avatar avatar-fallback" style={{ ...style, background: colorFor(name) }} aria-label={name}>
      {initials(name)}
    </span>
  );
}
