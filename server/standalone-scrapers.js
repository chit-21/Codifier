#!/usr/bin/env node

/**
 * Standalone Contest Scrapers
 * 
 * This file provides standalone contest scraping functionality
 * that can be used independently without a database.
 * 
 * Usage:
 * - node standalone-scrapers.js --platform=codeforces
 * - node standalone-scrapers.js --all
 * - node standalone-scrapers.js --help
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class StandaloneContestScraper {
  constructor() {
    this.outputDir = path.join(__dirname, 'contest-data');
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }

  // Codeforces scraper
  async scrapeCodeforces() {
    console.log('Scraping Codeforces contests...');
    try {
      const response = await axios.get('https://codeforces.com/api/contest.list');
      const data = response.data;
      
      if (data.status !== 'OK') {
        throw new Error('Codeforces API error');
      }

      const contests = data.result
        .filter(contest => {
          const startTime = new Date(contest.startTimeSeconds * 1000);
          const now = new Date();
          return startTime > new Date(now.getTime() - 24 * 60 * 60 * 1000);
        })
        .map(contest => ({
          id: `cf_${contest.id}`,
          name: contest.name,
          platform: 'codeforces',
          url: `https://codeforces.com/contest/${contest.id}`,
          startTime: new Date(contest.startTimeSeconds * 1000).toISOString(),
          endTime: new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000).toISOString(),
          duration: Math.floor(contest.durationSeconds / 60),
          status: this.getContestStatus(new Date(contest.startTimeSeconds * 1000), contest.durationSeconds),
          registrationRequired: true
        }));

      await this.saveContests('codeforces', contests);
      console.log(`✅ Codeforces: Found ${contests.length} contests`);
      return contests;
    } catch (error) {
      console.error('❌ Error scraping Codeforces:', error.message);
      return [];
    }
  }

  // LeetCode scraper
  async scrapeLeetcode() {
    console.log('Scraping LeetCode contests...');
    try {
      const query = `{
        topTwoContests {
          title
          titleSlug
          startTime
          duration
          originStartTime
          isVirtual
        }
      }`;

      const response = await axios.post('https://leetcode.com/graphql', {
        query
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      
      if (!data.data?.topTwoContests) {
        return [];
      }

      const contests = data.data.topTwoContests
        .filter(contest => {
          const startTime = new Date(contest.startTime * 1000);
          return startTime > new Date();
        })
        .map(contest => ({
          id: `lc_${contest.titleSlug}`,
          name: contest.title,
          platform: 'leetcode',
          url: `https://leetcode.com/contest/${contest.titleSlug}/`,
          startTime: new Date(contest.startTime * 1000).toISOString(),
          endTime: new Date((contest.startTime + contest.duration) * 1000).toISOString(),
          duration: Math.floor(contest.duration / 60),
          status: this.getContestStatus(new Date(contest.startTime * 1000), contest.duration),
          registrationRequired: false
        }));

      await this.saveContests('leetcode', contests);
      console.log(`✅ LeetCode: Found ${contests.length} contests`);
      return contests;
    } catch (error) {
      console.error('❌ Error scraping LeetCode:', error.message);
      return [];
    }
  }

  // CodeChef scraper
  async scrapeCodechef() {
    console.log('Scraping CodeChef contests...');
    try {
      const response = await axios.get(
        'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      const data = response.data;
      let contests = [];

      if (data?.present_contests) {
        contests = [...contests, ...data.present_contests];
      }
      if (data?.future_contests) {
        contests = [...contests, ...data.future_contests];
      }

      const processedContests = contests
        .filter(contest => {
          const startTime = new Date(contest.contest_start_date_iso);
          const now = new Date();
          return startTime > new Date(now.getTime() - 24 * 60 * 60 * 1000);
        })
        .map(contest => ({
          id: `cc_${contest.contest_code}`,
          name: contest.contest_name,
          platform: 'codechef',
          url: `https://www.codechef.com/${contest.contest_code}`,
          startTime: contest.contest_start_date_iso,
          endTime: contest.contest_end_date_iso,
          duration: Math.floor((new Date(contest.contest_end_date_iso) - new Date(contest.contest_start_date_iso)) / (1000 * 60)),
          status: this.getContestStatus(new Date(contest.contest_start_date_iso), 
                    (new Date(contest.contest_end_date_iso) - new Date(contest.contest_start_date_iso)) / 1000),
          registrationRequired: true
        }));

      await this.saveContests('codechef', processedContests);
      console.log(`✅ CodeChef: Found ${processedContests.length} contests`);
      return processedContests;
    } catch (error) {
      console.error('❌ Error scraping CodeChef:', error.message);
      return [];
    }
  }

  // GeeksforGeeks scraper
  async scrapeGFG() {
    console.log('Scraping GeeksforGeeks contests...');
    try {
      const response = await axios.get('https://practiceapi.geeksforgeeks.org/api/vr/events/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      if (!data?.results?.upcoming) {
        return [];
      }

      const contests = data.results.upcoming
        .filter(contest => {
          const startTime = new Date(contest.start_time);
          return startTime > new Date();
        })
        .map(contest => ({
          id: `gfg_${contest.slug}`,
          name: contest.event_name,
          platform: 'gfg',
          url: `https://practice.geeksforgeeks.org/contest/${contest.slug}`,
          startTime: contest.start_time,
          endTime: contest.end_time,
          duration: Math.floor((new Date(contest.end_time) - new Date(contest.start_time)) / (1000 * 60)),
          status: this.getContestStatus(new Date(contest.start_time), 
                    (new Date(contest.end_time) - new Date(contest.start_time)) / 1000),
          registrationRequired: true
        }));

      await this.saveContests('gfg', contests);
      console.log(`✅ GeeksforGeeks: Found ${contests.length} contests`);
      return contests;
    } catch (error) {
      console.error('❌ Error scraping GeeksforGeeks:', error.message);
      return [];
    }
  }

  // CodingNinjas scraper
  async scrapeCodingNinjas() {
    console.log('Scraping CodingNinjas contests...');
    try {
      const response = await axios.get('https://www.codingninjas.com/api/v4/public_section/contest_list', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      if (!data?.data?.events) {
        return [];
      }

      const contests = data.data.events
        .filter(contest => {
          const startTime = new Date(contest.event_start_time);
          return startTime > new Date();
        })
        .map(contest => ({
          id: `cn_${contest.slug}`,
          name: contest.name,
          platform: 'codingninjas',
          url: `https://www.codingninjas.com/codestudio/contests/${contest.slug}`,
          startTime: contest.event_start_time,
          endTime: contest.event_end_time,
          duration: Math.floor((new Date(contest.event_end_time) - new Date(contest.event_start_time)) / (1000 * 60)),
          status: this.getContestStatus(new Date(contest.event_start_time), 
                    (new Date(contest.event_end_time) - new Date(contest.event_start_time)) / 1000),
          registrationRequired: true
        }));

      await this.saveContests('codingninjas', contests);
      console.log(`✅ CodingNinjas: Found ${contests.length} contests`);
      return contests;
    } catch (error) {
      console.error('❌ Error scraping CodingNinjas:', error.message);
      return [];
    }
  }

  // AtCoder scraper (placeholder - requires web scraping)
  async scrapeAtcoder() {
    console.log('⚠️  AtCoder scraping not implemented (requires web scraping)');
    return [];
  }

  // Helper method to determine contest status
  getContestStatus(startTime, durationSeconds) {
    const now = new Date();
    const endTime = new Date(startTime.getTime() + (durationSeconds * 1000));
    
    if (now < startTime) {
      return 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      return 'live';
    } else {
      return 'ended';
    }
  }

  // Save contests to JSON file
  async saveContests(platform, contests) {
    try {
      const filename = path.join(this.outputDir, `${platform}-contests.json`);
      const data = {
        platform,
        contests,
        lastUpdated: new Date().toISOString(),
        count: contests.length
      };
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving ${platform} contests:`, error);
    }
  }

  // Scrape all platforms
  async scrapeAll() {
    console.log('🚀 Starting to scrape all platforms...\n');
    
    const results = {};
    const scrapers = {
      codeforces: this.scrapeCodeforces.bind(this),
      leetcode: this.scrapeLeetcode.bind(this),
      codechef: this.scrapeCodechef.bind(this),
      gfg: this.scrapeGFG.bind(this),
      codingninjas: this.scrapeCodingNinjas.bind(this),
      atcoder: this.scrapeAtcoder.bind(this)
    };

    for (const [platform, scraper] of Object.entries(scrapers)) {
      try {
        results[platform] = await scraper();
      } catch (error) {
        console.error(`❌ Error scraping ${platform}:`, error.message);
        results[platform] = [];
      }
    }

    // Save combined results
    const allContests = Object.values(results).flat();
    await this.saveContests('all-platforms', allContests);
    
    console.log('\n📊 Scraping Summary:');
    Object.entries(results).forEach(([platform, contests]) => {
      console.log(`  ${platform}: ${contests.length} contests`);
    });
    console.log(`  Total: ${allContests.length} contests`);
    console.log(`\n💾 Data saved to: ${this.outputDir}`);

    return results;
  }
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  const scraper = new StandaloneContestScraper();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Contest Scraper CLI

Usage:
  node standalone-scrapers.js [options]

Options:
  --all                 Scrape all platforms
  --platform=<name>     Scrape specific platform (codeforces, leetcode, codechef, gfg, codingninjas, atcoder)
  --help, -h           Show this help message

Examples:
  node standalone-scrapers.js --all
  node standalone-scrapers.js --platform=codeforces
  node standalone-scrapers.js --platform=leetcode
    `);
    return;
  }

  const platformArg = args.find(arg => arg.startsWith('--platform='));
  const platform = platformArg ? platformArg.split('=')[1] : null;

  if (args.includes('--all')) {
    await scraper.scrapeAll();
  } else if (platform) {
    const scraperMethods = {
      codeforces: scraper.scrapeCodeforces.bind(scraper),
      leetcode: scraper.scrapeLeetcode.bind(scraper),
      codechef: scraper.scrapeCodechef.bind(scraper),
      gfg: scraper.scrapeGFG.bind(scraper),
      codingninjas: scraper.scrapeCodingNinjas.bind(scraper),
      atcoder: scraper.scrapeAtcoder.bind(scraper)
    };

    if (scraperMethods[platform]) {
      await scraperMethods[platform]();
    } else {
      console.error(`❌ Unknown platform: ${platform}`);
      console.log('Available platforms: codeforces, leetcode, codechef, gfg, codingninjas, atcoder');
    }
  } else {
    console.log('Use --help for usage information');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = StandaloneContestScraper;