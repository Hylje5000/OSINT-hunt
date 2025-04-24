import React, { useState } from 'react';
import './App.css';
import IocsTab from './components/IocsTab';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'iocs' | 'reports'>('iocs'); // Default tab is IoCs, can be 'iocs' or 'reports'

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
        
        {/* Reports Tab - "Coming Soon" placeholder */}
        {activeTab === 'reports' && (
          <section className="reports-section">
            <h2>Threat Intelligence Reports</h2>
            <div className="coming-soon-container">
              <div className="coming-soon-message">
                <h3>Coming Soon!</h3>
                <p>The Reports feature is currently under development. Check back later for updates.</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;