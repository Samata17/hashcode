import jwt from 'jsonwebtoken';

// Creates a signed JWT that contains the user's id.
// The secret lives only on the server (in .env), so nobody can fake a token.
export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
