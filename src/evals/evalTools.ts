import 'dotenv/config'
import type { Scorer } from 'autoevals'
import chalk from 'chalk'
import { calculateAvgScore } from '../utils/evals/calculateAvgScore'
import { loadExperiment } from '../utils/evals/loadExperiment'
import { saveSet } from '../utils/evals/saveSet'
import { processBatch } from '../utils/evals/processBatch'
import { configManager } from '../utils/config/ConfigManager'
import type { EvalResult } from './types'

/**
 * 
 * @param experiment
 * @params an object with the following properties:
 * - task: a function that takes an input and returns a promise of a string or an object with a context and response property or an AI functions
 * - data: an array of objects with the following properties:
 *   - input: the input to the task
 *   - expected: the expected output of the task
 * - scorers: an array of scorers to score the output of the task (Calculate the score of the output and saves the results in the database)
 * - options: optional configuration
 *   - concurrency: number of parallel evaluations (default: 5)
 *   - maxRetries: maximum number of retries per evaluation (default: 3)
 * @returns 
 */
export const runEval = async <T = any>(
  experiment: string,
  {
    task,
    data,
    scorers,
    options = {}
  }: {
    task: (input: any) => Promise<T>
    data: { input: any; expected?: T; reference?: string | string[] }[]
    scorers: Scorer<T, any>[]
    options?: {
      concurrency?: number
      maxRetries?: number
    }
  }
) => {
  // Get configuration values with fallbacks to provided options
  const concurrency = options.concurrency || 
    configManager.get('concurrency', 5);
  
  const maxRetries = options.maxRetries || 
    configManager.get('maxRetries', 3);

  console.log(chalk.blue(`Starting experiment: ${experiment}`));
  console.log(chalk.blue(`Dataset size: ${data.length} items`));
  console.log(chalk.blue(`Concurrency: ${concurrency}`));
  console.log(chalk.blue(`Max retries: ${maxRetries}`));
  
  const startTime = Date.now()
  
  const results = await processBatch(
    data,
    task,
    scorers,
    {
      concurrency,
      maxRetries,
    }
  )
  
  const executionTime = (Date.now() - startTime) / 1000
  console.log(chalk.blue(`Execution time: ${executionTime.toFixed(2)}s (${(executionTime / data.length).toFixed(2)}s per item)`))

  const previousExperiment = await loadExperiment(experiment)
  const previousScore =
    previousExperiment?.sets[previousExperiment.sets.length - 1]?.score || 0
  const currentScore = calculateAvgScore(results)
  const scoreDiff = currentScore - previousScore

  const errorCount = results.filter(r => r.error).length
  if (errorCount > 0) {
    console.log(chalk.yellow(`Errors: ${errorCount}/${results.length} (${Math.round((errorCount / results.length) * 100)}%)`))
  }

  const color = previousExperiment
    ? scoreDiff > 0
      ? chalk.green
      : scoreDiff < 0
      ? chalk.red
      : chalk.blue
    : chalk.blue

  console.log(`Experiment: ${experiment}`)
  console.log(`Previous score: ${color(previousScore.toFixed(2))}`)
  console.log(`Current score: ${color(currentScore.toFixed(2))}`)
  console.log(
    `Difference: ${scoreDiff > 0 ? '+' : ''}${color(scoreDiff.toFixed(2))}`
  )

  await saveSet(experiment, results)

  return results
}

// Add structured test reporting
export const generateTestReport = (results: EvalResult[]) => {
  const summary = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    metrics: {
      averageResponseTime: results.reduce((acc, r) => acc + (r.responseTime || 0), 0) / results.length
    }
  };
  
  return {
    summary,
    details: results,
    timestamp: new Date().toISOString()
  };
};

// Add ability to run specific test suites
export const runTestSuite = async (suiteName: string) => {
  // ... implementation to run only tests from a specific suite
};