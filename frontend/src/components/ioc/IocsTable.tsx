import React from 'react';
import { IoC, HuntingQuery } from '../../types';
import { IocsTableRow } from './IocsTableRow';

interface IocsTableProps {
  filteredIocs: IoC[];
  expandedIoc: number | null;
  toggleExpand: (iocId: number) => void;
  selectedIocs: IoC[];
  toggleIocSelection: (ioc: IoC) => void;
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  iocQueries: Record<number, HuntingQuery[]>;
  onDeleteQuery: (queryId: number, iocId: number) => void;
  onGenerateQuery: (ioc: IoC) => void;
  onDeleteIoc?: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
  iocsWithoutQueries: Set<number>;
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
  onDeleteIoc,
  generatingSingleQuery,
  iocsWithoutQueries
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
          {filteredIocs.map((ioc) => (
            <IocsTableRow 
              key={ioc.id}
              ioc={ioc}
              expandedIoc={expandedIoc}
              toggleExpand={toggleExpand}
              selectedIocs={selectedIocs}
              toggleIocSelection={toggleIocSelection}
              iocQueries={iocQueries}
              onDeleteQuery={onDeleteQuery}
              onGenerateQuery={onGenerateQuery}
              onDeleteIoc={onDeleteIoc}
              generatingSingleQuery={generatingSingleQuery}
              hasQuery={!iocsWithoutQueries.has(ioc.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);