import mongoose from 'mongoose';

/**
 * CareerProfile Model
 * Stores normalized structured student assessment data
 */
const careerProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Academic Background
  academic_background: {
    qualification_type: {
      type: String,
      enum: ['local_board', 'alevels', 'other'],
      required: true
    },
    study_stream: {
      type: String,
      enum: ['pre_engineering', 'pre_medical', 'ics', 'icom', 'fa', 'alevel_science', 'alevel_business', 'other'],
      required: true
    },
    academic_performance: {
      type: String,
      enum: ['excellent', 'good', 'average', 'below_average'],
      required: true
    },
    favorite_subjects: [String],
    challenging_subjects: [String]
  },
  
  // Interests (NEW: Likert scale responses)
  interests: {
    // Likert scale questions (1-5)
    enjoy_solving_logical_problems: { type: Number, min: 1, max: 5 },
    like_working_with_computers: { type: Number, min: 1, max: 5 },
    enjoy_creative_tasks: { type: Number, min: 1, max: 5 },
    like_analyzing_data: { type: Number, min: 1, max: 5 },
    enjoy_understanding_systems: { type: Number, min: 1, max: 5 },
    prefer_planning_over_execution: { type: Number, min: 1, max: 5 },
    enjoy_helping_people: { type: Number, min: 1, max: 5 },
    curious_about_business: { type: Number, min: 1, max: 5 },
    enjoy_research: { type: Number, min: 1, max: 5 },
    like_learning_new_tools: { type: Number, min: 1, max: 5 },
    // Multi-select
    hobbies: [String]
  },
  
  // Skills Assessment (EXPANDED with new questions)
  skills: {
    // Skills Likert scale (1-5: Very Weak to Very Strong)
    mathematical_skills: { type: Number, min: 1, max: 5 },
    learn_programming_quickly: { type: Number, min: 1, max: 5 },
    communicate_ideas_clearly: { type: Number, min: 1, max: 5 },
    problem_solving_under_pressure: { type: Number, min: 1, max: 5 },
    comfortable_with_data: { type: Number, min: 1, max: 5 },
    lead_team_effectively: { type: Number, min: 1, max: 5 },
    logical_reasoning: { type: Number, min: 1, max: 5 },
    adapt_to_challenges: { type: Number, min: 1, max: 5 },
    attention_to_detail: { type: Number, min: 1, max: 5 },
    creative_problem_solving: { type: Number, min: 1, max: 5 },
    // Learning preference
    learning_preference: {
      type: String,
      enum: ['hands_on', 'theoretical', 'visual', 'mixed'],
      required: true
    }
  },
  
  // Personality Traits (NEW SECTION)
  personality: {
    prefer_working_independently: { type: Number, min: 1, max: 5 },
    enjoy_taking_responsibility: { type: Number, min: 1, max: 5 },
    remain_calm_under_pressure: { type: Number, min: 1, max: 5 },
    like_structured_environments: { type: Number, min: 1, max: 5 },
    comfortable_taking_risks: { type: Number, min: 1, max: 5 },
    prefer_routine: { type: Number, min: 1, max: 5 },
    enjoy_interacting_with_people: { type: Number, min: 1, max: 5 },
    motivated_by_long_term_goals: { type: Number, min: 1, max: 5 },
    like_abstract_problems: { type: Number, min: 1, max: 5 },
    enjoy_practical_work: { type: Number, min: 1, max: 5 }
  },
  
  // Work Style & Career Preferences (REORGANIZED)
  work_style: {
    preferred_work_environment: {
      type: String,
      enum: ['office', 'lab', 'remote', 'field'],
      required: true
    },
    problem_solving_approach: {
      type: String,
      enum: ['logic_data', 'creativity', 'communication', 'proven_methods'],
      required: true
    },
    career_motivation: {
      type: String,
      enum: ['high_salary', 'job_stability', 'learning_growth', 'leadership'],
      required: true
    },
    exciting_work_type: {
      type: String,
      enum: ['designing_systems', 'analyzing_data', 'managing', 'creating_products'],
      required: true
    },
    continuous_learning_attitude: {
      type: String,
      enum: ['enjoy_pursue', 'accept_if_required', 'prefer_stable'],
      required: true
    },
    preferred_location: {
      type: String,
      enum: ['local', 'national', 'international', 'no_preference'],
      default: 'no_preference'
    }
  },
  
  // Career Inclination (NEW SECTION)
  career_inclination: {
    appealing_role: {
      type: String,
      enum: ['software_engineer', 'data_analyst', 'ai_engineer', 'electrical_engineer', 'business_manager', 'entrepreneur', 'researcher']
    }
  },
  
  // Metadata
  status: {
    type: String,
    enum: ['draft', 'completed'],
    default: 'completed'
  }
}, {
  timestamps: true,
  collection: 'career_profiles'
});

// Indexes for efficient queries
careerProfileSchema.index({ userId: 1, createdAt: -1 });

// Virtual for getting the most recent profile
careerProfileSchema.statics.getLatestByUserId = function(userId) {
  return this.findOne({ userId }).sort({ createdAt: -1 });
};

export default mongoose.model('CareerProfile', careerProfileSchema);
