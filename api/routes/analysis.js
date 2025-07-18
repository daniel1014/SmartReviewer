import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Article from '../models/Article.js';
import geminiService from '../services/geminiService.js';
import sentimentService from '../services/sentimentService.js';

const router = express.Router();

// Analyze single article
router.post('/article', async (req, res) => {
  try {
    console.log('📥 Analysis request received:', {
      body: req.body,
      headers: req.headers['x-session-id']
    });
    
    const { article } = req.body;
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    
    if (!article || !article.url || !article.title) {
      console.log('❌ Invalid article data:', { 
        hasArticle: !!article,
        hasUrl: !!article?.url,
        hasTitle: !!article?.title 
      });
      return res.status(400).json({
        error: 'Article with url and title is required'
      });
    }

    const result = await analyzeWithRetry(article, sessionId);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Article analysis error:', error);
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Analysis rate limit exceeded',
        retryAfter: 60
      });
    }

    res.status(500).json({
      error: 'Failed to analyze article',
      message: error.message
    });
  }
});

// Batch analyze articles (up to 5)
router.post('/batch', async (req, res) => {
  try {
    const { articles } = req.body;
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    
    if (!articles || !Array.isArray(articles)) {
      return res.status(400).json({
        error: 'Articles array is required'
      });
    }

    // Remove arbitrary limitation on number of articles for batch analysis
    if (articles.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 articles can be analyzed at once'
      });
    }

    // Process all articles in parallel
    const results = await Promise.allSettled(
      articles.map(article => analyzeWithRetry(article, sessionId))
    );

    const processed = results.map((result, index) => ({
      article: articles[index],
      status: result.status,
      analysis: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    res.json({
      success: true,
      data: {
        results: processed,
        summary: {
          total: articles.length,
          successful: processed.filter(r => r.status === 'fulfilled').length,
          failed: processed.filter(r => r.status === 'rejected').length
        }
      }
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze articles batch',
      message: error.message
    });
  }
});

// Get analysis history for session
router.get('/history', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    const { page = 1, limit = 20, sentiment } = req.query;
    
    const query = { sessionId, status: 'completed' };
    
    if (sentiment && ['positive', 'neutral', 'negative'].includes(sentiment)) {
      query['analysis.sentiment.label'] = sentiment;
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 results per page

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-__v');

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch analysis history',
      message: error.message
    });
  }
});

// Get analysis service status
router.get('/status', async (req, res) => {
  try {
    const geminiStatus = geminiService.getStatus();
    const sentimentStatus = sentimentService.getStats();
    
    // Monitor MongoDB connection
    const startTime = Date.now();
    let databaseStatus = {
      status: 'disconnected',
      readyState: mongoose.connection.readyState,
      responseTime: null,
      error: null
    };
    
    try {
      // Test database connection with ping
      await mongoose.connection.db.admin().ping();
      databaseStatus = {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
        readyState: mongoose.connection.readyState,
        responseTime: Date.now() - startTime,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        error: null
      };
    } catch (dbError) {
      databaseStatus.error = dbError.message;
      databaseStatus.status = 'disconnected';
    }
    
    // Overall system status
    const systemStatus = databaseStatus.status === 'connected' ? 'operational' : 'degraded';
    
    res.json({
      services: {
        gemini: geminiStatus,
        sentiment: sentimentStatus,
        database: databaseStatus
      },
      status: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to analyze article with retry logic
async function analyzeWithRetry(article, sessionId, maxRetries = 3) {
  let lastError;
  const startTime = Date.now();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check if already analyzed
      const urlHash = crypto.createHash('md5').update(article.url).digest('hex');
      const existing = await Article.findOne({ urlHash });
      
      if (existing?.analysis?.summary) {
        console.log(`Using cached analysis for: ${article.title}`);
        return existing.analysis;
      }

      // Perform analysis
      const geminiResult = await geminiService.analyzeArticle(article);
      
      const sentiment = sentimentService.analyzeSentiment(
        `${article.title} ${article.content || article.description || ''}`,
        geminiResult.sentimentHint
      );

      // Calculate summary length - use character count for non-English languages
      const isChinese = /[\u4e00-\u9fff]/.test(geminiResult.summary);
      const summaryLength = isChinese 
        ? geminiResult.summary.length // Character count for Chinese
        : geminiResult.summary.split(' ').length; // Word count for English

      const analysis = {
        summary: geminiResult.summary,
        summaryLength,
        sentiment,
        analyzedAt: new Date(),
        processingTime: Date.now() - startTime
      };

      // Save to database
      const saved = await Article.findOneAndUpdate(
        { urlHash },
        {
          ...article,
          urlHash,
          sessionId,
          analysis,
          status: 'completed',
          retryCount: attempt
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true
        }
      );

      console.log(`Analysis completed for: ${article.title} (attempt ${attempt + 1})`);
      return saved.analysis;

    } catch (error) {
      lastError = error;
      console.error(`Analysis attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Save failed analysis to database
  try {
    const urlHash = crypto.createHash('md5').update(article.url).digest('hex');
    await Article.findOneAndUpdate(
      { urlHash },
      {
        ...article,
        urlHash,
        sessionId,
        status: 'failed',
        retryCount: maxRetries
      },
      { upsert: true, runValidators: true }
    );
  } catch (dbError) {
    console.error('Failed to save error state:', dbError);
  }
  
  throw lastError;
}

export default router;