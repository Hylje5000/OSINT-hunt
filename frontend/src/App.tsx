import React, { useState } from 'react';
import IocsTab from './components/IocsTab';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'iocs' | 'reports'>('iocs'); // Default tab is IoCs, can be 'iocs' or 'reports'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-primary/10 backdrop-blur-sm border-b border-primary/20 py-4 px-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            OSINT-Hunt Platform
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-primary/20 text-primary-foreground">
              Alpha
            </span>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <nav className="max-w-6xl mx-auto border-b border-border mt-6 px-4">
        <div className="flex">
          <Button 
            variant="ghost"
            className={`px-8 py-3 text-base font-medium relative rounded-none ${activeTab === 'iocs' 
              ? 'text-foreground after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-primary' 
              : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('iocs')}
          >
            IoCs
          </Button>
          <Button 
            variant="ghost"
            className={`px-8 py-3 text-base font-medium relative rounded-none ${activeTab === 'reports' 
              ? 'text-foreground after:content-[""] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-primary' 
              : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </Button>
        </div>
      </nav>
      
      <main className="max-w-6xl mx-auto p-4 pb-20">
        {/* IoCs Tab */}
        {activeTab === 'iocs' && <IocsTab />}
        
        {/* Reports Tab - "Coming Soon" placeholder */}
        {activeTab === 'reports' && (
          <section className="mt-6">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold">Threat Intelligence Reports</h2>
              <div className="ml-auto"></div>
            </div>
            
            <Card className="border-primary/10 bg-secondary/60">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Coming Soon!</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  The Reports feature is currently under development. Check back later for updates on our threat intelligence reporting capabilities.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
      
      <footer className="border-t border-primary/10 py-4 text-center text-sm text-muted-foreground mt-auto">
        <div className="max-w-6xl mx-auto px-4">
          OSINT-Hunt Platform &copy; {new Date().getFullYear()} - Threat Intelligence Collection and Analysis
        </div>
      </footer>
    </div>
  );
}

export default App;