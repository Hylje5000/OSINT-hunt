import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IocsFilter } from './ioc/IocsFilter';
import { StatusMessage } from './ioc/StatusMessage';
import { IocsTable } from './ioc/IocsTable';
import { AddIocsModal } from './ioc/AddIocsModal';
import { IoC, HuntingQuery, Report } from '../types';
import { Button } from './ui/button';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to fetch IoC queries using IoC ID
const fetchIocQueries = async (iocId: number): Promise<HuntingQuery[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/iocs/${iocId}/hunting_queries`);
    return response.data.hunting_queries || [];
  } catch (err) {
    console.error('Error fetching hunting queries:', err);
    return [];
  }
};

const IocsTab: React.FC = () => {
  const [iocs, setIocs] = useState<IoC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIoc, setExpandedIoc] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedIocs, setSelectedIocs] = useState<IoC[]>([]);
  const [generatingQuery, setGeneratingQuery] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('Operation completed successfully');
  const [iocQueries, setIocQueries] = useState<Record<number, HuntingQuery[]>>({});
  const [generatingSingleQuery, setGeneratingSingleQuery] = useState<boolean>(false);
  const [isAddIocsModalOpen, setIsAddIocsModalOpen] = useState<boolean>(false);

  // Track which IoCs can have queries generated (those without existing queries)
  const [iocsWithoutQueries, setIocsWithoutQueries] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchAllIocs();
  }, []);

  // When an IoC is expanded, fetch its hunting queries
  useEffect(() => {
    if (expandedIoc !== null) {
      fetchIocQueriesForState(expandedIoc);
    }
  }, [expandedIoc]);

  // Fetch all IoCs directly from the IoCs endpoint
  const fetchAllIocs = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Fetch all IoCs from the new IoCs endpoint
      const iocsResponse = await axios.get(`${API_URL}/api/iocs`);
      const iocsArray = iocsResponse.data.iocs as IoC[];
      setIocs(iocsArray);
      
      // Initialize the state of IoCs without queries
      const iocIds = iocsArray.map(ioc => ioc.id);
      await checkQueriesForAllIocs(iocIds);
      
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Error fetching IoCs: ' + errorMessage);
      setLoading(false);
    }
  };

  // Check which IoCs don't have hunting queries
  const checkQueriesForAllIocs = async (iocIds: number[]): Promise<void> => {
    const withoutQueries = new Set<number>();
    
    // For performance, we fetch queries in batches or for specific IoCs only when needed
    for (const iocId of iocIds) {
      const queries = await fetchIocQueries(iocId);
      setIocQueries(prev => ({
        ...prev,
        [iocId]: queries
      }));
      
      if (queries.length === 0) {
        withoutQueries.add(iocId);
      }
    }
    
    setIocsWithoutQueries(withoutQueries);
  };

  // Fetch hunting queries for a specific IoC and update state
  const fetchIocQueriesForState = async (iocId: number): Promise<void> => {
    try {
      const queries = await fetchIocQueries(iocId);
      setIocQueries(prev => ({
        ...prev,
        [iocId]: queries
      }));
      
      // Update the set of IoCs without queries
      setIocsWithoutQueries(prev => {
        const newSet = new Set(prev);
        if (queries.length === 0) {
          newSet.add(iocId);
        } else {
          newSet.delete(iocId);
        }
        return newSet;
      });
    } catch (err) {
      console.error('Error fetching hunting queries for IoC:', err);
    }
  };

  // Generate hunting query for a single IoC
  const generateSingleIocQuery = async (ioc: IoC): Promise<void> => {
    // Check if IoC already has queries
    if (iocQueries[ioc.id] && iocQueries[ioc.id].length > 0) {
      // IoC already has a query, just return without generating
      return;
    }

    try {
      setGeneratingSingleQuery(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/iocs/${ioc.id}/generate_query`, {
        query_name: `Hunting Query for ${ioc.type} ${ioc.value}`,
        description: `Generated hunting query for ${ioc.type}: ${ioc.value}`
      });
      
      // Refresh the queries for this IoC
      fetchIocQueriesForState(ioc.id);
      
      // Show a temporary success message
      setSuccessMessage('Hunting query generated successfully');
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

  // Delete an IoC
  const deleteIoc = async (ioc: IoC): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete the IoC: ${ioc.value}? This will also delete all associated hunting queries.`)) {
      return;
    }

    try {
      setError(null);
      
      // Call the API to delete the IoC
      await axios.delete(`${API_URL}/api/iocs/${ioc.id}`);
      
      // Remove the deleted IoC from state
      setIocs(prev => prev.filter(i => i.id !== ioc.id));
      
      // Remove any selected status
      setSelectedIocs(prev => prev.filter(i => i.id !== ioc.id));
      
      // Clear any expanded state if it's the deleted IoC
      if (expandedIoc === ioc.id) {
        setExpandedIoc(null);
      }
      
      // Clean up queries data
      setIocQueries(prev => {
        const newQueries = { ...prev };
        delete newQueries[ioc.id];
        return newQueries;
      });
      
      // Remove from IoCs without queries set
      setIocsWithoutQueries(prev => {
        const newSet = new Set(prev);
        newSet.delete(ioc.id);
        return newSet;
      });
      
      // Show success message
      setSuccessMessage(`IoC "${ioc.value}" deleted successfully`);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (err) {
      const axiosError = err as any;
      setError(`Error deleting IoC: ${axiosError.response?.data?.error || (err instanceof Error ? err.message : 'Unknown error')}`);
    }
  };

  // Handle expanding an IoC row
  const toggleExpand = (iocId: number): void => {
    if (expandedIoc === iocId) {
      setExpandedIoc(null);
    } else {
      setExpandedIoc(iocId);
    }
  };

  // Handle IoC selection
  const toggleIocSelection = (ioc: IoC): void => {
    setSelectedIocs(prevSelected => {
      const isSelected = prevSelected.some(selected => selected.id === ioc.id);
      if (isSelected) {
        return prevSelected.filter(selected => selected.id !== ioc.id);
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

    // Filter selected IoCs to only include those without queries
    const iocsToGenerate = selectedIocs.filter(ioc => iocsWithoutQueries.has(ioc.id));

    if (iocsToGenerate.length === 0) {
      setError('All selected IoCs already have hunting queries.');
      return;
    }

    try {
      setGeneratingQuery(true);
      setError(null);
      
      // Get array of IoC IDs
      const iocIds = iocsToGenerate.map(ioc => ioc.id);
      
      // Use the new bulk generate endpoint
      const response = await axios.post(`${API_URL}/api/hunting_queries/bulk_generate`, {
        ioc_ids: iocIds
      });
      
      setSuccessMessage(`Generated hunting queries for ${iocsToGenerate.length} IoCs`);
      setShowSuccessMessage(true);
      
      // Refresh queries for expanded IoC if it's in the selected list
      if (expandedIoc !== null && iocsToGenerate.some(ioc => ioc.id === expandedIoc)) {
        fetchIocQueriesForState(expandedIoc);
      }
      
      // Update iocsWithoutQueries to reflect newly generated queries
      setIocsWithoutQueries(prev => {
        const newSet = new Set(prev);
        iocsToGenerate.forEach(ioc => newSet.delete(ioc.id));
        return newSet;
      });
      
      // Update iocQueries for all newly generated queries
      for (const ioc of iocsToGenerate) {
        fetchIocQueriesForState(ioc.id);
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
  const deleteQuery = async (queryId: number, iocId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this hunting query?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/hunting_queries/${queryId}`);
      
      // Update the local state to remove the deleted query
      setIocQueries(prev => {
        const updatedQueries = { ...prev };
        if (updatedQueries[iocId]) {
          updatedQueries[iocId] = updatedQueries[iocId].filter(q => q.id !== queryId);
          
          // If this was the last query, add the IoC back to the set of IoCs without queries
          if (updatedQueries[iocId].length === 0) {
            setIocsWithoutQueries(prev => new Set(prev).add(iocId));
          }
        }
        return updatedQueries;
      });
      
      // Show success message
      setSuccessMessage('Hunting query deleted successfully');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
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
    filteredIocs.every(ioc => selectedIocs.some(selected => selected.id === ioc.id));

  // Handle opening the Add IoCs modal
  const openAddIocsModal = () => {
    setIsAddIocsModalOpen(true);
  };

  // Handle closing the Add IoCs modal
  const closeAddIocsModal = () => {
    setIsAddIocsModalOpen(false);
  };

  // Handle when IoCs are added through the modal
  const handleIocsAdded = () => {
    fetchAllIocs();
    setSuccessMessage('IoCs added successfully');
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <div className="p-5 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-foreground m-0 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
            Indicators of Compromise (IoCs)
          </h2>
          <p className="text-muted-foreground m-0">Analyze and generate hunting queries for indicators of compromise.</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={openAddIocsModal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add IoCs
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-sm"
            disabled={selectedIocs.length === 0 || generatingQuery || !selectedIocs.some(ioc => iocsWithoutQueries.has(ioc.id))}
            onClick={generateHuntingQueries}
          >
            {generatingQuery ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Generate Hunting Queries ({selectedIocs.filter(ioc => iocsWithoutQueries.has(ioc.id)).length})
              </>
            )}
          </Button>
        </div>
      </div>

      <StatusMessage 
        loading={loading} 
        error={error} 
        showSuccessMessage={showSuccessMessage}
        successMessage={successMessage}
      />

      {!loading && !error && (
        <>
          {iocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xl text-muted-foreground">No IoCs found. Add some IoCs using the "Add IoCs" button.</p>
              <Button variant="default" onClick={openAddIocsModal} className="mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add IoCs
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <IocsFilter 
                  filterType={filterType} 
                  setFilterType={setFilterType} 
                  iocTypes={iocTypes} 
                />
                
                <div className="px-3 py-1.5 rounded-full bg-muted/40 backdrop-blur-sm text-sm text-muted-foreground font-medium flex items-center gap-2 border border-border/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
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
                onDeleteIoc={deleteIoc}
                generatingSingleQuery={generatingSingleQuery}
                iocsWithoutQueries={iocsWithoutQueries}
              />
            </div>
          )}
        </>
      )}
      
      {/* Add IoCs Modal */}
      <AddIocsModal
        isOpen={isAddIocsModalOpen}
        onClose={closeAddIocsModal}
        onIocsAdded={handleIocsAdded}
      />
    </div>
  );
};

export default IocsTab;