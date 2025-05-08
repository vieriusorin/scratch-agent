import React from 'react';
import ProblematicCases from './ProblematicCases';

interface AnalyticsSectionProps {
  problematicCases: Array<{
    query?: string;
    score?: number;
    responseTime?: number;
    issues: string[];
    [key: string]: any;
  }>;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ problematicCases }) => {
  return (
    <div className='analytics-section'>
      <h2>Advanced Analytics</h2>
      <ProblematicCases problematicCases={problematicCases} />
    </div>
  );
};

export default AnalyticsSection; 