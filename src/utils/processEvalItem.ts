import type { Scorer } from "autoevals"
import chalk from "chalk"
import type { Run } from "../types"

/**
 * Processes a single evaluation item with retry logic
 * @param input - The input to the task
 * @param expected - The expected output of the task
 * @param reference - The reference to the task
 * @param task - The task to process the item
 * @param scorers - The scorers to score the item
 * @param maxRetries - The maximum number of retries
 * @returns The result of the processed item
 */
export const processEvalItem = async <T = any>({
    input,
    expected,
    reference,
    task,
    scorers,
    maxRetries = 3,
  }: {
    input: any
    expected?: T
    reference?: string | string[]
    task: (input: any) => Promise<T>
    scorers: Scorer<T, any>[]
    maxRetries?: number
  }): Promise<Run> => {
    let attempt = 0
    let lastError: Error | null = null
  
    while (attempt < maxRetries) {
      try {
        const results = await task(input)
        let context: string | string[] | undefined
        let output: any
  
        if (results && typeof results === 'object' && 'context' in results && 'response' in results) {
          context = results.context as string | string[] | undefined
          output = results.response
        } else {
          output = results
        }
  
        const scores = await Promise.all(
          scorers.map(async (scorer) => {
            try {
              const score = await scorer({
                input,
                output: results,
                expected,
                reference,
                context,
              })
              return {
                name: score.name,
                score: score.score,
              }
            } catch (err) {
              console.warn(`Scorer "${scorer.name}" failed: ${err}`)
              return {
                name: scorer.name,
                score: 0,
              }
            }
          })
        )
  
        return {
          input,
          output,
          expected,
          scores,
        }
      } catch (err) {
        lastError = err as Error
        attempt++
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s, etc.
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
          console.warn(
            chalk.yellow(
              `Attempt ${attempt}/${maxRetries} failed for input: ${JSON.stringify(input).substring(0, 50)}... - Retrying in ${backoffTime / 1000}s`
            )
          )
          await new Promise(resolve => setTimeout(resolve, backoffTime))
        }
      }
    }
  
    // All retries failed
    console.error(chalk.red(`All ${maxRetries} attempts failed for input:`), input)
    console.error(chalk.red(`Last error:`), lastError)
  
    return {
      input,
      output: null,
      expected,
      scores: scorers.map(scorer => ({ name: scorer.name, score: 0 })),
      error: lastError ? lastError.message : 'Unknown error',
    }
  }