const Contest = require('../models/Contest');

// Clean up old contests from database
const cleanupOldContests = async () => {
  try {
    console.log('Starting contest cleanup...');
    
    const now = new Date();
    
    // 1. Mark ended contests
    const endedResult = await Contest.updateMany(
      { 
        endTime: { $lt: now },
        status: { $ne: 'ended' }
      },
      { status: 'ended' }
    );
    
    console.log(`Marked ${endedResult.modifiedCount} contests as ended`);
    
    // 2. Delete very old contests (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deleteResult = await Contest.deleteMany({
      endTime: { $lt: thirtyDaysAgo }
    });
    
    console.log(`Deleted ${deleteResult.deletedCount} old contests (>30 days)`);
    
    // 3. Get current stats
    const stats = await getContestStats();
    console.log('Current contest stats:', stats);
    
    return {
      success: true,
      markedAsEnded: endedResult.modifiedCount,
      deleted: deleteResult.deletedCount,
      stats: stats
    };
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get contest statistics
const getContestStats = async () => {
  try {
    const total = await Contest.countDocuments();
    const upcoming = await Contest.countDocuments({ status: 'upcoming' });
    const live = await Contest.countDocuments({ status: 'live' });
    const ended = await Contest.countDocuments({ status: 'ended' });
    
    return {
      total,
      upcoming,
      live,
      ended
    };
  } catch (error) {
    console.error('Error getting stats:', error.message);
    return null;
  }
};

// Remove duplicate contests (same name and platform)
const removeDuplicateContests = async () => {
  try {
    console.log('Checking for duplicate contests...');
    
    const duplicates = await Contest.aggregate([
      {
        $group: {
          _id: { name: '$name', platform: '$platform' },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    let removedCount = 0;
    
    for (const duplicate of duplicates) {
      // Keep the first document, remove the rest
      const docsToRemove = duplicate.docs.slice(1);
      await Contest.deleteMany({ _id: { $in: docsToRemove } });
      removedCount += docsToRemove.length;
    }
    
    console.log(`Removed ${removedCount} duplicate contests`);
    return removedCount;
    
  } catch (error) {
    console.error('Error removing duplicates:', error.message);
    return 0;
  }
};

// Full cleanup process
const performFullCleanup = async () => {
  try {
    console.log('Starting full database cleanup...');
    
    // 1. Remove duplicates
    const duplicatesRemoved = await removeDuplicateContests();
    
    // 2. Clean up old contests
    const cleanupResult = await cleanupOldContests();
    
    console.log('Full cleanup completed!');
    return {
      success: true,
      duplicatesRemoved,
      ...cleanupResult
    };
    
  } catch (error) {
    console.error('Full cleanup failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  cleanupOldContests,
  getContestStats,
  removeDuplicateContests,
  performFullCleanup
};
