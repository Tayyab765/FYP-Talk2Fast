import { getDb } from '../config/mongoClient.js';
import { logger } from '../utils/logger.js';

// Collection name for users in MongoDB
const USERS_COLLECTION = 'users';

// Normalize Supabase user object into our Mongo user schema
function mapSupabaseUserToMongo(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    supabaseId: user.id, // UUID from Supabase
    email: user.email || null,
    full_name: meta.full_name || meta.name || null,
    avatar_url: meta.avatar_url || null,
    role: meta.role || 'student',
    // timestamps - set by upsert helpers
  };
}

export async function ensureUserFromSupabase(user, { touchLogin = false } = {}) {
  const db = getDb();
  const col = db.collection(USERS_COLLECTION);
  const doc = mapSupabaseUserToMongo(user);
  if (!doc) return null;

  const now = new Date();
  const update = {
    $setOnInsert: { createdAt: now },
    $set: {
      email: doc.email,
      full_name: doc.full_name,
      avatar_url: doc.avatar_url,
      role: doc.role,
      updatedAt: now,
    },
  };
  if (touchLogin) update.$set.lastLogin = now;

  const res = await col.findOneAndUpdate(
    { supabaseId: doc.supabaseId },
    update,
    { upsert: true, returnDocument: 'after' }
  );

  const saved = res.value || (await col.findOne({ supabaseId: doc.supabaseId }));
  logger.info(`Mongo user ensured for Supabase id ${doc.supabaseId}`);
  return saved;
}

export async function updateLastLogin(supabaseId) {
  const db = getDb();
  const col = db.collection(USERS_COLLECTION);
  const now = new Date();
  await col.updateOne({ supabaseId }, { $set: { lastLogin: now, updatedAt: now } });
}

export async function getUserBySupabaseId(supabaseId) {
  const db = getDb();
  const col = db.collection(USERS_COLLECTION);
  return col.findOne({ supabaseId });
}

export async function updateUserRole(supabaseId, role) {
  const db = getDb();
  const col = db.collection(USERS_COLLECTION);
  const now = new Date();
  await col.updateOne({ supabaseId }, { $set: { role, updatedAt: now } });
}
