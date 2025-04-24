import React from 'react';
import axios from 'axios';
import { IoC, HuntingQuery } from '../types';
import { Button } from './ui/button';

// Get API URL from environment variable or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Format hunting query to properly display line breaks
const formatQueryText = (queryText: string): string => {
  if (!queryText) return '';
  // Replace literal \n strings with actual line breaks
  return queryText.replace(/\\n/g, '\n');
};

// Format date for display
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// IoC Filter Component
interface IocsFilterProps {
  filterType: string;
  setFilterType: (type: string) => void;
  iocTypes: string[];
}

export const IocsFilter: React.FC<IocsFilterProps> = ({ filterType, setFilterType, iocTypes }) => (
  <div className="flex items-center">
    <label htmlFor="type-filter" className="mr-2 font-medium text-muted-foreground flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      Filter by type:
    </label>
    <select 
      id="type-filter" 
      value={filterType} 
      onChange={(e) => setFilterType(e.target.value)}
      className="px-3 py-2 rounded-md border border-input bg-muted/40 backdrop-blur-sm min-w-[180px] text-sm cursor-pointer focus:border-primary transition-colors"
    >
      {iocTypes.map(type => (
        <option key={type} value={type}>
          {type === 'all' ? 'All Types' : type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </option>
      ))}
    </select>
  </div>
);

// IoC Status Message Component
interface StatusMessageProps {
  loading: boolean;
  error: string | null;
  showSuccessMessage: boolean;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ loading, error, showSuccessMessage }) => (
  <>
    {loading && (
      <div className="flex justify-center items-center my-10 text-muted-foreground">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading IoCs...
      </div>
    )}
    {error && (
      <div className="text-destructive bg-destructive/10 p-3 rounded-md my-4 text-center animate-in fade-in slide-in-from-top-5 duration-300 border border-destructive/20">
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    )}
    {showSuccessMessage && (
      <div className="text-green-500 bg-green-900/20 border border-green-500/20 p-3 rounded-md my-4 text-center font-medium animate-in fade-in slide-in-from-top-5 duration-300">
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Hunting queries were successfully generated and saved to the database!
        </div>
      </div>
    )}
  </>
);

// Hunting Query Item Component
interface HuntingQueryItemProps {
  query: HuntingQuery;
  iocValue: string;
  onDelete: (queryId: number, iocValue: string) => void;
}

export const HuntingQueryItem: React.FC<HuntingQueryItemProps> = ({ query, iocValue, onDelete }) => (
  <div className="border border-border/50 rounded-md overflow-hidden glass-card card-hover" key={query.id}>
    <div className="flex justify-between items-center p-3 bg-muted/40 backdrop-blur-sm border-b border-border/50">
      <h5 className="text-sm font-medium m-0 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        {query.name}
      </h5>
      <div className="flex items-center gap-3">
        <small className="text-xs text-muted-foreground bg-background/40 px-2 py-1 rounded-full">Created: {formatDate(query.created_at)}</small>
        <Button 
          variant="destructive"
          size="sm"
          onClick={() => onDelete(query.id, iocValue)}
          className="h-7 px-2 py-1 text-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Delete
        </Button>
      </div>
    </div>
    <pre className="bg-muted p-3 m-0 overflow-x-auto text-xs leading-relaxed max-h-[300px] overflow-y-auto text-left font-mono">
      {formatQueryText(query.query_text)}
    </pre>
  </div>
);

// Hunting Queries List Component
interface HuntingQueriesProps {
  ioc: IoC;
  iocQueries: Record<string, HuntingQuery[]>;
  onDelete: (queryId: number, iocValue: string) => void;
  onGenerateQuery: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
}

