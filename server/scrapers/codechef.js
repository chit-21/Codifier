const axios = require('axios');

const CODECHEF_BASE_URL = "https://www.codechef.com/";
const CODECHEF_API = "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all";

// Fetch contests from CodeChef API
const fetchCodeChefContests = async () => {
  try {
    console.log('Fetching contests from CodeChef API...');
    
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

    console.log(`Fetched ${result.length} contests from CodeChef`);
    return result;
  } catch (error) {
    console.error('Error fetching CodeChef contests:', error.message);
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

  console.log(`Parsed ${contests.length} upcoming/live CodeChef contests`);
  return contests;
};




// Main function to get CodeChef contests (database-free)
const getCodeChefContests = async () => {
  try {
    console.log('Starting CodeChef contest scraping...');
    const rawData = await fetchCodeChefContests();
    if (rawData.length === 0) {
      console.log('No contests fetched from CodeChef');
      return [];
    }
    const parsedContests = parseCodeChefContests(rawData);
    if (parsedContests.length === 0) {
      console.log('No upcoming/live contests found');
      return [];
    }
    return parsedContests;
  } catch (error) {
    console.error('Error in CodeChef scraping:', error.message);
    return [];
  }
};

module.exports = {
  getCodeChefContests,
  fetchCodeChefContests,
  parseCodeChefContests
};
