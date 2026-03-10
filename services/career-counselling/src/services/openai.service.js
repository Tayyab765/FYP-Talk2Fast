import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

/**
 * OpenAI Service
 * Handles all interactions with OpenAI API
 * Implements retry logic, error handling, and token optimization
 */

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.client = null;
  }
  
  /**
   * Initialize OpenAI client (lazy initialization)
   * @private
   */
  _ensureClient() {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured. Please set it in your .env file.');
    }
    
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.apiKey
      });
    }
  }
  
  /**
   * Generate AI-powered degree recommendations
   * @param {Object} profileData - Descriptive profile in AI-friendly format
   * @returns {Promise<Object>} - Structured recommendations JSON
   */
  async generateRecommendation(profileData) {
    this._ensureClient();
    const systemPrompt = this._buildRecommendationSystemPrompt();
    const userPrompt = this._buildRecommendationUserPrompt(profileData);
    
    try {
      logger.info('Generating career recommendations via OpenAI');
      
      const response = await this._callOpenAIWithRetry([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });
      
      const content = response.choices[0].message.content;
      const recommendations = this._safeParseJSON(content);
      
      // Validate structure
      if (!this._validateRecommendationStructure(recommendations)) {
        throw new Error('Invalid recommendation structure received from AI');
      }
      
      logger.info('Successfully generated career recommendations', {
        degreeCount: recommendations.top_3_degrees?.length || 0,
        tokens: response.usage
      });
      
      return {
        recommendations,
        usage: response.usage
      };
      
    } catch (error) {
      logger.error('Failed to generate recommendations', { error: error.message });
      throw new Error(`AI recommendation generation failed: ${error.message}`);
    }
  }
  
  /**
   * Generate memory summary for session
   * Compresses recommendation into concise summary for future context
   */
  async generateMemorySummary(profileData, recommendations) {
    const systemPrompt = `You are a career counseling assistant. Create a very concise 2-3 sentence summary of the student's profile and top recommendation for memory purposes. Focus only on key facts.`;
    
    const userPrompt = `Profile: ${JSON.stringify(profileData, null, 2)}
    
Top Recommendation: ${recommendations.top_3_degrees[0].degree_name} (${recommendations.top_3_degrees[0].match_percentage}% match)

Create a brief summary for future reference.`;
    
    try {
      const response = await this._callOpenAIWithRetry([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.5,
        max_tokens: 150
      });
      
      return response.choices[0].message.content.trim();
      
    } catch (error) {
      logger.error('Failed to generate memory summary', { error: error.message });
      // Fallback to basic summary
      return `Student interested in ${profileData.interests_and_passion.primary_interests[0]}. Top recommendation: ${recommendations.top_3_degrees[0].degree_name}.`;
    }
  }
  
  /**
   * Continue career counseling conversation with context
   * @param {Object} sessionData - Session context including memory, profile, and chat history
   * @param {string} userMessage - New user message
   * @returns {Promise<Object>} - AI response and token usage
   */
  async continueCareerChat(sessionData, userMessage) {
    const messages = this._buildChatMessages(sessionData, userMessage);
    
    try {
      logger.info('Processing career chat message', { 
        sessionId: sessionData.sessionId,
        messageLength: userMessage.length 
      });
      
      const response = await this._callOpenAIWithRetry(messages, {
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const aiResponse = response.choices[0].message.content;
      
      logger.info('Chat response generated', {
        sessionId: sessionData.sessionId,
        tokens: response.usage
      });
      
      return {
        response: aiResponse,
        usage: response.usage
      };
      
    } catch (error) {
      logger.error('Failed to process chat message', { error: error.message });
      throw new Error(`Chat processing failed: ${error.message}`);
    }
  }
  
  /**
   * Build system prompt for recommendation generation
   */
  _buildRecommendationSystemPrompt() {
    return `You are an expert career counselor specializing in Pakistani higher education system. Your role is to analyze student profiles and provide highly personalized, data-driven degree recommendations.

CRITICAL INSTRUCTIONS:
1. Analyze the student's academic background, interests, skills, and preferences comprehensively
2. Recommend EXACTLY 3 degree programs that best match their profile
3. Focus on degrees available in Pakistani universities
4. Provide realistic and actionable recommendations
5. Consider Pakistan's job market and career opportunities
6. Return your response as STRICTLY VALID JSON matching this exact structure:

{
  "top_3_degrees": [
    {
      "degree_name": "string (e.g., BS Computer Science)",
      "degree_level": "string (Bachelors/Masters/etc)",
      "match_percentage": number (70-98),
      "reasoning": "string (2-3 sentences explaining why this matches)",
      "career_paths": ["string array of 4-5 specific job titles"],
      "career_outlook": {
        "demand": "string (High/Medium/Growing - with brief explanation)",
        "salary_range": "string (in PKR, realistic for Pakistan)",
        "growth_potential": "string (1-2 sentences)"
      },
      "recommended_universities": [
        {
          "name": "string",
          "location": "string (city in Pakistan)",
          "specialization": "string (what they're known for)"
        }
      ],
      "skill_gap_analysis": {
        "current_strengths": ["array of strengths from their profile"],
        "skills_to_develop": ["array of specific skills they should learn"],
        "recommended_certifications": ["array of relevant certifications/courses"]
      }
    }
  ],
  "overall_assessment": "string (3-4 sentences summarizing the student's potential)",
  "next_steps": ["array of 4-5 actionable steps they should take"]
}

IMPORTANT CONSTRAINTS:
- Degrees must be realistic for their current education level
- Match percentages should reflect genuine compatibility (don't inflate scores)
- Universities must be real Pakistani institutions
- Salary ranges should be realistic for Pakistan market
- Career paths should be specific job titles, not vague descriptions
- Be honest about challenges and skill gaps
- Focus on practical, achievable recommendations

Return ONLY the JSON object, no additional text.`;
  }
  
  /**
   * Build user prompt with profile data
   */
  _buildRecommendationUserPrompt(profileData) {
    return `Please analyze this student profile and provide career recommendations:

${JSON.stringify(profileData, null, 2)}

Provide your recommendations in the specified JSON format.`;
  }
  
  /**
   * Build message array for chat continuation
   */
  _buildChatMessages(sessionData, userMessage) {
    const messages = [];
    
    // System role: Career counselor instructions
    messages.push({
      role: 'system',
      content: `You are an expert career counselor helping a student explore their career options. You have already provided them with degree recommendations. Now continue the conversation naturally, answering their questions, providing additional insights, and offering guidance.

GUIDELINES:
- Be conversational, supportive, and encouraging
- Reference their profile and previous recommendations when relevant
- Provide specific, actionable advice
- If they ask about a specific degree/career, provide detailed information
- If they're uncertain, help them think through their options
- Keep responses focused and concise (2-4 paragraphs)
- Always maintain context of their profile and previous conversation`
    });
    
    // System role: Memory summary (compressed context)
    messages.push({
      role: 'system',
      content: `STUDENT CONTEXT (for your reference):
${sessionData.memorySummary}`
    });
    
    // System role: Previous recommendation summary
    if (sessionData.recommendationJSON?.top_3_degrees?.length > 0) {
      const topDegree = sessionData.recommendationJSON.top_3_degrees[0];
      messages.push({
        role: 'system',
        content: `PREVIOUS RECOMMENDATIONS:
Top recommendation: ${topDegree.degree_name} (${topDegree.match_percentage}% match)
Other recommendations: ${sessionData.recommendationJSON.top_3_degrees.slice(1).map(d => d.degree_name).join(', ')}`
      });
    }
    
    // Include recent chat history (last 10 messages for context)
    const recentMessages = sessionData.chatHistory.slice(-10);
    messages.push(...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
    
    // Add new user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    return messages;
  }
  
  /**
   * Call OpenAI API with retry logic
   */
  async _callOpenAIWithRetry(messages, options = {}, attempt = 1) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        ...options
      });
      
      return response;
      
    } catch (error) {
      // Handle rate limiting
      if (error.status === 429 && attempt < this.maxRetries) {
        const delay = this.retryDelay * attempt;
        logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
        await this._sleep(delay);
        return this._callOpenAIWithRetry(messages, options, attempt + 1);
      }
      
      // Handle temporary errors
      if (error.status >= 500 && attempt < this.maxRetries) {
        const delay = this.retryDelay * attempt;
        logger.warn(`Server error, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
        await this._sleep(delay);
        return this._callOpenAIWithRetry(messages, options, attempt + 1);
      }
      
      throw error;
    }
  }
  
  /**
   * Safe JSON parsing with error handling
   */
  _safeParseJSON(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      logger.error('Failed to parse JSON response', { jsonString });
      throw new Error('Invalid JSON response from AI');
    }
  }
  
  /**
   * Validate recommendation structure
   */
  _validateRecommendationStructure(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.top_3_degrees)) return false;
    if (data.top_3_degrees.length !== 3) return false;
    
    // Validate each degree object
    for (const degree of data.top_3_degrees) {
      if (!degree.degree_name || !degree.match_percentage || !degree.reasoning) {
        return false;
      }
      if (!Array.isArray(degree.career_paths)) return false;
      if (!degree.career_outlook || !degree.skill_gap_analysis) return false;
    }
    
    return true;
  }
  
  /**
   * Sleep utility for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let openAIServiceInstance = null;

export function getOpenAIService() {
  if (!openAIServiceInstance) {
    openAIServiceInstance = new OpenAIService();
  }
  return openAIServiceInstance;
}
