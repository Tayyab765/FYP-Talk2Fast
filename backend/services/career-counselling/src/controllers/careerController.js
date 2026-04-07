import { getCareerService } from '../services/career.service.js';
import { getAllQuestions, getCategories } from '../config/questions.js';
import { logger } from '../utils/logger.js';
import { transformProfileToAnswers } from '../utils/transformers.js';

/**
 * Career Controller
 * HTTP request handlers for career counseling endpoints
 * THIN LAYER - delegates business logic to service
 * Enhanced with user management integration
 */

class CareerController {
  constructor() {
    this.careerService = getCareerService();
  }
  
  /**
   * GET /api/career/questions
   * Retrieve all assessment questions
   * Accessible by both authenticated and guest users
   */
  getQuestions = async (req, res, next) => {
    try {
      const questions = getAllQuestions();
      const categories = getCategories();
      
      res.status(200).json({
        success: true,
        data: {
          questions,
          categories,
          totalQuestions: questions.length
        }
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * POST /api/career/profile
   * Submit student profile with assessment answers
   * Body: { answers: {...} }
   * UserId extracted from req.user (set by auth middleware)
   */
  submitProfile = async (req, res, next) => {
    try {
      // Extract userId from authenticated user or guest session
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }
      
      const { answers } = req.body;
      
      const profile = await this.careerService.submitProfile(userId, answers);
      
      // Store profile information in user context
      logger.info('Profile submitted by user', {
        userId,
        userType: req.user?.type || 'unknown',
        profileId: profile._id
      });
      
      res.status(201).json({
        success: true,
        message: 'Profile submitted successfully',
        data: {
          profileId: profile._id,
          userId: profile.userId,
          createdAt: profile.createdAt
        }
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * POST /api/career/recommend
   * Generate AI-powered degree recommendations
   * UserId extracted from req.user
   */
  generateRecommendations = async (req, res, next) => {
    try {
      // Extract userId from authenticated user or guest session
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }
      
      const result = await this.careerService.generateRecommendations(userId);
      
      logger.info('Recommendations generated', {
        userId,
        userType: req.user?.type || 'unknown',
        sessionId: result.sessionId
      });
      
      res.status(200).json({
        success: true,
        message: 'Recommendations generated successfully',
        data: {
          sessionId: result.sessionId,
          recommendations: result.recommendations,
          tokenUsage: {
            total: result?.tokenUsage?.total_tokens ?? 0,
            prompt: result?.tokenUsage?.prompt_tokens ?? 0,
            completion: result?.tokenUsage?.completion_tokens ?? 0,
            evalCount: result?.tokenUsage?.eval_count ?? 0,
            evalDuration: result?.tokenUsage?.eval_duration ?? 0,
            promptEvalCount: result?.tokenUsage?.prompt_eval_count ?? 0,
            promptEvalDuration: result?.tokenUsage?.prompt_eval_duration ?? 0
          }
        }
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * POST /api/career/chat/:sessionId
   * Send follow-up message in career counseling chat
   * Body: { message }
   */
  sendChatMessage = async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;
      
      // Verify user owns this session
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;
      
      const result = await this.careerService.processChatMessage(sessionId, message);
      
      logger.info('Chat message sent', {
        userId,
        sessionId,
        messageLength: message.length
      });
      
      res.status(200).json({
        success: true,
        data: {
          response: result.response,
          tokenUsage: {
            total: result?.tokenUsage?.total_tokens ?? 0,
            prompt: result?.tokenUsage?.prompt_tokens ?? 0,
            completion: result?.tokenUsage?.completion_tokens ?? 0,
            evalCount: result?.tokenUsage?.eval_count ?? 0,
            evalDuration: result?.tokenUsage?.eval_duration ?? 0,
            promptEvalCount: result?.tokenUsage?.prompt_eval_count ?? 0,
            promptEvalDuration: result?.tokenUsage?.prompt_eval_duration ?? 0
          },
          sessionCost: result?.totalSessionCost ?? 0
        }
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * GET /api/career/session/:sessionId
   * Retrieve full session details including chat history
   */
  getSession = async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;
      
      const session = await this.careerService.getSession(sessionId);
      
      // Verify user owns this session
      if (session.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this session'
        });
      }
      
      res.status(200).json({
        success: true,
        data: session
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * GET /api/career/profile
   * Get user's latest career profile
   * UserId extracted from req.user
   */
  getUserProfile = async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }
      
      const profile = await this.careerService.getUserProfile(userId);
      const profileData = profile?.toObject ? profile.toObject() : profile;
      const answers = transformProfileToAnswers(profileData);
      
      res.status(200).json({
        success: true,
        data: {
          ...profileData,
          answers,
          profile: profileData
        }
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/career/profile
   * Update user's latest profile
   * Body: { answers: {...} }
   */
  updateUserProfile = async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { answers } = req.body;
      const profile = await this.careerService.updateUserProfile(userId, answers);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profileId: profile._id,
          userId: profile.userId,
          updatedAt: profile.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/career/profile
   * Delete user's latest profile
   */
  deleteUserProfile = async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const result = await this.careerService.deleteUserProfile(userId);

      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * GET /api/career/session/active
   * Get active session for current user
   */
  getActiveSession = async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.guestId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }
      
      const session = await this.careerService.getActiveSession(userId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'No active session found for user'
        });
      }
      
      res.status(200).json({
        success: true,
        data: session
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * GET /api/career/analytics/:sessionId
   * Get session analytics and statistics
   */
  getSessionAnalytics = async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      
      const analytics = await this.careerService.getSessionAnalytics(sessionId);
      
      // Verify user owns this session
      if (analytics.sessionId.toString() !== sessionId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this session analytics'
        });
      }
      
      res.status(200).json({
        success: true,
        data: analytics
      });
      
    } catch (error) {
      next(error);
    }
  };
}

export default new CareerController();
