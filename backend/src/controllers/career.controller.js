const getCareerService = require('../services/career.service');
const { getAllQuestions, getCategories } = require('../config/questions');
const logger = require('../utils/logger');

/**
 * Career Controller
 * HTTP request handlers for career counseling endpoints
 * THIN LAYER - delegates business logic to service
 */

class CareerController {
  constructor() {
    this.careerService = getCareerService();
  }
  
  /**
   * GET /api/career/questions
   * Retrieve all assessment questions
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
   * Body: { userId, answers: {...} }
   */
  submitProfile = async (req, res, next) => {
    try {
      const { userId, answers } = req.body;
      
      const profile = await this.careerService.submitProfile(userId, answers);
      
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
   * Body: { userId }
   */
  generateRecommendations = async (req, res, next) => {
    try {
      const { userId } = req.body;
      
      const result = await this.careerService.generateRecommendations(userId);
      
      res.status(200).json({
        success: true,
        message: 'Recommendations generated successfully',
        data: {
          sessionId: result.sessionId,
          recommendations: result.recommendations,
          tokenUsage: {
            total: result.tokenUsage.total_tokens,
            prompt: result.tokenUsage.prompt_tokens,
            completion: result.tokenUsage.completion_tokens
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
      
      const result = await this.careerService.processChatMessage(sessionId, message);
      
      res.status(200).json({
        success: true,
        data: {
          response: result.response,
          tokenUsage: {
            total: result.tokenUsage.total_tokens,
            prompt: result.tokenUsage.prompt_tokens,
            completion: result.tokenUsage.completion_tokens
          },
          sessionCost: result.totalSessionCost
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
      
      const session = await this.careerService.getSession(sessionId);
      
      res.status(200).json({
        success: true,
        data: session
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * GET /api/career/profile/:userId
   * Get user's latest career profile
   */
  getUserProfile = async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      const profile = await this.careerService.getUserProfile(userId);
      
      res.status(200).json({
        success: true,
        data: profile
      });
      
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * GET /api/career/session/active/:userId
   * Get active session for user
   */
  getActiveSession = async (req, res, next) => {
    try {
      const { userId } = req.params;
      
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
      
      res.status(200).json({
        success: true,
        data: analytics
      });
      
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CareerController();
