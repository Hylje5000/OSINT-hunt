import React, { useState } from 'react';
import IocsTab from './components/IocsTab';
import { Button } from './components/ui/button';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'iocs' | 'reports'>('iocs'); // Default tab is IoCs, can be 'iocs' or 'reports'

  return (
    <div className="max-w-6xl mx-auto text-center">
      <header className="bg-primary text-primary-foreground py-6 px-4 mb-4">
        <h1 className="text-2xl font-bold m-0">OSINT-Hunt Platform</h1>
      </header>
      
      {/* Tab Navigation */}
      <nav className="flex justify-center border-b border-border mb-8">
        <Button 
          variant="ghost"
          className={`px-8 py-4 text-lg font-medium relative ${activeTab === 'iocs' 
            ? 'text-primary font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[3px] after:bg-primary' 
            : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('iocs')}
        >
          IoCs
        </Button>
        <Button 
          variant="ghost"
          className={`px-8 py-4 text-lg font-medium relative ${activeTab === 'reports' 
            ? 'text-primary font-semibold after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[3px] after:bg-primary' 
            : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </Button>
      </nav>
      
      <main className="px-4">
        {/* IoCs Tab */}
        {activeTab === 'iocs' && <IocsTab />}
        
        {/* Reports Tab - "Coming Soon" placeholder */}
        {activeTab === 'reports' && (
          <section className="mb-12">
            <h2 className="text-left mb-6 text-xl font-semibold text-foreground pb-2 border-b-2 border-primary">
              Threat Intelligence Reports
            </h2>
            <div className="bg-muted rounded-lg p-12 shadow-sm">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3">Coming Soon!</h3>
                <p className="text-muted-foreground">
                  The Reports feature is currently under development. Check back later for updates.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;