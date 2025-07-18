import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import { extract } from '@extractus/article-extractor';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the structured output schema
const articleAnalysisSchema = z.object({
  summary: z.string().describe('A clear and concise summary in the same language as the article (100-200 words)'),
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
      // Use LangChain structured approach
      const result = await this.analyzeWithLangChain(enrichedArticle);
      this.requestCount++;
      console.log(`Gemini API called successfully with LangChain structured output. Requests used: ${this.requestCount}/${this.minuteLimit}`);
      return result;
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
        1. A clear and concise summary in the same language as the article. The summary should capture the main points and important details, ideally between 100-200 words, but adjust the length if the content requires more or less explanation.
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