export const HuntingQueries: React.FC<HuntingQueriesProps> = ({ 
  ioc, 
  iocQueries, 
  onDelete, 
  onGenerateQuery, 
  generatingSingleQuery 
}) => (
  <div className="glass-card p-4 border border-border/50 shadow-md rounded-lg backdrop-blur-sm">
    <div className="flex justify-between items-center pb-2 mb-3 border-b border-border/50">
      <h4 className="text-base font-medium m-0 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
        </svg>
        Hunting Queries
      </h4>
      <Button
        variant="default"
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
        disabled={generatingSingleQuery}
        onClick={() => onGenerateQuery(ioc)}
      >
        {generatingSingleQuery ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Generate Query
          </>
        )}
      </Button>
    </div>
    
    {iocQueries[ioc.value] && iocQueries[ioc.value].length > 0 ? (
      <div className="flex flex-col gap-4">
        {iocQueries[ioc.value].map(query => (
          <HuntingQueryItem 
            key={query.id}
            query={query} 
            iocValue={ioc.value} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    ) : (
      <div className="text-center italic text-muted-foreground py-6 px-3 bg-muted/20 rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="m-0">No hunting queries found for this IoC.<br/>Click "Generate Query" to create one.</p>
      </div>
    )}
  </div>
);

// IoC Details Component
interface IocDetailsProps {
  ioc: IoC;
  iocQueries: Record<string, HuntingQuery[]>;
  onDeleteQuery: (queryId: number, iocValue: string) => void;
  onGenerateQuery: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
}

export const IocDetails: React.FC<IocDetailsProps> = ({ 
  ioc, 
  iocQueries, 
  onDeleteQuery, 
  onGenerateQuery, 
  generatingSingleQuery 
}) => (
  <tr className="bg-muted/10 animate-in fade-in slide-in-from-top-5 duration-300">
    <td colSpan={5}>
      <div className="p-4">
        <HuntingQueries 
          ioc={ioc}
          iocQueries={iocQueries}
          onDelete={onDeleteQuery}
          onGenerateQuery={onGenerateQuery}
          generatingSingleQuery={generatingSingleQuery}
        />
      </div>
    </td>
  </tr>
);

// IoC Table Row Component
interface IocsTableRowProps {
  ioc: IoC;
  expandedIoc: string | null;
  toggleExpand: (iocValue: string) => void;
  selectedIocs: IoC[];
  toggleIocSelection: (ioc: IoC) => void;
  iocQueries: Record<string, HuntingQuery[]>;
  onDeleteQuery: (queryId: number, iocValue: string) => void;
  onGenerateQuery: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
}

export const IocsTableRow: React.FC<IocsTableRowProps> = ({ 
  ioc, 
  expandedIoc, 
  toggleExpand, 
  selectedIocs, 
  toggleIocSelection,
  iocQueries,
  onDeleteQuery,
  onGenerateQuery,
  generatingSingleQuery
}) => (
  <React.Fragment>
    <tr className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${expandedIoc === ioc.value ? 'bg-muted/30' : ''}`}>
      <td className="w-10 text-center p-3">
        <input 
          type="checkbox"
          className="h-4 w-4 rounded border-gray-500 text-primary focus:ring-primary/50"
          checked={selectedIocs.some(selected => selected.value === ioc.value)}
          onChange={() => toggleIocSelection(ioc)}
        />
      </td>
      <td className="p-3 font-mono font-medium">
        <div className="truncate max-w-xs" title={ioc.value}>
          {ioc.value}
        </div>
      </td>
      <td className="p-3">
        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground border border-primary/30">
          {(ioc as any).type_name || ioc.type}
        </span>
      </td>
      <td className="p-3 text-sm">
        {ioc.description ? (
          <div className="truncate max-w-xs" title={ioc.description}>
            {ioc.description}
          </div>
        ) : (
          <span className="italic text-muted-foreground">No description</span>
        )}
      </td>
      <td className="p-3 text-right">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => toggleExpand(ioc.value)}
          className={`text-primary flex items-center gap-1 transition-all ${expandedIoc === ioc.value ? 'border-primary/50' : ''}`}
        >
          {expandedIoc === ioc.value ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Hide Details
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Show Details
            </>
          )}
        </Button>
      </td>
    </tr>
    {expandedIoc === ioc.value && (
      <IocDetails 
        ioc={ioc} 
        iocQueries={iocQueries}
        onDeleteQuery={onDeleteQuery}
        onGenerateQuery={onGenerateQuery}
        generatingSingleQuery={generatingSingleQuery}
      />
    )}
  </React.Fragment>
);

// IoCs Table Component
interface IocsTableProps {
  filteredIocs: IoC[];
  expandedIoc: string | null;
  toggleExpand: (iocValue: string) => void;
  selectedIocs: IoC[];
  toggleIocSelection: (ioc: IoC) => void;
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  iocQueries: Record<string, HuntingQuery[]>;
  onDeleteQuery: (queryId: number, iocValue: string) => void;
  onGenerateQuery: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
}

export const IocsTable: React.FC<IocsTableProps> = ({ 
  filteredIocs, 
  expandedIoc, 
  toggleExpand, 
  selectedIocs, 
  toggleIocSelection, 
  allFilteredSelected, 
  toggleSelectAll,
  iocQueries,
  onDeleteQuery,
  onGenerateQuery,
  generatingSingleQuery
}) => (
  <div className="overflow-hidden rounded-lg border border-border/50 shadow-md glass-card">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-card/20 text-card-foreground backdrop-blur-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-10 text-center p-3">
              <input 
                type="checkbox"
                className="h-4 w-4 rounded border-gray-500 text-primary focus:ring-primary/50"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="p-3 text-left font-medium text-sm">Value</th>
            <th className="p-3 text-left font-medium text-sm">Type</th>
            <th className="p-3 text-left font-medium text-sm">Description</th>
            <th className="p-3 text-right font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredIocs.map((ioc, index) => (
            <IocsTableRow 
              key={index}
              ioc={ioc}
              expandedIoc={expandedIoc}
              toggleExpand={toggleExpand}
              selectedIocs={selectedIocs}
              toggleIocSelection={toggleIocSelection}
              iocQueries={iocQueries}
              onDeleteQuery={onDeleteQuery}
              onGenerateQuery={onGenerateQuery}
              generatingSingleQuery={generatingSingleQuery}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Helper functions that can be exported for reuse
export const fetchIocQueries = async (iocValue: string): Promise<HuntingQuery[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/iocs/${encodeURIComponent(iocValue)}/hunting_queries`);
    return response.data.hunting_queries;
  } catch (err) {
    console.error('Error fetching hunting queries for IoC:', err);
    return [];
  }
};