import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import { extract } from '@extractus/article-extractor';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the structured output schema
const articleAnalysisSchema = z.object({
  summary: z.string().describe('A comprehensive summary of the article (100-200 words)'),
  sentimentHint: z.enum(['positive', 'neutral', 'negative']).describe('The sentiment of the article')
});

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    // Initialize LangChain model with structured output support
    this.langChainModel = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3,
      maxOutputTokens: 500,
      topK: 40,
      topP: 0.95,
    });
    
    // Create structured output model
    this.structuredModel = this.langChainModel.withStructuredOutput(articleAnalysisSchema);
    
    // Fallback to original client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    this.requestCount = 0;
    this.minuteLimit = 15;
    this.resetTime = Date.now() + 60 * 1000; // Reset every minute
  }

  // Reset request counter every minute
  checkAndResetCounter() {
    const now = Date.now();
    if (now >= this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60 * 1000;
    }
  }

  async analyzeArticle(article) {
    this.checkAndResetCounter();
    
    if (this.requestCount >= this.minuteLimit) {
      throw new Error('Gemini API rate limit exceeded (15 requests/minute)');
    }

    // Extract full article content using @extractus/article-extractor
    let enrichedArticle = { ...article };
    
    try {
      if (article.url) {
        console.log(`🔍 Extracting full content from URL: ${article.url}`);
        const extractedData = await extract(article.url);
        
        if (extractedData && extractedData.content) {
          enrichedArticle.content = extractedData.content;
          console.log(`✅ Extracted ${extractedData.content.length} characters from article`);
          
          // Also update title and description if they're better
          if (extractedData.title && extractedData.title.length > article.title?.length) {
            enrichedArticle.title = extractedData.title;
          }
          if (extractedData.description && extractedData.description.length > (article.description?.length || 0)) {
            enrichedArticle.description = extractedData.description;
          }
        }
      }
    } catch (extractError) {
      console.warn('Article extraction failed:', extractError.message);
      // Continue with original article data
    }

    try {
      // Try LangChain structured approach first
      const structuredResult = await this.analyzeWithLangChain(enrichedArticle);
      this.requestCount++;
      console.log(`Gemini API called successfully with LangChain structured output. Requests used: ${this.requestCount}/${this.minuteLimit}`);
      return structuredResult;
    } catch (langChainError) {
      console.warn('LangChain structured approach failed:', langChainError.message);
      // Continue to fallback method
    }

    // Fallback to enhanced prompt approach
    try {
      const prompt = `
        Analyze this news article and provide:
        1. A comprehensive summary (aim for 100-200 words but be flexible based on content importance)
        2. Initial sentiment assessment
        
        Article Title: ${enrichedArticle.title}
        Article Content: ${enrichedArticle.content || enrichedArticle.description || ''}
      `;

      // Enhanced prompt for better JSON compliance
      const enhancedPrompt = `${prompt}
      
      Please respond ONLY with valid JSON in this exact format:
      {"summary": "your summary here", "sentimentHint": "positive|neutral|negative"}
      
      Do not include any markdown formatting or code blocks.`;

      const result = await this.model.generateContent({
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          topK: 40,
          topP: 0.95,
        }
      });

      this.requestCount++;
      
      const responseText = result.response.text();
      console.log(`Gemini API called successfully with fallback. Requests used: ${this.requestCount}/${this.minuteLimit}`);
      
      // Enhanced JSON parsing with multiple strategies
      return this.parseGeminiResponse(responseText, enrichedArticle);
      
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Provide fallback response
      return {
        summary: this.generateFallbackSummary(enrichedArticle),
        sentimentHint: 'neutral'
      };
    }
  }

  async analyzeWithLangChain(article) {
    try {
      const prompt = `
        Analyze this news article and provide:
        1. A comprehensive yet concise summary following the article language (aim for 100-200 words but be flexible based on content importance)
        2. Initial sentiment assessment
        
        Article Title: ${article.title}
        Article Content: ${article.content || article.description || ''}
      `;

      // Use structured output - automatically validates against Zod schema
      const result = await this.structuredModel.invoke(prompt);
      
      // Additional validation to ensure the result is valid
      const validatedResult = articleAnalysisSchema.parse(result);
      
      console.log('✅ Structured output successful:', validatedResult);
      return validatedResult;
      
    } catch (error) {
      console.error('LangChain structured output error:', error);
      
      // Check if it's a Zod validation error
      if (error.name === 'ZodError') {
        console.error('Schema validation failed:', error.errors);
        throw new Error(`Schema validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      
      throw error;
    }
  }

  parseGeminiResponse(responseText, article) {
    console.log('Raw Gemini response:', responseText);
    
    // Simplified JSON parsing for fallback method only
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.summary && parsed.sentimentHint) {
        console.log('✅ Direct JSON parsing successful');
        return parsed;
      }
    } catch (parseError) {
      console.log('❌ Direct JSON parsing failed, using fallback');
    }
    
    // Fallback to basic extraction
    const summary = this.extractSummary(responseText);
    const sentimentHint = this.extractSentimentHint(responseText);
    
    const result = {
      summary: summary || this.generateFallbackSummary(article),
      sentimentHint: sentimentHint || 'neutral'
    };
    
    console.log('📋 Fallback extraction result:', result);
    return result;
  }

  // Extract summary from malformed response
  extractSummary(text) {
    const summaryMatch = text.match(/"summary":\s*"([^"]+)"/);
    return summaryMatch ? summaryMatch[1] : null;
  }

  // Extract sentiment hint from malformed response
  extractSentimentHint(text) {
    const sentimentMatch = text.match(/"sentimentHint":\s*"(positive|neutral|negative)"/);
    return sentimentMatch ? sentimentMatch[1] : 'neutral';
  }

  // Generate fallback summary when Gemini fails
  generateFallbackSummary(article) {
    const content = article.content || article.description || '';
    const sentences = content.split('. ');
    
    // Take first 2-3 sentences as summary
    const summary = sentences.slice(0, 3).join('. ');
    return summary.length > 50 ? summary : article.title;
  }

  // Get remaining API requests
  getRemainingRequests() {
    this.checkAndResetCounter();
    return this.minuteLimit - this.requestCount;
  }

  // Get service status
  getStatus() {
    return {
      available: !!process.env.GEMINI_API_KEY,
      requestsRemaining: this.getRemainingRequests(),
      resetTime: this.resetTime
    };
  }
}

export default new GeminiService();