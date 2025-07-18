import { useState } from 'react';
import { Database, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useDatabaseStatus } from '../hooks/useAnalysis';

interface DatabaseStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function DatabaseStatus({ className = '', showDetails = false }: DatabaseStatusProps) {
  const { databaseStatus, systemStatus, isLoading, refetch, lastUpdated } = useDatabaseStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusIcon = () => {
    if (isLoading) return <Database className="h-4 w-4 animate-pulse" />;
    
    switch (databaseStatus.status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Database className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (databaseStatus.status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (databaseStatus.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const formatResponseTime = (time: number | null) => {
    if (time === null) return 'N/A';
    return `${time}ms`;
  };

  const formatLastUpdated = (timestamp: string | undefined) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (showDetails) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </h3>
          <button
            onClick={() => refetch()}
            className="text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Refresh
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Connection:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Response Time:</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {formatResponseTime(databaseStatus.responseTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">System Status:</span>
            <span className={`text-sm font-medium ${systemStatus === 'operational' ? 'text-green-500' : 'text-red-500'}`}>
              {systemStatus}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated:</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {formatLastUpdated(lastUpdated)}
            </span>
          </div>
          
          {databaseStatus.error && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
              <p className="text-sm text-red-600 dark:text-red-400">
                Error: {databaseStatus.error}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact status indicator
  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => refetch()}
      >
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          DB
        </span>
      </div>
      
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-black text-white text-xs rounded py-2 px-3 z-50">
          <div className="space-y-1">
            <div>Status: {getStatusText()}</div>
            <div>Response: {formatResponseTime(databaseStatus.responseTime)}</div>
            <div>System: {systemStatus}</div>
            <div>Updated: {formatLastUpdated(lastUpdated)}</div>
          </div>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-black transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}