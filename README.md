# 🤖 Jobright.ai Web Scraping Bot

A real-time job posting scraper for Jobright.ai built with Node.js, Puppeteer, and Cheerio.

## Features

✨ **Real-time Scraping** - Continuously monitors Jobright.ai for new job postings
🔄 **Dual Scraping Modes** - Puppeteer for dynamic content + Cheerio for static content
💾 **Data Persistence** - Stores jobs in JSON with deduplication
📊 **CSV Export** - Export scraped data to CSV format
🎯 **Flexible Filtering** - Filter jobs by title, company, or location
⚙️ **Configurable** - Easy environment configuration
🛑 **Graceful Shutdown** - Proper cleanup of resources

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Internet connection

## Installation

```bash
# Clone the repository
git clone https://github.com/luoethan001-sudo/jobright-scraper.git
cd jobright-scraper

# Install dependencies
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your preferences:
```env
JOBRIGHT_URL=https://www.jobright.ai
SCRAPE_INTERVAL=300000          # 5 minutes in milliseconds
OUTPUT_FILE=jobs.json            # Where to save job data
LOG_LEVEL=info                   # Logging level
HEADLESS_BROWSER=true            # Run browser in headless mode
```

## Usage

### Start the scraper

```bash
npm start
```

### Development mode (auto-restart on file changes)

```bash
npm run dev
```

### Examples

**Using the scraper programmatically:**

```javascript
import JobrightScraper from './src/scraper.js';
import StorageManager from './src/storage.js';

const scraper = new JobrightScraper();
const storage = new StorageManager('jobs.json');

// Scrape jobs
const jobs = await scraper.scrape();

// Save jobs
await storage.saveJobs(jobs);

// Filter jobs
const filtered = scraper.getJobs({
  title: 'JavaScript',
  location: 'Remote'
});

console.log(filtered);

// Cleanup
await scraper.closeBrowser();
```

**Export to CSV:**

```javascript
const storage = new StorageManager('jobs.json');
await storage.exportToCSV('jobs_export.csv');
```

## Project Structure

```
jobright-scraper/
├── src/
│   ├── index.js          # Main entry point
│   ├── scraper.js        # Core scraping logic
│   ├── storage.js        # Data persistence
│   └── scheduler.js      # Task scheduling
├── .env.example          # Configuration template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
└── README.md             # This file
```

## How It Works

1. **Initialization** - Starts a headless browser and initializes storage
2. **Scheduling** - Sets up a recurring scrape task based on `SCRAPE_INTERVAL`
3. **Scraping** - Fetches job listings from Jobright.ai
4. **Storage** - Saves new jobs and deduplicates existing ones
5. **Monitoring** - Continues running until interrupted with Ctrl+C

## Troubleshooting

### Browser won't start
```bash
# Try disabling headless mode in .env
HEADLESS_BROWSER=false
```

### Selector not matching
Jobright.ai may change their HTML structure. Update the selectors in `src/scraper.js`:
```javascript
// Look for the actual CSS classes/IDs used by Jobright
$('[data-testid="job-card"]')  // Try different selectors
```

### Memory issues with long runs
Reduce `SCRAPE_INTERVAL` or add periodic browser restarts to `src/index.js`

### No jobs being scraped
1. Check if the URL is correct
2. Verify Jobright.ai HTML structure hasn't changed
3. Try disabling headless mode to visually debug
4. Check browser console logs

## API Reference

### JobrightScraper

**Methods:**
- `initBrowser()` - Initialize browser instance
- `scrape(url)` - Scrape jobs from URL
- `scrapeJobsWithBrowser(url)` - Puppeteer-based scraping
- `scrapeJobsWithAxios(url)` - Axios-based scraping
- `getJobs(filter)` - Get jobs with optional filtering
- `closeBrowser()` - Close browser instance

### StorageManager

**Methods:**
- `saveJobs(jobs)` - Save jobs to JSON
- `loadJobs()` - Load jobs from JSON
- `appendJobs(jobs)` - Append new jobs with deduplication
- `exportToCSV(filename)` - Export to CSV format

### Scheduler

**Methods:**
- `scheduleTask(name, fn, interval)` - Schedule a recurring task
- `cancelTask(name)` - Cancel a specific task
- `cancelAllTasks()` - Cancel all tasks
- `getScheduledTasks()` - Get list of scheduled tasks
- `getTaskCount()` - Get number of active tasks

## Legal & Ethical Considerations

⚠️ **Important**: Always check Jobright.ai's `robots.txt` and Terms of Service before scraping.

- Respect rate limits
- Don't overload the server
- Consider using their API if available
- Ensure compliance with local laws and regulations

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.
