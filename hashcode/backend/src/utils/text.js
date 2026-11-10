// Makes a short plain-text summary from Markdown content (used when no excerpt is given).
export function makeExcerpt(markdown, length = 160) {
  const plain = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/[#>*_~\-|]+/g, ' ') // markdown symbols
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length).trimEnd()}…` : plain;
}

// Escapes characters that have special meaning in regular expressions,
// so a search like "c++" doesn't break the query.
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
