import { useState, useCallback, useEffect, useMemo } from 'react';
import { Newspaper, TrendingUp, Activity, Settings } from 'lucide-react';
import type { Article } from '../../../shared/types';
import SearchBar from '../components/SearchBar';
import SearchFilters from '../components/SearchFilters';
import BatchAnalysisControls from '../components/BatchAnalysisControls';
import ArticleCard from '../components/ArticleCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../components/Toast';
import { useNewsSearch } from '../hooks/useNewsSearch';
import { useAnalyzeArticle, useAnalyzeBatch } from '../hooks/useAnalysis';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [resultLimit, setResultLimit] = useState(9);
  const [analyzingArticles, setAnalyzingArticles] = useState<Set<string>>(new Set());
  const [articlesWithAnalysis, setArticlesWithAnalysis] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [batchAnalysisMode, setBatchAnalysisMode] = useState(false);
  const [batchStatus, setBatchStatus] = useState<{
    total: number;
    successful: number;
    failed: number;
    inProgress: number;
  } | null>(null);
  const { showToast } = useToast();

  const { 
    data: newsData, 
    isLoading: isLoadingNews, 
    error: newsError,
    refetch: refetchNews
  } = useNewsSearch(searchQuery, 1, resultLimit);

  const analyzeArticleMutation = useAnalyzeArticle();
  const analyzeBatchMutation = useAnalyzeBatch();

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleResultLimitChange = useCallback((limit: number) => {
    setResultLimit(limit);
  }, []);

  const handleArticleSelect = useCallback((article: any) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(article.url)) {
        newSet.delete(article.url);
      } else {
        newSet.add(article.url);
      }
      return newSet;
    });
  }, []);

  // handleSelectAll will be defined after articles

  const handleDeselectAll = useCallback(() => {
    setSelectedArticles(new Set());
  }, []);

  const toggleBatchMode = useCallback(() => {
    setBatchAnalysisMode(prev => !prev);
    if (batchAnalysisMode) {
      setSelectedArticles(new Set());
    }
  }, [batchAnalysisMode]);

  // handleBatchAnalyze will be defined after articles

  const handleAnalyze = useCallback(async (article: any) => {
    console.log('🔍 Starting analysis for article:', article.title);
    console.log('📄 Article data:', article);
    
    setAnalyzingArticles(prev => new Set(prev).add(article.url));
    
    try {
      console.log('🚀 Calling analyzeArticleMutation with article:', article);
      const result = await analyzeArticleMutation.mutateAsync(article);
      
      console.log('✅ Analysis completed successfully:', result);
      
      // Validate the response structure
      if (!result || !result.data) {
        throw new Error('Invalid response: missing data field');
      }
      
      const analysisData = result.data;
      
      // Validate required fields
      if (!analysisData.summary) {
        throw new Error('Invalid response: missing summary field');
      }
      
      // Update the article with the new analysis in our state
      setArticlesWithAnalysis(prev => {
        const existing = prev.find(a => a.url === article.url);
        if (existing) {
          // Update existing article analysis
          return prev.map(a => 
            a.url === article.url 
              ? { ...a, analysis: analysisData }
              : a
          );
        } else {
          // Add new article with analysis
          return [...prev, { ...article, analysis: analysisData }];
        }
      });
      
      console.log('✅ Analysis state updated successfully for:', article.title);
      showToast('Article analyzed successfully!', 'success');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      console.error('📋 Error details:', {
        message: (error as any).message,
        response: (error as any).response?.data,
        status: (error as any).response?.status,
        article: article.title
      });
      
      // Show user-friendly error message
      showToast(`Failed to analyze article: ${(error as any).message || 'Unknown error'}`, 'error');
    } finally {
      setAnalyzingArticles(prev => {
        const newSet = new Set(prev);
        newSet.delete(article.url);
        return newSet;
      });
    }
  }, [analyzeArticleMutation]);

  // Reset analyzed articles when new search is performed
  useEffect(() => {
    setArticlesWithAnalysis([]);
  }, [searchQuery]);

  // Merge news articles with analysis data
  const articles = useMemo(() => {
    const newsArticles = newsData?.articles || [];
    return newsArticles.map((article: Article) => {
      const analyzed = articlesWithAnalysis.find((a: Article) => a.url === article.url);
      return analyzed || article;
    });
  }, [newsData?.articles, articlesWithAnalysis]);

  // Define handleSelectAll after articles is available
  const handleSelectAll = useCallback(() => {
    const articleUrls = articles.map((article: Article) => article.url);
    setSelectedArticles(new Set(articleUrls));
  }, [articles]);

  // Define handleBatchAnalyze after articles is available
  const handleBatchAnalyze = useCallback(async () => {
    if (selectedArticles.size === 0) return;
    
    // Get selected article objects
    const selectedArticleObjects = articles.filter((article: Article) => 
      selectedArticles.has(article.url)
    );
    
    if (selectedArticleObjects.length > 5) {
      showToast('Maximum 5 articles can be analyzed at once', 'error');
      return;
    }
    
    console.log('🔍 Starting batch analysis for articles:', selectedArticleObjects.map((a: Article) => a.title));
    
    setBatchStatus({
      total: selectedArticleObjects.length,
      successful: 0,
      failed: 0,
      inProgress: selectedArticleObjects.length
    });
    
    try {
      const result = await analyzeBatchMutation.mutateAsync(selectedArticleObjects);
      
      console.log('✅ Batch analysis completed:', result);
      
      if (result.data) {
        const { results, summary } = result.data;
        
        // Update articles with analysis results
        setArticlesWithAnalysis(prev => {
          const newAnalyzed = [...prev];
          
          results.forEach((resultItem: any) => {
            if (resultItem.status === 'fulfilled' && resultItem.analysis) {
              const existing = newAnalyzed.find(a => a.url === resultItem.article.url);
              if (existing) {
                // Update existing
                Object.assign(existing, { analysis: resultItem.analysis });
              } else {
                // Add new
                newAnalyzed.push({ ...resultItem.article, analysis: resultItem.analysis });
              }
            }
          });
          
          return newAnalyzed;
        });
        
        setBatchStatus({
          total: summary.total,
          successful: summary.successful,
          failed: summary.failed,
          inProgress: 0
        });
        
        showToast(`Batch analysis completed: ${summary.successful} successful, ${summary.failed} failed`, 
          summary.failed === 0 ? 'success' : 'error');
      }
      
    } catch (error) {
      console.error('❌ Batch analysis failed:', error);
      setBatchStatus(prev => prev ? { ...prev, inProgress: 0 } : null);
      showToast(`Batch analysis failed: ${(error as any).message || 'Unknown error'}`, 'error');
    }
  }, [selectedArticles, articles, analyzeBatchMutation, showToast]);

  // Reset selected articles when search changes
  useEffect(() => {
    setSelectedArticles(new Set());
    setBatchStatus(null);
  }, [searchQuery, resultLimit]);

  const hasResults = searchQuery && articles.length > 0;
  const showEmptyState = searchQuery && !isLoadingNews && articles.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Newspaper className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Smart Reviewer
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>AI Analysis</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>Real-time</span>
                </div>
              </div>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Discover & Analyze News
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Search for news articles and get AI-powered summaries with sentiment analysis
            </p>
          </div>
          
          <SearchBar
            onSearch={handleSearch}
            className="max-w-2xl mx-auto mb-4"
            placeholder="Search for news articles..."
          />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SearchFilters
              resultLimit={resultLimit}
              onResultLimitChange={handleResultLimitChange}
            />
            
            {hasResults && (
              <button
                onClick={toggleBatchMode}
                className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                  batchAnalysisMode
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {batchAnalysisMode ? 'Exit Batch Mode' : 'Batch Analysis'}
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        {!searchQuery && (
          <div className="text-center py-12">
            <Newspaper className="h-24 w-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start by searching for news
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a topic or keyword to find and analyze news articles
            </p>
          </div>
        )}

        {isLoadingNews && (
          <div className="py-12">
            <LoadingSpinner size="lg" text="Searching for articles..." />
          </div>
        )}

        {newsError && (
          <ErrorMessage
            title="Search Failed"
            message={newsError.message || 'Failed to search for articles'}
            onRetry={() => refetchNews()}
            className="py-12"
          />
        )}

        {showEmptyState && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Settings className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try searching for a different topic or keyword
            </p>
          </div>
        )}

        {hasResults && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Found {articles.length} articles
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search results for "{searchQuery}"
              </p>
            </div>

            {/* Batch Analysis Controls */}
            {batchAnalysisMode && (
              <BatchAnalysisControls
                totalArticles={articles.length}
                selectedCount={selectedArticles.size}
                isAnalyzing={analyzeBatchMutation.isPending}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onAnalyzeSelected={handleBatchAnalyze}
                batchStatus={batchStatus || undefined}
                className="mb-6"
              />
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article: any) => (
                <ArticleCard
                  key={article.url}
                  article={article}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={analyzingArticles.has(article.url)}
                  isSelected={selectedArticles.has(article.url)}
                  onSelect={handleArticleSelect}
                  showSelection={batchAnalysisMode}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Smart Reviewer - AI-powered news analysis</p>
            <p className="mt-1">Built with React, TypeScript, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}