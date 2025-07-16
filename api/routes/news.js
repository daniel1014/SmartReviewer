import express from 'express';
import gnewsService from '../services/gnewsService.js';

const router = express.Router();

// Search news articles
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 9 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter is required'
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        error: 'Query too long (max 100 characters)'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || pageNum > 10) {
      return res.status(400).json({
        error: 'Page must be between 1 and 10'
      });
    }

    if (limitNum < 1 || limitNum > 10) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 10'
      });
    }

    const result = await gnewsService.searchNews(query, pageNum, limitNum);

    res.json({
      success: true,
      data: result,
      meta: {
        query: query,
        page: pageNum,
        limit: limitNum,
        remainingRequests: gnewsService.getRemainingRequests(),
        cached: result.cached || false
      }
    });

  } catch (error) {
    console.error('News search error:', error);
    
    if (error.message.includes('Daily API limit')) {
      return res.status(429).json({
        error: 'Daily news API limit reached. Please try again tomorrow.',
        retryAfter: 86400 // 24 hours
      });
    }

    res.status(500).json({
      error: 'Failed to search news articles',
      message: error.message
    });
  }
});

// Get GNews service status
router.get('/status', (req, res) => {
  try {
    const stats = gnewsService.getCacheStats();
    
    res.json({
      service: 'GNews',
      status: 'operational',
      remainingRequests: gnewsService.getRemainingRequests(),
      cache: stats
    });
  } catch (error) {
    res.status(500).json({
      service: 'GNews',
      status: 'error',
      error: error.message
    });
  }
});

export default router;