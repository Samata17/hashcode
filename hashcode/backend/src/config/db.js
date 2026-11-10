import mongoose from 'mongoose';

// Connects to MongoDB using the address in the MONGO_URI environment variable.
// If the connection fails, we stop the server because nothing works without the database.
export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is missing. Add it to backend/.env (see .env.example).');
  }
  // Give up after 10 seconds instead of the default 30, so mistakes show up quickly.
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}
