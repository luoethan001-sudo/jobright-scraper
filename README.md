# 🤖 Jobright.ai Web Scraping Bot with Gmail Login

A real-time job posting scraper for Jobright.ai built with Node.js, Puppeteer, and Cheerio. **Now with Gmail authentication support!**

## Features

✨ **Real-time Scraping** - Continuously monitors Jobright.ai for new job postings
🔐 **Gmail Authentication** - Automatically logs in with your Gmail account
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
- Gmail account
- Gmail App Password (for authentication)

## Installation

```bash
# Clone the repository
git clone https://github.com/luoethan001-sudo/jobright-scraper.git
cd jobright-scraper

# Install dependencies
npm install
```

## Setup Gmail Authentication

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to your [Google Account](https://myaccount.google.com/)
2. Click **Security** in the left menu
3. Scroll to **How you sign in to Google**
4. Enable **2-Step Verification**

### Step 2: Create an App Password
1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Find **App passwords** (appears after enabling 2FA)
3. Select **Mail** and **Windows Computer** (or your device)
4. Google will generate a 16-character password
5. Copy this password

### Step 3: Configure Your Bot
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:
```env
JOBRIGHT_URL=https://www.jobright.ai
SCRAPE_INTERVAL=300000

# Gmail Login (required for authenticated access)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Your 16-char App Password (with/without spaces)

# Browser settings
HEADLESS_BROWSER=false              # Set to 'true' for headless mode
BROWSER_TIMEOUT=30000               # Timeout in milliseconds
```

⚠️ **Security Note**: 
- Never commit `.env` file to git (it's in `.gitignore`)
- The App Password is less secure than your main password - use it only for this bot
- You can revoke the App Password anytime from Google Account settings

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

**Using the scraper programmatically with Gmail:**

```javascript
import JobrightScraper from './src/scraper.js';
import StorageManager from './src/storage.js';

const scraper = new JobrightScraper({
  gmailEmail: 'your-email@gmail.com',
  gmailPassword: 'your-app-password'
});

const storage = new StorageManager('jobs.json');

// Initialize browser and login
await scraper.initBrowser();
await scraper.loginWithGmail();

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
│   ├── index.js          # Main entry point with Gmail config
│   ├── scraper.js        # Core scraping logic with Gmail auth
│   ├── storage.js        # Data persistence
│   └── scheduler.js      # Task scheduling
├── .env.example          # Configuration template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
└── README.md             # This file
```

## How It Works

1. **Initialization** - Starts a headless browser and loads configuration
2. **Authentication** - Logs in to Jobright.ai using your Gmail account
3. **Scheduling** - Sets up a recurring scrape task based on `SCRAPE_INTERVAL`
4. **Scraping** - Fetches job listings from authenticated session
5. **Storage** - Saves new jobs and deduplicates existing ones
6. **Monitoring** - Continues running until interrupted with Ctrl+C

## Troubleshooting

### "Gmail credentials not provided"
- Make sure `GMAIL_EMAIL` and `GMAIL_PASSWORD` are set in `.env`
- Ensure you're using an App Password, not your main Gmail password

### Login fails with "Could not find email input field"
- Google's login flow may have changed
- Try disabling headless mode: `HEADLESS_BROWSER=false`
- This lets you see what's happening during login

### Browser won't start
```bash
# Try disabling headless mode in .env
HEADLESS_BROWSER=false

# Increase timeout if needed
BROWSER_TIMEOUT=60000
```

### "No jobs being scraped"
1. Check if Gmail login is successful (watch the browser)
2. Verify selectors match Jobright.ai's current HTML
3. Check if you're logged in properly
4. Try disabling headless mode to debug

### "2FA required" error
- Make sure 2-Factor Authentication is enabled before creating an App Password
- Check that you're using a valid App Password (16 characters)

## API Reference

### JobrightScraper

**Methods:**
- `initBrowser()` - Initialize browser instance
- `loginWithGmail()` - Authenticate using Gmail credentials
- `scrape(url)` - Scrape jobs from URL (auto-logs in if needed)
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

- Respect rate limits (default: 5 minute interval)
- Don't overload the server
- Consider using their API if available
- Ensure compliance with local laws and regulations
- Your Gmail account is your responsibility - keep credentials secure

## Security Best Practices

1. ✅ Use **App Passwords**, not your main Gmail password
2. ✅ Never share your `.env` file
3. ✅ Keep `.env` in `.gitignore` (already configured)
4. ✅ Revoke the App Password when no longer needed
5. ✅ Consider using a dedicated Gmail account for scraping
6. ✅ Use environment variables in production, not hardcoded values

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.

---

**Happy Scraping! 🚀**
