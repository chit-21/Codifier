const axios = require('axios');
const Contest = require('../models/Contest');

const CODECHEF_BASE_URL = "https://www.codechef.com/";
const CODECHEF_API = "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all";

// Fetch contests from CodeChef API
const fetchCodeChefContests = async () => {
  try {
    console.log('🔍 Fetching contests from CodeChef API...');
    
    const response = await axios.get(CODECHEF_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    let result = [];
    
    // Combine present and future contests
    if (data?.present_contests) {
      result = [...result, ...data.present_contests];
    }
    if (data?.future_contests) {
      result = [...result, ...data.future_contests];
    }

    console.log(`✅ Fetched ${result.length} contests from CodeChef`);
    return result;
  } catch (error) {
    console.error('❌ Error fetching CodeChef contests:', error.message);
    return [];
  }
};

// Parse and filter CodeChef contests
const parseCodeChefContests = (data) => {
  const contests = [];

  data.forEach((element) => {
    const contest_name = element?.contest_name || "CodeChef contest";
    const url = CODECHEF_BASE_URL + element?.contest_code;

    const startMs = new Date(element?.contest_start_date_iso).getTime();
    const endMs = new Date(element?.contest_end_date_iso).getTime();
    const duration = Math.floor((endMs - startMs) / (1000 * 60)) || 120; // minutes

    // Determine status based on current time
    const now = Date.now();
    let status = 'upcoming';
    if (now >= startMs && now <= endMs) {
      status = 'live';
    } else if (now > endMs) {
      status = 'ended';
    }

    // Only include upcoming and live contests
    if (status === 'upcoming' || status === 'live') {
      const contest = {
        name: contest_name,
        platform: 'codechef',
        url: url,
        startTime: new Date(startMs),
        endTime: new Date(endMs),
        duration: duration,
        status: status,
        description: `CodeChef Programming Contest - ${element?.contest_code || ''}`,
        registrationRequired: true
      };

      contests.push(contest);
    }
  });

  console.log(`📋 Parsed ${contests.length} upcoming/live CodeChef contests`);
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

// Main function to get and save CodeChef contests
const getCodeChefContests = async () => {
  try {
    console.log('🚀 Starting CodeChef contest scraping...');
    
    const rawData = await fetchCodeChefContests();
    
    if (rawData.length === 0) {
      console.log('⚠️ No contests fetched from CodeChef');
      return { success: false, message: 'No contests fetched' };
    }

    const parsedContests = parseCodeChefContests(rawData);
    
    if (parsedContests.length === 0) {
      console.log('⚠️ No upcoming/live contests found');
      return { success: true, message: 'No upcoming contests', count: 0 };
    }

    const saveResult = await saveContestsToDatabase(parsedContests);
    
    console.log('🎉 CodeChef scraping completed successfully!');
    return {
      success: true,
      platform: 'codechef',
      totalFetched: rawData.length,
      contestsParsed: parsedContests.length,
      saved: saveResult.saved,
      updated: saveResult.updated
    };
    
  } catch (error) {
    console.error('❌ Error in CodeChef scraping:', error.message);
    return {
      success: false,
      platform: 'codechef',
      error: error.message
    };
  }
};

module.exports = {
  getCodeChefContests,
  fetchCodeChefContests,
  parseCodeChefContests
};
