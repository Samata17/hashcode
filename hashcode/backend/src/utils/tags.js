import { Tag } from '../models/Tag.js';
import { slugify } from './slugify.js';

// Takes tag names typed by the user (e.g. ["React", "Node.js", "react"]),
// makes sure each one exists in the Tag collection, and returns unique slugs
// (e.g. ["react", "nodejs"]) to store on the post.
export async function syncTags(names = []) {
  const slugs = [];
  for (const raw of names) {
    const name = String(raw).trim();
    const slug = slugify(name);
    if (!slug || slugs.includes(slug)) continue;
    slugs.push(slug);
    // "upsert" = create the tag only if it doesn't exist yet
    // eslint-disable-next-line no-await-in-loop
    await Tag.updateOne({ slug }, { $setOnInsert: { name, slug } }, { upsert: true });
  }
  return slugs;
}
