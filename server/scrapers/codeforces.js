const axios = require('axios');
const Contest = require('../models/Contest');

const CODEFORCES_BASE_URL = "https://codeforces.com/contest/";
const CODEFORCES_API = "https://codeforces.com/api/contest.list";

// Fetch contests from Codeforces API
const fetchCodeforcesContests = async () => {
  try {
    console.log(' Fetching contests from Codeforces API...');
    const response = await axios.get(CODEFORCES_API);
    const data = response.data;

    if (data.status !== 'OK') {
      throw new Error('Codeforces API returned error status');
    }

    console.log(` Fetched ${data.result.length} contests from Codeforces`);
    return data.result || [];
  } catch (error) {
    console.error(' Error fetching Codeforces contests:', error.message);
    return [];
  }
};

// Parse and filter Codeforces contests
const parseCodeforcesContests = (data) => {
  const contests = [];

  data.forEach((element) => {
    // Only get upcoming and live contests
    if (element.phase === "BEFORE" || element.phase === "CODING") {
      const contest_name = element?.name || "Codeforces contest";
      const url = CODEFORCES_BASE_URL + element?.id;

      const startMs = element?.startTimeSeconds * 1000;
      const duration = Math.floor(element?.durationSeconds / 60) || 120; // minutes
      const endMs = startMs + duration * 60 * 1000;

      // Determine status based on phase
      let status = 'upcoming';
      if (element.phase === 'CODING') {
        status = 'live';
      }

      const contest = {
        name: contest_name,
        platform: 'codeforces',
        url: url,
        startTime: new Date(startMs),
        endTime: new Date(endMs),
        duration: duration,
        status: status,
        description: `Codeforces contest - ${element.type || 'Programming Contest'}`,
        registrationRequired: true
      };

      contests.push(contest);
    }
  });

  console.log(` Parsed ${contests.length} upcoming/live Codeforces contests`);
  return contests;
};

// Save contests to database
const saveContestsToDatabase = async (contests) => {
  try {
    let savedCount = 0;
    let updatedCount = 0;

    for (const contestData of contests) {
      // Check if contest already exists (by platform and name)
      const existingContest = await Contest.findOne({
        platform: contestData.platform,
        name: contestData.name
      });

      if (existingContest) {
        // Update existing contest
        await Contest.findByIdAndUpdate(existingContest._id, contestData);
        updatedCount++;
      } else {
        // Create new contest
        const contest = new Contest(contestData);
        await contest.save();
        savedCount++;
      }
    }

    console.log(` Saved ${savedCount} new contests, updated ${updatedCount} existing contests`);
    return { saved: savedCount, updated: updatedCount };
  } catch (error) {
    console.error(' Error saving contests to database:', error.message);
    throw error;
  }
};

// Main function to get and save Codeforces contests
const getCodeforcesContests = async () => {
  try {
    console.log(' Starting Codeforces contest scraping...');
    
    // Fetch raw data from API
    const rawData = await fetchCodeforcesContests();
    
    if (rawData.length === 0) {
      console.log(' No contests fetched from Codeforces');
      return { success: false, message: 'No contests fetched' };
    }

    // Parse and filter contests
    const parsedContests = parseCodeforcesContests(rawData);
    
    if (parsedContests.length === 0) {
      console.log(' No upcoming/live contests found');
      return { success: true, message: 'No upcoming contests', count: 0 };
    }

    // Save to database
    const saveResult = await saveContestsToDatabase(parsedContests);
    
    console.log(' Codeforces scraping completed successfully!');
    return {
      success: true,
      platform: 'codeforces',
      totalFetched: rawData.length,
      contestsParsed: parsedContests.length,
      saved: saveResult.saved,
      updated: saveResult.updated
    };
    
  } catch (error) {
    console.error(' Error in Codeforces scraping:', error.message);
    return {
      success: false,
      platform: 'codeforces',
      error: error.message
    };
  }
};

// Export the main function
module.exports = {
  getCodeforcesContests,
  fetchCodeforcesContests,
  parseCodeforcesContests
};