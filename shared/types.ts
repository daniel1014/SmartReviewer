// Shared types between client and API
export interface Article {
  url: string;
  urlHash: string;
  title: string;
  description?: string;
  content: string;
  image?: string;
  publishedAt: Date;
  source: {
    name: string;
    url: string;
  };
  analysis?: ArticleAnalysis;
  sessionId?: string;
  searchQuery?: string;
  retryCount?: number;
  status?: 'pending' | 'completed' | 'failed';
}

export interface ArticleAnalysis {
  summary: string;
  summaryLength: number;
  sentiment: SentimentAnalysis;
  analyzedAt: Date;
  processingTime: number;
}

export interface SentimentAnalysis {
  label: 'positive' | 'neutral' | 'negative';
  score: number; // -5 to +5
  confidence: number; // 0 to 1
  details: {
    positiveWords: string[];
    negativeWords: string[];
    comparative: number;
  };
}

export interface NewsSearchResponse {
  articles: Article[];
  totalArticles: number;
  page: number;
  totalPages: number;
}

export interface AnalysisRequest {
  article: Article;
  sessionId: string;
}

export interface BatchAnalysisRequest {
  articles: Article[];
  sessionId: string;
}

export interface BatchAnalysisResponse {
  results: {
    article: Article;
    status: 'fulfilled' | 'rejected';
    analysis?: ArticleAnalysis;
    error?: string;
  }[];
}