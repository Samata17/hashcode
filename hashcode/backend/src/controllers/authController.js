import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/token.js';
import { uniqueSlug } from '../utils/slugify.js';

// The shape of the response after register/login: the token plus safe user info.
function authResponse(user) {
  return { token: generateToken(user._id), user: user.toJSON() };
}

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body;

  if (await User.exists({ email: email.toLowerCase() })) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // Build a unique public username from the name: "Jane Doe" -> "jane-doe" (or "jane-doe-2")
  const username = await uniqueSlug(User, 'username', name);
  const user = await User.create({ name, email, password, username });

  res.status(201).json(authResponse(user));
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  // We need the password hash here, so we explicitly select it.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Same message for "no user" and "wrong password" so attackers can't guess which emails exist.
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  res.json(authResponse(user));
}

// GET /api/auth/me  (protected) - used by the frontend to restore the session after a refresh
export async function getMe(req, res) {
  res.json({ user: req.user });
}
