import { Post } from '../models/Post.js';
import { Tag } from '../models/Tag.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/tags - every tag used by at least one PUBLISHED post, with its post count.
// Drafts are not counted, so private drafts don't leak through the tag list.
export async function getTags(_req, res) {
  const tags = await Post.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' }, // one row per (post, tag)
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $lookup: { from: 'tags', localField: '_id', foreignField: 'slug', as: 'tag' } },
    { $unwind: { path: '$tag', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        slug: '$_id',
        name: { $ifNull: ['$tag.name', '$_id'] },
        description: { $ifNull: ['$tag.description', ''] },
        count: 1,
      },
    },
    { $sort: { count: -1, slug: 1 } },
  ]);
  res.json({ tags });
}

// GET /api/tags/:slug - details for one tag
export async function getTag(req, res) {
  const slug = req.params.slug.toLowerCase();
  const tag = await Tag.findOne({ slug });
  if (!tag) throw new ApiError(404, 'Tag not found.');
  const count = await Post.countDocuments({ status: 'published', tags: slug });
  res.json({ tag: { name: tag.name, slug: tag.slug, description: tag.description, count } });
}
