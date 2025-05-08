import React from 'react';
import { Line } from 'react-chartjs-2';

interface HistoricalTrendProps {
  historicalData: Array<{
    date: string;
    averageScore: number;
    lowerBound: number;
    upperBound: number;
    sampleSize: number;
  }> | null;
}

const HistoricalTrend: React.FC<HistoricalTrendProps> = ({ historicalData }) => {
  if (!historicalData) return <p>No historical data available.</p>;
  
  const dates = historicalData.map(entry => entry.date);
  const averageScores = historicalData.map(entry => entry.averageScore);
  const lowerBounds = historicalData.map(entry => entry.lowerBound || entry.averageScore - 0.05);
  const upperBounds = historicalData.map(entry => entry.upperBound || entry.averageScore + 0.05);
  
  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Average Score',
        data: averageScores,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Lower Bound',
        data: lowerBounds,
        borderColor: 'rgba(75, 192, 192, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.1
      },
      {
        label: 'Upper Bound',
        data: upperBounds,
        borderColor: 'rgba(75, 192, 192, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.1
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Historical Performance Trend'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(2);
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: 'Score'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };
  
  return (
    <div className='historical-trend'>
      <h2>Historical Performance Trend</h2>
      <div className='trend-chart'>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default HistoricalTrend; 