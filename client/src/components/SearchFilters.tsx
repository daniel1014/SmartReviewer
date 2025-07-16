import React from 'react';
import { Settings, Grid, List } from 'lucide-react';

interface SearchFiltersProps {
  resultLimit: number;
  onResultLimitChange: (limit: number) => void;
  className?: string;
}

const LIMIT_OPTIONS = [
  { value: 3, label: '3 articles' },
  { value: 6, label: '6 articles' },
  { value: 9, label: '9 articles' }
];

export default function SearchFilters({ 
  resultLimit, 
  onResultLimitChange, 
  className = '' 
}: SearchFiltersProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Show:
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={resultLimit}
          onChange={(e) => onResultLimitChange(parseInt(e.target.value))}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 
                     rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          {LIMIT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Grid className="h-3 w-3" />
        <span>per search</span>
      </div>
    </div>
  );
}