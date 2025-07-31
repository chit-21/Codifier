const axios = require('axios');
const Contest = require('../models/Contest');

const CODING_NINJA_BASE_URL = "https://www.naukri.com/code360/contests/";
const CODING_NINJA_API = "https://api.codingninjas.com/api/v4/public_section/contest_list";

// Fetch contests from CodingNinjas API
const fetchCodingNinjasContests = async () => {
  try {
    console.log('🔍 Fetching contests from CodingNinjas API...');
    
    const response = await axios.get(CODING_NINJA_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    
    if (data?.data?.events) {
      console.log(`✅ Fetched ${data.data.events.length} contests from CodingNinjas`);
      return data.data.events;
    }
    
    console.log('⚠️ No events found in CodingNinjas API response');
    return [];
  } catch (error) {
    console.error('❌ Error fetching CodingNinjas contests:', error.message);
    return [];
  }
};

// Parse and filter CodingNinjas contests
const parseCodingNinjasContests = (data) => {
  const contests = [];

  data.forEach((element) => {
    const contest_name = element?.name || "CodingNinjas contest";
    const url = CODING_NINJA_BASE_URL + element?.slug;

    const startMs = new Date(element?.event_start_time * 1000).getTime();
    const endMs = new Date(element?.event_end_time * 1000).getTime();
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
        platform: 'codingninjas',
        url: url,
        startTime: new Date(startMs),
        endTime: new Date(endMs),
        duration: duration,
        status: status,
        description: `CodingNinjas Programming Contest`,
        registrationRequired: true
      };

      contests.push(contest);
    }
  });

  console.log(`📋 Parsed ${contests.length} upcoming/live CodingNinjas contests`);
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

// Main function to get and save CodingNinjas contests
const getCodingNinjasContests = async () => {
  try {
    console.log('🚀 Starting CodingNinjas contest scraping...');
    
    const rawData = await fetchCodingNinjasContests();
    
    if (rawData.length === 0) {
      console.log('⚠️ No contests fetched from CodingNinjas');
      return { success: false, message: 'No contests fetched' };
    }

    const parsedContests = parseCodingNinjasContests(rawData);
    
    if (parsedContests.length === 0) {
      console.log('⚠️ No upcoming/live contests found');
      return { success: true, message: 'No upcoming contests', count: 0 };
    }

    const saveResult = await saveContestsToDatabase(parsedContests);
    
    console.log('🎉 CodingNinjas scraping completed successfully!');
    return {
      success: true,
      platform: 'codingninjas',
      totalFetched: rawData.length,
      contestsParsed: parsedContests.length,
      saved: saveResult.saved,
      updated: saveResult.updated
    };
    
  } catch (error) {
    console.error('❌ Error in CodingNinjas scraping:', error.message);
    return {
      success: false,
      platform: 'codingninjas',
      error: error.message
    };
  }
};

module.exports = {
  getCodingNinjasContests,
  fetchCodingNinjasContests,
  parseCodingNinjasContests
};
