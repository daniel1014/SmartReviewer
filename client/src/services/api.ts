import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Session management - generates unique session ID for tracking
const SESSION_KEY = import.meta.env.VITE_SESSION_KEY || 'smart_reviewer_session';

const getSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
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
  search: (query: string, page = 1, limit = 9, filters?: { country?: string; language?: string }) => {
    const params: any = { q: query, page, limit };
    
    // Add filters if provided
    if (filters?.country) params.country = filters.country;
    if (filters?.language) params.language = filters.language;
    
    return api.get('/news/search', { params });
  },
  
  getStatus: () => 
    api.get('/news/status'),
};

// Helper function to handle API calls with consistent error handling
const apiCall = async (apiFunction: () => Promise<any>, errorContext: string) => {
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    console.error(`❌ API ${errorContext} failed:`, error);
    throw error;
  }
};

export const analysisAPI = {
  analyzeArticle: (article: any) => 
    apiCall(() => api.post('/analysis/article', { article }), 'article analysis'),
    
  analyzeBatch: (articles: any[]) => 
    apiCall(() => api.post('/analysis/batch', { articles }), 'batch analysis'),
    
  getHistory: (filters = {}) => 
    apiCall(() => api.get('/analysis/history', { params: filters }), 'history fetch'),
    
  getStatus: () => 
    apiCall(() => api.get('/analysis/status'), 'status check'),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;