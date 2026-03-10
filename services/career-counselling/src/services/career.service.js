import { CareerProfile, CareerSession } from '../models/index.js';
import { getOpenAIService } from './openai.service.js';
import { 
  transformAnswersToProfile, 
  transformProfileToAIFormat,
  generateProfileSummary 
} from '../utils/transformers.js';
import { logger } from '../utils/logger.js';

/**
 * Career Service
 * Business logic for career counseling module
 * Orchestrates profile management, AI recommendations, and chat sessions
 */

class CareerService {
  constructor() {
    this.openAIService = getOpenAIService();
  }
  
  /**
   * PHASE 2: Submit and store student profile
   * Validates, normalizes, and saves career profile
   */
  async submitProfile(userId, answers) {
    try {
      logger.info('Submitting career profile', { userId });
      
      // Transform answers to normalized profile structure
      const profileData = transformAnswersToProfile(userId, answers);
      
      // Create and save profile
      const profile = new CareerProfile(profileData);
      await profile.save();
      
      logger.info('Career profile saved successfully', { 
        userId, 
        profileId: profile._id 
      });
      
      return profile;
      
    } catch (error) {
      logger.error('Failed to submit profile', { 
        userId, 
        error: error.message 
      });
      throw new Error(`Profile submission failed: ${error.message}`);
    }
  }
  
  /**
   * PHASE 3: Generate AI-powered recommendations
   * Fetches profile, transforms to AI format, calls OpenAI, stores session
   */
  async generateRecommendations(userId) {
    try {
      logger.info('Generating recommendations for user', { userId });
      
      // 1. Fetch latest profile
      const profile = await CareerProfile.getLatestByUserId(userId);
      
      if (!profile) {
        throw new Error('No profile found for user. Please complete assessment first.');
      }
      
      // 2. Transform to AI-friendly descriptive format
      const aiProfile = transformProfileToAIFormat(profile);
      
      // 3. Call OpenAI for recommendations
      const { recommendations, usage } = await this.openAIService.generateRecommendation(aiProfile);
      
      // 4. Generate memory summary
      const memorySummary = await this.openAIService.generateMemorySummary(aiProfile, recommendations);
      
      // 5. Calculate session expiry
      const expiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS) || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      // 6. Create and save session
      const session = new CareerSession({
        userId,
        profileId: profile._id,
        profileSnapshot: profile.toObject(),
        recommendationJSON: recommendations,
        memorySummary,
        chatHistory: [],
        tokenUsage: {
          total_tokens: usage.total_tokens || 0,
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0
        },
        status: 'active',
        expiresAt
      });
      
      // Calculate and store estimated cost
      session.updateTokenUsage(usage);
      await session.save();
      
      logger.info('Recommendations generated successfully', { 
        userId, 
        sessionId: session._id,
        tokenUsage: usage.total_tokens
      });
      
      return {
        sessionId: session._id,
        recommendations: recommendations,
        tokenUsage: usage
      };
      
    } catch (error) {
      logger.error('Failed to generate recommendations', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * PHASE 5: Handle follow-up chat with context
   * Retrieves session, builds context, calls AI, updates history
   */
  async processChatMessage(sessionId, userMessage) {
    try {
      logger.info('Processing chat message', { sessionId });
      
      // 1. Retrieve session
      const session = await CareerSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.status !== 'active') {
        throw new Error('Session is no longer active');
      }
      
      // 2. Add user message to history
      session.addMessage('user', userMessage);
      
      // 3. Prepare context for AI
      const sessionData = {
        sessionId: session._id,
        memorySummary: session.memorySummary,
        recommendationJSON: session.recommendationJSON,
        chatHistory: session.getRecentMessages(10)
      };
      
      // 4. Call OpenAI for response
      const { response, usage } = await this.openAIService.continueCareerChat(
        sessionData,
        userMessage
      );
      
      // 5. Add AI response to history
      session.addMessage('assistant', response, usage.completion_tokens);
      
      // 6. Update token usage
      session.updateTokenUsage(usage);
      
      // 7. Save session
      await session.save();
      
      logger.info('Chat message processed successfully', { 
        sessionId,
        tokenUsage: usage.total_tokens
      });
      
      return {
        response,
        tokenUsage: usage,
        totalSessionCost: session.tokenUsage.estimated_cost
      };
      
    } catch (error) {
      logger.error('Failed to process chat message', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Get session details with full context
   */
  async getSession(sessionId) {
    try {
      const session = await CareerSession.findById(sessionId)
        .populate('profileId', '-__v')
        .lean();
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      return session;
      
    } catch (error) {
      logger.error('Failed to retrieve session', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Get active session for user
   */
  async getActiveSession(userId) {
    try {
      const session = await CareerSession.getActiveByUserId(userId);
      return session;
    } catch (error) {
      logger.error('Failed to retrieve active session', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Get user's latest profile
   */
  async getUserProfile(userId) {
    try {
      const profile = await CareerProfile.getLatestByUserId(userId);
      
      if (!profile) {
        throw new Error('No profile found for user');
      }
      
      return profile;
      
    } catch (error) {
      logger.error('Failed to retrieve user profile', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Archive old sessions (maintenance task)
   */
  async archiveOldSessions(daysOld = 30) {
    try {
      const result = await CareerSession.archiveOldSessions(daysOld);
      logger.info('Archived old sessions', { 
        daysOld, 
        count: result.modifiedCount 
      });
      return result;
    } catch (error) {
      logger.error('Failed to archive sessions', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get session analytics for user
   */
  async getSessionAnalytics(sessionId) {
    try {
      const session = await CareerSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      return {
        sessionId: session._id,
        messageCount: session.chatHistory.length,
        tokenUsage: session.tokenUsage,
        duration: {
          created: session.createdAt,
          lastActivity: session.lastActivityAt,
          daysActive: Math.ceil((session.lastActivityAt - session.createdAt) / (1000 * 60 * 60 * 24))
        },
        status: session.status
      };
      
    } catch (error) {
      logger.error('Failed to get session analytics', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }
}

// Singleton instance
let careerServiceInstance = null;

export function getCareerService() {
  if (!careerServiceInstance) {
    careerServiceInstance = new CareerService();
  }
  return careerServiceInstance;
}
