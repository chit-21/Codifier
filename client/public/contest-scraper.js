// Contest Scraper Module for Chrome Extension
// This module handles fetching contest data from various platforms
// and stores it in chrome.storage.local instead of a database

class ContestScraper {
  constructor() {
    this.platforms = {
      codeforces: this.scrapeCodeforces.bind(this),
      leetcode: this.scrapeLeetcode.bind(this),
      atcoder: this.scrapeAtcoder.bind(this),
      codechef: this.scrapeCodechef.bind(this),
      gfg: this.scrapeGFG.bind(this),
      codingninjas: this.scrapeCodingNinjas.bind(this)
    };
  }

  // Main method to scrape all platforms
  async scrapeAllPlatforms() {
    console.log('🚀 Starting contest scraping for all platforms...');
    const results = {};
    let totalContests = 0;
    
    for (const [platform, scraper] of Object.entries(this.platforms)) {
      try {
        console.log(`📡 Scraping ${platform}...`);
        const startTime = Date.now();
        const contests = await scraper();
        const endTime = Date.now();
        
        results[platform] = {
          success: true,
          contests: contests,
          lastUpdated: new Date().toISOString(),
          count: contests.length,
          scrapingTime: endTime - startTime
        };
        
        totalContests += contests.length;
        console.log(`✅ ${platform}: Found ${contests.length} contests (${endTime - startTime}ms)`);
        
        // Log sample contest for debugging
        if (contests.length > 0) {
          const sample = contests[0];
          console.log(`   📝 Sample: "${sample.name}" (${sample.startTime})`);
        }
      } catch (error) {
        console.error(`❌ Error scraping ${platform}:`, error);
        results[platform] = {
          success: false,
          error: error.message,
          lastUpdated: new Date().toISOString(),
          count: 0
        };
      }
    }

    // Store results in chrome storage
    await this.storeContests(results);
    console.log(`💾 Contest data stored successfully - Total: ${totalContests} contests`);
    
    // Log summary
    console.log('📊 Scraping Summary:');
    Object.keys(results).forEach(platform => {
      const result = results[platform];
      console.log(`   ${platform}: ${result.success ? result.count + ' contests' : 'FAILED - ' + result.error}`);
    });
    
    return results;
  }

  // Test function to check individual platform scraping
  async testPlatform(platformName) {
    if (!this.platforms[platformName]) {
      console.error(`Platform ${platformName} not found`);
      return null;
    }
    
    try {
      console.log(`🧪 Testing ${platformName} scraper...`);
      const startTime = Date.now();
      const contests = await this.platforms[platformName]();
      const endTime = Date.now();
      
      console.log(`✅ ${platformName} test result: ${contests.length} contests (${endTime - startTime}ms)`);
      if (contests.length > 0) {
        console.log('Sample contests:', contests.slice(0, 3));
      }
      return contests;
    } catch (error) {
      console.error(`❌ ${platformName} test failed:`, error);
      return null;
    }
  }

