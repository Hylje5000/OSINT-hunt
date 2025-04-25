import React from 'react';
import { IoC, HuntingQuery } from '../../types';
import { HuntingQueries } from './HuntingQueries';

interface IocDetailsProps {
  ioc: IoC;
  iocQueries: Record<number, HuntingQuery[]>;
  onDeleteQuery: (queryId: number, iocId: number) => void;
  onGenerateQuery: (ioc: IoC) => void;
  generatingSingleQuery: boolean;
  hasQuery: boolean;
}

export const IocDetails: React.FC<IocDetailsProps> = ({ 
  ioc, 
  iocQueries, 
  onDeleteQuery, 
  onGenerateQuery, 
  generatingSingleQuery,
  hasQuery
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
          hasQuery={hasQuery}
        />
      </div>
    </td>
  </tr>
);