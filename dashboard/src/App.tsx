import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import ExperimentGraph from './components/ExperimentGraph'
import ExperimentSelector from './components/ExperimentSelector'
import ConfidenceIntervals from './components/ConfidenceIntervals'
import HistoricalTrend from './components/HistoricalTrend'
import AnalyticsSection from './components/AnalyticsSection'
import resultsData from '../../results-dev.json'
import { Results } from '../../src/types'
import './App.css'
import './styles/feedback.css'
import { useExperimentData } from './hooks/useExperimentData'
import { useExperimentSelection } from './hooks/useExperimentSelection'
import { useState } from 'react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const App = () => {
  const results = resultsData as unknown as Results
  const [activeTab, setActiveTab] = useState('experiments') // 'experiments' or 'feedback'
  
  const { selectedExperiment, setSelectedExperiment, limitedExperiment } = 
    useExperimentSelection(results.experiments)
    
  const { confidenceData, historicalData, problematicCases } = 
    useExperimentData(results)

  return (
    <div className="app">
      <h1>Dashboard</h1>
      
      <div className="tab-navigation">
        <button 
          className={activeTab === 'experiments' ? 'active' : ''} 
          onClick={() => setActiveTab('experiments')}
        >
          Experiment Results
        </button>
        <button 
          className={activeTab === 'feedback' ? 'active' : ''} 
          onClick={() => setActiveTab('feedback')}
        >
          User Feedback
        </button>
      </div>

      {activeTab === 'experiments' && (
        <>
          <ExperimentSelector 
            experiments={results.experiments}
            selectedExperiment={selectedExperiment}
            onExperimentChange={setSelectedExperiment}
          />

          <div className="dashboard-grid">
            {limitedExperiment && (
              <div className="dashboard-card full-width-card">
                <h2>Experiment Results</h2>
                <ExperimentGraph experiment={limitedExperiment} />
              </div>
            )}

            <div className="dashboard-card">
              <ConfidenceIntervals confidenceData={confidenceData} />
            </div>
            
            <div className="dashboard-card">
              <HistoricalTrend historicalData={historicalData} />
            </div>
            
            <div className="dashboard-card full-width-card">
              <AnalyticsSection problematicCases={problematicCases} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
