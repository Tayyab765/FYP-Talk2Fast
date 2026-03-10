import GuestSession from '../models/guestSession.js';

// Middleware to verify user authentication by calling auth service
async function authenticateOrGuest(req, res, next) {
  try {
    // Check if Bearer token is provided
    const authHeader = req.headers.authorization;
    
    // If Bearer token exists, verify it with auth service
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Call auth service to verify token
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
      try {
        const response = await fetch(`${authServiceUrl}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.type === 'registered' && data.user) {
            req.user = {
              id: data.user.id,
              email: data.user.email,
              type: 'authenticated'
            };
            return next();
          }
        }
      } catch (err) {
        // Auth service unavailable or token invalid
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

export { authenticateOrGuest };
