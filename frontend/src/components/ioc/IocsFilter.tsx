import React from 'react';

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