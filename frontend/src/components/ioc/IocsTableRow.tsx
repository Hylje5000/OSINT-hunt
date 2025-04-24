import React from 'react';
import { IoC, HuntingQuery } from '../../types';
import { Button } from '../ui/button';
import { IocDetails } from './IocDetails';

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
  hasQuery: boolean; // New prop to indicate if this IoC already has a query
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
  generatingSingleQuery,
  hasQuery
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
        hasQuery={hasQuery}
      />
    )}
  </React.Fragment>
);