  // Store contests in chrome.storage.local
  async storeContests(contestData) {
    return new Promise((resolve, reject) => {
      const storageData = {
        contests: contestData,
        lastFullUpdate: new Date().toISOString()
      };

      chrome.storage.local.set(storageData, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('Contest data stored successfully');
          resolve();
        }
      });
    });
  }

  // Get stored contests
  async getStoredContests() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['contests', 'lastFullUpdate'], (result) => {
        resolve({
          contests: result.contests || {},
          lastFullUpdate: result.lastFullUpdate || null
        });
      });
    });
  }

  // Get contests with filtering
  async getContests(filters = {}) {
    try {
      const stored = await this.getStoredContests();
      const contestData = stored.contests;
      
      let allContests = [];
      let platformCounts = {};
      
      // Combine contests from all platforms
      Object.keys(contestData).forEach(platform => {
        if (contestData[platform].success && contestData[platform].contests) {
          const platformContests = contestData[platform].contests;
          allContests = [...allContests, ...platformContests];
          platformCounts[platform] = platformContests.length;
          console.log(`📊 ${platform}: ${platformContests.length} contests loaded`);
        } else {
          platformCounts[platform] = 0;
          console.warn(`⚠️ ${platform}: No contests or failed to load`);
        }
      });
      
      console.log(`📈 Total contests before filtering: ${allContests.length}`);
      console.log('Platform breakdown:', platformCounts);
      
      // Apply platform filter
      if (filters.platform && filters.platform !== 'all') {
        const beforeCount = allContests.length;
        allContests = allContests.filter(contest => contest.platform === filters.platform);
        console.log(`🔍 Platform filter '${filters.platform}': ${beforeCount} → ${allContests.length} contests`);
      }
      
      // Apply time filter
      if (filters.timeFilter) {
        const now = new Date();
        const beforeCount = allContests.length;
        
        switch (filters.timeFilter) {
          case 'live':
            allContests = allContests.filter(contest => {
              const startTime = new Date(contest.startTime);
              const endTime = new Date(contest.endTime);
              return startTime <= now && endTime > now;
            });
            console.log(`🔴 Live filter: ${beforeCount} → ${allContests.length} contests`);
            break;
          case 'week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            allContests = allContests.filter(contest => {
              const startTime = new Date(contest.startTime);
              return startTime >= now && startTime <= weekFromNow;
            });
            console.log(`📅 Week filter: ${beforeCount} → ${allContests.length} contests`);
            break;
          case 'month':
            const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            allContests = allContests.filter(contest => {
              const startTime = new Date(contest.startTime);
              return startTime >= now && startTime <= monthFromNow;
            });
            console.log(`📆 Month filter: ${beforeCount} → ${allContests.length} contests`);
            break;
          default:
            console.log(`📋 All filter: ${allContests.length} contests (no time filtering)`);
            break;
        }
      }
      
      // Sort contests by start time
      allContests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      console.log(`✅ Final result: ${allContests.length} contests returned`);
      
      return {
        success: true,
        contests: allContests,
        count: allContests.length,
        lastUpdate: stored.lastFullUpdate,
        platformCounts: platformCounts
      };
    } catch (error) {
      console.error('Error getting contests:', error);
      return {
        success: false,
        error: error.message,
        contests: [],
        count: 0
      };
    }
  }

  // Codeforces scraper
  async scrapeCodeforces() {
    const API_URL = 'https://codeforces.com/api/contest.list';
    
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error('Codeforces API error');
      }

      const contests = data.result
        .filter(contest => {
          const startTime = new Date(contest.startTimeSeconds * 1000);
          const endTime = new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000);
          const now = new Date();
          // Include upcoming contests and contests that ended within last 7 days
          return endTime > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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

      return contests;
    } catch (error) {
      console.error('Error fetching Codeforces contests:', error);
      return [];
    }
  }

  // LeetCode scraper
  async scrapeLeetcode() {
    const API_URL = 'https://leetcode.com/graphql';
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

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (!data.data?.topTwoContests) {
        return [];
      }

      const contests = data.data.topTwoContests
        .filter(contest => {
          const startTime = new Date(contest.startTime * 1000);
          const endTime = new Date((contest.startTime + contest.duration) * 1000);
          const now = new Date();
          // Include upcoming and recently ended contests
          return endTime > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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

      return contests;
    } catch (error) {
      console.error('Error fetching LeetCode contests:', error);
      return [];
    }
  }

  // AtCoder scraper
  async scrapeAtcoder() {
    const API_URL = 'https://atcoder.jp/contests/?lang=en';
    
    try {
      // Note: AtCoder doesn't have a public API, so this would need web scraping
      // For now, returning empty array - you can implement web scraping if needed
      console.log('AtCoder scraping not implemented yet (requires web scraping)');
      return [];
    } catch (error) {
      console.error('Error fetching AtCoder contests:', error);
      return [];
    }
  }

  // CodeChef scraper
  async scrapeCodechef() {
    const API_URL = 'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all';
    
    try {
      const response = await fetch(API_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('CodeChef API returned non-JSON response');
        return [];
      }

      const data = await response.json();
      let contests = [];

      // Combine present, future, and past contests
      if (data?.present_contests) {
        contests = [...contests, ...data.present_contests];
      }
      if (data?.future_contests) {
        contests = [...contests, ...data.future_contests];
      }
      if (data?.past_contests) {
        contests = [...contests, ...data.past_contests.slice(0, 10)]; // Include recent past contests
      }

      return contests
        .filter(contest => {
          const endTime = new Date(contest.contest_end_date_iso);
          const now = new Date();
          // Include contests that ended within last 7 days
          return endTime > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    } catch (error) {
      console.error('Error fetching CodeChef contests:', error);
      return [];
    }
  }

  // GeeksforGeeks scraper
  async scrapeGFG() {
    // Try multiple API endpoints for GFG
    const API_URLS = [
      'https://practiceapi.geeksforgeeks.org/api/vr/events/',
      'https://practiceapi.geeksforgeeks.org/api/latest/events/',
      'https://www.geeksforgeeks.org/events/rec/upcoming'
    ];
    
    for (const API_URL of API_URLS) {
      try {
        const response = await fetch(API_URL, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://practice.geeksforgeeks.org/'
          }
        });

        if (!response.ok) {
          console.warn(`GFG API ${API_URL} returned ${response.status}, trying next...`);
          continue;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`GFG API ${API_URL} returned non-JSON response, trying next...`);
          continue;
        }

        const data = await response.json();
        
        // Handle different response formats
        let contests = [];
        if (data?.results?.upcoming) {
          contests = data.results.upcoming;
        } else if (data?.upcoming) {
          contests = data.upcoming;
        } else if (Array.isArray(data)) {
          contests = data;
        } else {
          console.warn(`GFG API ${API_URL} returned unexpected format, trying next...`);
          continue;
        }

        return contests
          .filter(contest => {
            const endTime = new Date(contest.end_time || contest.endTime);
            const now = new Date();
            // Include contests that ended within last 7 days
            return endTime > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          })
          .map(contest => ({
            id: `gfg_${contest.slug}`,
            name: contest.event_name || contest.name,
            platform: 'gfg',
            url: `https://practice.geeksforgeeks.org/contest/${contest.slug}`,
            startTime: contest.start_time || contest.startTime,
            endTime: contest.end_time || contest.endTime,
            duration: Math.floor((new Date(contest.end_time || contest.endTime) - new Date(contest.start_time || contest.startTime)) / (1000 * 60)),
            status: this.getContestStatus(new Date(contest.start_time || contest.startTime), 
                      (new Date(contest.end_time || contest.endTime) - new Date(contest.start_time || contest.startTime)) / 1000),
            registrationRequired: true
          }));
      } catch (error) {
        console.warn(`Error with GFG API ${API_URL}:`, error.message);
        continue;
      }
    }
    
    // If all APIs fail, return empty array
    console.error('All GFG API endpoints failed');
    return [];
  }

  // CodingNinjas scraper
  async scrapeCodingNinjas() {
    const API_URL = 'https://www.codingninjas.com/api/v4/public_section/contest_list';
    
    try {
      const response = await fetch(API_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('CodingNinjas API returned non-JSON response, possibly blocked or changed');
        return [];
      }

      const data = await response.json();
      
      if (!data?.data?.events) {
        return [];
      }

      return data.data.events
        .filter(contest => {
          const endTime = new Date(contest.event_end_time);
          const now = new Date();
          // Include contests that ended within last 7 days
          return endTime > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    } catch (error) {
      console.error('Error fetching CodingNinjas contests:', error.message);
      
      // If it's a JSON parsing error, the API might be returning HTML (blocked/changed)
      if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
        console.warn('CodingNinjas API seems to be returning HTML instead of JSON - possibly blocked or API changed');
      }
      
      return [];
    }
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

  // Get contests with filtering
  async getContests(filters = {}) {
    const stored = await this.getStoredContests();
    let allContests = [];

    // Flatten all platform contests
    Object.values(stored.contests).forEach(platformData => {
      if (platformData.success && platformData.contests) {
        allContests = [...allContests, ...platformData.contests];
      }
    });

    // Apply filters
    if (filters.platform && filters.platform !== 'all') {
      allContests = allContests.filter(contest => contest.platform === filters.platform);
    }

    if (filters.status) {
      allContests = allContests.filter(contest => contest.status === filters.status);
    }

    if (filters.timeFilter) {
      const now = new Date();
      switch (filters.timeFilter) {
        case 'live':
          allContests = allContests.filter(contest => contest.status === 'live');
          break;
        case 'week':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          allContests = allContests.filter(contest => {
            const startTime = new Date(contest.startTime);
            return startTime >= now && startTime <= weekFromNow;
          });
          break;
        case 'month':
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          allContests = allContests.filter(contest => {
            const startTime = new Date(contest.startTime);
            return startTime >= now && startTime <= monthFromNow;
          });
          break;
      }
    }

    // Sort by start time
    allContests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return {
      success: true,
      contests: allContests,
      count: allContests.length,
      lastUpdated: stored.lastFullUpdate
    };
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContestScraper;
} else if (typeof window !== 'undefined') {
  // For browser environment (popup, content scripts)
  window.ContestScraper = ContestScraper;
} else {
  // For service worker environment
  self.ContestScraper = ContestScraper;
}