import mongoose from 'mongoose';

const sectionTimestampSchema = new mongoose.Schema({
  sectionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  sectionName: {
    type: String,
    required: true,
    enum: ['Advance Math', 'Basic Math', 'IQ & Logical', 'English']
  },
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    default: null
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const sectionScoreSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    enum: ['Advance Math', 'Basic Math', 'IQ & Logical', 'English']
  },
  correct: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  incorrect: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unattempted: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  }
}, { _id: false });

const scoreSchema = new mongoose.Schema({
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  sectionScores: {
    type: [sectionScoreSchema],
    default: []
  }
}, { _id: false });

const testAttemptSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['authenticated', 'guest']
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true,
    index: true
  },
  currentSection: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  answers: {
    type: Map,
    of: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      uppercase: true
    },
    default: new Map()
  },
  markedForReview: {
    type: [String],
    default: []
  },
  sectionTimestamps: {
    type: [sectionTimestampSchema],
    default: []
  },
  score: {
    type: scoreSchema,
    default: () => ({
      total: 0,
      percentage: 0,
      sectionScores: []
    })
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for fetching user attempts by status
testAttemptSchema.index({ userId: 1, status: 1 });

// Index for test history (completed attempts sorted by date)
testAttemptSchema.index({ userId: 1, completedAt: -1 });

// Index for checking existing attempts for a user-test combination
testAttemptSchema.index({ testId: 1, userId: 1 });

const TestAttempt = mongoose.models.TestAttempt || mongoose.model('TestAttempt', testAttemptSchema);

export default TestAttempt;
