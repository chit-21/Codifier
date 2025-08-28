const axios = require('axios');

const GFG_BASE_URL = "https://practice.geeksforgeeks.org/contest/";
const GFG_API = "https://practiceapi.geeksforgeeks.org/api/vr/events/?page_number=1&sub_type=all&type=contest";

// Fetch contests from GeeksforGeeks API
const fetchGFGContests = async () => {
  try {
    console.log('Fetching contests from GeeksforGeeks API...');
    
    const response = await axios.get(GFG_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    let result = [];
    
    // Get upcoming contests
    if (data?.results?.upcoming) {
      result = data.results.upcoming;
    }

    console.log(`Fetched ${result.length} contests from GeeksforGeeks`);
    return result;
  } catch (error) {
    console.error('Error fetching GeeksforGeeks contests:', error.message);
    return [];
  }
};

// Parse and filter GeeksforGeeks contests
const parseGFGContests = (data) => {
  const contests = [];

  data.forEach((element) => {
    const contest_name = element?.name || "GeeksforGeeks contest";
    const url = GFG_BASE_URL + element?.slug;

    // Convert IST to UTC (subtract 5.5 hours)
    const startDate = new Date(new Date(element?.start_time).getTime() - (5.5 * 60 * 60 * 1000));
    const endDate = new Date(new Date(element?.end_time).getTime() - (5.5 * 60 * 60 * 1000));
    
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const duration = Math.abs(endMs - startMs) / (1000 * 60) || 120; // minutes

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
        platform: 'gfg',
        url: url,
        startTime: startDate,
        endTime: endDate,
        duration: Math.floor(duration),
        status: status,
        description: `GeeksforGeeks Programming Contest`,
        registrationRequired: true
      };

      contests.push(contest);
    }
  });

  console.log(`Parsed ${contests.length} upcoming/live GeeksforGeeks contests`);
  return contests;
};

// Save contests to database
// const saveContestsToDatabase = async (contests) => {
//   try {
//     let savedCount = 0;
//     let updatedCount = 0;

//     for (const contestData of contests) {
//       const existingContest = await Contest.findOne({
//         platform: contestData.platform,
//         name: contestData.name
//       });

//       if (existingContest) {
//         await Contest.findByIdAndUpdate(existingContest._id, contestData);
//         updatedCount++;
//       } else {
//         const contest = new Contest(contestData);
//         await contest.save();
//         savedCount++;
//       }
//     }

//     console.log(`Saved ${savedCount} new contests, updated ${updatedCount} existing contests`);
//     return { saved: savedCount, updated: updatedCount };
//   } catch (error) {
//     console.error('Error saving contests to database:', error.message);
//     throw error;
//   }
// };

// Main function to get GeeksforGeeks contests (database-free)
const getGFGContests = async () => {
  try {
    console.log('Starting GeeksforGeeks contest scraping...');
    const rawData = await fetchGFGContests();
    if (rawData.length === 0) {
      console.log('No contests fetched from GeeksforGeeks');
      return [];
    }
    const parsedContests = parseGFGContests(rawData);
    if (parsedContests.length === 0) {
      console.log('No upcoming/live contests found');
      return [];
    }
    return parsedContests;
  } catch (error) {
    console.error('Error in GeeksforGeeks scraping:', error.message);
    return [];
  }
};

module.exports = {
  getGFGContests,
  fetchGFGContests,
  parseGFGContests
};
