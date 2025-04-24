import React from 'react';
import { IoC, HuntingQuery } from '../../types';
import { Button } from '../ui/button';
import { HuntingQueryItem } from './HuntingQueryItem';

interface HuntingQueriesProps {
  ioc: IoC;
  iocQueries: Record<string, HuntingQuery[]>;
  onDelete: (queryId: number, iocValue: string) => void;
  onGenerateQuery: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
  hasQuery: boolean;
}

export const HuntingQueries: React.FC<HuntingQueriesProps> = ({ 
  ioc, 
  iocQueries, 
  onDelete, 
  onGenerateQuery, 
  generatingSingleQuery,
  hasQuery
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
      
      {/* Only show the generate button if no query exists yet */}
      {!hasQuery && (
        <Button
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
          disabled={generatingSingleQuery || hasQuery}
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
      )}
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
        <p className="m-0">No hunting queries found for this IoC.
        {!hasQuery && <><br/>Click "Generate Query" to create one.</>}</p>
      </div>
    )}
  </div>
);