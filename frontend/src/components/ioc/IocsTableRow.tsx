import React from 'react';
import { IoC, HuntingQuery } from '../../types';
import { Button } from '../ui/button';
import { IocDetails } from './IocDetails';
import { getIocTypeDisplayName } from './utils';

interface IocsTableRowProps {
  ioc: IoC;
  expandedIoc: number | null;
  toggleExpand: (iocId: number) => void;
  selectedIocs: IoC[];
  toggleIocSelection: (ioc: IoC) => void;
  iocQueries: Record<number, HuntingQuery[]>;
  onDeleteQuery: (queryId: number, iocId: number) => void;
  onGenerateQuery: (ioc: IoC) => void;
  onDeleteIoc?: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
  hasQuery: boolean;
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
  onDeleteIoc,
  generatingSingleQuery,
  hasQuery
}) => (
  <React.Fragment>
    <tr className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${expandedIoc === ioc.id ? 'bg-muted/30' : ''}`}>
      <td className="w-10 text-center p-3">
        <input 
          type="checkbox"
          className="h-4 w-4 rounded border-gray-500 text-primary focus:ring-primary/50"
          checked={selectedIocs.some(selected => selected.id === ioc.id)}
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
          {getIocTypeDisplayName(ioc.type)}
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
        <div className="flex items-center justify-end gap-2">
          {onDeleteIoc && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteIoc(ioc)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              title="Delete IoC"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={() => toggleExpand(ioc.id)}
            className={`text-primary flex items-center gap-1 transition-all ${expandedIoc === ioc.id ? 'border-primary/50' : ''}`}
          >
            {expandedIoc === ioc.id ? (
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
        </div>
      </td>
    </tr>
    {expandedIoc === ioc.id && (
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