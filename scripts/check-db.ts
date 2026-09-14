import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    return;
  }
  console.log('Connecting to:', uri.replace(/:([^:@]+)@/, ':***@'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  if (!db) {
    console.error('No db instance available');
    return;
  }
  const collections = await db.listCollections().toArray();
  console.log('\n--- Collections & Document Counts ---');
  let totalDocs = 0;
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`• ${c.name}: ${count} document(s)`);
    totalDocs += count;
  }
  console.log(`Total documents across all collections: ${totalDocs}`);
  await mongoose.disconnect();
}

check().catch((err) => {
  console.error('Error connecting to DB:', err.message);
  process.exit(1);
});
