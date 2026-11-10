// "Try it without MongoDB" mode.
// Starts a TEMPORARY in-memory MongoDB, fills it with sample data, and runs the API.
// Everything is DELETED when you stop this process. Use "npm run dev" for real, saved data.
// Run with: npm run dev:memory
import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seedSampleData, SAMPLE_PASSWORD } from '../src/seed/sampleData.js';

process.env.JWT_SECRET ||= 'dev-memory-secret';
const PORT = process.env.PORT || 5000;

const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
await mongoose.syncIndexes();
await seedSampleData();

createApp().listen(PORT, () => {
  console.log('\n⚠  TEMPORARY in-memory database - data is lost when you stop this.');
  console.log(`DevBlog API running at http://localhost:${PORT}`);
  console.log(`Sample login: priya@devblog.sample / ${SAMPLE_PASSWORD}\n`);
});

async function shutdown() {
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
