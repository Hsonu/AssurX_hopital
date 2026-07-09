import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sonurajsonuraj4515_db_user:Sonu@cluster0.cxyxqda.mongodb.net/assurx?retryWrites=true&w=majority&appName=Cluster0';

if (!process.env.MONGODB_URI) {
  console.warn("⚠️ WARNING: MONGODB_URI environment variable is NOT set! Falling back to local database.");
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const maskedURI = MONGODB_URI.includes('@')
      ? MONGODB_URI.replace(/:([^:@]+)@/, ':***@')
      : MONGODB_URI;
    console.log(`Connecting to MongoDB: ${maskedURI}`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected successfully.`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

export default mongoose;
