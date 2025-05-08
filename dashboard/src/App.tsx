import { useState, useEffect } from 'react'
import ExperimentGraph from './components/ExperimentGraph'
import resultsData from '../../results-dev.json'
import { Results } from '../../src/types'
import './App.css'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const App = () => {
  const results = resultsData as unknown as Results
  const [selectedExperiment, setSelectedExperiment] = useState(
    results.experiments[0].name
  )
  const [confidenceData, setConfidenceData] = useState(null)
  const [historicalData, setHistoricalData] = useState(null)
  const [problematicCases, setProblematicCases] = useState([])

  const currentExperiment = results.experiments.find(
    (exp) => exp.name === selectedExperiment
  )

  const limitedExperiment = currentExperiment
    ? {
        ...currentExperiment,
        sets: currentExperiment.sets.slice(-10),
      }
    : null


  const calculateConfidenceIntervals = (data: any) => {
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
    });
  };
  
  useEffect(() => {
    if (results) {
      const confidenceData = calculateConfidenceIntervals(results)
      setConfidenceData(confidenceData)
    }
  }, [results])

  // Function to extract historical data from results
  const extractHistoricalData = (data) => {
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
    allSets.sort((a: { date: Date; scores: number[] }, b: { date: Date; scores: number[] }) => a.date.getTime() - b.date.getTime());
    
    // Group by month for a cleaner visualization
    const monthlyData = {};
    
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
  
  // Function to fetch historical data - using real data
  const fetchHistoricalData = async () => {
    try {
      // Extract historical data from the results
      return extractHistoricalData(results);
    } catch (error) {
      console.error('Failed to process historical data:', error);
      return [];
    }
  };
  
  useEffect(() => {
    // Fetch historical data when component mounts
    const loadHistoricalData = async () => {
      const data = await fetchHistoricalData()
      setHistoricalData(data)
    }
    
    loadHistoricalData()
  }, [])

  // Function to identify problematic cases
  const identifyProblematicCases = (data: any) => {
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
  
  useEffect(() => {
    if (results) {
      const problematic = identifyProblematicCases(results)
      setProblematicCases(problematic)
    }
  }, [results])

  // Render historical trend chart
  const renderHistoricalTrend = () => {
    if (!historicalData) return null;
    
    // Process data for chart
    const dates = historicalData.map(entry => entry.date);
    const averageScores = historicalData.map(entry => entry.averageScore);
    // Add confidence intervals if available in your data
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
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Historical Performance Trend'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
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

  // Render problematic cases
  const renderProblematicCases = () => {
    if (!problematicCases.length) return <p>No problematic cases identified.</p>
    
    return (
      <div className='problematic-cases'>
        <h2>Problematic Cases ({problematicCases.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Query</th>
              <th>Score</th>
              <th>Response Time</th>
              <th>Issues</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {problematicCases.map((item, index) => (
              <tr key={index} className='problematic-row'>
                <td>{item.query || 'N/A'}</td>
                <td>{item.score?.toFixed(2) || 'N/A'}</td>
                <td>{item.responseTime || 'N/A'} ms</td>
                <td>{item.issues.join(', ')}</td>
                <td>
                  <button onClick={() => alert(JSON.stringify(item, null, 2))}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Move renderConfidenceIntervals inside the component
  const renderConfidenceIntervals = () => {
    if (!confidenceData) return null
    
    return (
      <div className='confidence-section'>
        <h2>Confidence Intervals (95%)</h2>
        <div className='confidence-chart'>
          {/* Render chart or table with confidence data */}
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
    )
  }

  return (
    <div className="app">
      <h1>Experiment Results Viewer</h1>

      <div className="controls">
        <label htmlFor="experiment-select">Select Experiment: </label>
        <select
          id="experiment-select"
          value={selectedExperiment}
          onChange={(e) => setSelectedExperiment(e.target.value)}
        >
          {results.experiments.map((exp) => (
            <option key={exp.name} value={exp.name}>
              {exp.name}
            </option>
          ))}
        </select>
      </div>

      {limitedExperiment && <ExperimentGraph experiment={limitedExperiment} />}

      {/* Add confidence interval visualization */}
      {renderConfidenceIntervals()}

      {/* Add historical trend chart */}
      {renderHistoricalTrend()}

      <div className='analytics-section'>
        <h2>Advanced Analytics</h2>
        {renderProblematicCases()}
      </div>
    </div>
  )
}

export default App
