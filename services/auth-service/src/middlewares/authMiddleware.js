import { getUserFromToken } from '../services/supabaseService.js';
import { ensureUserFromSupabase } from '../services/userService.js';
import GuestSession from '../models/guestSession.js';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

    const token = authHeader.split(' ')[1];

    const user = await getUserFromToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    // Ensure user exists in MongoDB as well (auth remains Supabase)
    try {
      await ensureUserFromSupabase(user);
    } catch (e) {
      // don't block request on Mongo persistence
    }

    req.user = {
      id: user.id,
      email: user.email,
      raw: user,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

// Middleware that accepts both authenticated users and guest sessions
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
          try {
            await ensureUserFromSupabase(user);
          } catch (e) {
            // don't block request on Mongo persistence
          }
          req.user = {
            id: user.id,
            email: user.email,
            raw: user,
            type: 'authenticated'
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
          id: guestSession.guestId,
          type: 'guest',
          guestSession: guestSession
        };
        return next();
      } else {
        return res.status(401).json({ error: 'Invalid or expired guest session' });
      }
    }

    // Neither Bearer token nor guest ID provided
    return res.status(401).json({ error: 'Authentication required. Please provide either Bearer token or x-guest-id header.' });
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export { authenticate, authenticateOrGuest };
