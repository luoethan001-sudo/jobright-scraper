import dotenv from 'dotenv';
import JobrightScraper from './scraper.js';
import StorageManager from './storage.js';
import Scheduler from './scheduler.js';

// Load environment variables
dotenv.config();

const CONFIG = {
  jobright_url: process.env.JOBRIGHT_URL || 'https://www.jobright.ai',
  scrape_interval: parseInt(process.env.SCRAPE_INTERVAL) || 300000, // 5 minutes
  output_file: process.env.OUTPUT_FILE || 'jobs.json',
  headless_browser: process.env.HEADLESS_BROWSER === 'true',
  gmail_email: process.env.GMAIL_EMAIL || '',
  gmail_password: process.env.GMAIL_PASSWORD || '',
  browser_timeout: parseInt(process.env.BROWSER_TIMEOUT) || 30000
};

// Initialize components
const scraper = new JobrightScraper({
  baseUrl: CONFIG.jobright_url,
  headlessBrowser: CONFIG.headless_browser,
  gmailEmail: CONFIG.gmail_email,
  gmailPassword: CONFIG.gmail_password,
  browserTimeout: CONFIG.browser_timeout
});

const storage = new StorageManager(CONFIG.output_file);
const scheduler = new Scheduler();

/**
 * Main scraping task
 */
async function scrapeAndStore() {
  try {
    const jobs = await scraper.scrape(CONFIG.jobright_url);
    
    if (jobs.length > 0) {
      await storage.appendJobs(jobs);
    } else {
      console.warn('⚠ No jobs scraped');
    }
  } catch (error) {
    console.error('✗ Scrape and store failed:', error.message);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  scheduler.cancelAllTasks();
  await scraper.closeBrowser();
  console.log('✓ Cleanup complete');
  process.exit(0);
}

/**
 * Initialize and start the bot
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Jobright.ai Job Scraping Bot Started');
  console.log('='.repeat(60));
  console.log(`📍 Target URL: ${CONFIG.jobright_url}`);
  console.log(`⏱️  Scrape Interval: ${CONFIG.scrape_interval}ms (${CONFIG.scrape_interval / 1000}s)`);
  console.log(`💾 Output File: ${CONFIG.output_file}`);
  console.log(`🔐 Gmail Auth: ${CONFIG.gmail_email ? '✓ Enabled' : '✗ Disabled'}`);
  console.log(`🎨 Headless Mode: ${CONFIG.headless_browser ? '✓ On' : '✗ Off'}`);
  console.log('='.repeat(60));

  // Validate Gmail credentials if provided
  if (CONFIG.gmail_email && !CONFIG.gmail_password) {
    console.warn('⚠ Gmail email provided but password is missing!');
    console.log('📌 Set GMAIL_PASSWORD in .env file');
  }

  // Set up signal handlers
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // Initialize browser
    await scraper.initBrowser();

    // Schedule recurring scrape task
    scheduler.scheduleTask(
      'scrape-jobright',
      scrapeAndStore,
      CONFIG.scrape_interval
    );

    console.log('\n✓ Bot is running. Press Ctrl+C to stop.\n');
  } catch (error) {
    console.error('✗ Failed to start bot:', error.message);
    await shutdown();
  }
}

// Start the bot
main().catch(error => {
  console.error('✗ Fatal error:', error.message);
  process.exit(1);
});
