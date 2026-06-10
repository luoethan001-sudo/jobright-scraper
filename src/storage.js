import fs from 'fs/promises';
import path from 'path';

/**
 * Storage handler for job data
 */
export class StorageManager {
  constructor(filePath = 'jobs.json') {
    this.filePath = filePath;
  }

  /**
   * Save jobs to JSON file
   */
  async saveJobs(jobs) {
    try {
      const data = {
        totalJobs: jobs.length,
        lastUpdated: new Date().toISOString(),
        jobs: jobs
      };

      await fs.writeFile(
        this.filePath,
        JSON.stringify(data, null, 2),
        'utf8'
      );
      console.log(`✓ Saved ${jobs.length} jobs to ${this.filePath}`);
    } catch (error) {
      console.error('✗ Failed to save jobs:', error.message);
      throw error;
    }
  }

  /**
   * Load jobs from JSON file
   */
  async loadJobs() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`✓ Loaded ${parsed.jobs.length} jobs from ${this.filePath}`);
      return parsed.jobs;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`ℹ No existing jobs file found at ${this.filePath}`);
        return [];
      }
      console.error('✗ Failed to load jobs:', error.message);
      throw error;
    }
  }

  /**
   * Append new jobs to existing data (avoid duplicates)
   */
  async appendJobs(newJobs) {
    try {
      const existing = await this.loadJobs();
      
      // Merge and deduplicate by URL
      const urlSet = new Set(existing.map(job => job.url));
      const uniqueNewJobs = newJobs.filter(job => !urlSet.has(job.url));

      const merged = [...existing, ...uniqueNewJobs];
      await this.saveJobs(merged);

      console.log(`✓ Added ${uniqueNewJobs.length} new jobs (${urlSet.size} duplicates removed)`);
      return merged;
    } catch (error) {
      console.error('✗ Failed to append jobs:', error.message);
      throw error;
    }
  }

  /**
   * Export jobs to CSV
   */
  async exportToCSV(filename = 'jobs.csv') {
    try {
      const jobs = await this.loadJobs();
      
      if (jobs.length === 0) {
        console.log('ℹ No jobs to export');
        return;
      }

      const headers = Object.keys(jobs[0]);
      const csv = [
        headers.join(','),
        ...jobs.map(job =>
          headers.map(header => {
            const value = job[header];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      await fs.writeFile(filename, csv, 'utf8');
      console.log(`✓ Exported ${jobs.length} jobs to ${filename}`);
    } catch (error) {
      console.error('✗ Failed to export to CSV:', error.message);
      throw error;
    }
  }
}

export default StorageManager;
