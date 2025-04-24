import React, { useState } from 'react';
import './ReportCard.css';
import { Report } from '../types';

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  return (
    <div className="report-card">
      <div className="report-header" onClick={() => setShowDetails(!showDetails)}>
        <h3>{report.name}</h3>
        <span className="source">Source: {report.source}</span>
      </div>

      {showDetails && (
        <div className="report-details">
          <div className="sigma-rule">
            <h4>Sigma Rule:</h4>
            <pre>{report.sigma_rule}</pre>
          </div>
          
          {report.iocs && report.iocs.length > 0 && (
            <div className="iocs-section">
              <h4>Indicators of Compromise:</h4>
              <ul className="iocs-list">
                {report.iocs.map((ioc, index) => (
                  <li key={index} className={`ioc-item ioc-${ioc.type}`}>
                    <span className="ioc-type">{ioc.type}</span>
                    <span className="ioc-value">{ioc.value}</span>
                    {ioc.description && <span className="ioc-description">{ioc.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportCard;