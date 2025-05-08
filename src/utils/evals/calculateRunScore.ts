import type { Score } from "autoevals"
import type { Run } from "../../types"

/**
 * Calculate the average score for a run (across all its scorers)
 * @param run - The run to calculate the score for
 * @returns The average score for the run
 */
export const calculateRunScore = (run: Run): number => {
    if (run.error || run.scores.length === 0) return 0
    return run.scores.reduce((sum: number, score: Score) => sum + (score.score ?? 0), 0) / 
           (run.scores.length || 1) // Avoid division by zero
  }