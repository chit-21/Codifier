const cron = require('node-cron');
const StandaloneContestScraper = require('../standalone-scrapers');

// Initialize scraper
const scraper = new StandaloneContestScraper();

// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Scheduled contest scraping started!');
  try {
    await scraper.scrapeAll();
    console.log('[CRON] Scheduled contest scraping finished!');
  } catch (error) {
    console.error('[CRON] Error during scheduled scraping:', error);
  }
});

// Schedule cleanup every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running contest data cleanup...');
  try {
    // Clean up old contest data files
    const fs = require('fs').promises;
    const path = require('path');
    const outputDir = path.join(__dirname, '..', 'contest-data');
    
    try {
      const files = await fs.readdir(outputDir);
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(outputDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < oneDayAgo) {
            console.log(`[CRON] Cleaning up old file: ${file}`);
            // Don't delete, just log for now - files are small
          }
        }
      }
    } catch (error) {
      console.log('[CRON] No contest data directory found or empty');
    }
    
    console.log('[CRON] Cleanup finished!');
  } catch (error) {
    console.error('[CRON] Error during cleanup:', error);
  }
});

console.log('[CRON] Contest scraper cron jobs initialized');
console.log('[CRON] - Scraping every 30 minutes');
console.log('[CRON] - Cleanup daily at 2:00 AM');