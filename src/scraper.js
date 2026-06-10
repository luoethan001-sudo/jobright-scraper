import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Scraper class for Jobright.ai with Gmail authentication
 * Handles both static and dynamic content scraping with login
 */
export class JobrightScraper {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://www.jobright.ai';
    this.headlessBrowser = config.headlessBrowser !== false;
    this.gmailEmail = config.gmailEmail || '';
    this.gmailPassword = config.gmailPassword || '';
    this.browserTimeout = config.browserTimeout || 30000;
    this.browser = null;
    this.jobs = [];
    this.isAuthenticated = false;
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
   * Login to Jobright.ai using Gmail
   */
  async loginWithGmail() {
    if (!this.gmailEmail || !this.gmailPassword) {
      throw new Error('Gmail credentials not provided. Set GMAIL_EMAIL and GMAIL_PASSWORD in .env');
    }

    if (!this.browser) {
      await this.initBrowser();
    }

    try {
      console.log('🔐 Attempting Gmail login...');
      const page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate to login page
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: this.browserTimeout });
      console.log('📍 Navigated to Jobright.ai');

      // Look for Gmail login button and click it
      console.log('🔍 Looking for Gmail login button...');
      
      // Try multiple selectors for Gmail login button
      const gmailButtonSelectors = [
        'button:has-text("Google")',
        'button:has-text("Gmail")',
        'a:has-text("Google")',
        '[data-testid="google-login"]',
        '.google-login',
        'button[type="button"]:contains("Google")',
        '.btn-google',
        'button:contains("Sign in with Google")'
      ];

      let clicked = false;
      for (const selector of gmailButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            console.log(`✓ Found Gmail button with selector: ${selector}`);
            await button.click();
            clicked = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!clicked) {
        console.warn('⚠ Gmail button not found. Trying alternative approach...');
        // Try to find any button with "Sign in" or "Google"
        const buttons = await page.$$('button, a');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && (text.includes('Google') || text.includes('Sign in'))) {
            await btn.click();
            clicked = true;
            console.log(`✓ Clicked button: ${text}`);
            break;
          }
        }
      }

      if (!clicked) {
        console.warn('⚠ Could not find Gmail login button');
      }

      // Wait for Gmail login window or redirect
      console.log('⏳ Waiting for Gmail authentication...');
      await page.waitForTimeout(2000);

      // Check if we got redirected to Google login
      const currentUrl = page.url();
      if (currentUrl.includes('accounts.google.com')) {
        console.log('📧 Redirected to Google login');
        
        // Enter email
        const emailInputSelectors = ['input[type="email"]', 'input[name="identifier"]'];
        let emailEntered = false;
        
        for (const selector of emailInputSelectors) {
          try {
            const emailInput = await page.$(selector);
            if (emailInput) {
              await emailInput.click();
              await page.keyboard.type(this.gmailEmail, { delay: 50 });
              console.log('✓ Email entered');
              emailEntered = true;
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        if (!emailEntered) {
          throw new Error('Could not find email input field');
        }

        // Click Next
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        // Enter password
        const passwordInputSelectors = ['input[type="password"]', 'input[name="password"]'];
        let passwordEntered = false;

        for (const selector of passwordInputSelectors) {
          try {
            const passwordInput = await page.$(selector);
            if (passwordInput) {
              await passwordInput.click();
              await page.keyboard.type(this.gmailPassword, { delay: 50 });
              console.log('✓ Password entered');
              passwordEntered = true;
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        if (!passwordEntered) {
          throw new Error('Could not find password input field');
        }

        // Click Next
        await page.keyboard.press('Enter');
        console.log('⏳ Authenticating with Google...');
        
        // Wait for redirect back to Jobright.ai
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.browserTimeout });
        } catch (e) {
          console.warn('⚠ Navigation timeout, but may have succeeded');
        }
      }

      await page.close();
      this.isAuthenticated = true;
      console.log('✓ Gmail authentication successful');
      return true;
    } catch (error) {
      console.error('✗ Gmail login failed:', error.message);
      this.isAuthenticated = false;
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

    // Login if not authenticated
    if (!this.isAuthenticated && this.gmailEmail) {
      try {
        await this.loginWithGmail();
      } catch (error) {
        console.warn('⚠ Login failed, attempting to scrape without authentication');
      }
    }

    try {
      const page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      console.log(`🔄 Loading: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.browserTimeout });

      // Wait for job listings to load - try multiple selectors
      const selectors = [
        '[data-testid="job-card"]',
        '.job-card',
        'article',
        '[class*="job"]',
        '[class*="JobCard"]'
      ];

      let jobsFound = false;
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✓ Found jobs with selector: ${selector}`);
          jobsFound = true;
          break;
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!jobsFound) {
        console.warn('⚠ Job card selector not found, attempting to scrape anyway');
      }

      // Extract job data
      const jobs = await page.evaluate(() => {
        const jobElements = document.querySelectorAll(
          '[data-testid="job-card"], .job-card, article, [class*="job"], [class*="JobCard"]'
        );
        
        return Array.from(jobElements).map((el) => {
          // Try to extract text from various possible selectors
          const titleEl = el.querySelector('h2, h3, h4, [class*="title"], [class*="Title"]');
          const companyEl = el.querySelector('[class*="company"], [class*="Company"], .company-name');
          const locationEl = el.querySelector('[class*="location"], [class*="Location"]');
          const salaryEl = el.querySelector('[class*="salary"], [class*="Salary"]');
          const descEl = el.querySelector('[class*="description"], [class*="Description"], p');
          const linkEl = el.querySelector('a[href*="/jobs/"], a[href*="job"]');

          return {
            title: titleEl?.textContent?.trim() || 'N/A',
            company: companyEl?.textContent?.trim() || 'N/A',
            location: locationEl?.textContent?.trim() || 'N/A',
            salary: salaryEl?.textContent?.trim() || 'N/A',
            description: descEl?.textContent?.trim()?.substring(0, 200) || 'N/A',
            url: linkEl?.href || 'N/A',
            postedDate: el.querySelector('[class*="date"], time')?.textContent?.trim() || 'N/A',
            scrapedAt: new Date().toISOString()
          };
        }).filter(job => job.title !== 'N/A' && job.url !== 'N/A');
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
      $('[data-testid="job-card"], .job-card, article, [class*="job"], [class*="JobCard"]').each((index, element) => {
        const job = {
          title: $(element).find('h2, h3, h4, [class*="title"]').text().trim() || 'N/A',
          company: $(element).find('[class*="company"], .company-name').text().trim() || 'N/A',
          location: $(element).find('[class*="location"]').text().trim() || 'N/A',
          salary: $(element).find('[class*="salary"]').text().trim() || 'N/A',
          description: $(element).find('[class*="description"], p').text().trim().substring(0, 200) || 'N/A',
          url: $(element).find('a[href*="/jobs/"], a[href*="job"]').attr('href') || 'N/A',
          postedDate: $(element).find('[class*="date"], time').text().trim() || 'N/A',
          scrapedAt: new Date().toISOString()
        };

        if (job.title !== 'N/A' && job.url !== 'N/A') {
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
