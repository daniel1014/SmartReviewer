import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  // Article Identity
  url: { type: String, required: true, unique: true },
  urlHash: { type: String, required: true, index: true },
  
  // Article Content
  title: { type: String, required: true },
  description: String,
  content: { type: String, required: true },
  image: String,
  publishedAt: Date,
  source: {
    name: String,
    url: String
  },
  
  // Analysis Results
  analysis: {
    summary: String,
    summaryLength: Number,
    sentiment: {
      label: { type: String, enum: ['positive', 'neutral', 'negative'] },
      score: Number, // -5 to +5
      confidence: Number, // 0 to 1
      details: {
        positiveWords: [String],
        negativeWords: [String],
        comparative: Number
      }
    },
    analyzedAt: Date,
    processingTime: Number // milliseconds
  },
  
  // Metadata
  sessionId: String,
  searchQuery: String,
  retryCount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
}, {
  timestamps: true
});

// Indexes for performance
articleSchema.index({ createdAt: -1 });
articleSchema.index({ 'analysis.sentiment.label': 1 });
articleSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model('Article', articleSchema);