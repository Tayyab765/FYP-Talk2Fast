import { CareerProfile, CareerSession } from '../models/index.js';
import { getOllamaService } from './ollama.service.js';
import { transformAnswersToProfile } from '../utils/transformers.js';
import { logger } from '../utils/logger.js';

/**
 * Career Service
 * Business logic for career counseling module
 * Orchestrates profile management, AI recommendations, and chat sessions
 * Now using Ollama for local AI inference
 */

class CareerService {
  constructor() {
    this.aiService = getOllamaService();
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
    * Fetches profile, compresses context, calls Ollama, stores session
   */
  async generateRecommendations(userId) {
    try {
      logger.info('Generating recommendations for user', { userId });
      
      // 1. Fetch latest profile
      const profile = await CareerProfile.getLatestByUserId(userId);
      
      if (!profile) {
        throw new Error('No profile found for user. Please complete assessment first.');
      }
      
      // 2. Call Ollama with compressed profile context (no full JSON payload)
      const profileForAI = profile.toObject();

      // 3. Generate recommendations
      const recommendations = await this.aiService.generateRecommendation(profileForAI);
      
      // 4. Generate memory summary
      const memorySummary = await this.aiService.generateMemorySummary(profileForAI, recommendations);
      
      // 5. Calculate session expiry
      const expiryDays = Number.parseInt(process.env.SESSION_EXPIRY_DAYS, 10) || 30;
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
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0,
          estimated_cost: 0 // Ollama is free (local inference)
        },
        messageCount: 0,
        status: 'active',
        expiresAt
      });
      
      await session.save();
      
      logger.info('Recommendations generated successfully', { 
        userId, 
        sessionId: session._id
      });
      
      return {
        sessionId: session._id,
        recommendations: recommendations,
        tokenUsage: {
          total_tokens: 0,
          prompt_tokens: 0,
          completion_tokens: 0,
          eval_count: 0,
          eval_duration: 0,
          prompt_eval_count: 0,
          prompt_eval_duration: 0
        }
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
      
      // 4. Call Ollama for response
      const ollamaResult = await this.aiService.continueCareerChat(
        sessionData,
        userMessage
      );
      const response = ollamaResult?.response || '';
      const usage = {
        eval_count: ollamaResult?.usage?.eval_count ?? 0,
        eval_duration: ollamaResult?.usage?.eval_duration ?? 0,
        prompt_eval_count: ollamaResult?.usage?.prompt_eval_count ?? 0,
        prompt_eval_duration: ollamaResult?.usage?.prompt_eval_duration ?? 0
      };
      
      // 5. Add AI response to history
      session.addMessage('assistant', response, 0);
      
      // 6. Save session
      await session.save();
      
      logger.info('Chat message processed successfully', { 
        sessionId,
        messageCount: session.messageCount
      });
      
      return {
        response,
        tokenUsage: usage,
        messageCount: session.messageCount,
        totalSessionCost: 0 // Ollama is free
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
   * Update user's latest profile
   */
  async updateUserProfile(userId, answers) {
    try {
      const existingProfile = await CareerProfile.getLatestByUserId(userId);

      if (!existingProfile) {
        throw new Error('No profile found for user');
      }

      const profileData = transformAnswersToProfile(userId, answers);

      const updatedProfile = await CareerProfile.findByIdAndUpdate(
        existingProfile._id,
        profileData,
        {
          new: true,
          runValidators: true
        }
      );

      logger.info('Career profile updated successfully', {
        userId,
        profileId: existingProfile._id
      });

      return updatedProfile;
    } catch (error) {
      logger.error('Failed to update user profile', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete user's latest profile and related sessions
   */
  async deleteUserProfile(userId) {
    try {
      const profile = await CareerProfile.getLatestByUserId(userId);

      if (!profile) {
        throw new Error('No profile found for user');
      }

      const deletedSessions = await CareerSession.deleteMany({
        userId,
        profileId: profile._id
      });

      await CareerProfile.findByIdAndDelete(profile._id);

      logger.info('Career profile deleted successfully', {
        userId,
        profileId: profile._id,
        deletedSessions: deletedSessions.deletedCount || 0
      });

      return {
        profileId: profile._id,
        deletedSessions: deletedSessions.deletedCount || 0
      };
    } catch (error) {
      logger.error('Failed to delete user profile', {
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
