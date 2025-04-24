import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ReportCard from './components/ReportCard';
import IocsTab from './components/IocsTab';
import { Report } from './types';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App(): React.ReactElement {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'iocs' | 'reports'>('iocs'); // Default tab is IoCs, can be 'iocs' or 'reports'

  useEffect(() => {
    // Fetch reports from the backend API
    const fetchReports = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/reports`);
        setReports(response.data.reports);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError('Error fetching reports: ' + errorMessage);
        setLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>OSINT-Hunt Platform</h1>
      </header>
      
      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'iocs' ? 'active' : ''}`}
          onClick={() => setActiveTab('iocs')}
        >
          IoCs
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </nav>
      
      <main className="App-content">
        {/* IoCs Tab */}
        {activeTab === 'iocs' && <IocsTab />}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <section className="reports-section">
            <h2>Threat Intelligence Reports</h2>
            {loading && <p>Loading reports...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && (
              <div className="reports-container">
                {reports.length === 0 ? (
                  <p>No reports found</p>
                ) : (
                  <ul className="reports-list">
                    {reports.map(report => (
                      <li key={report.id}>
                        <ReportCard report={report} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;