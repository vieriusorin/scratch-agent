import { useState, useEffect } from 'react';
import { calculateConfidenceIntervals, extractHistoricalData, identifyProblematicCases } from '../utils/dataProcessing';
import { ConfidenceData, HistoricalDataPoint, ProblematicCase } from '../types';

/**
 * Custom hook to process experiment data and provide analytics
 * @param results The experiment results data
 */
export const useExperimentData = (results: any) => {
  const [confidenceData, setConfidenceData] = useState<ConfidenceData[] | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
  const [problematicCases, setProblematicCases] = useState<ProblematicCase[]>([]);


  useEffect(() => {
    if (results) {
      const data = calculateConfidenceIntervals(results);
      setConfidenceData(data.filter(d => d !== null));
    }
  }, [results]);

  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const data = extractHistoricalData(results);
        setHistoricalData(data);
      } catch (error) {
        console.error('Failed to process historical data:', error);
      }
    };
    
    loadHistoricalData();
  }, [results]);

  useEffect(() => {
    if (results) {
      const problematic = identifyProblematicCases(results);
      setProblematicCases(problematic);
    }
  }, [results]);

  return {
    confidenceData,
    historicalData,
    problematicCases
  };
}; 