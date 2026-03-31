import express from 'express';
import { signup, login, logout, profile, forgotPassword, guestSession } from '../controllers/authController.js';
import { validateSignup, validateLogin, validateForgotPassword } from '../validators/authValidators.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { getUserFromToken } from '../services/supabaseService.js';
import GuestSession from '../models/guestSession.js';

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, profile);
router.post('/forgot-password', forgotPassword);
router.post('/guest-session', guestSession);

// Verify endpoint for other microservices
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token verification failed' });
  }
});

// Verify guest session endpoint for other microservices
router.get('/guest/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    const guestSession = await GuestSession.findOne({ guestId });
    
    if (!guestSession) {
      return res.status(404).json({ success: false, error: 'Guest session not found' });
    }

    // Check if expired
    if (new Date() > new Date(guestSession.expireAt)) {
      return res.status(401).json({ success: false, error: 'Guest session expired' });
    }

    res.json({ 
      success: true, 
      session: {
        guestId: guestSession.guestId,
        expiresAt: guestSession.expireAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to verify guest session' });
  }
});

export default router;
