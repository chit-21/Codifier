# 🔧 Standalone Contest Scrapers

This directory contains standalone contest scrapers that work independently without requiring a database. These scrapers can be used for testing, development, or as standalone utilities.

## 🚀 Quick Start

### Installation
```bash
# Install dependencies
npm install

# Or use the new package.json
cp package-new.json package.json
npm install
```

### Usage

#### Scrape All Platforms
```bash
node standalone-scrapers.js --all
```

#### Scrape Specific Platform
```bash
node standalone-scrapers.js --platform=codeforces
node standalone-scrapers.js --platform=leetcode
node standalone-scrapers.js --platform=codechef
node standalone-scrapers.js --platform=gfg
node standalone-scrapers.js --platform=codingninjas
```

#### Test Scrapers
```bash
node test-scrapers.js
```

## 📁 Output

Scraped data is saved to `contest-data/` directory:
- `codeforces-contests.json`
- `leetcode-contests.json`
- `codechef-contests.json`
- `gfg-contests.json`
- `codingninjas-contests.json`
- `all-platforms-contests.json` (combined)

## 🔧 Features

### ✅ Working Scrapers
- **Codeforces**: Uses official API
- **LeetCode**: Uses GraphQL API
- **CodeChef**: Uses public API
- **GeeksforGeeks**: Uses practice API
- **CodingNinjas**: Uses public API

### ⚠️ Limitations
- **AtCoder**: Requires web scraping (not implemented)

## 📊 Data Format

Each contest object contains:
```json
{
  "id": "cf_1234",
  "name": "Contest Name",
  "platform": "codeforces",
  "url": "https://codeforces.com/contest/1234",
  "startTime": "2024-01-01T10:00:00.000Z",
  "endTime": "2024-01-01T12:00:00.000Z",
  "duration": 120,
  "status": "upcoming",
  "registrationRequired": true
}
```

## 🔄 Migration from Database Version

The Chrome extension now uses these scrapers directly in the background script instead of relying on a database server. This provides:

- ✅ **No Database Required**: All data stored in Chrome's local storage
- ✅ **Faster Performance**: Direct API calls without server overhead
- ✅ **Better Reliability**: No server downtime issues
- ✅ **Privacy**: All data stays local to the user

## 🛠️ Development

### Adding New Platforms

1. Add scraper method to `StandaloneContestScraper` class
2. Add platform to CLI options
3. Add test case to `test-scrapers.js`
4. Update the Chrome extension's `contest-scraper.js`

### Testing Individual Scrapers

```javascript
const StandaloneContestScraper = require('./standalone-scrapers');

const scraper = new StandaloneContestScraper();
scraper.scrapeCodeforces().then(contests => {
  console.log('Found contests:', contests.length);
});
```

## 📝 Notes

- Scrapers include rate limiting and respectful delays
- All scrapers handle errors gracefully
- Data is automatically timestamped
- Contests are filtered to show only recent/upcoming ones