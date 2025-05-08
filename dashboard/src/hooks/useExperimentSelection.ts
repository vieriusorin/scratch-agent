import { useState } from 'react';

/**
 * Custom hook to manage experiment selection
 * @param experiments Array of available experiments
 */
export const useExperimentSelection = (experiments: Array<{
  sets: any; name: string 
}>) => {
  const [selectedExperiment, setSelectedExperiment] = useState(
    experiments.length > 0 ? experiments[0].name : ''
  );

  const currentExperiment = experiments.find(
    (exp) => exp.name === selectedExperiment
  );

  const limitedExperiment = currentExperiment
    ? {
        ...currentExperiment,
        sets: currentExperiment.sets.slice(-10),
      }
    : null;

  return {
    selectedExperiment,
    setSelectedExperiment,
    currentExperiment,
    limitedExperiment
  };
}; 