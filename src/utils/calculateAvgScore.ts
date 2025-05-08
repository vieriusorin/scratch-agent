import type { Run } from "../types"

/**
 * Calculates the average score of the runs
 * @param runs - The runs to calculate the average score of
 * @returns The average score of the runs
 */
export const calculateAvgScore = (runs: Run[]) => {
    // Filter out runs with errors that don't have scores
    const validRuns = runs.filter(run => !run.error || run.scores.length > 0)
    
    if (validRuns.length === 0) return 0
  
    const totalScores = validRuns.reduce((sum, run) => {
      const runAvg =
        run.scores.reduce((sum, score) => sum + (score.score ?? 0), 0) /
        (run.scores.length || 1) // Avoid division by zero
      return sum + runAvg
    }, 0)
    return totalScores / validRuns.length
  }
  