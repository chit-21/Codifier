const express = require('express');
const router = express.Router();
const { getCodeforcesContests } = require('../scrapers/codeforces');
const { getLeetCodeContests } = require('../scrapers/leetcode');
const { getAtCoderContests } = require('../scrapers/atcoder');
const { getCodeChefContests } = require('../scrapers/codechef');
const { getGFGContests } = require('../scrapers/gfg');
const { getCodingNinjasContests } = require('../scrapers/codingninjas');
const { performFullCleanup } = require('../services/cleanup');

// POST /api/scraper/codeforces - Manually trigger Codeforces scraping
router.post('/codeforces', async (req, res) => {
  try {
    console.log('Manual Codeforces scraping triggered via API');
    
    const result = await getCodeforcesContests();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Codeforces scraping completed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Codeforces scraping failed',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in Codeforces scraping route:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during Codeforces scraping',
      error: error.message
    });
  }
});

// POST /api/scraper/leetcode - Manually trigger LeetCode scraping
router.post('/leetcode', async (req, res) => {
  try {
    console.log('Manual LeetCode scraping triggered via API');
    const result = await getLeetCodeContests();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'LeetCode scraping completed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'LeetCode scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in LeetCode scraping route:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during LeetCode scraping',
      error: error.message
    });
  }
});

// POST /api/scraper/atcoder - Manually trigger AtCoder scraping
router.post('/atcoder', async (req, res) => {
  try {
    console.log('Manual AtCoder scraping triggered via API');
    const result = await getAtCoderContests();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'AtCoder scraping completed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'AtCoder scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in AtCoder scraping route:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during AtCoder scraping',
      error: error.message
    });
  }
});

// POST /api/scraper/codechef - Manually trigger CodeChef scraping
router.post('/codechef', async (req, res) => {
  try {
    console.log('Manual CodeChef scraping triggered via API');
    const result = await getCodeChefContests();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'CodeChef scraping completed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'CodeChef scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in CodeChef scraping route:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during CodeChef scraping',
      error: error.message
    });
  }
});

// POST /api/scraper/gfg - Manually trigger GeeksforGeeks scraping
router.post('/gfg', async (req, res) => {
  try {
    console.log('Manual GeeksforGeeks scraping triggered via API');
    const result = await getGFGContests();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'GeeksforGeeks scraping completed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'GeeksforGeeks scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in GeeksforGeeks scraping route:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during GeeksforGeeks scraping',
      error: error.message
    });
  }
});

// POST /api/scraper/codingninjas - Manually trigger CodingNinjas scraping
router.post('/codingninjas', async (req, res) => {
  try {
    console.log('Manual CodingNinjas scraping triggered via API');
    const result = await getCodingNinjasContests();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'CodingNinjas scraping completed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'CodingNinjas scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in CodingNinjas scraping route:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during CodingNinjas scraping',
      error: error.message
    });
  }
});

// POST /api/scraper/all - Trigger scraping for all platforms
router.post('/all', async (req, res) => {
  try {
    console.log('Scraping all platforms triggered via API');
    
    const results = [];
    const scrapers = [
      { name: 'codeforces', scraper: getCodeforcesContests },
      { name: 'leetcode', scraper: getLeetCodeContests },
      { name: 'atcoder', scraper: getAtCoderContests },
      { name: 'codechef', scraper: getCodeChefContests },
      { name: 'gfg', scraper: getGFGContests },
      { name: 'codingninjas', scraper: getCodingNinjasContests }
    ];
    
    // Run all scrapers in parallel
    const promises = scrapers.map(async ({ name, scraper }) => {
      try {
        const result = await scraper();
        return { platform: name, ...result };
      } catch (error) {
        console.error(`Error scraping ${name}:`, error.message);
        return { platform: name, success: false, error: error.message };
      }
    });
    
    const results_array = await Promise.all(promises);
    results.push(...results_array);
    
    const successCount = results.filter(r => r.success).length;
    const totalPlatforms = results.length;
    
    res.json({
      success: successCount > 0,
      message: `Scraping completed for ${successCount}/${totalPlatforms} platforms`,
      platforms: results,
      summary: {
        totalPlatforms,
        successful: successCount,
        failed: totalPlatforms - successCount,
        totalContestsFetched: results.reduce((sum, r) => sum + (r.totalFetched || 0), 0),
        totalContestsSaved: results.reduce((sum, r) => sum + (r.saved || 0), 0),
        totalContestsUpdated: results.reduce((sum, r) => sum + (r.updated || 0), 0)
      }
    });
    
  } catch (error) {
    console.error('Error in all platforms scraping:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during platform scraping',
      error: error.message
    });
  }
});

// POST /api/scraper/cleanup - Trigger database cleanup
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 Database cleanup triggered via API');
    
    const result = await performFullCleanup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Database cleanup completed successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database cleanup failed',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in cleanup route:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during database cleanup',
      error: error.message
    });
  }
});

// GET /api/scraper/status - Get scraper status and stats
router.get('/status', async (req, res) => {
  try {
    const Contest = require('../models/Contest');
    
    // Get contest statistics
    const stats = await Contest.aggregate([
      {
        $group: {
          _id: '$platform',
          total: { $sum: 1 },
          upcoming: {
            $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] }
          },
          live: {
            $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] }
          },
          ended: {
            $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const totalContests = await Contest.countDocuments();
    const lastUpdated = await Contest.findOne().sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: {
        totalContests,
        lastUpdated: lastUpdated?.updatedAt || null,
        platformStats: stats,
        availablePlatforms: ['codeforces', 'leetcode', 'atcoder', 'codechef', 'gfg', 'codingninjas'],
        nextScheduledScrape: 'Not scheduled yet' // TODO: Add cron info
      }
    });
    
  } catch (error) {
    console.error('Error getting scraper status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error getting scraper status',
      error: error.message
    });
  }
});

module.exports = router;
