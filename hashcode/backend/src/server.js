import 'dotenv/config'; // loads variables from backend/.env into process.env
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const secret = process.env.JWT_SECRET || '';
if (!secret) {
  console.error('JWT_SECRET is missing. Add it to backend/.env (see .env.example).');
  process.exit(1);
}
// A short or example secret would let attackers forge login tokens.
if (process.env.NODE_ENV === 'production' && (secret.length < 32 || secret.includes('replace-me'))) {
  console.error('JWT_SECRET is too weak for production. Use a long random string (48+ characters).');
  process.exit(1);
}

try {
  await connectDB();
  createApp().listen(PORT, () => {
    console.log(`DevBlog API running at http://localhost:${PORT}`);
  });
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
