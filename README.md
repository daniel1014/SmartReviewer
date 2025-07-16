# Smart Reviewer - AI-Powered News Analysis Platform

A modern web application that enables users to search real-time news articles, analyze them using AI-powered summarization and sentiment analysis, and store results for future reference.

## 🚀 Features

- **Real-time News Search**: Search current news articles using the GNews API
- **AI-Powered Summarization**: Get intelligent summaries using Google Gemini 2.0 Flash
- **ML Sentiment Analysis**: Advanced sentiment analysis with confidence scoring
- **Batch Processing**: Analyze up to 5 articles simultaneously
- **Dark/Light Theme**: Toggle between light and dark themes
- **Session-based History**: Track your analysis history
- **Responsive Design**: Works seamlessly on desktop and mobile

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
- **AI Services**: Google Gemini 2.0 Flash API
- **ML Processing**: Local sentiment analysis with Natural.js
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
├── shared/                 # Shared types and constants
├── vercel.json             # Deployment configuration
└── package.json            # Root package management
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account
- GNews API key
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-reviewer
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Environment Configuration**

Create `.env` files in both `api/` and `client/` directories:

**api/.env**
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/smart-reviewer
GNEWS_API_KEY=your_gnews_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=3000
```

**client/.env.local**
```
VITE_API_URL=http://localhost:3000
VITE_SESSION_KEY=smart_reviewer_session
```

### Development

Run both frontend and backend simultaneously:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend
npm run dev:api

# Frontend
npm run dev:client
```

### Building for Production

```bash
npm run build
```

## 🔧 API Endpoints

### News Search
- `GET /api/news/search?q={query}&page={page}&limit={limit}` - Search news articles
- `GET /api/news/status` - Get GNews service status

### Analysis
- `POST /api/analysis/article` - Analyze single article
- `POST /api/analysis/batch` - Analyze multiple articles (max 5)
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
- **Library**: Natural.js with custom enhancements
- **Features**: Negation detection, intensifier recognition, Gemini integration
- **Output**: Label (positive/neutral/negative), score (-5 to +5), confidence (0-1)

### Article Summarization
- **Model**: Google Gemini 2.0 Flash
- **Features**: Flexible length, content-aware summarization
- **Optimization**: Temperature 0.3, max 500 tokens

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

- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Processing time tracking
- **API Usage**: Rate limiting and quota monitoring
- **Cache Statistics**: Hit/miss ratio tracking

## 🔧 Technical Constraints

- **GNews API**: 100 requests/day limit
- **Gemini API**: 15 requests/minute limit
- **Vercel Serverless**: 10-second execution timeout
- **MongoDB Atlas**: 512MB storage (free tier)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, please open an issue in the repository or contact the development team.

---

**Built with ❤️ using React, TypeScript, Node.js, and MongoDB**
