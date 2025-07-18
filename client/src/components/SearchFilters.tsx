import React from 'react';
import { Settings, List, Flag, Languages } from 'lucide-react';

interface SearchFiltersProps {
  resultLimit: number;
  onResultLimitChange: (limit: number) => void;
  country?: string;
  onCountryChange: (country: string) => void;
  language?: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

const LIMIT_OPTIONS = [
  { value: 3, label: '3 articles' },
  { value: 6, label: '6 articles' },
  { value: 9, label: '9 articles' },
];


const COUNTRY_OPTIONS = [
  { value: '', label: 'All Countries' },
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy' },
  { value: 'es', label: 'Spain' },
  { value: 'jp', label: 'Japan' },
  { value: 'in', label: 'India' },
  { value: 'br', label: 'Brazil' },
  { value: 'cn', label: 'China' }
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' }
];

export default function SearchFilters({ 
  resultLimit, 
  onResultLimitChange,
  country = '',
  onCountryChange,
  language = '',
  onLanguageChange,
  className = '' 
}: SearchFiltersProps) {
  const selectClassName = "px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors";

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Filters:
        </span>
      </div>
      

      {/* Country Filter */}
      <div className="flex items-center gap-2">
        <Flag className="h-3 w-3 text-gray-500 dark:text-gray-400" />
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className={selectClassName}
          title="Country"
        >
          {COUNTRY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Language Filter */}
      <div className="flex items-center gap-2">
        <Languages className="h-3 w-3 text-gray-500 dark:text-gray-400" />
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className={selectClassName}
          title="Language"
        >
          {LANGUAGE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Results Limit */}
      <div className="flex items-center gap-2">
        <List className="h-3 w-3 text-gray-500 dark:text-gray-400" />
        <select
          value={resultLimit}
          onChange={(e) => onResultLimitChange(parseInt(e.target.value))}
          className={selectClassName}
          title="Results per page"
        >
          {LIMIT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}