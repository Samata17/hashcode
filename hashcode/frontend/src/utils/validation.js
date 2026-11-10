// Checks done in the browser for instant feedback.
// The backend repeats every check, so these can't be bypassed to save bad data.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

export const isEmail = (v) => EMAIL_RE.test(String(v).trim());
export const isUrl = (v) => URL_RE.test(String(v).trim());

export function validateLogin({ email, password }) {
  const errors = {};
  if (!isEmail(email)) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Please enter your password.';
  return errors;
}

export function validateRegister({ name, email, password, confirm }) {
  const errors = {};
  const n = name.trim();
  if (n.length < 2 || n.length > 50) errors.name = 'Name must be 2 to 50 characters.';
  if (!isEmail(email)) errors.email = 'Please enter a valid email address.';
  if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (confirm !== password) errors.confirm = 'Passwords do not match.';
  return errors;
}

export function validatePost({ title, content, coverImage, excerpt, tags }) {
  const errors = {};
  const t = title.trim();
  if (t.length < 3 || t.length > 150) errors.title = 'Title must be 3 to 150 characters.';
  if (!content.trim()) errors.content = 'Content cannot be empty.';
  if (coverImage.trim() && !isUrl(coverImage)) errors.coverImage = 'Cover image must be a full URL starting with http:// or https://';
  if (excerpt.length > 300) errors.excerpt = 'Excerpt must be at most 300 characters.';
  if (tags.length > 5) errors.tags = 'You can add up to 5 tags.';
  return errors;
}

export function validateProfile({ name, bio, avatar }) {
  const errors = {};
  const n = name.trim();
  if (n.length < 2 || n.length > 50) errors.name = 'Name must be 2 to 50 characters.';
  if (bio.length > 300) errors.bio = 'Bio must be at most 300 characters.';
  if (avatar.trim() && !isUrl(avatar)) errors.avatar = 'Avatar must be a full URL starting with http:// or https://';
  return errors;
}
