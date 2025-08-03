const express = require('express');
const router = express.Router();
const { getCodeforcesContests } = require('../scrapers/codeforces');
const { getLeetCodeContests } = require('../scrapers/leetcode');
const { getAtCoderContests } = require('../scrapers/atcoder');
const { getCodeChefContests } = require('../scrapers/codechef');
const { getGFGContests } = require('../scrapers/gfg');
const { getCodingNinjasContests } = require('../scrapers/codingninjas');

// POST /api/scraper/codeforces - Manually trigger Codeforces scraping
router.post('/codeforces', async (req, res) => {
  try {
    console.log('Manual Codeforces scraping triggered via API');
    const data = await getCodeforcesContests();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in Codeforces scraping route:', error.message);
    res.status(500).json({ success: false, message: 'Error during Codeforces scraping', error: error.message });
  }
});

// POST /api/scraper/leetcode - Manually trigger LeetCode scraping
router.post('/leetcode', async (req, res) => {
  try {
    console.log('Manual LeetCode scraping triggered via API');
    const data = await getLeetCodeContests();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in LeetCode scraping route:', error.message);
    res.status(500).json({ success: false, message: 'Error during LeetCode scraping', error: error.message });
  }
});

// POST /api/scraper/atcoder - Manually trigger AtCoder scraping
router.post('/atcoder', async (req, res) => {
  try {
    console.log('Manual AtCoder scraping triggered via API');
    const data = await getAtCoderContests();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in AtCoder scraping route:', error.message);
    res.status(500).json({ success: false, message: 'Error during AtCoder scraping', error: error.message });
  }
});

// POST /api/scraper/codechef - Manually trigger CodeChef scraping
router.post('/codechef', async (req, res) => {
  try {
    console.log('Manual CodeChef scraping triggered via API');
    const data = await getCodeChefContests();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in CodeChef scraping route:', error.message);
    res.status(500).json({ success: false, message: 'Error during CodeChef scraping', error: error.message });
  }
});

// POST /api/scraper/gfg - Manually trigger GeeksforGeeks scraping
router.post('/gfg', async (req, res) => {
  try {
    console.log('Manual GeeksforGeeks scraping triggered via API');
    const data = await getGFGContests();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GeeksforGeeks scraping route:', error.message);
    res.status(500).json({ success: false, message: 'Error during GeeksforGeeks scraping', error: error.message });
  }
});

// POST /api/scraper/codingninjas - Manually trigger CodingNinjas scraping
router.post('/codingninjas', async (req, res) => {
  try {
    console.log('Manual CodingNinjas scraping triggered via API');
    const data = await getCodingNinjasContests();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in CodingNinjas scraping route:', error.message);
    res.status(500).json({ success: false, message: 'Error during CodingNinjas scraping', error: error.message });
  }
});

// POST /api/scraper/all - Trigger scraping for all platforms
router.post('/all', async (req, res) => {
  try {
    console.log('Scraping all platforms triggered via API');
    const scrapers = [
      { name: 'codeforces', scraper: getCodeforcesContests },
      { name: 'leetcode', scraper: getLeetCodeContests },
      { name: 'atcoder', scraper: getAtCoderContests },
      { name: 'codechef', scraper: getCodeChefContests },
      { name: 'gfg', scraper: getGFGContests },
      { name: 'codingninjas', scraper: getCodingNinjasContests }
    ];
    const results = await Promise.all(scrapers.map(async ({ name, scraper }) => {
      try {
        const data = await scraper();
        return { platform: name, success: true, data };
      } catch (error) {
        return { platform: name, success: false, error: error.message };
      }
    }));
    res.json({ success: true, platforms: results });
  } catch (error) {
    console.error('Error in all platforms scraping:', error.message);
    res.status(500).json({ success: false, message: 'Error during platform scraping', error: error.message });
  }
});

module.exports = router;
