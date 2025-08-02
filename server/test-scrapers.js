#!/usr/bin/env node

/**
 * Test file for standalone contest scrapers
 * 
 * This file tests individual scrapers to ensure they work correctly
 */

const StandaloneContestScraper = require('./standalone-scrapers');

async function testScraper(scraperName, scraperMethod) {
  console.log(`\n🧪 Testing ${scraperName} scraper...`);
  console.log('─'.repeat(50));
  
  const startTime = Date.now();
  
  try {
    const contests = await scraperMethod();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${scraperName} test completed in ${duration}ms`);
    console.log(`📊 Found ${contests.length} contests`);
    
    if (contests.length > 0) {
      console.log(`📝 Sample contest:`, {
        name: contests[0].name,
        platform: contests[0].platform,
        startTime: contests[0].startTime,
        status: contests[0].status
      });
    }
    
    return {
      platform: scraperName,
      success: true,
      count: contests.length,
      duration,
      contests: contests.slice(0, 3) // First 3 contests for preview
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`❌ ${scraperName} test failed after ${duration}ms:`, error.message);
    
    return {
      platform: scraperName,
      success: false,
      error: error.message,
      duration
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Contest Scraper Tests');
  console.log('='.repeat(50));
  
  const scraper = new StandaloneContestScraper();
  const results = [];
  
  // Test individual scrapers
  const tests = [
    ['Codeforces', scraper.scrapeCodeforces.bind(scraper)],
    ['LeetCode', scraper.scrapeLeetcode.bind(scraper)],
    ['CodeChef', scraper.scrapeCodechef.bind(scraper)],
    ['GeeksforGeeks', scraper.scrapeGFG.bind(scraper)],
    ['CodingNinjas', scraper.scrapeCodingNinjas.bind(scraper)],
    ['AtCoder', scraper.scrapeAtcoder.bind(scraper)]
  ];
  
  for (const [name, method] of tests) {
    const result = await testScraper(name, method);
    results.push(result);
    
    // Add delay between tests to be respectful to APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful scrapers:');
    successful.forEach(result => {
      console.log(`  • ${result.platform}: ${result.count} contests (${result.duration}ms)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed scrapers:');
    failed.forEach(result => {
      console.log(`  • ${result.platform}: ${result.error}`);
    });
  }
  
  const totalContests = successful.reduce((sum, result) => sum + result.count, 0);
  console.log(`\n🎯 Total contests found: ${totalContests}`);
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n🏁 All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testScraper };