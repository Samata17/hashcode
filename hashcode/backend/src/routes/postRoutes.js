import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getFeed,
  getMyPosts,
  getPostForEdit,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Rules shared by create and update. "required" decides if title/content must be present.
function postRules(required) {
  const field = (name) => (required ? body(name) : body(name).optional());
  return [
    field('title').isString().trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3 to 150 characters.'),
    field('content').isString().trim().notEmpty().withMessage('Content cannot be empty.'),
    body('excerpt').optional().isString().isLength({ max: 300 }).withMessage('Excerpt must be at most 300 characters.'),
    body('coverImage')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Cover image must be a full URL starting with http:// or https://'),
    body('tags').optional().isArray({ max: 5 }).withMessage('You can add up to 5 tags.'),
    body('tags.*').isString().trim().isLength({ min: 1, max: 30 }).withMessage('Each tag must be 1 to 30 characters.'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be "draft" or "published".'),
  ];
}

const idRule = param('id').isMongoId().withMessage('Invalid post id.');

// Order matters: specific paths like "/mine" must come before "/:slug".
router.get('/', getFeed);
router.get('/mine', protect, getMyPosts);
router.get('/edit/:id', protect, idRule, validate, getPostForEdit);
router.get('/:slug', optionalAuth, getPostBySlug);
router.post('/', protect, postRules(true), validate, createPost);
router.put('/:id', protect, idRule, postRules(false), validate, updatePost);
router.delete('/:id', protect, idRule, validate, deletePost);

export default router;
