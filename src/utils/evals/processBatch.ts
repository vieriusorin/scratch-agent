import type { Scorer } from "autoevals";
import type { Run } from "../../types";
import { processEvalItem } from "./processEvalItem";
import chalk from "chalk";
import { configManager } from "../config/ConfigManager";

/**
 * Processes a batch of evaluation items with controlled concurrency
 * @param items - The items to process
 * @param task - The task to process the items
 * @param scorers - The scorers to score the items
 * @param options - The options for the process
 * @returns The results of the processed items
 */
export const processBatch = async <T = any>(
  items: { input: any; expected?: T; reference?: string | string[] }[],
  task: (input: any) => Promise<T>,
  scorers: Scorer<T, any>[],
  { 
    concurrency = configManager.get('concurrency', 5), 
    maxRetries = configManager.get('maxRetries', 3) 
  }: { 
    concurrency?: number; 
    maxRetries?: number 
  }
): Promise<Run[]> => {
    const results: Run[] = []
    const queue = [...items]
    
    while (queue.length > 0) {
      const batch = queue.splice(0, concurrency)
      const batchPromises = batch.map(item => 
        processEvalItem({
          ...item,
          task,
          scorers,
          maxRetries,
        })
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Simple progress reporting
      console.log(
        chalk.blue(
          `Progress: ${results.length}/${items.length} (${Math.round((results.length / items.length) * 100)}%)`
        )
      );

      // Get progress reporting interval from config
      const progressInterval = configManager.get('progressInterval', 5);
      let lastReportedProgress = 0;

      // Report progress based on configured interval
      const currentProgress = Math.round((results.length / items.length) * 100);
      if (currentProgress >= lastReportedProgress + progressInterval) {
        console.log(
          chalk.blue(
            `Progress: ${results.length}/${items.length} (${currentProgress}%)`
          )
        );
        lastReportedProgress = currentProgress;
      }
    }
    
    return results
  }
  