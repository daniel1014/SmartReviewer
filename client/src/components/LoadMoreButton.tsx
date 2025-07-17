import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface LoadMoreButtonProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  className?: string;
  disabled?: boolean;
}

export default function LoadMoreButton({
  onLoadMore,
  hasMore,
  loading,
  className = '',
  disabled = false
}: LoadMoreButtonProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const handleLoadMore = async () => {
    if (loading || !hasMore || disabled) return;

    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more items:', error);
    }
  };

  // Intersection Observer for auto-loading when near bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !autoTriggered) {
          setAutoTriggered(true);
          handleLoadMore().finally(() => {
            // Reset auto-trigger after a delay
            setTimeout(() => setAutoTriggered(false), 2000);
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, autoTriggered]);

  if (!hasMore) {
    return (
      <div className={`mt-12 text-center ${className}`}>
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm">
          <span>🎉 You've reached the end!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-12 flex flex-col items-center gap-4 ${className}`}>
      {/* Animated Arrow - hide when loading */}
      {!loading && (
        <div className="transition-all duration-500 transform animate-bounce">
          <ChevronDown className="w-8 h-8 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
        </div>
      )}

      {/* Load More Button */}
      <button
        onClick={handleLoadMore}
        disabled={loading || disabled}
        className={`
          group relative inline-flex items-center justify-center
          px-8 py-3 text-sm font-medium rounded-lg
          ${loading 
            ? 'bg-emerald-400 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 hover:scale-105'
          }
          text-white
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          transition-all duration-300 ease-out
          transform active:scale-95
          shadow-sm hover:shadow-md
          min-w-[180px]
          dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus:bg-emerald-600
          dark:focus:ring-emerald-400
        `}
      >
        {/* Button content */}
        <div className="flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading articles...</span>
            </>
          ) : (
            <>
              <span>Load More Articles</span>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </>
          )}
        </div>
      </button>

      {/* Invisible trigger for auto-loading */}
      <div ref={observerRef} className="h-4" />
    </div>
  );
}