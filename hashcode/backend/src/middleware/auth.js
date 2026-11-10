import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';

// Protects a route: the request must include "Authorization: Bearer <token>".
// If the token is valid, the logged-in user is attached as req.user.
export async function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Please log in to continue.');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw new ApiError(401, 'This account no longer exists.');
  }

  req.user = user;
  next();
}
