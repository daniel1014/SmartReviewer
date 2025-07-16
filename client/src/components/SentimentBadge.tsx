import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentBadgeProps {
  sentiment: {
    label: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  };
  showScore?: boolean;
  showConfidence?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SentimentBadge({ 
  sentiment, 
  showScore = false, 
  showConfidence = false,
  size = 'md' 
}: SentimentBadgeProps) {
  const { label, score, confidence } = sentiment;
  
  const getColorClasses = () => {
    switch (label) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-3 py-2';
      case 'md':
      default:
        return 'text-sm px-2.5 py-1.5';
    }
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    switch (label) {
      case 'positive':
        return <TrendingUp className={iconSize} />;
      case 'negative':
        return <TrendingDown className={iconSize} />;
      case 'neutral':
      default:
        return <Minus className={iconSize} />;
    }
  };

  const formatScore = (score: number) => {
    return score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${getColorClasses()} ${getSizeClasses()}`}>
      {getIcon()}
      <span className="capitalize">{label}</span>
      {showScore && (
        <span className="text-xs opacity-75">
          ({formatScore(score)})
        </span>
      )}
      {showConfidence && (
        <span className="text-xs opacity-75">
          {formatConfidence(confidence)}
        </span>
      )}
    </div>
  );
}