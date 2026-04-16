import mongoose from 'mongoose';

const sectionStatSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['Advance Math', 'Basic Math', 'IQ & Logical', 'English']
  },
  totalAttempts: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  averageAccuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { _id: false });

const topicStatSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['weak', 'average', 'strong']
  }
}, { _id: false });

const scoreTrendSchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  completedAt: {
    type: Date,
    required: true
  }
}, { _id: false });

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['authenticated', 'guest']
  },
  totalAttempts: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  averageScore: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  highestScore: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowestScore: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sectionStats: {
    type: [sectionStatSchema],
    default: []
  },
  topicStats: {
    type: [topicStatSchema],
    default: []
  },
  scoreTrend: {
    type: [scoreTrendSchema],
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for cache invalidation
analyticsSchema.index({ lastUpdated: -1 });

const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

export default Analytics;
