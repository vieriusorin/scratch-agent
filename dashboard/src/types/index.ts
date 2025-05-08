export interface ConfidenceData {
  label: string;
  mean: number;
  lowerBound: number;
  upperBound: number;
  sampleSize: number;
}

export interface HistoricalDataPoint {
  date: string;
  averageScore: number;
  lowerBound: number;
  upperBound: number;
  sampleSize: number;
}

export interface ProblematicCase {
  query?: string;
  score?: number;
  responseTime?: number;
  issues: string[];
  [key: string]: any;
}

export interface ExperimentDataHookResult {
  confidenceData: ConfidenceData[] | null;
  historicalData: HistoricalDataPoint[] | null;
  problematicCases: ProblematicCase[];
}

export interface ExperimentSelectionHookResult {
  selectedExperiment: string;
  setSelectedExperiment: (name: string) => void;
  currentExperiment: any;
  limitedExperiment: any;
} 