import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateMe } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const profileRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2 to 50 characters.'),
  body('bio').optional().isString().trim().isLength({ max: 300 }).withMessage('Bio must be at most 300 characters.'),
  body('avatar')
    .optional({ values: 'falsy' })
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Avatar must be a full URL starting with http:// or https://'),
];

// "/me" must come before "/:username"
router.put('/me', protect, profileRules, validate, updateMe);
router.get('/:username', getProfile);

export default router;
