const axios = require('axios');
const cheerio = require('cheerio');
const Contest = require('../models/Contest');

const ATCODER_BASE_URL = "https://atcoder.jp";
const ATCODER_CONTESTS_PAGE = "https://atcoder.jp/contests/";

// Parse contest table from AtCoder HTML
const parseTable = ($, tbody) => {
  const contests = [];

  tbody.find('tr').each((index, element) => {
    const trElement = $(element);

    // Extract start time from href
    const startTimeHref = trElement.find('td').eq(0).find('a').attr('href');
    const startTimeIso = startTimeHref ? startTimeHref.split('=')[1].split('&')[0] : '';
    
    if (!startTimeIso) return; // Skip if no valid time
    
    // Format ISO string: YYYYMMDDTHHMM -> YYYY-MM-DDTHH:MM
    const formattedStartTimeIso = `${startTimeIso.substring(0, 4)}-${startTimeIso.substring(4, 6)}-${startTimeIso.substring(6, 8)}T${startTimeIso.substring(9, 11)}:${startTimeIso.substring(11)}`;
    
    // Extract contest details
    const contestLink = trElement.find('td').eq(1).find('a').attr('href');
    const contestName = trElement.find('td').eq(1).text()
      .replace('Ⓐ', '').replace('◉', '').replace('Ⓗ', '').trim();
    const duration = trElement.find('td').eq(2).text().trim();
    
    // Parse duration (HH:MM format)
    const [hours, minutes] = duration.split(':');
    const durationMinutes = Number(hours) * 60 + Number(minutes);
    
    // Convert JST to UTC
    const startTimeJST = new Date(formattedStartTimeIso);
    const startTime = new Date(startTimeJST.getTime() - (9 * 60 * 60 * 1000)); // JST to UTC
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    
    // Only include future contests
    if (startTime > new Date()) {
      contests.push({
        name: contestName,
        platform: 'atcoder',
        url: ATCODER_BASE_URL + (contestLink || ''),
        startTime: startTime,
        endTime: endTime,
        duration: durationMinutes,
        status: 'upcoming',
        description: `AtCoder Programming Contest`,
        registrationRequired: true
      });
    }
  });

  return contests;
};

// Fetch contests from AtCoder website
const fetchAtCoderContests = async () => {
  try {
    console.log('🔍 Fetching contests from AtCoder website...');
    
    const response = await axios.get(ATCODER_CONTESTS_PAGE, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    let contests = [];

    // Parse active contests table
    const tBodyActive = $('#contest-table-action').find('tbody');
    if (tBodyActive.length > 0) {
      contests = [...contests, ...parseTable($, tBodyActive)];
    }

    // Parse upcoming contests table
    const tbodyUpcoming = $('#contest-table-upcoming').find('tbody');
    if (tbodyUpcoming.length > 0) {
      contests = [...contests, ...parseTable($, tbodyUpcoming)];
    }

    console.log(`✅ Fetched ${contests.length} contests from AtCoder`);
    return contests;
  } catch (error) {
    console.error('❌ Error fetching AtCoder contests:', error.message);
    return [];
  }
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

// Main function to get and save AtCoder contests
const getAtCoderContests = async () => {
  try {
    console.log('🚀 Starting AtCoder contest scraping...');
    
    const contests = await fetchAtCoderContests();
    
    if (contests.length === 0) {
      console.log('⚠️ No upcoming contests found on AtCoder');
      return { success: true, message: 'No upcoming contests', count: 0 };
    }

    const saveResult = await saveContestsToDatabase(contests);
    
    console.log('🎉 AtCoder scraping completed successfully!');
    return {
      success: true,
      platform: 'atcoder',
      totalFetched: contests.length,
      contestsParsed: contests.length,
      saved: saveResult.saved,
      updated: saveResult.updated
    };
    
  } catch (error) {
    console.error('❌ Error in AtCoder scraping:', error.message);
    return {
      success: false,
      platform: 'atcoder',
      error: error.message
    };
  }
};

module.exports = {
  getAtCoderContests,
  fetchAtCoderContests,
  parseTable
};
