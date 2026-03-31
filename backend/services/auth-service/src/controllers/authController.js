import { supabase } from '../config/supabaseClient.js';
import { ensureUserFromSupabase } from '../services/userService.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import GuestSession from '../models/guestSession.js';

const GUEST_HEADER = 'x-guest-id';
const GUEST_TTL_MS = 8 * 60 * 60 * 1000;
const computeExpiryDate = () => new Date(Date.now() + GUEST_TTL_MS);
const touchGuestSession = async (guestId) => {
  if (!guestId) return null;
  return GuestSession.findOneAndUpdate(
    { guestId },
    { lastActive: new Date(), expireAt: computeExpiryDate() },
    { new: true }
  );
};
const createGuestSession = async () => {
  const now = new Date();
  return GuestSession.create({
    guestId: `guest_${uuidv4()}`,
    createdAt: now,
    lastActive: now,
    expireAt: computeExpiryDate(),
  });
};
const ensureGuestContext = async (req) => {
  const candidate = req.headers[GUEST_HEADER] || req.body?.guestId || req.query?.guestId;
  const existing = await touchGuestSession(candidate);
  if (existing) return { guestId: existing.guestId, expiresAt: existing.expireAt, isNew: false };
  const created = await createGuestSession();
  return { guestId: created.guestId, expiresAt: created.expireAt, isNew: true };
};

async function signup(req, res) {
  const { email, password, full_name } = req.body;
  try {
    logger.info(`📝 New signup attempt for user: ${email}`);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name }
      }
    });
    
    if (error) {
      logger.error(`❌ Signup failed for ${email}: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    logger.info(`✅ Signup successful for user: ${email}`);
    
    // Persist user in Mongo as well (if user object exists)
    let mongoUser = null;
    if (data?.user) {
      try {
        mongoUser = await ensureUserFromSupabase(data.user);
        logger.info(`✅ User persisted to MongoDB: ${email}`);
      } catch (error_) {
        logger.error(`⚠️ MongoDB persistence failed: ${error_.message}`);
      }
    }

    return res.json({ 
      user: data.user,
      mongoUser,
      session: data.session 
    });
  } catch (err) {
    logger.error(`💥 Server error during signup: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  try {
    logger.info(`🔑 Login attempt for user: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      logger.error(`❌ Login failed for ${email}: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    logger.info(`✅ Login successful for user: ${email}`);

    // Persist/update user in MongoDB
    let mongoUser = null;
    if (data?.user) {
      try {
        mongoUser = await ensureUserFromSupabase(data.user, { touchLogin: true });
        logger.info(`✅ User synced to MongoDB: ${email}`);
      } catch (error_) {
        logger.error(`⚠️ MongoDB sync failed: ${error_.message}`);
      }
    }

    return res.json({ 
      session: data.session,
      user: data.user,
      mongoUser 
    });
  } catch (err) {
    logger.error(`💥 Server error during login: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

async function logout(req, res) {
  logger.info(`👋 User logged out: ${req.user?.email}`);
  return res.json({ ok: true });
}

async function profile(req, res) {
  try {
    if (req.user) {
      logger.info(`📱 Profile accessed by user: ${req.user?.email}`);
      return res.json({ type: 'registered', user: req.user });
    }
    const guestContext = await ensureGuestContext(req);
    logger.info(`🕊️ Guest profile accessed: ${guestContext.guestId}`);
    return res.json({
      type: 'guest',
      guestId: guestContext.guestId,
      expiresAt: guestContext.expiresAt,
    });
  } catch (err) {
    logger.error(`💥 Error accessing profile: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  try {
    logger.info(`🔐 Password reset requested for: ${email}`);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });
    
    if (error) {
      logger.error(`❌ Password reset failed for ${email}: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    logger.info(`✅ Password reset email sent to: ${email}`);
    return res.json({ message: 'Password reset email sent' });
  } catch (err) {
    logger.error(`💥 Server error during password reset: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

async function guestSession(req, res) {
  try {
    if (req.user) {
      return res.status(400).json({ error: 'Registered users do not need guest sessions' });
    }
    const context = await ensureGuestContext(req);
    logger.info(`🕊️ Guest session ${context.isNew ? 'created' : 'refreshed'}: ${context.guestId}`);
    return res
      .status(context.isNew ? 201 : 200)
      .json({ guestId: context.guestId, expiresAt: context.expiresAt });
  } catch (err) {
    logger.error(`💥 Error issuing guest session: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}

export { signup, login, logout, profile, forgotPassword, guestSession };
