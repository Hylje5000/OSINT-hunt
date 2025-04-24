import React from 'react';
import { HuntingQuery } from '../../types';
import { Button } from '../ui/button';
import { formatQueryText, formatDate } from './utils';

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