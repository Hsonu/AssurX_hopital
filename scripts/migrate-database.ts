import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Helper to ask input in terminal if not provided
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function migrate() {
  console.log('====================================================');
  console.log('   🚀 AssurX Hospital - Database Migration Tool');
  console.log('====================================================\n');

  let oldUri = process.env.OLD_MONGODB_URI || process.env.MONGODB_URI;
  let newUri = process.env.NEW_MONGODB_URI;

  if (!oldUri) {
    oldUri = await askQuestion('👉 Enter OLD MongoDB Connection URI: ');
  } else {
    console.log(`📌 Source (OLD) MongoDB: ${oldUri.replace(/:([^:@]+)@/, ':***@')}`);
  }

  if (!newUri) {
    newUri = await askQuestion('👉 Enter NEW MongoDB Connection URI: ');
  } else {
    console.log(`📌 Target (NEW) MongoDB: ${newUri.replace(/:([^:@]+)@/, ':***@')}`);
  }

  if (!oldUri || !newUri) {
    console.error('❌ Error: Both Old and New MongoDB URIs are required.');
    process.exit(1);
  }

  if (oldUri === newUri) {
    console.error('❌ Error: Source and Target MongoDB URIs are identical!');
    process.exit(1);
  }

  console.log('\n⏳ Connecting to Source (OLD) Database...');
  const sourceConn = await mongoose.createConnection(oldUri).asPromise();
  console.log('✅ Connected to Source Database successfully.');

  console.log('⏳ Connecting to Target (NEW) Database...');
  const targetConn = await mongoose.createConnection(newUri).asPromise();
  console.log('✅ Connected to Target Database successfully.\n');

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;

  if (!sourceDb || !targetDb) {
    throw new Error('Could not access database instances.');
  }

  // List all collections in the old database
  const collections = await sourceDb.listCollections().toArray();

  if (collections.length === 0) {
    console.log('⚠️ No collections found in the source database.');
  } else {
    console.log(`📦 Found ${collections.length} collection(s) to migrate:`);
    collections.forEach((c) => console.log(`   - ${c.name}`));
    console.log('\n🚀 Starting data migration...\n');

    let totalMigratedDocs = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      
      // Skip system collections
      if (colName.startsWith('system.')) continue;

      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const count = await sourceCol.countDocuments();
      console.log(`⏳ Migrating collection [${colName}] (${count} documents)...`);

      if (count === 0) {
        console.log(`   ⏭️ [${colName}] is empty, skipped.\n`);
        continue;
      }

      // Fetch all docs from source
      const docs = await sourceCol.find({}).toArray();

      if (docs.length > 0) {
        // Upsert all documents to avoid duplication and preserve exact _id
        const bulkOps = docs.map((doc) => ({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true,
          },
        }));

        const result = await targetCol.bulkWrite(bulkOps);
        console.log(
          `   ✅ [${colName}] Done: Upserted/Modified ${result.upsertedCount + result.modifiedCount + result.matchedCount} documents.`
        );
        totalMigratedDocs += docs.length;
      }
      console.log('');
    }

    console.log('====================================================');
    console.log(`🎉 Migration Completed Successfully!`);
    console.log(`📊 Total Documents Migrated: ${totalMigratedDocs}`);
    console.log('====================================================\n');
  }

  await sourceConn.close();
  await targetConn.close();
}

migrate().catch((err) => {
  console.error('\n❌ Migration failed with error:', err);
  process.exit(1);
});
