/**
 * Utility functions for processing experiment data
 */

/**
 * Calculate confidence intervals for experiment data
 */
export const calculateConfidenceIntervals = (data: any) => {
  if (!data || !Array.isArray(data.experiments)) {
    console.error('Invalid data format for confidence intervals');
    return [];
  }

  const allResults = data.experiments.flatMap((exp: { sets: { results: { query: string; score: number }[] }[] }) => 
    exp.sets.flatMap(set => set.results || [])
  );
  
  // Group data by query or other relevant dimension
  const groupedData = allResults.reduce((acc: Record<string, number[]>, item: { query: string; score: number }) => {
    const key = item.query || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item.score || 0);
    return acc;
  }, {});

  // Calculate mean and confidence interval for each group
  return Object.entries(groupedData).map(([key, scores]) => {
    if (!Array.isArray(scores)) return null;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length);
    const marginOfError = 1.96 * (stdDev / Math.sqrt(scores.length)); // 95% confidence
    return {
      label: key,
      mean,
      lowerBound: mean - marginOfError,
      upperBound: mean + marginOfError,
      sampleSize: scores.length
    };
  }).filter(Boolean); // Filter out null values
};

/**
 * Extract historical data from experiment results
 */
export const extractHistoricalData = (data: any) => {
  if (!data || !Array.isArray(data.experiments)) {
    return [];
  }
  
  // Get all sets from all experiments with timestamps
  const allSets = data.experiments.flatMap((exp: { sets: { timestamp: number; results: { score: number }[] }[] }) => 
    exp.sets.map(set => ({
      date: new Date(set.timestamp || Date.now()),
      scores: set.results ? set.results.map(r => r.score || 0) : []
    }))
  );
  
  // Sort by date
  allSets.sort((a: { date: Date; scores: number[] }, b: { date: Date; scores: number[] }) => 
    a.date.getTime() - b.date.getTime()
  );
  
  // Group by month for a cleaner visualization
  const monthlyData: Record<string, { allScores: number[], date: string }> = {};
  
  allSets.forEach(set => {
    const monthKey = `${set.date.getFullYear()}-${String(set.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        allScores: [],
        date: monthKey
      };
    }
    
    monthlyData[monthKey].allScores.push(...set.scores);
  });
  
  // Calculate average scores and confidence intervals for each month
  return Object.values(monthlyData).map(month => {
    const scores = month.allScores;
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;
    
    // Calculate standard deviation for confidence intervals
    const stdDev = scores.length > 1
      ? Math.sqrt(scores.reduce((sum: number, score: number) => sum + Math.pow(score - averageScore, 2), 0) / scores.length)
      : 0.1; // Default if not enough data
    
    const marginOfError = 1.96 * (stdDev / Math.sqrt(Math.max(1, scores.length)));
    
    return {
      date: month.date,
      averageScore,
      lowerBound: Math.max(0, averageScore - marginOfError),
      upperBound: Math.min(1, averageScore + marginOfError),
      sampleSize: scores.length
    };
  });
};

/**
 * Identify problematic cases in experiment data
 */
export const identifyProblematicCases = (data: any) => {
  if (!data || !Array.isArray(data.experiments)) return [];
  
  // Extract all results from all experiments
  const allResults = data.experiments.flatMap((exp: { sets: { results: { score: number; responseTime: number; error: boolean }[] }[] }) => 
    exp.sets.flatMap(set => set.results || [])
  );
  
  const SCORE_THRESHOLD = 0.5;
  const TIME_THRESHOLD = 1000;
  
  return allResults.filter(item => {
    const lowScore = (item.score || 0) < SCORE_THRESHOLD;
    const highLatency = (item.responseTime || 0) > TIME_THRESHOLD;
    const hasError = item.error || false;
    
    return lowScore || highLatency || hasError;
  }).map(item => ({
    ...item,
    issues: [
      ...(item.score < SCORE_THRESHOLD ? ['Low score'] : []),
      ...(item.responseTime > TIME_THRESHOLD ? ['High latency'] : []),
      ...(item.error ? ['Error occurred'] : [])
    ]
  }));
}; 