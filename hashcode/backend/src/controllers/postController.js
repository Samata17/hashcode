import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';
import { syncTags } from '../utils/tags.js';
import { makeExcerpt, escapeRegex } from '../utils/text.js';

// Which author fields to include with each post (never email or password).
const AUTHOR_FIELDS = 'name username avatar bio';

// Reads page/limit from the URL safely, e.g. ?page=2&limit=10
function getPaging(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

// Loads a post by id and makes sure the logged-in user is its author.
// This check runs on the server, so editing someone else's post is impossible
// even if a user changes the request by hand.
async function findOwnPost(id, user) {
  const post = await Post.findById(id);
  if (!post) throw new ApiError(404, 'Post not found.');
  if (!post.author.equals(user._id)) {
    throw new ApiError(403, 'You can only change your own posts.');
  }
  return post;
}

// GET /api/posts  - public feed. Only PUBLISHED posts, ever.
// Optional filters: ?search=react&tag=javascript&author=jane-doe&page=1&limit=10
export async function getFeed(req, res) {
  const { page, limit, skip } = getPaging(req.query);
  const filter = { status: 'published' };

  if (req.query.search) {
    filter.title = { $regex: escapeRegex(String(req.query.search).trim()), $options: 'i' };
  }
  if (req.query.tag) {
    filter.tags = String(req.query.tag).toLowerCase();
  }
  if (req.query.author) {
    const author = await User.findOne({ username: String(req.query.author).toLowerCase() });
    if (!author) return res.json({ posts: [], page, totalPages: 0, total: 0 });
    filter.author = author._id;
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select('-content') // the feed doesn't need full article text
      .populate('author', AUTHOR_FIELDS)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(filter),
  ]);

  res.json({ posts, page, totalPages: Math.ceil(total / limit), total });
}

// GET /api/posts/mine  (protected) - all of my posts, drafts included, for the dashboard
export async function getMyPosts(req, res) {
  const posts = await Post.find({ author: req.user._id }).select('-content').sort({ updatedAt: -1 });
  res.json({ posts });
}

// GET /api/posts/edit/:id  (protected, owner only) - full post for the edit form
export async function getPostForEdit(req, res) {
  const post = await findOwnPost(req.params.id, req.user);
  res.json({ post });
}

// GET /api/posts/:slug - one article. Drafts are visible only to their author.
export async function getPostBySlug(req, res) {
  const post = await Post.findOne({ slug: req.params.slug.toLowerCase() }).populate('author', AUTHOR_FIELDS);
  const isOwner = post && req.user && post.author._id.equals(req.user._id);
  if (!post || (post.status !== 'published' && !isOwner)) {
    throw new ApiError(404, 'Post not found.');
  }
  res.json({ post });
}

// POST /api/posts  (protected)
export async function createPost(req, res) {
  const { title, content, excerpt, coverImage, tags, status = 'draft' } = req.body;

  const post = await Post.create({
    title,
    content,
    excerpt: excerpt?.trim() || makeExcerpt(content),
    coverImage: coverImage || '',
    tags: await syncTags(tags),
    status,
    publishedAt: status === 'published' ? new Date() : undefined,
    slug: await uniqueSlug(Post, 'slug', title),
    author: req.user._id, // always the logged-in user; never taken from the request body
  });

  res.status(201).json({ post, message: status === 'published' ? 'Post published!' : 'Draft saved.' });
}

// PUT /api/posts/:id  (protected, owner only)
export async function updatePost(req, res) {
  const post = await findOwnPost(req.params.id, req.user);
  const { title, content, excerpt, coverImage, tags, status } = req.body;

  if (title !== undefined && title !== post.title) {
    post.title = title;
    // Keep the URL stable once a post has been published, so shared links keep working.
    if (!post.publishedAt) post.slug = await uniqueSlug(Post, 'slug', title, post._id);
  }
  if (content !== undefined) post.content = content;
  if (excerpt !== undefined || content !== undefined) {
    post.excerpt = excerpt?.trim() || makeExcerpt(post.content);
  }
  if (coverImage !== undefined) post.coverImage = coverImage;
  if (tags !== undefined) post.tags = await syncTags(tags);
  if (status !== undefined) {
    post.status = status;
    if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
  }

  await post.save();
  res.json({ post, message: 'Post updated.' });
}

// DELETE /api/posts/:id  (protected, owner only)
export async function deletePost(req, res) {
  const post = await findOwnPost(req.params.id, req.user);
  await post.deleteOne();
  res.json({ message: 'Post deleted.' });
}
