/**
 * One-time migration script: drops stale indexes from the old schema.
 * Run once with:  node drop-old-indexes.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: './src/../.env' });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/FPL_Cup';

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Connected to MongoDB:', MONGO_URL);

  const db = mongoose.connection.db;
  const collection = db.collection('users');

  // List current indexes
  const indexes = await collection.indexes();
  console.log('\nCurrent indexes:');
  indexes.forEach(i => console.log(' -', i.name, JSON.stringify(i.key)));

  // Drop stale indexes from the old schema
  const toDrop = ['teamId_1', 'email_1'];
  for (const name of toDrop) {
    const exists = indexes.find(i => i.name === name);
    if (exists) {
      await collection.dropIndex(name);
      console.log(`\n🗑️  Dropped index: ${name}`);
    } else {
      console.log(`\nℹ️  Index not found (already gone): ${name}`);
    }
  }

  console.log('\n✅ Done. Re-listing indexes:');
  const after = await collection.indexes();
  after.forEach(i => console.log(' -', i.name, JSON.stringify(i.key)));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
