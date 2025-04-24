import React, { useState } from 'react';
import { Report } from '../types';
import { Card, CardHeader, CardContent } from './ui/card';

interface ReportCardProps {
  report: Report;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Map IOC types to Tailwind background colors (updated for dark theme)
  const iocTypeColors: Record<string, string> = {
    ip: 'bg-red-500/80',
    domain: 'bg-blue-500/80',
    hash: 'bg-purple-500/80',
    email: 'bg-green-500/80',
    url: 'bg-amber-500/80',
    filename: 'bg-teal-500/80',
    registry: 'bg-orange-500/80',
    // Default color for any undefined types
    default: 'bg-gray-500/80'
  };

  return (
    <Card className="mb-5 overflow-hidden glass-card card-hover">
      <CardHeader 
        className="bg-muted/40 backdrop-blur-sm flex flex-row justify-between items-center px-4 py-3 cursor-pointer hover:bg-muted/60 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 text-primary transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <h3 className="text-md font-medium m-0 text-foreground">{report.name}</h3>
        </div>
        <span className="text-xs text-muted-foreground italic bg-background/40 px-2 py-1 rounded-full">Source: {report.source}</span>
      </CardHeader>

      {showDetails && (
        <CardContent className="p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="mb-5">
            <h4 className="mt-0 mb-2 text-sm font-medium text-foreground flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Sigma Rule:
            </h4>
            <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-x-auto border-l-2 border-primary font-mono">
              {report.sigma_rule}
            </pre>
          </div>
          
          {report.iocs && report.iocs.length > 0 && (
            <div>
              <h4 className="mt-0 mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Indicators of Compromise:
              </h4>
              <ul className="list-none p-0 m-0 space-y-2">
                {report.iocs.map((ioc, index) => (
                  <li key={index} className="p-2 rounded-md bg-muted/30 flex items-center backdrop-blur-sm hover:bg-muted/50 transition-colors">
                    <span className={`font-semibold mr-2 px-2 py-1 ${iocTypeColors[ioc.type] || iocTypeColors.default} text-white rounded-md text-xs min-w-16 text-center backdrop-blur-sm`}>
                      {ioc.type}
                    </span>
                    <code className="font-mono mr-2 flex-grow text-primary-foreground/90">{ioc.value}</code>
                    {ioc.description && (
                      <span className="text-xs text-muted-foreground italic bg-background/40 px-2 py-1 rounded-full">
                        {ioc.description}
                      </span>
                    )}
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