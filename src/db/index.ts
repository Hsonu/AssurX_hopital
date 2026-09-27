import mongoose from 'mongoose';
import dotenv from 'dotenv';


// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bmandal1997_db_user:Sonu%40123456789@cluster0.6aeqnar.mongodb.net/assurx?retryWrites=true&w=majority&appName=Cluster0';

if (!process.env.MONGODB_URI) {
  console.warn("⚠️ WARNING: MONGODB_URI environment variable is NOT set! Falling back to cloud database.");
}

let isConnected = false;
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 2000;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  const maskedURI = MONGODB_URI.includes('@')
    ? MONGODB_URI.replace(/:([^:@]+)@/, ':***@')
    : MONGODB_URI;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Connecting to MongoDB (attempt ${attempt}/${MAX_RETRIES}): ${maskedURI}`);

      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,  // 15s for slow networks
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 90000,           // 90s for slow networks
        connectTimeoutMS: 20000,          // 20s for slow networks
        autoIndex: false,
        heartbeatFrequencyMS: 30000,      // Check connection health every 30s
        retryWrites: true,
        retryReads: true,
        // Buffer commands when disconnected (prevents crashes during reconnection)
        bufferCommands: true,
        // Enable connection compression for faster data transfer on slow networks
        compressors: ['zlib', 'snappy'],
        // DNS caching to reduce DNS resolution time on subsequent connections
        family: 4,                        // Force IPv4 to avoid IPv6 resolution delays
      });
      isConnected = true;
      console.log(`✅ MongoDB connected successfully.`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s, 16s
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed.');
        throw error;
      }
    }
  }
}

// === Auto-reconnection on disconnect ===
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  isConnected = false;
  // Auto-reconnect after a short delay
  setTimeout(() => {
    connectDB().catch(err => {
      console.error('❌ MongoDB auto-reconnection failed:', err.message);
    });
  }, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully.');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  isConnected = false;
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

export default mongoose;
