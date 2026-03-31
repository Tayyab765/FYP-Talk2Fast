import mongoose from 'mongoose';

const guestSessionSchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  expireAt: { type: Date, default: () => new Date(Date.now() + 8 * 60 * 60 * 1000) },
});

guestSessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const GuestSession =
  mongoose.models.GuestSession || mongoose.model('GuestSession', guestSessionSchema);

export default GuestSession;
