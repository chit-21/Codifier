const axios = require('axios');
const Contest = require('../models/Contest');

const LEETCODE_BASE_URL = "https://leetcode.com/contest/";
const LEETCODE_API = "https://leetcode.com/graphql";

// Fetch contests from LeetCode GraphQL API
const fetchLeetCodeContests = async () => {
  try {
    console.log('🔍 Fetching contests from LeetCode API...');
    
    const response = await axios.post(LEETCODE_API, {
      query: `{
        topTwoContests {
          title
          startTime
          duration
          cardImg
          titleSlug
        }
      }`
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    
    if (data.errors) {
      throw new Error('LeetCode GraphQL API returned errors');
    }

    console.log(`✅ Fetched ${data.data.topTwoContests?.length || 0} contests from LeetCode`);
    return data.data.topTwoContests || [];
  } catch (error) {
    console.error('❌ Error fetching LeetCode contests:', error.message);
    return [];
  }
};

// Parse and filter LeetCode contests
const parseLeetCodeContests = (data) => {
  const contests = [];

  data.forEach((element) => {
    const contest_name = element?.title || "LeetCode contest";
    const url = LEETCODE_BASE_URL + element?.titleSlug;

    const startMs = element?.startTime * 1000;
    const duration = Math.floor(element?.duration / 60) || 90; // minutes
    const endMs = startMs + duration * 60 * 1000;

    // Only include future contests
    if (startMs > Date.now()) {
      const contest = {
        name: contest_name,
        platform: 'leetcode',
        url: url,
        startTime: new Date(startMs),
        endTime: new Date(endMs),
        duration: duration,
        status: 'upcoming',
        description: `LeetCode Weekly/Biweekly Contest`,
        registrationRequired: false
      };

      contests.push(contest);
    }
  });

  console.log(`📋 Parsed ${contests.length} upcoming LeetCode contests`);
  return contests;
};

// Save contests to database
const saveContestsToDatabase = async (contests) => {
  try {
    let savedCount = 0;
    let updatedCount = 0;

    for (const contestData of contests) {
      const existingContest = await Contest.findOne({
        platform: contestData.platform,
        name: contestData.name
      });

      if (existingContest) {
        await Contest.findByIdAndUpdate(existingContest._id, contestData);
        updatedCount++;
      } else {
        const contest = new Contest(contestData);
        await contest.save();
        savedCount++;
      }
    }

    console.log(`💾 Saved ${savedCount} new contests, updated ${updatedCount} existing contests`);
    return { saved: savedCount, updated: updatedCount };
  } catch (error) {
    console.error('❌ Error saving contests to database:', error.message);
    throw error;
  }
};

// Main function to get and save LeetCode contests
const getLeetCodeContests = async () => {
  try {
    console.log('🚀 Starting LeetCode contest scraping...');
    
    const rawData = await fetchLeetCodeContests();
    
    if (rawData.length === 0) {
      console.log('⚠️ No contests fetched from LeetCode');
      return { success: false, message: 'No contests fetched' };
    }

    const parsedContests = parseLeetCodeContests(rawData);
    
    if (parsedContests.length === 0) {
      console.log('⚠️ No upcoming contests found');
      return { success: true, message: 'No upcoming contests', count: 0 };
    }

    const saveResult = await saveContestsToDatabase(parsedContests);
    
    console.log('🎉 LeetCode scraping completed successfully!');
    return {
      success: true,
      platform: 'leetcode',
      totalFetched: rawData.length,
      contestsParsed: parsedContests.length,
      saved: saveResult.saved,
      updated: saveResult.updated
    };
    
  } catch (error) {
    console.error('❌ Error in LeetCode scraping:', error.message);
    return {
      success: false,
      platform: 'leetcode',
      error: error.message
    };
  }
};

module.exports = {
  getLeetCodeContests,
  fetchLeetCodeContests,
  parseLeetCodeContests
};
