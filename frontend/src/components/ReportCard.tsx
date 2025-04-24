import React, { useState } from 'react';
import { Report } from '../types';
import { Card, CardHeader, CardContent } from './ui/card';

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Map IOC types to Tailwind background colors
  const iocTypeColors: Record<string, string> = {
    ip: 'bg-red-500',
    domain: 'bg-blue-500',
    hash: 'bg-purple-500',
    email: 'bg-green-500',
    url: 'bg-amber-500',
    filename: 'bg-teal-500',
    registry: 'bg-orange-500',
    // Default color for any undefined types
    default: 'bg-gray-500'
  };

  return (
    <Card className="mb-5 overflow-hidden">
      <CardHeader 
        className="bg-muted flex flex-row justify-between items-center px-4 py-3 cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <h3 className="text-md font-medium m-0 text-foreground">{report.name}</h3>
        <span className="text-xs text-muted-foreground italic">Source: {report.source}</span>
      </CardHeader>

      {showDetails && (
        <CardContent className="p-4">
          <div className="mb-5">
            <h4 className="mt-0 mb-2 text-sm font-medium text-foreground">Sigma Rule:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto border-l-2 border-primary">
              {report.sigma_rule}
            </pre>
          </div>
          
          {report.iocs && report.iocs.length > 0 && (
            <div>
              <h4 className="mt-0 mb-2 text-sm font-medium text-foreground">Indicators of Compromise:</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                {report.iocs.map((ioc, index) => (
                  <li key={index} className="p-2 rounded bg-muted flex items-center">
                    <span className={`font-semibold mr-2 px-2 py-1 ${iocTypeColors[ioc.type] || iocTypeColors.default} text-white rounded text-xs min-w-16 text-center`}>
                      {ioc.type}
                    </span>
                    <span className="font-mono mr-2 flex-grow">{ioc.value}</span>
                    {ioc.description && <span className="text-xs text-muted-foreground italic">{ioc.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ReportCard;