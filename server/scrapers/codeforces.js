const axios = require('axios');

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




// Main function to get Codeforces contests (database-free)
const getCodeforcesContests = async () => {
  try {
    console.log(' Starting Codeforces contest scraping...');
    // Fetch raw data from API
    const rawData = await fetchCodeforcesContests();
    if (rawData.length === 0) {
      console.log(' No contests fetched from Codeforces');
      return [];
    }
    // Parse and filter contests
    const parsedContests = parseCodeforcesContests(rawData);
    if (parsedContests.length === 0) {
      console.log(' No upcoming/live contests found');
      return [];
    }
    return parsedContests;
  } catch (error) {
    console.error(' Error in Codeforces scraping:', error.message);
    return [];
  }
};

// Export the main function
module.exports = {
  getCodeforcesContests,
  fetchCodeforcesContests,
  parseCodeforcesContests
};