import mongoose from 'mongoose';

const MAX_CHAT_MESSAGES = 10;

/**
 * Message Schema
 * Represents a single chat message in the conversation
 */
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokenCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

/**
 * CareerSession Model
 * Stores AI recommendations, chat history, and memory summaries
 */
const careerSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerProfile',
    required: true
  },
  
  // Snapshot of profile data at recommendation time
  profileSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // AI-generated recommendations (structured JSON)
  recommendationJSON: {
    top_3_degrees: [{
      degree_name: String,
      degree_level: String,
      match_percentage: Number,
      reasoning: String,
      career_paths: [String],
      career_outlook: {
        demand: String,
        salary_range: String,
        growth_potential: String
      },
      recommended_universities: [{
        name: String,
        location: String,
        specialization: String
      }],
      skill_gap_analysis: {
        current_strengths: [String],
        skills_to_develop: [String],
        recommended_certifications: [String]
      }
    }],
    overall_assessment: String,
    next_steps: [String]
  },
  
  // Compressed memory summary for token optimization
  memorySummary: {
    type: String,
    required: true
  },
  
  // Chat history - stores full conversation
  chatHistory: [messageSchema],
  
  // Token usage tracking (kept for compatibility, but not critical for Ollama)
  tokenUsage: {
    total_tokens: { type: Number, default: 0 },
    prompt_tokens: { type: Number, default: 0 },
    completion_tokens: { type: Number, default: 0 },
    estimated_cost: { type: Number, default: 0 }
  },
  
  // Message count tracking
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Session management
  status: {
    type: String,
    enum: ['active', 'archived', 'expired'],
    default: 'active'
  },
  
  expiresAt: {
    type: Date
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'career_sessions'
});

// Indexes
careerSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });
careerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
careerSessionSchema.methods.addMessage = function(role, content, tokenCount = 0) {
  this.chatHistory.push({ 
    role, 
    content, 
    tokenCount,
    timestamp: new Date()
  });

  if (this.chatHistory.length > MAX_CHAT_MESSAGES) {
    this.chatHistory.splice(0, this.chatHistory.length - MAX_CHAT_MESSAGES);
  }

  this.messageCount = this.chatHistory.length;
  this.lastActivityAt = new Date();
  
  if (tokenCount > 0) {
    this.tokenUsage.total_tokens += tokenCount;
  }
};

careerSessionSchema.methods.updateTokenUsage = function(usage) {
  // Keep method for backward compatibility, but Ollama doesn't require cost tracking
  if (usage && typeof usage === 'object') {
    this.tokenUsage.total_tokens += usage.total_tokens || 0;
    this.tokenUsage.prompt_tokens += usage.prompt_tokens || 0;
    this.tokenUsage.completion_tokens += usage.completion_tokens || 0;
    
    // For Ollama, cost is 0 (local inference)
    this.tokenUsage.estimated_cost = 0;
  }
};

careerSessionSchema.methods.getRecentMessages = function(limit = 10) {
  return this.chatHistory.slice(-limit);
};

// Static methods
careerSessionSchema.statics.getActiveByUserId = function(userId) {
  return this.findOne({ 
    userId, 
    status: 'active' 
  }).sort({ createdAt: -1 });
};

careerSessionSchema.statics.archiveOldSessions = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.updateMany(
    { 
      lastActivityAt: { $lt: cutoffDate },
      status: 'active'
    },
    { 
      status: 'archived' 
    }
  );
};

export default mongoose.model('CareerSession', careerSessionSchema);
