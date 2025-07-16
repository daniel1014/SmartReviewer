import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Session management
const getSessionId = () => {
  let sessionId = localStorage.getItem(import.meta.env.VITE_SESSION_KEY || 'smart_reviewer_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(import.meta.env.VITE_SESSION_KEY || 'smart_reviewer_session', sessionId);
  }
  return sessionId;
};

// Add session ID to all requests
api.interceptors.request.use(config => {
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      // Rate limit exceeded
      throw new Error('Too many requests. Please try again later.');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
);

export const newsAPI = {
  search: (query: string, page = 1, limit = 9) => 
    api.get('/news/search', { params: { q: query, page, limit } }),
  
  getStatus: () => 
    api.get('/news/status'),
};

export const analysisAPI = {
  analyzeArticle: async (article: any) => {
    try {
      console.log('🚀 API: Sending analysis request for article:', article.title);
      const response = await api.post('/analysis/article', { article });
      console.log('✅ API: Analysis response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Analysis request failed:', error);
      throw error;
    }
  },
    
  analyzeBatch: async (articles: any[]) => {
    try {
      const response = await api.post('/analysis/batch', { articles });
      return response.data;
    } catch (error) {
      console.error('❌ API: Batch analysis failed:', error);
      throw error;
    }
  },
    
  getHistory: async (filters = {}) => {
    try {
      const response = await api.get('/analysis/history', { params: filters });
      return response.data;
    } catch (error) {
      console.error('❌ API: History fetch failed:', error);
      throw error;
    }
  },
    
  getStatus: async () => {
    try {
      const response = await api.get('/analysis/status');
      return response.data;
    } catch (error) {
      console.error('❌ API: Status check failed:', error);
      throw error;
    }
  },
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;