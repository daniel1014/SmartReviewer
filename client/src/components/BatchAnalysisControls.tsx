import { 
  CheckSquare, 
  Square, 
  Play, 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';

interface BatchAnalysisControlsProps {
  totalArticles: number;
  selectedCount: number;
  isAnalyzing: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAnalyzeSelected: () => void;
  batchStatus?: {
    total: number;
    successful: number;
    failed: number;
    inProgress: number;
  };
  className?: string;
}

export default function BatchAnalysisControls({
  totalArticles,
  selectedCount,
  isAnalyzing,
  onSelectAll,
  onDeselectAll,
  onAnalyzeSelected,
  batchStatus,
  className = ''
}: BatchAnalysisControlsProps) {
  const allSelected = selectedCount === totalArticles;
  const maxBatchSize = 10; // Backend limit

  const canAnalyze = selectedCount > 0 && selectedCount <= maxBatchSize && !isAnalyzing;
  const exceededLimit = selectedCount > maxBatchSize;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 
                         rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCount} of {totalArticles} selected
            </span>
          </div>
          
          {exceededLimit && (
            <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Max {maxBatchSize} articles per batch</span>
            </div>
          )}
        </div>
        
        <button
          onClick={onAnalyzeSelected}
          disabled={!canAnalyze}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Analyze Selected ({selectedCount})
            </>
          )}
        </button>
      </div>
      
      {/* Batch Status */}
      {batchStatus && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">
              Processing: {batchStatus.inProgress}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              Success: {batchStatus.successful}
            </span>
          </div>
          
          {batchStatus.failed > 0 && (
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Failed: {batchStatus.failed}
              </span>
            </div>
          )}
          
          <div className="ml-auto">
            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(batchStatus.successful + batchStatus.failed) / batchStatus.total * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}