import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Where "npm run build" puts the finished React website (frontend/dist)
const FRONTEND_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');

// Builds the Express app. It's separate from server.js so tests can use it
// without starting a real server or connecting to the real database.
export function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  // Hosting services (Render, Railway…) sit in front of the app as a proxy.
  // This lets Express see the visitor's real IP address (needed for rate limiting).
  if (isProduction) app.set('trust proxy', 1);
  app.disable('x-powered-by'); // don't advertise that we use Express

  // Allow the React app (a different port/domain during development) to call this API.
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' })); // read JSON request bodies

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/users', userRoutes);

  // In production, this same server also sends the React website,
  // so the whole app runs as ONE service on ONE address.
  if (isProduction && fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST, { index: false, maxAge: '7d' }));
    // Any other GET page (e.g. /post/my-article) returns index.html and React Router shows the right page.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
