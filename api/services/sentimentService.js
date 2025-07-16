import Sentiment from 'sentiment';
import natural from 'natural';

class SentimentService {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    
    // Custom sentiment words for news analysis
    this.sentiment.registerLanguage('en', {
      labels: {
        // Positive news words
        'breakthrough': 3,
        'success': 2,
        'achievement': 2,
        'progress': 2,
        'improvement': 2,
        'victory': 3,
        'milestone': 2,
        'innovation': 2,
        'solution': 2,
        'recovery': 2,
        
        // Negative news words
        'crisis': -3,
        'disaster': -3,
        'failure': -2,
        'decline': -2,
        'concern': -1,
        'threat': -2,
        'risk': -1,
        'problem': -1,
        'issue': -1,
        'controversy': -2
      }
    });
  }

  analyzeSentiment(text, geminiHint = null) {
    try {
      // Primary sentiment analysis
      const analysis = this.sentiment.analyze(text);
      
      // Feature extraction
      const tokens = this.tokenizer.tokenize(text.toLowerCase());
      const features = this.extractFeatures(tokens, analysis);
      
      // Calculate final sentiment score
      const finalScore = this.calculateWeightedScore(
        analysis.score,
        features,
        geminiHint,
        text.length
      );
      
      // Determine label and confidence
      const label = this.determineLabel(finalScore);
      const confidence = this.calculateConfidence(
        analysis,
        finalScore,
        geminiHint,
        label,
        text.length
      );

      return {
        label,
        score: finalScore,
        confidence,
        details: {
          positiveWords: analysis.positive,
          negativeWords: analysis.negative,
          comparative: analysis.comparative
        }
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      
      // Fallback to neutral sentiment
      return {
        label: 'neutral',
        score: 0,
        confidence: 0.5,
        details: {
          positiveWords: [],
          negativeWords: [],
          comparative: 0
        }
      };
    }
  }

  extractFeatures(tokens, analysis) {
    const features = {
      negationCount: 0,
      intensifierCount: 0,
      questionMarks: 0,
      exclamationMarks: 0,
      capitalWords: 0,
      textLength: tokens.length
    };

    const negations = ['not', 'no', 'never', 'neither', 'nobody', 'nowhere', 'nothing', 'none'];
    const intensifiers = ['very', 'extremely', 'absolutely', 'completely', 'totally', 'entirely', 'highly'];

    tokens.forEach((token, i) => {
      if (negations.includes(token)) {
        features.negationCount++;
      }
      
      if (intensifiers.includes(token)) {
        features.intensifierCount++;
      }
      
      if (token === '?') {
        features.questionMarks++;
      }
      
      if (token === '!') {
        features.exclamationMarks++;
      }
      
      if (token === token.toUpperCase() && token.length > 2) {
        features.capitalWords++;
      }
    });

    return features;
  }

  calculateWeightedScore(baseScore, features, geminiHint, textLength) {
    let score = baseScore;
    
    // Normalize score by text length
    const lengthNormalizer = Math.min(textLength / 100, 1);
    score = score * lengthNormalizer;
    
    // Apply feature weights
    score += features.intensifierCount * 0.5;
    score -= features.negationCount * 0.8;
    score += features.exclamationMarks * 0.3;
    score -= features.questionMarks * 0.1;
    score += features.capitalWords * 0.2;
    
    // Incorporate Gemini hint with weighted approach
    if (geminiHint) {
      const hintScore = {
        positive: 2,
        neutral: 0,
        negative: -2
      }[geminiHint];
      
      // 70% ML sentiment, 30% Gemini hint
      score = score * 0.7 + hintScore * 0.3;
    }
    
    // Clamp score to -5 to +5 range
    return Math.max(-5, Math.min(5, score));
  }

  determineLabel(score) {
    if (score > 0.5) return 'positive';
    if (score < -0.5) return 'negative';
    return 'neutral';
  }

  calculateConfidence(analysis, finalScore, geminiHint, label, textLength) {
    let confidence = 0.5;
    
    // Base confidence on score magnitude
    confidence += Math.min(Math.abs(finalScore) / 10, 0.3);
    
    // Agreement with Gemini boosts confidence
    if (geminiHint && geminiHint === label) {
      confidence += 0.2;
    }
    
    // Clear positive/negative words boost confidence
    const wordCount = analysis.positive.length + analysis.negative.length;
    confidence += Math.min(wordCount / 20, 0.2);
    
    // Longer text generally provides more confidence
    const textLengthBoost = Math.min(textLength / 1000, 0.1);
    confidence += textLengthBoost;
    
    // Strong scores get higher confidence
    if (Math.abs(finalScore) > 2) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1);
  }

  // Batch sentiment analysis
  analyzeBatch(texts, geminiHints = []) {
    return texts.map((text, index) => {
      const hint = geminiHints[index] || null;
      return this.analyzeSentiment(text, hint);
    });
  }

  // Get service statistics
  getStats() {
    return {
      available: true,
      version: '1.0.0',
      features: ['negation_detection', 'intensifier_detection', 'gemini_integration']
    };
  }
}

export default new SentimentService();