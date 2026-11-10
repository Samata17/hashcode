import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/users/:username - public profile with the author's PUBLISHED posts only.
// The email is never included in public data.
export async function getProfile(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).select(
    'name username bio avatar createdAt'
  );
  if (!user) throw new ApiError(404, 'User not found.');

  const posts = await Post.find({ author: user._id, status: 'published' })
    .select('-content')
    .populate('author', 'name username avatar')
    .sort({ publishedAt: -1 });

  res.json({ user, posts });
}

// PUT /api/users/me  (protected) - update my own name, bio, and avatar.
// Only these fields can be changed; email/password/username in the body are ignored.
export async function updateMe(req, res) {
  const { name, bio, avatar } = req.body;
  if (name !== undefined) req.user.name = name;
  if (bio !== undefined) req.user.bio = bio;
  if (avatar !== undefined) req.user.avatar = avatar;
  await req.user.save();
  res.json({ user: req.user, message: 'Profile updated.' });
}
