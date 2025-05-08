import type { Run, StatisticalMetrics } from "../../types";
import { calculateRunScore } from "./calculateRunScore";

import * as stats from 'simple-statistics'

/**
 * Calculate statistical metrics for a set of runs
 * @param runs - The runs to calculate the statistics for
 * @returns The statistical metrics for the runs
 */
export const calculateStatistics = (runs: Run[]): StatisticalMetrics => {
    // Get individual run scores (one score per run)
    const scores = runs
      .filter(run => !run.error || run.scores.length > 0)
      .map(run => calculateRunScore(run))
    
    if (scores.length === 0) {
      return {
        mean: 0,
        median: 0,
        standardDeviation: 0,
        confidenceInterval95: [0, 0],
        min: 0,
        max: 0
      }
    }
    
    const mean = stats.mean(scores)
    const standardDeviation = stats.standardDeviation(scores)
    const n = scores.length
    
    // Calculate 95% confidence interval using t-distribution
    // For small samples, we use the t-distribution instead of normal distribution
    const tValue = stats.tTest([0.95], n - 1)
    const marginOfError = tValue * (standardDeviation / Math.sqrt(n))
    const confidenceInterval95: [number, number] = [
      Math.max(0, mean - marginOfError),
      Math.min(1, mean + marginOfError)
    ]
    
    return {
      mean,
      median: stats.median(scores),
      standardDeviation,
      confidenceInterval95,
      min: Math.min(...scores),
      max: Math.max(...scores)
    }
  }