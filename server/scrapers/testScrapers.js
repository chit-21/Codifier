const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/scraper';
const platforms = [
  'codeforces',
  'leetcode',
  'atcoder',
  'codechef',
  'gfg',
  'codingninjas'
];

async function testScrapers() {
  for (const platform of platforms) {
    try {
      console.log(`Testing ${platform} scraper...`);
      const res = await axios.post(`${BASE_URL}/${platform}`);
      console.log(`${platform}:`, res.data);
    } catch (err) {
      if (err.response) {
        console.error(`${platform} failed:`, err.response.data);
      } else {
        console.error(`${platform} failed:`, err.message);
          }
    }
  }
}

testScrapers();