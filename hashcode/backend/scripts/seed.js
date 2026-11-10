// Adds SAMPLE data to the database in MONGO_URI.
// Run with: npm run seed
// Only sample accounts (emails ending in @devblog.sample) are replaced. Your real data is safe.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { seedSampleData, SAMPLE_PASSWORD } from '../src/seed/sampleData.js';

try {
  await connectDB();
  const result = await seedSampleData();
  console.log(`Sample data added: ${result.users} users, ${result.posts} posts.`);
  console.log(`Sample login: priya@devblog.sample / ${SAMPLE_PASSWORD}`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
