const axios = require('axios');

const CODING_NINJA_BASE_URL = "https://www.naukri.com/code360/contests/";
const CODING_NINJA_API = "https://api.codingninjas.com/api/v4/public_section/contest_list";

// Fetch contests from CodingNinjas API
const fetchCodingNinjasContests = async () => {
  try {
    console.log('Fetching contests from CodingNinjas API...');
    
    const response = await axios.get(CODING_NINJA_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    
    if (data?.data?.events) {
      console.log(`Fetched ${data.data.events.length} contests from CodingNinjas`);
      return data.data.events;
    }
    
    console.log('No events found in CodingNinjas API response');
    return [];
  } catch (error) {
    console.error('Error fetching CodingNinjas contests:', error.message);
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

  console.log(`Parsed ${contests.length} upcoming/live CodingNinjas contests`);
  return contests;
};



// Main function to get CodingNinjas contests (database-free)
const getCodingNinjasContests = async () => {
  try {
    console.log('Starting CodingNinjas contest scraping...');
    const rawData = await fetchCodingNinjasContests();
    if (rawData.length === 0) {
      console.log('No contests fetched from CodingNinjas');
      return [];
    }
    const parsedContests = parseCodingNinjasContests(rawData);
    if (parsedContests.length === 0) {
      console.log('No upcoming/live contests found');
      return [];
    }
    return parsedContests;
  } catch (error) {
    console.error('Error in CodingNinjas scraping:', error.message);
    return [];
  }
};

module.exports = {
  getCodingNinjasContests,
  fetchCodingNinjasContests,
  parseCodingNinjasContests
};
