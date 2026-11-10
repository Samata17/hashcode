// "2026-10-27T10:00:00Z" -> "Oct 27, 2026"
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// "Jane Doe" -> "JD"
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// Picks a stable color for a piece of text (used for avatar and cover placeholders).
const COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#db2777', '#059669', '#ea580c', '#2563eb'];
export function colorFor(text = '') {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}
