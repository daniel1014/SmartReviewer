import React, { useState } from 'react';
import { Calendar, ExternalLink, Loader2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import SentimentBadge from './SentimentBadge';

interface Article {
  url: string;
  title: string;
  description?: string;
  content: string;
  image?: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
  analysis?: {
    summary: string;
    summaryLength: number;
    sentiment: {
      label: 'positive' | 'neutral' | 'negative';
      score: number;
      confidence: number;
    };
    processingTime: number;
  };
}

interface ArticleCardProps {
  article: Article;
  onAnalyze: (article: Article) => void;
  isAnalyzing?: boolean;
  isSelected?: boolean;
  onSelect?: (article: Article) => void;
  showSelection?: boolean;
}

export default function ArticleCard({ 
  article, 
  onAnalyze, 
  isAnalyzing = false,
  isSelected = false,
  onSelect,
  showSelection = false
}: ArticleCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Debug logging
  React.useEffect(() => {
    console.log('ArticleCard re-rendered:', {
      title: article.title,
      hasAnalysis: !!article.analysis,
      isAnalyzing
    });
  }, [article.analysis, isAnalyzing, article.title]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatProcessingTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
                    transition-all duration-200 p-4 border 
                    ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700'}
                    ${showSelection ? 'cursor-pointer' : ''}`}
         onClick={showSelection && onSelect ? () => onSelect(article) : undefined}>
      {/* Selection Checkbox */}
      {showSelection && (
        <div className="absolute top-2 right-2 z-10"
             onClick={(e) => {
               e.stopPropagation();
               if (onSelect) onSelect(article);
             }}>
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-blue-600" />
          ) : (
            <Square className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors" />
          )}
        </div>
      )}
      
      {/* Article Image */}
      {article.image && !imageError && (
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-48 object-cover rounded-md mb-4"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
      
      {/* Article Title */}
      <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
        {article.title}
      </h3>
      
      {/* Article Description */}
      {article.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {article.description}
        </p>
      )}
      
      {/* Article Meta */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            {article.source.name}
          </span>
        </div>
        
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 
                     transition-colors duration-200"
        >
          <ExternalLink className="h-4 w-4" />
          Read full
        </a>
      </div>
      
      {/* Analysis Section */}
      {article.analysis ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SentimentBadge 
              sentiment={article.analysis.sentiment} 
              showScore={true} 
              showConfidence={true}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatProcessingTime(article.analysis.processingTime)}
            </span>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center justify-between w-full text-left font-medium 
                         text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400
                         transition-colors duration-200"
            >
              <span>Summary ({article.analysis.summaryLength} words)</span>
              {showSummary ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {showSummary && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {article.analysis.summary}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            console.log('🎯 Analyze button clicked for article:', article.title);
            try {
              onAnalyze(article);
            } catch (error) {
              console.error('❌ Error calling onAnalyze:', error);
            }
          }}
          disabled={isAnalyzing}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 transition-colors duration-200
                     dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Article'
          )}
        </button>
      )}
    </div>
  );
}