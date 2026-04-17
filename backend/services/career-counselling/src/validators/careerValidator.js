import Joi from 'joi';

/**
 * Validation Schemas for Career Module
 * Using Joi for robust request validation
 */

// Profile submission validation (userId removed - extracted from auth context)
const profileSubmissionSchema = Joi.object({
  answers: Joi.object({
    // ===== ACADEMIC BACKGROUND (5 questions) =====
    qualification_type: Joi.string()
      .valid('fsc', 'alevels', 'other')
      .required(),
    
    study_stream: Joi.string()
      .valid('pre_engineering', 'pre_medical', 'ics', 'icom', 'fa', 'alevel_science', 'alevel_business', 'other')
      .required(),
    
    academic_performance: Joi.string()
      .valid('excellent', 'good', 'average', 'below_average')
      .required(),
    
    favorite_subjects: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(3)
      .required(),
    
    challenging_subjects: Joi.array()
      .items(Joi.string())
      .optional(),
    
    // ===== INTEREST ASSESSMENT (11 questions) =====
    // Likert scale questions (1-5)
    enjoy_solving_logical_problems: Joi.number().min(1).max(5).required(),
    like_working_with_computers: Joi.number().min(1).max(5).required(),
    enjoy_creative_tasks: Joi.number().min(1).max(5).required(),
    like_analyzing_data: Joi.number().min(1).max(5).required(),
    enjoy_understanding_systems: Joi.number().min(1).max(5).required(),
    prefer_planning_over_execution: Joi.number().min(1).max(5).required(),
    enjoy_helping_people: Joi.number().min(1).max(5).required(),
    curious_about_business: Joi.number().min(1).max(5).required(),
    enjoy_research: Joi.number().min(1).max(5).required(),
    like_learning_new_tools: Joi.number().min(1).max(5).required(),
    hobbies: Joi.array().items(Joi.string()).optional(),
    
    // ===== SKILLS & STRENGTHS (11 questions) =====
    // Skill strength scale (1-5: Very Weak to Very Strong)
    mathematical_skills: Joi.number().min(1).max(5).required(),
    learn_programming_quickly: Joi.number().min(1).max(5).required(),
    communicate_ideas_clearly: Joi.number().min(1).max(5).required(),
    problem_solving_under_pressure: Joi.number().min(1).max(5).required(),
    comfortable_with_data: Joi.number().min(1).max(5).required(),
    lead_team_effectively: Joi.number().min(1).max(5).required(),
    logical_reasoning: Joi.number().min(1).max(5).required(),
    adapt_to_challenges: Joi.number().min(1).max(5).required(),
    attention_to_detail: Joi.number().min(1).max(5).required(),
    creative_problem_solving: Joi.number().min(1).max(5).required(),
    learning_preference: Joi.string()
      .valid('hands_on', 'theoretical', 'visual', 'mixed')
      .required(),
    
    // ===== PERSONALITY TRAITS (10 questions) =====
    // Likert scale (1-5)
    prefer_working_independently: Joi.number().min(1).max(5).required(),
    enjoy_taking_responsibility: Joi.number().min(1).max(5).required(),
    remain_calm_under_pressure: Joi.number().min(1).max(5).required(),
    like_structured_environments: Joi.number().min(1).max(5).required(),
    comfortable_taking_risks: Joi.number().min(1).max(5).required(),
    prefer_routine: Joi.number().min(1).max(5).required(),
    enjoy_interacting_with_people: Joi.number().min(1).max(5).required(),
    motivated_by_long_term_goals: Joi.number().min(1).max(5).required(),
    like_abstract_problems: Joi.number().min(1).max(5).required(),
    enjoy_practical_work: Joi.number().min(1).max(5).required(),
    
    // ===== WORK STYLE & PREFERENCES (6 questions) =====
    preferred_work_environment: Joi.string()
      .valid('office', 'lab', 'remote', 'field')
      .required(),
    
    problem_solving_approach: Joi.string()
      .valid('logic_data', 'creativity', 'communication', 'proven_methods')
      .required(),
    
    career_motivation: Joi.string()
      .valid('high_salary', 'job_stability', 'learning_growth', 'leadership')
      .required(),
    
    exciting_work_type: Joi.string()
      .valid('designing_systems', 'analyzing_data', 'managing', 'creating_products')
      .required(),
    
    continuous_learning_attitude: Joi.string()
      .valid('enjoy_pursue', 'accept_if_required', 'prefer_stable')
      .required(),
    
    preferred_location: Joi.string()
      .valid('local', 'national', 'international', 'no_preference')
      .default('no_preference'),
    
    // ===== CAREER INCLINATION (1 question) =====
    appealing_role: Joi.string()
      .valid('software_engineer', 'data_analyst', 'ai_engineer', 'electrical_engineer', 'business_manager', 'entrepreneur', 'researcher')
      .optional(),
      
    // ===== OPEN ENDED QUESTIONS FOR LLM (6 questions) =====
    ideal_work_environment_desc: Joi.string().max(1000).optional().allow(''),
    passionate_project_desc: Joi.string().max(1000).optional().allow(''),
    problem_solving_desc: Joi.string().max(1000).optional().allow(''),
    career_dream_desc: Joi.string().max(1000).optional().allow(''),
    disliked_tasks_desc: Joi.string().max(1000).optional().allow(''),
    impact_desc: Joi.string().max(1000).optional().allow('')
  }).required()
});

// Recommendation request validation (no userId needed - from auth context)
const recommendationRequestSchema = Joi.object({});

// Profile deletion validation (empty body)
const profileDeleteSchema = Joi.object({});

// Chat message validation
const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.min': 'Message must be at least 1 character',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    })
});

// Session ID validation
const sessionIdSchema = Joi.object({
  sessionId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid session ID format',
      'any.required': 'Session ID is required'
    })
});

/**
 * Validation middleware factory
 */
export function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
}

export const schemas = {
  profileSubmissionSchema,
  recommendationRequestSchema,
  profileDeleteSchema,
  chatMessageSchema,
  sessionIdSchema
};
