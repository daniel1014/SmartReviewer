import NodeCache from 'node-cache';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

class GNewsService {
  constructor() {
    this.baseURL = 'https://gnews.io/api/v4';
    this.apiKey = process.env.GNEWS_API_KEY;
    this.requestCount = 0;
    this.dailyLimit = 100;
    this.resetTime = new Date().setHours(24, 0, 0, 0); // Reset at midnight
  }

  // Reset request counter at midnight
  checkAndResetCounter() {
    const now = Date.now();
    if (now >= this.resetTime) {
      this.requestCount = 0;
      this.resetTime = new Date().setHours(24, 0, 0, 0);
    }
  }

  async searchNews(query, page = 1, limit = 9) {
    this.checkAndResetCounter();
    
    // First check if we have cached all results for this query
    const masterCacheKey = `news_master_${crypto.createHash('md5').update(query).digest('hex')}`;
    const specificCacheKey = `news_${crypto.createHash('md5').update(`${query}_${page}_${limit}`).digest('hex')}`;
    
    const cachedSpecific = cache.get(specificCacheKey);
    if (cachedSpecific) {
      console.log(`Cache hit for query: ${query}, page: ${page}, limit: ${limit}`);
      return cachedSpecific;
    }

    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Daily API limit reached for GNews');
    }

    try {
      // Check if we have the master results cached
      let masterResults = cache.get(masterCacheKey);
      
      if (!masterResults) {
        // GNews API: Fetch maximum results (100) for this query
        const url = `${this.baseURL}/search?q=${encodeURIComponent(query)}&lang=en&max=100&apikey=${this.apiKey}`;
        
        console.log(`GNews API URL: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`GNews API error: ${response.status} ${response.statusText}`);
        }
        
        this.requestCount++;
        const data = await response.json();
        
        
        // Transform and cache all results
        masterResults = {
          ...data,
          articles: data.articles.map(article => ({
            ...article,
            urlHash: crypto.createHash('md5').update(article.url).digest('hex'),
            content: article.content || article.description || '',
            publishedAt: new Date(article.publishedAt)
          }))
        };
        
        // Cache the master results for 5 minutes
        cache.set(masterCacheKey, masterResults, 300);
        console.log(`GNews API called successfully. Total results: ${data.totalArticles}, Requests used: ${this.requestCount}/${this.dailyLimit}`);
      } else {
        console.log(`Using cached master results for query: ${query}`);
      }
      
      // Now paginate from the cached results
      const startIndex = (page - 1) * limit;
      
      // Create infinite scroll by cycling through available articles
      const cycledArticles = [];
      const totalNeeded = limit;
      const availableArticles = masterResults.articles;
      
      for (let i = 0; i < totalNeeded; i++) {
        const articleIndex = (startIndex + i) % availableArticles.length;
        cycledArticles.push(availableArticles[articleIndex]);
      }
      
      // Limit total articles to 40 to show "end" state
      const totalDisplayed = (page - 1) * limit + cycledArticles.length;
      const maxArticles = 40;
      
      const transformedData = {
        totalArticles: masterResults.totalArticles,
        articles: cycledArticles,
        currentPage: page,
        hasMore: totalDisplayed < maxArticles, // Stop at 40 articles
        totalResults: masterResults.totalArticles || 0
      };
      
      // Cache this specific page result
      cache.set(specificCacheKey, transformedData, 300);
      
      return transformedData;
    } catch (error) {
      console.error('GNews API error:', error);
      throw error;
    }
  }

  // Get remaining API requests
  getRemainingRequests() {
    this.checkAndResetCounter();
    return this.dailyLimit - this.requestCount;
  }

  // Get cache statistics
  getCacheStats() {
    return {
      keys: cache.keys().length,
      hits: cache.getStats().hits,
      misses: cache.getStats().misses
    };
  }
}

export default new GNewsService();