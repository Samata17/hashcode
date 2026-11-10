import { Router } from 'express';
import { body } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2 to 50 characters.'),
  body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
  body('password')
    .isString()
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be at least 6 characters.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
  body('password').isString().notEmpty().withMessage('Please enter your password.'),
];

// Slows down password-guessing: at most 30 login/register attempts per 15 minutes per IP address.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);

export default router;
