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
    
    const cacheKey = `news_${crypto.createHash('md5').update(`${query}_${page}_${limit}`).digest('hex')}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log(`Cache hit for query: ${query}`);
      return cached;
    }

    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Daily API limit reached for GNews');
    }

    try {
      const url = `${this.baseURL}/search?q=${encodeURIComponent(query)}&lang=en&max=${limit}&page=${page}&apikey=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GNews API error: ${response.status} ${response.statusText}`);
      }
      
      this.requestCount++;
      const data = await response.json();
      
      // Transform data to match our Article interface
      const transformedData = {
        ...data,
        articles: data.articles.map(article => ({
          ...article,
          urlHash: crypto.createHash('md5').update(article.url).digest('hex'),
          content: article.content || article.description || '',
          publishedAt: new Date(article.publishedAt)
        }))
      };
      
      cache.set(cacheKey, transformedData);
      console.log(`GNews API called successfully. Requests used: ${this.requestCount}/${this.dailyLimit}`);
      
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