// Turns any text into a URL-friendly "slug".
// Example: "Hello World! React & Node" -> "hello-world-react-node"
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove symbols
    .replace(/[\s_-]+/g, '-') // spaces/underscores -> single dash
    .replace(/^-+|-+$/g, ''); // trim dashes at the ends
}

// Returns a slug that is not used yet in the given Mongoose model/field.
// If "my-post" exists, it tries "my-post-2", "my-post-3", ...
export async function uniqueSlug(Model, field, text, excludeId) {
  const base = slugify(text) || 'item';
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ [field]: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}
