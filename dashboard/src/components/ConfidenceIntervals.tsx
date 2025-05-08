import React from 'react';

interface ConfidenceIntervalsProps {
  confidenceData: Array<{
    label: string;
    mean: number;
    lowerBound: number;
    upperBound: number;
    sampleSize: number;
  }> | null;
}

const ConfidenceIntervals: React.FC<ConfidenceIntervalsProps> = ({ confidenceData }) => {
  if (!confidenceData) return <p>No confidence data available.</p>;
  
  return (
    <div className='confidence-section'>
      <h2>Confidence Intervals (95%)</h2>
      <div className='confidence-chart'>
        <table>
          <thead>
            <tr>
              <th>Query</th>
              <th>Mean Score</th>
              <th>Lower Bound</th>
              <th>Upper Bound</th>
              <th>Sample Size</th>
            </tr>
          </thead>
          <tbody>
            {confidenceData.map((item, index) => (
              <tr key={index}>
                <td>{item.label}</td>
                <td>{item.mean.toFixed(2)}</td>
                <td>{item.lowerBound.toFixed(2)}</td>
                <td>{item.upperBound.toFixed(2)}</td>
                <td>{item.sampleSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConfidenceIntervals; 