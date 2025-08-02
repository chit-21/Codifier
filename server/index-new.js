#!/usr/bin/env node

/**
 * Contest Notifier - Standalone Server
 * 
 * This server provides standalone contest scraping functionality
 * without requiring a database. It can be used for development
 * and testing purposes.
 */

const StandaloneContestScraper = require('./standalone-scrapers');
require('./cron/scrapeCron'); // Initialize cron jobs

console.log('🚀 Contest Notifier - Standalone Server');
console.log('=====================================');
console.log('');
console.log('✅ Database-free operation');
console.log('✅ Automatic contest scraping every 30 minutes');
console.log('✅ Data saved to local JSON files');
console.log('');
console.log('Available commands:');
console.log('  npm start          - Start with cron jobs');
console.log('  npm test           - Test all scrapers');
console.log('  npm run scrape-all - Scrape all platforms once');
console.log('');

// Initialize scraper
const scraper = new StandaloneContestScraper();

// Add custom commands
const args = process.argv.slice(2);

if (args.includes('--scrape-all')) {
  console.log('🔄 Running one-time scrape of all platforms...');
  scraper.scrapeAll()
    .then(() => {
      console.log('✅ Scraping completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Scraping failed:', error);
      process.exit(1);
    });
} else if (args.includes('--help')) {
  console.log(`
Usage: node index-new.js [options]

Options:
  --scrape-all    Run one-time scrape of all platforms
  --help          Show this help message

The server will run continuously with cron jobs unless --scrape-all is used.
  `);
  process.exit(0);
} else {
  // Keep the process running for cron jobs
  console.log('🕐 Server running with scheduled tasks...');
  console.log('   Press Ctrl+C to stop');
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, shutting down...');
    process.exit(0);
  });
  
  // Keep process alive
  setInterval(() => {
    // Just keep the process running
  }, 60000);
}