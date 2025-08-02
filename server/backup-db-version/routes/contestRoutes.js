const express = require('express');
const Contest = require('../models/Contest');
const router = express.Router();

// GET /api/contests - Get all contests with optional filtering
router.get('/', async (req, res) => {
  try {
    const { platform, status, limit = 50 } = req.query;
    
    // Build query object
    let query = {};
    
    if (platform) {
      query.platform = platform.toLowerCase();
    }
    
    if (status) {
      query.status = status.toLowerCase();
    }
    
    // Execute query
    const contests = await Contest.find(query)
      .sort({ startTime: 1 })
      .limit(parseInt(limit));
    
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
// In the live contests route
router.get('/live', async (req, res) => {
  try {
    const { platform } = req.query;
    console.log('Live contests - Platform filter:', platform);
    
    let query = {
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    };
    
    if (platform) {
      query.platform = platform.toLowerCase();
      console.log('Applying platform filter:', platform.toLowerCase());
    }
    
    const liveContests = await Contest.find(query).sort({ startTime: 1 });
    console.log(`Found ${liveContests.length} live contests`);
    // Log platforms of found contests
    console.log('Platforms found:', liveContests.map(c => c.platform));
    
    res.json({
      success: true,
      count: liveContests.length,
      data: liveContests
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

// Similar logs in the upcoming contests route
router.get('/upcoming', async (req, res) => {
  try {
    const { range, platform } = req.query;
    console.log('Upcoming contests - Platform filter:', platform, 'Range:', range);
    
    let endDate = null;
    if (range === 'week') {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
    } else if (range === 'month') {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    }
    
    let query = { startTime: { $gt: new Date() } };
    if (endDate) {
      query.startTime.$lt = endDate;
    }
    
    // Add platform filtering
    if (platform) {
      query.platform = platform.toLowerCase();
      console.log('Applying platform filter:', platform.toLowerCase());
    }
    
    const upcomingContests = await Contest.find(query).sort({ startTime: 1 });
    console.log(`Found ${upcomingContests.length} upcoming contests`);
    // Log platforms of found contests
    console.log('Platforms found:', upcomingContests.map(c => c.platform));
    
    res.json({
      success: true,
      count: upcomingContests.length,
      range: range || 'all',
      data: upcomingContests
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
    const platforms = await Contest.distinct('platform');
    
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

// GET /api/contests/:id - Get specific contest by ID
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    res.json({
      success: true,
      data: contest
    });
    
  } catch (error) {
    console.error('Error fetching contest:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contest',
      error: error.message
    });
  }
});

// POST /api/contests - Create new contest (for testing/manual entry)
router.post('/', async (req, res) => {
  try {
    const contestData = req.body;
    
    // Create new contest
    const contest = new Contest(contestData);
    await contest.save();
    
    res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      data: contest
    });
    
  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating contest',
      error: error.message
    });
  }
});

// PUT /api/contests/:id - Update contest
router.put('/:id', async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Contest updated successfully',
      data: contest
    });
    
  } catch (error) {
    console.error('Error updating contest:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating contest',
      error: error.message
    });
  }
});

// DELETE /api/contests/:id - Delete contest
router.delete('/:id', async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Contest deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting contest:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contest',
      error: error.message
    });
  }
});

// GET /api/contests/stats/summary - Get contest statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalContests = await Contest.countDocuments();
    const liveContests = await Contest.countDocuments({
      startTime: { $lte: new Date() },
      endTime: { $gte: new Date() }
    });
    const upcomingContests = await Contest.countDocuments({
      startTime: { $gt: new Date() }
    });
    
    const platformStats = await Contest.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalContests,
        live: liveContests,
        upcoming: upcomingContests,
        platforms: platformStats
      }
    });
    
  } catch (error) {
    console.error('Error fetching contest stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contest statistics',
      error: error.message
    });
  }
});

module.exports = router;
