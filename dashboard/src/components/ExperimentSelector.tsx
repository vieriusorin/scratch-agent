import React from 'react';

interface ExperimentSelectorProps {
  experiments: Array<{ name: string }>;
  selectedExperiment: string;
  onExperimentChange: (experimentName: string) => void;
}

const ExperimentSelector: React.FC<ExperimentSelectorProps> = ({ 
  experiments, 
  selectedExperiment, 
  onExperimentChange 
}) => {
  return (
    <div className="controls">
      <label htmlFor="experiment-select">Select Experiment: </label>
      <select
        id="experiment-select"
        value={selectedExperiment}
        onChange={(e) => onExperimentChange(e.target.value)}
      >
        {experiments.map((exp) => (
          <option key={exp.name} value={exp.name}>
            {exp.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ExperimentSelector; 