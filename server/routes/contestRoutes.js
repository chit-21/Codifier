const express = require('express');
const router = express.Router();

// Import scraper functions
const { getAtCoderContests } = require('../scrapers/atcoder');
const { getCodeChefContests } = require('../scrapers/codechef');
const { getCodeforcesContests } = require('../scrapers/codeforces');
const { getCodingNinjasContests } = require('../scrapers/codingninjas');
const { getGFGContests } = require('../scrapers/gfg');
const { getLeetCodeContests } = require('../scrapers/leetcode');

// Persistent, long-lived in-memory cache for each platform
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
let lastRefreshTime = 0;
let codeforcesContests = [], leetcodeContests = [], codechefContests = [], gfgContests = [], atcoderContests = [], codingninjasContests = [];

async function refreshCacheIfNeeded() {
  const now = Date.now();
  if (now - lastRefreshTime < CACHE_DURATION && lastRefreshTime !== 0) return;
  lastRefreshTime = now;
  try {
    [codechefContests, codeforcesContests, leetcodeContests, gfgContests, atcoderContests, codingninjasContests] = await Promise.all([
      getCodeChefContests(),
      getCodeforcesContests(),
      getLeetCodeContests(),
      getGFGContests(),
      getAtCoderContests(),
      getCodingNinjasContests()
    ]);
    console.log('Contest cache refreshed!');
  } catch (error) {
    console.error('Error refreshing contest cache:', error);
  }
}

async function fetchAllContestsCached() {
  await refreshCacheIfNeeded();
  return [
    ...atcoderContests,
    ...codechefContests,
    ...codeforcesContests,
    ...codingninjasContests,
    ...gfgContests,
    ...leetcodeContests
  ];
}

// GET /api/contests - Get all contests with optional filtering
router.get('/', async (req, res) => {
  try {
    const { platform, status, limit = 50 } = req.query;
    let contests = await fetchAllContestsCached();

    // Filtering
    if (platform) {
      contests = contests.filter(c => c.platform === platform.toLowerCase());
    }
    if (status) {
      contests = contests.filter(c => c.status === status.toLowerCase());
    }
    // Sort by startTime
    contests = contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    // Limit
    contests = contests.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: contests.length,
      data: contests
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contests',
      error: error.message
    });
  }
});

// GET /api/contests/live - Get currently running contests
router.get('/live', async (req, res) => {
  try {
    const { platform } = req.query;
    let contests = await fetchAllContestsCached();
    const now = new Date();
    contests = contests.filter(c => new Date(c.startTime) <= now && new Date(c.endTime) >= now);
    if (platform) {
      contests = contests.filter(c => c.platform === platform.toLowerCase());
    }
    contests = contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    res.json({
      success: true,
      count: contests.length,
      data: contests
    });
  } catch (error) {
    console.error('Error fetching live contests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live contests',
      error: error.message
    });
  }
});

// GET /api/contests/upcoming - Get upcoming contests
router.get('/upcoming', async (req, res) => {
  try {
    const { range, platform } = req.query;
    let contests = await fetchAllContestsCached();
    const now = new Date();
    let endDate = null;
    if (range === 'week') {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
    } else if (range === 'month') {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    }
    contests = contests.filter(c => new Date(c.startTime) > now);
    if (endDate) {
      contests = contests.filter(c => new Date(c.startTime) < endDate);
    }
    if (platform) {
      contests = contests.filter(c => c.platform === platform.toLowerCase());
    }
    contests = contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    res.json({
      success: true,
      count: contests.length,
      range: range || 'all',
      data: contests
    });
  } catch (error) {
    console.error('Error fetching upcoming contests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming contests',
      error: error.message
    });
  }
});

// GET /api/contests/platforms - Get available platforms
router.get('/platforms', async (req, res) => {
  try {
    const contests = await fetchAllContestsCached();
    const platforms = Array.from(new Set(contests.map(c => c.platform)));
    res.json({
      success: true,
      count: platforms.length,
      data: platforms
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platforms',
      error: error.message
    });
  }
});

// All other endpoints (CRUD, stats, etc.) are not supported in stateless mode

module.exports = router;
