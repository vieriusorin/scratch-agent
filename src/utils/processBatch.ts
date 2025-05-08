import type { Scorer } from "autoevals";
import type { Run } from "../types";
import { processEvalItem } from "./processEvalItem";
import chalk from "chalk";

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
    { concurrency = 5, maxRetries = 3 }: { concurrency?: number; maxRetries?: number }
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
      )
    }
    
    return results
  }
  