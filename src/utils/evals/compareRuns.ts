import type { Run } from "../../types";
import { calculateRunScore } from "./calculateRunScore";
import * as stats from 'simple-statistics'

/**
 * Compare two sets of runs and calculate statistical significance
 * @returns Object containing p-value, significance, and effect size
 */
export const compareRuns = (
    currentRuns: Run[],
    previousRuns: Run[]
  ): { pValue: number; isSignificant: boolean; effectSize: number } => {
    // Extract scores from runs
    const currentScores = currentRuns
      .filter(run => !run.error || run.scores.length > 0)
      .map(run => calculateRunScore(run))
    
    const previousScores = previousRuns
      .filter(run => !run.error || run.scores.length > 0)
      .map(run => calculateRunScore(run))
    
    // Default values if we can't do the comparison
    if (currentScores.length < 2 || previousScores.length < 2) {
      return { pValue: 1, isSignificant: false, effectSize: 0 }
    }
    
    try {
      // Perform two-sample t-test to get p-value
      const tTestResult = stats.tTestTwoSample(currentScores, previousScores)
      
      // Calculate Cohen's d effect size
      const currentMean = stats.mean(currentScores)
      const previousMean = stats.mean(previousScores)
      
      // Pooled standard deviation
      const currentVariance = stats.variance(currentScores)
      const previousVariance = stats.variance(previousScores)
      const pooledStdDev = Math.sqrt(
        ((currentScores.length - 1) * currentVariance + 
         (previousScores.length - 1) * previousVariance) / 
        (currentScores.length + previousScores.length - 2)
      )
      
      // Cohen's d
      const effectSize = Math.abs(currentMean - previousMean) / pooledStdDev
      
      return {
        pValue: tTestResult ?? 1,
        isSignificant: (tTestResult ?? 1) < 0.05, // Using 0.05 significance level
        effectSize
      }
    } catch (error) {
      console.warn('Error calculating statistical comparison:', error)
      return { pValue: 1, isSignificant: false, effectSize: 0 }
    }
  }