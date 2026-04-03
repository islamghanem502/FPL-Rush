const app = require('./app');
const connectDB = require('./config/database');
const cron = require('node-cron');
const User = require('./models/user.model');
const { syncMultipleUsers } = require('./services/fpl.service');
const { syncPvPChallenges } = require('./services/fpl.service');

// Connect to MongoDB
connectDB();


cron.schedule('*/15 * * * *', async () => {
  const startTime = Date.now();
  console.log('---------------------------------------');
  console.log('🕒 [Cron Job] Started at:', new Date().toLocaleString());

  try {

    const users = await User.find({});
    if (users.length > 0) {
      await syncMultipleUsers(users);
      console.log(`✅ Synced ${users.length} users.`);
    } else {
      console.log('ℹ️ No users found for sync.');
    }


    await syncPvPChallenges();
    console.log('✅ PvP Challenges outcomes and predictions updated.');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️ Cron finished in ${duration}s`);
  console.log('---------------------------------------');

}, {
  timezone: "Africa/Cairo"
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('---------------------------------------');
  console.log('Server Time:', new Date().toLocaleString());
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🕒 Cron Job: Active (Runs every 15 minutes)`);
  console.log('---------------------------------------');
});