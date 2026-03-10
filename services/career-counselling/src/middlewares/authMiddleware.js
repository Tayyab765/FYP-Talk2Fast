import axios from 'axios';
import { logger } from '../utils/logger.js';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';

/**
 * Auth Middleware for Career Counselling Service
 * Validates tokens with Auth Service and handles guest sessions
 */

/**
 * Verify token with auth service
 */
async function verifyToken(token) {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    return null;
  }
}

/**
 * Verify guest session with auth service
 */
async function verifyGuestSession(guestId) {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/guest/${guestId}`);
    return response.data;
  } catch (error) {
    logger.error('Guest session verification failed', { error: error.message });
    return null;
  }
}

/**
 * Middleware for authenticated users only
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing authentication token' 
      });
    }

    const token = authHeader.split(' ')[1];
    const userData = await verifyToken(token);
    
    if (!userData || !userData.success) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }

    req.user = {
      id: userData.user.id,
      userId: userData.user.id,
      email: userData.user.email,
      type: 'authenticated',
      raw: userData.user
    };
    
    next();
  } catch (err) {
    logger.error('Authentication error', { error: err.message });
    return res.status(401).json({ 
      success: false,
      error: 'Token verification failed' 
    });
  }
}

/**
 * Middleware that accepts both authenticated users and guest sessions
 */
export async function authenticateOrGuest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    // Try authenticated user first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const userData = await verifyToken(token);
      
      if (userData && userData.success) {
        req.user = {
          id: userData.user.id,
          userId: userData.user.id,
          email: userData.user.email,
          type: 'authenticated',
          raw: userData.user
        };
        return next();
      }
      // If Bearer token is provided but invalid, return error
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
    }

    // Check for guest session
    const guestId = req.headers['x-guest-id'] || req.body?.guestId || req.query?.guestId;
    
    if (guestId) {
      const guestData = await verifyGuestSession(guestId);
      
      if (guestData && guestData.success) {
        req.user = {
          id: guestData.session.guestId,
          userId: guestData.session.guestId,
          guestId: guestData.session.guestId,
          type: 'guest',
          guestSession: guestData.session
        };
        return next();
      }
      
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired guest session' 
      });
    }

    // Neither authentication method provided
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required. Provide either Bearer token or x-guest-id header.' 
    });
  } catch (err) {
    logger.error('Authentication error', { error: err.message });
    return res.status(401).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
}

/**
 * Optional authentication - allows requests without auth but adds user context if available
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const userData = await verifyToken(token);
      
      if (userData && userData.success) {
        req.user = {
          id: userData.user.id,
          userId: userData.user.id,
          email: userData.user.email,
          type: 'authenticated',
          raw: userData.user
        };
      }
    } else {
      const guestId = req.headers['x-guest-id'];
      if (guestId) {
        const guestData = await verifyGuestSession(guestId);
        if (guestData && guestData.success) {
          req.user = {
            id: guestData.session.guestId,
            userId: guestData.session.guestId,
            guestId: guestData.session.guestId,
            type: 'guest',
            guestSession: guestData.session
          };
        }
      }
    }
    
    next();
  } catch (err) {
    // Don't block request, just log error
    logger.warn('Optional auth failed', { error: err.message });
    next();
  }
}
