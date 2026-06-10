import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Scraper class for Jobright.ai
 * Handles both static and dynamic content scraping
 */
export class JobrightScraper {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://www.jobright.ai';
    this.headlessBrowser = config.headlessBrowser !== false;
    this.browser = null;
    this.jobs = [];
  }

  /**
   * Initialize browser instance for dynamic content
   */
  async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: this.headlessBrowser,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('✓ Browser initialized');
    } catch (error) {
      console.error('✗ Failed to initialize browser:', error.message);
      throw error;
    }
  }

  /**
   * Scrape job listings using Puppeteer for dynamic content
   */
  async scrapeJobsWithBrowser(url) {
    if (!this.browser) {
      await this.initBrowser();
    }

    try {
      const page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      console.log(`🔄 Loading: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for job listings to load
      await page.waitForSelector('[data-testid="job-card"], .job-card, article', {
        timeout: 10000
      }).catch(() => console.log('⚠ Job card selector not found, attempting alternative'));

      // Extract job data
      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll(
          '[data-testid="job-card"], .job-card, article'
        );
        
        return Array.from(jobElements).map((el) => {
          return {
            title: el.querySelector('h2, h3, [class*="title"]')?.textContent?.trim() || 'N/A',
            company: el.querySelector('[class*="company"], .company-name')?.textContent?.trim() || 'N/A',
            location: el.querySelector('[class*="location"]')?.textContent?.trim() || 'N/A',
            salary: el.querySelector('[class*="salary"]')?.textContent?.trim() || 'N/A',
            description: el.querySelector('[class*="description"], p')?.textContent?.trim() || 'N/A',
            url: el.querySelector('a')?.href || 'N/A',
            postedDate: el.querySelector('[class*="date"]')?.textContent?.trim() || 'N/A',
            scrapedAt: new Date().toISOString()
          };
        });
      });

      await page.close();
      return jobs;
    } catch (error) {
      console.error('✗ Scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Scrape job listings using Axios + Cheerio for static content
   */
  async scrapeJobsWithAxios(url) {
    try {
      console.log(`🔄 Loading: ${url}`);
      
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(data);
      const jobs = [];

      // Adjust selectors based on actual Jobright.ai structure
      $('[data-testid="job-card"], .job-card, article').each((index, element) => {
        const job = {
          title: $(element).find('h2, h3, [class*="title"]').text().trim() || 'N/A',
          company: $(element).find('[class*="company"], .company-name').text().trim() || 'N/A',
          location: $(element).find('[class*="location"]').text().trim() || 'N/A',
          salary: $(element).find('[class*="salary"]').text().trim() || 'N/A',
          description: $(element).find('[class*="description"], p').text().trim() || 'N/A',
          url: $(element).find('a').attr('href') || 'N/A',
          postedDate: $(element).find('[class*="date"]').text().trim() || 'N/A',
          scrapedAt: new Date().toISOString()
        };

        if (job.title !== 'N/A') {
          jobs.push(job);
        }
      });

      return jobs;
    } catch (error) {
      console.error('✗ Axios scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Main scrape method - tries both approaches
   */
  async scrape(url = this.baseUrl) {
    try {
      // Try Puppeteer first for dynamic content
      const jobs = await this.scrapeJobsWithBrowser(url);
      this.jobs = jobs;
      console.log(`✓ Scraped ${jobs.length} job listings`);
      return jobs;
    } catch (error) {
      console.warn('⚠ Browser scraping failed, attempting Axios fallback...');
      try {
        const jobs = await this.scrapeJobsWithAxios(url);
        this.jobs = jobs;
        console.log(`✓ Scraped ${jobs.length} job listings (via Axios)`);
        return jobs;
      } catch (fallbackError) {
        console.error('✗ All scraping methods failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  /**
   * Get jobs with optional filtering
   */
  getJobs(filter = {}) {
    let filtered = [...this.jobs];

    if (filter.title) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(filter.title.toLowerCase())
      );
    }

    if (filter.company) {
      filtered = filtered.filter(job =>
        job.company.toLowerCase().includes(filter.company.toLowerCase())
      );
    }

    if (filter.location) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(filter.location.toLowerCase())
      );
    }

    return filtered;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('✓ Browser closed');
    }
  }
}

export default JobrightScraper;
