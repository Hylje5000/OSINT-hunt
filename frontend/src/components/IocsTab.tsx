import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  IocsFilter,
  StatusMessage,
  IocsTable,
  fetchIocQueries
} from './IocComponents';
import './IocsTab.css';
import { IoC, HuntingQuery, Report } from '../types';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const IocsTab: React.FC = () => {
  const [iocs, setIocs] = useState<IoC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIoc, setExpandedIoc] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedIocs, setSelectedIocs] = useState<IoC[]>([]);
  const [generatingQuery, setGeneratingQuery] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [iocQueries, setIocQueries] = useState<Record<string, HuntingQuery[]>>({});
  const [generatingSingleQuery, setGeneratingSingleQuery] = useState<boolean>(false);

  useEffect(() => {
    fetchAllIocs();
  }, []);

  // When an IoC is expanded, fetch its hunting queries
  useEffect(() => {
    if (expandedIoc) {
      fetchIocQueriesForState(expandedIoc);
    }
  }, [expandedIoc]);

  // Fetch all IoCs from reports
  const fetchAllIocs = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // First fetch all reports
      const reportsResponse = await axios.get(`${API_URL}/api/reports`);
      const reports = reportsResponse.data.reports as Report[];
      
      // Extract unique IoCs from all reports
      const uniqueIocs: Record<string, IoC> = {};
      
      reports.forEach((report: Report) => {
        if (report.iocs && Array.isArray(report.iocs)) {
          report.iocs.forEach((ioc: IoC) => {
            // Use the IoC value as a unique key
            if (!uniqueIocs[ioc.value]) {
              uniqueIocs[ioc.value] = ioc;
            }
          });
        }
      });
      
      // Convert to array
      const iocsArray = Object.values(uniqueIocs);
      setIocs(iocsArray);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Error fetching IoCs: ' + errorMessage);
      setLoading(false);
    }
  };

  // Fetch hunting queries for a specific IoC and update state
  const fetchIocQueriesForState = async (iocValue: string): Promise<void> => {
    try {
      const queries = await fetchIocQueries(iocValue);
      setIocQueries(prev => ({
        ...prev,
        [iocValue]: queries
      }));
    } catch (err) {
      console.error('Error fetching hunting queries for IoC:', err);
    }
  };

  // Generate hunting query for a single IoC
  const generateSingleIocQuery = async (ioc: IoC): Promise<void> => {
    try {
      setGeneratingSingleQuery(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/iocs/${encodeURIComponent(ioc.value)}/generate_query`, {
        ioc_type: ioc.type,
        query_name: `Hunting Query for ${ioc.type} ${ioc.value}`,
        description: `Generated hunting query for ${ioc.type}: ${ioc.value}`
      });
      
      // Refresh the queries for this IoC
      fetchIocQueriesForState(ioc.value);
      
      // Show a temporary success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (err) {
      const axiosError = err as any;
      setError(`Error generating query for ${ioc.value}: ${axiosError.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error')}`);
    } finally {
      setGeneratingSingleQuery(false);
    }
  };

  // Handle expanding an IoC row
  const toggleExpand = (iocValue: string): void => {
    if (expandedIoc === iocValue) {
      setExpandedIoc(null);
    } else {
      setExpandedIoc(iocValue);
    }
  };

  // Handle IoC selection
  const toggleIocSelection = (ioc: IoC): void => {
    setSelectedIocs(prevSelected => {
      const isSelected = prevSelected.some(selected => selected.value === ioc.value);
      if (isSelected) {
        return prevSelected.filter(selected => selected.value !== ioc.value);
      } else {
        return [...prevSelected, ioc];
      }
    });
  };

  // Handle select all IoCs
  const toggleSelectAll = (): void => {
    if (selectedIocs.length === filteredIocs.length) {
      // Deselect all
      setSelectedIocs([]);
    } else {
      // Select all filtered IoCs
      setSelectedIocs(filteredIocs);
    }
  };

  // Generate hunting queries for selected IoCs
  const generateHuntingQueries = async (): Promise<void> => {
    if (selectedIocs.length === 0) {
      setError('Please select at least one IoC to generate hunting queries.');
      return;
    }

    try {
      setGeneratingQuery(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/iocs/generate_queries`, {
        iocs: selectedIocs,
        save: true,
        generate_individual_queries: true, // Generate queries for each IoC individually
        query_name: `Generated Query for ${selectedIocs.length} IoCs - ${new Date().toLocaleString()}`,
        description: `Automatically generated hunting query for selected IoCs`
      });
      
      setShowSuccessMessage(true);
      
      // Refresh queries for expanded IoC if it's in the selected list
      if (expandedIoc && selectedIocs.some(ioc => ioc.value === expandedIoc)) {
        fetchIocQueriesForState(expandedIoc);
      }
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } catch (err) {
      const axiosError = err as any;
      setError('Error generating hunting queries: ' + (axiosError.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error')));
    } finally {
      setGeneratingQuery(false);
    }
  };

  // Delete a hunting query
  const deleteQuery = async (queryId: number, iocValue: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this hunting query?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/hunting_queries/${queryId}`);
      
      // Update the local state to remove the deleted query
      setIocQueries(prev => {
        const updatedQueries = { ...prev };
        if (updatedQueries[iocValue]) {
          updatedQueries[iocValue] = updatedQueries[iocValue].filter(q => q.id !== queryId);
        }
        return updatedQueries;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Error deleting query: ' + errorMessage);
    }
  };

  // Get unique IoC types for filtering
  const iocTypes = ['all', ...Array.from(new Set(iocs.map(ioc => ioc.type || 'unknown')))];

  // Filter IoCs by type
  const filteredIocs = filterType === 'all' 
    ? iocs 
    : iocs.filter(ioc => ioc.type === filterType);

  // Check if all filtered IoCs are selected
  const allFilteredSelected = filteredIocs.length > 0 && 
    filteredIocs.every(ioc => selectedIocs.some(selected => selected.value === ioc.value));

  return (
    <div className="iocs-tab">
      <div className="iocs-header">
        <h2>Indicators of Compromise (IoCs)</h2>
        <div className="iocs-actions">
          <button 
            className="generate-button"
            disabled={selectedIocs.length === 0 || generatingQuery}
            onClick={generateHuntingQueries}
          >
            {generatingQuery ? 'Generating...' : `Generate Hunting Queries (${selectedIocs.length})`}
          </button>
        </div>
      </div>

      <StatusMessage 
        loading={loading} 
        error={error} 
        showSuccessMessage={showSuccessMessage} 
      />

      {!loading && !error && (
        <>
          {iocs.length === 0 ? (
            <p className="no-iocs-message">No IoCs found. Add some IoCs to your reports first.</p>
          ) : (
            <div className="iocs-container">
              <div className="iocs-controls">
                <IocsFilter 
                  filterType={filterType} 
                  setFilterType={setFilterType} 
                  iocTypes={iocTypes} 
                />
                
                <div className="selected-count">
                  {selectedIocs.length} IoCs selected
                </div>
              </div>
              
              <IocsTable 
                filteredIocs={filteredIocs}
                expandedIoc={expandedIoc}
                toggleExpand={toggleExpand}
                selectedIocs={selectedIocs}
                toggleIocSelection={toggleIocSelection}
                allFilteredSelected={allFilteredSelected}
                toggleSelectAll={toggleSelectAll}
                iocQueries={iocQueries}
                onDeleteQuery={deleteQuery}
                onGenerateQuery={generateSingleIocQuery}
                generatingSingleQuery={generatingSingleQuery}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IocsTab;