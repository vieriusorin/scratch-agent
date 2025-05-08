import React from 'react';

interface ProblematicCase {
  query?: string;
  score?: number;
  responseTime?: number;
  issues: string[];
  [key: string]: any;
}

interface ProblematicCasesProps {
  problematicCases: ProblematicCase[];
}

const ProblematicCases: React.FC<ProblematicCasesProps> = ({ problematicCases }) => {
  if (!problematicCases.length) return <p>No problematic cases identified.</p>;
  
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
  );
};

export default ProblematicCases; 