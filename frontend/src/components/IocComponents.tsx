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
    <label htmlFor="type-filter" className="mr-2 font-medium text-muted-foreground">Filter by type: </label>
    <select 
      id="type-filter" 
      value={filterType} 
      onChange={(e) => setFilterType(e.target.value)}
      className="px-3 py-2 rounded border border-input bg-background min-w-[180px] text-sm cursor-pointer"
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
    {loading && <p className="text-center my-10 text-muted-foreground">Loading IoCs...</p>}
    {error && (
      <p className="text-destructive bg-destructive/10 p-3 rounded-md my-4 text-center">
        {error}
      </p>
    )}
    {showSuccessMessage && (
      <div className="text-green-600 bg-green-100 p-3 rounded-md my-4 text-center font-medium animate-in fade-in slide-in-from-top-5 duration-300">
        ✅ Hunting queries were successfully generated and saved to the database!
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
  <div className="border border-border rounded-md overflow-hidden" key={query.id}>
    <div className="flex justify-between items-center p-3 bg-muted/50 border-b border-border">
      <h5 className="text-sm font-medium m-0">{query.name}</h5>
      <div className="flex items-center gap-3">
        <small className="text-xs text-muted-foreground">Created: {formatDate(query.created_at)}</small>
        <Button 
          variant="destructive"
          size="sm"
          onClick={() => onDelete(query.id, iocValue)}
          className="h-7 px-2 py-1 text-xs"
        >
          Delete
        </Button>
      </div>
    </div>
    <pre className="bg-zinc-900 text-zinc-50 p-3 m-0 overflow-x-auto text-xs leading-relaxed max-h-[300px] overflow-y-auto text-left">
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
  <div className="bg-white rounded-md p-4 border border-border shadow-sm">
    <div className="flex justify-between items-center pb-2 mb-3 border-b">
      <h4 className="text-base font-medium m-0">Hunting Queries</h4>
      <Button
        variant="default"
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={generatingSingleQuery}
        onClick={() => onGenerateQuery(ioc)}
      >
        {generatingSingleQuery ? 'Generating...' : 'Generate Query'}
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
      <p className="text-center italic text-muted-foreground py-4 px-2 bg-muted/20 rounded-md">
        No hunting queries found for this IoC. Click "Generate Query" to create one.
      </p>
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
  <tr className="bg-muted/30">
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
    <tr className={`border-b border-border hover:bg-muted/30 transition-colors ${expandedIoc === ioc.value ? 'bg-muted/20' : ''}`}>
      <td className="w-10 text-center p-3">
        <input 
          type="checkbox"
          className="h-4 w-4"
          checked={selectedIocs.some(selected => selected.value === ioc.value)}
          onChange={() => toggleIocSelection(ioc)}
        />
      </td>
      <td className="p-3 font-mono font-medium">{ioc.value}</td>
      <td className="p-3">
        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary text-primary-foreground">
          {(ioc as any).type_name || ioc.type}
        </span>
      </td>
      <td className="p-3 text-sm">
        {ioc.description || <span className="italic text-muted-foreground">No description</span>}
      </td>
      <td className="p-3 text-right">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => toggleExpand(ioc.value)}
          className="text-primary"
        >
          {expandedIoc === ioc.value ? 'Hide Details' : 'Show Details'}
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
  <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
    <table className="w-full border-collapse bg-card text-card-foreground">
      <thead className="bg-primary text-primary-foreground">
        <tr>
          <th className="w-10 text-center p-3">
            <input 
              type="checkbox"
              className="h-4 w-4"
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