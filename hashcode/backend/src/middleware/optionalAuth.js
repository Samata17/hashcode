import { User } from '../models/User.js';
import { verifyToken } from '../utils/token.js';

// Like "protect", but never blocks the request.
// If a valid token is sent, req.user is set; otherwise the visitor is treated as a guest.
// Used on public pages that show extra things to the owner (e.g. viewing your own draft).
export async function optionalAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const { id } = verifyToken(token);
      req.user = (await User.findById(id)) || undefined;
    } catch {
      // invalid/expired token: continue as a guest
    }
  }
  next();
}
