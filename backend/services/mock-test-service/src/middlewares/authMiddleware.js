import { supabase } from '../config/supabaseClient.js';
import GuestSession from '../models/GuestSession.js';

/**
 * Get user from Supabase token
 * @param {string} token - JWT token
 * @returns {Object|null} User object or null
 */
async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  } catch (err) {
    return null;
  }
}

/**
 * Middleware that accepts both authenticated users and guest sessions
 * Sets req.user with { userId, userType } for downstream handlers
 */
async function authenticateOrGuest(req, res, next) {
  try {
    // Check if Bearer token is provided
    const authHeader = req.headers.authorization;
    
    // If Bearer token exists, validate it (for logged-in users)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const user = await getUserFromToken(token);
        if (user) {
          req.user = {
            userId: user.id,
            userType: 'authenticated',
            email: user.email,
            raw: user
          };
          return next();
        }
      } catch (err) {
        // Invalid token, return error for authenticated users
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    }

    // No Bearer token provided, check for guest session
    const guestId = req.headers['x-guest-id'] || req.body?.guestId || req.query?.guestId;
    if (guestId) {
      const guestSession = await GuestSession.findOneAndUpdate(
        { guestId },
        { lastActive: new Date(), expireAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
        { new: true }
      );
      
      if (guestSession) {
        req.user = {
          userId: guestSession.guestId,
          userType: 'guest',
          guestSession: guestSession
        };
        return next();
      } else {
        return res.status(401).json({ error: 'Invalid or expired guest session' });
      }
    }

    // Neither Bearer token nor guest ID provided
    return res.status(401).json({ 
      error: 'Authentication required. Please provide either Bearer token or x-guest-id header.' 
    });
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware for authenticated users only (no guest access)
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      userId: user.id,
      userType: 'authenticated',
      email: user.email,
      raw: user
    };
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

export { authenticate, authenticateOrGuest };
