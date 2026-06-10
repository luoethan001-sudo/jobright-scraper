/**
 * Scheduler for running scraping tasks at intervals
 */
export class Scheduler {
  constructor() {
    this.intervals = new Map();
    this.taskCount = 0;
  }

  /**
   * Schedule a task to run at regular intervals
   */
  scheduleTask(taskName, taskFunction, intervalMs) {
    try {
      const intervalId = setInterval(async () => {
        try {
          console.log(`\n⏱️  Running scheduled task: ${taskName}`);
          await taskFunction();
        } catch (error) {
          console.error(`✗ Task "${taskName}" failed:`, error.message);
        }
      }, intervalMs);

      this.intervals.set(taskName, intervalId);
      this.taskCount++;

      console.log(`✓ Scheduled "${taskName}" to run every ${intervalMs}ms`);
      
      // Run immediately on first schedule
      taskFunction().catch(error =>
        console.error(`✗ Initial task run failed: ${error.message}`)
      );

      return intervalId;
    } catch (error) {
      console.error('✗ Failed to schedule task:', error.message);
      throw error;
    }
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskName) {
    const intervalId = this.intervals.get(taskName);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(taskName);
      console.log(`✓ Cancelled task: ${taskName}`);
    } else {
      console.warn(`⚠ Task "${taskName}" not found`);
    }
  }

  /**
   * Cancel all scheduled tasks
   */
  cancelAllTasks() {
    for (const [taskName, intervalId] of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
    console.log(`✓ Cancelled all ${this.taskCount} scheduled tasks`);
  }

  /**
   * Get all scheduled tasks
   */
  getScheduledTasks() {
    return Array.from(this.intervals.keys());
  }

  /**
   * Get task count
   */
  getTaskCount() {
    return this.intervals.size;
  }
}

export default Scheduler;
