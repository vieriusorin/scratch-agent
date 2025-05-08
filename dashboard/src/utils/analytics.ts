/**
 * Utility functions for dashboard analytics
 */

/**
 * Calculate confidence interval for a set of scores
 * @param scores Array of numeric scores
 * @param confidenceLevel Confidence level (default: 0.95 for 95%)
 */
export const calculateConfidenceInterval = (scores: number[], confidenceLevel = 0.95) => {
  if (!scores.length) return { mean: 0, lowerBound: 0, upperBound: 0, marginOfError: 0 };
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const stdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length);
  
  // Z-score for common confidence levels
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };
  
  const zScore = zScores[confidenceLevel] || 1.96;
  const marginOfError = zScore * (stdDev / Math.sqrt(scores.length));
  
  return {
    mean,
    lowerBound: mean - marginOfError,
    upperBound: mean + marginOfError,
    marginOfError
  };
};

/**
 * Group data by a specific property
 * @param data Array of data objects
 * @param property Property to group by
 */
export const groupBy = <T>(data: T[], property: keyof T): Record<string, T[]> => {
  return data.reduce((acc, item) => {
    const key = String(item[property] || 'unknown');
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Calculate trend data from historical results
 * @param data Historical data with timestamps
 * @param interval Interval for grouping (day, week, month)
 */
export const calculateTrend = (data: any[], interval = 'day') => {
  if (!data.length) return [];
  
  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.timestamp || 0);
    const dateB = new Date(b.timestamp || 0);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Group by interval
  const groupedData: Record<string, any[]> = {};
  
  sortedData.forEach(item => {
    const date = new Date(item.timestamp || 0);
    let key: string;
    
    switch (interval) {
      case 'week':
        // Get the week number
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        break;
      case 'day':
      default:
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
    
    if (!groupedData[key]) groupedData[key] = [];
    groupedData[key].push(item);
  });
  
  // Calculate averages for each group
  return Object.entries(groupedData).map(([key, items]) => {
    const scores = items.map(item => item.score || 0);
    const { mean, lowerBound, upperBound } = calculateConfidenceInterval(scores);
    
    return {
      period: key,
      averageScore: mean,
      lowerBound,
      upperBound,
      count: items.length
    };
  });
};

/**
 * Identify outliers using IQR method
 * @param data Array of data points
 * @param property Property to analyze for outliers
 */
export const findOutliers = <T>(data: T[], property: keyof T): T[] => {
  if (!data.length) return [];
  
  const values = data.map(item => Number(item[property]) || 0).sort((a, b) => a - b);
  
  const q1Index = Math.floor(values.length * 0.25);
  const q3Index = Math.floor(values.length * 0.75);
  
  const q1 = values[q1Index];
  const q3 = values[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return data.filter(item => {
    const value = Number(item[property]) || 0;
    return value < lowerBound || value > upperBound;
  });
}; 