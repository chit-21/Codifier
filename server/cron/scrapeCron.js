const cron = require('node-cron');
const { getCodeforcesContests } = require('../scrapers/codeforces');
const { getLeetCodeContests } = require('../scrapers/leetcode');
const { getAtCoderContests } = require('../scrapers/atcoder');
const { getCodeChefContests } = require('../scrapers/codechef');
const { getGFGContests } = require('../scrapers/gfg');
const { getCodingNinjasContests } = require('../scrapers/codingninjas');
const { performFullCleanup } = require('../services/cleanup');

// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('⏰ [CRON] Scheduled contest scraping started!');
  await getCodeforcesContests();
  await getLeetCodeContests();
  await getAtCoderContests();
  await getCodeChefContests();
  await getGFGContests();
  await getCodingNinjasContests();
  console.log('✅ [CRON] Scheduled contest scraping finished!');
});

// Schedule full cleanup every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Running scheduled full cleanup...');
  await performFullCleanup();
});
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 [CRON] Running full contest cleanup...');
  await performFullCleanup();
  console.log('✅ [CRON] Cleanup finished!');
});