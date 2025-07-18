# Smart Reviewer - AI-Powered News Analysis Platform

**Live Demo:** [https://smart-reviewer-aries-global.vercel.app/](https://smart-reviewer-aries-global.vercel.app/)

## Overview
A modern web application that enables users to search for real-time news articles, analyze them using AI-powered summarization and sentiment analysis, and store results for future reference. Built with a MERN stack and deployed on Vercel, it demonstrates scalable, modular, and production-ready architecture.

## Key Features
- **Real-time News Search:** Search for news articles using the GNews API with advanced filtering (country, language).
- **AI-Powered Summarization:** Each article is summarized using Google Gemini 2.0 Flash via LangChain with structured output.
- **ML-Based Sentiment Analysis:** Sentiment is determined using a hybrid of ML (Sentiment.js) and LLM hints.
- **Batch Analysis:** Analyze up to **10 articles at once** with real-time progress and error handling.
- **Session-Based History:** Each user's analysis history is stored and filterable by sentiment.
- **Dark/Light Theme:** Fully responsive and theme-aware UI.
- **Robust Error Handling:** Rate limiting, health checks, and user-friendly error messages.

## 🏗️ Architecture
### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Query for server state
- **UI Components**: Custom components with Lucide React icons
- **Build Tool**: Vite

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **AI Services**: Google Gemini 2.0 Flash API with LangChain
- **ML Processing**: Local sentiment analysis with Natural.js & Sentiment.js
- **External APIs**: GNews.io for news data
- **Caching**: Node-cache for API response caching

### Deployment
- **Platform**: Vercel serverless functions
- **Database**: MongoDB Atlas
- **CDN**: Vercel Edge Network

## 📦 Project Structure

```
smart-reviewer/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Theme)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   └── services/       # API service layer
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── api/                    # Express serverless functions
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API route handlers
│   ├── services/           # External service integrations
│   └── package.json        # Backend dependencies

## Setup & Running Locally
1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd SmartReviewer
   ```
2. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install
   cd ../api && npm install
   ```
3. **Environment variables:**
   - Set up `.env` files in both `client/` and `api/` (see `tasks/spec.md` for required keys).
4. **Run locally:**
   ```bash
   npm run dev
   ```
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - API: [http://localhost:3000/api](http://localhost:3000/api)

## Main Files & Structure
- `client/src/pages/Dashboard.tsx` — Main UI, search, batch analysis, and history
- `client/src/components/BatchAnalysisControls.tsx` — Batch selection and progress
- `client/src/components/ArticleCard.tsx` — Article display and analysis trigger
- `api/routes/analysis.js` — Analysis endpoints, batch workflow, history
- `api/services/geminiService.js` — AI summarization (LangChain + Gemini)
- `api/services/sentimentService.js` — Sentiment analysis logic
- `api/models/Article.js` — MongoDB schema for articles and analysis

---

## 🔧 API Endpoints

### News Search
- `GET /api/news/search?q={query}&page={page}&limit={limit}` - Search news articles
- `GET /api/news/status` - Get GNews service status

### Analysis
- `POST /api/analysis/article` - Analyze single article
- `POST /api/analysis/batch` - Analyze multiple articles (max 10)
- `GET /api/analysis/history` - Get analysis history
- `GET /api/analysis/status` - Get analysis service status

### Health Check
- `GET /api/health` - Application health status

## 🎯 Usage

1. **Search News**: Enter keywords in the search bar to find relevant articles
2. **Analyze Articles**: Click "Analyze Article" on any news card to get AI-powered analysis
3. **View Results**: See sentiment analysis, confidence scores, and intelligent summaries
4. **Toggle Theme**: Switch between light and dark modes using the theme toggle
5. **Review History**: Access your analysis history in your session

## 🧠 AI & ML Features

### Sentiment Analysis
- **Approach**: Analyzes sentiment using a rule-based ML library, enhances it with text features, and blends in an LLM (Gemini) hint for a balanced, robust result.
- **Library**: Natural.js, Sentiment.js, Gemini
- **Features**: Negation detection, intensifier recognition, Gemini integration. 
- **Output**: Label (positive/neutral/negative), score (-5 to +5), confidence (0-1)

### Article Summarization
- **Approach**: Extracts the full news article content directly from the provided URL before summarization, ensuring summaries are based on the complete article text rather than just metadata or snippets.
- **Model**: Google Gemini 2.0 Flash
- **Features**: Flexible length, content-aware summarization

### Caching Strategy
- **News API**: 5-minute cache for search results
- **Analysis Results**: Permanent storage in MongoDB
- **Session Management**: Browser localStorage for user sessions

## 🔒 Security Features

- **Rate Limiting**: 30 requests per minute per IP
- **Input Validation**: Comprehensive validation on all endpoints
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet Security**: Security headers via Helmet.js
- **Environment Variables**: Secure API key management

## 📊 Performance Optimizations

- **Caching**: Multi-layer caching (browser, server, database)
- **Debouncing**: Search input debouncing (500ms)
- **Lazy Loading**: Image lazy loading for better performance
- **Bundle Optimization**: Vite build optimization
- **Error Boundaries**: Graceful error handling

## 🚀 Deployment

### Vercel Deployment

1. **Configure vercel.json** (already included)
2. **Set Environment Variables** in Vercel dashboard
3. **Deploy**: 
```bash
vercel deploy
```

### Environment Variables (Production)
Set these in your Vercel dashboard:
- `MONGODB_URI`
- `GNEWS_API_KEY`
- `GEMINI_API_KEY`
- `NODE_ENV=production`

## 📈 Monitoring

- **Error Tracking**: Comprehensive error logging (Vercel backlog)
- **Performance Metrics**: Processing time tracking
- **API Usage**: Rate limiting and quota monitoring
- **Cache Statistics**: Hit/miss ratio tracking

## 🔧 Technical Constraints

- **GNews API**: 100 requests/day, 10 news per request limit
- **Gemini API**: 15 requests/minute limit
- **Vercel Serverless**: 10-second execution timeout
- **MongoDB Atlas**: 512MB storage (free tier)

---

**Built with ❤️ using React, TypeScript, Node.js (Express), and MongoDB**
