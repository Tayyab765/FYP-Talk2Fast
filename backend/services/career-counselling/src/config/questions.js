/**
 * Career Assessment Questions Configuration
 * Dynamic question system for collecting student profile data
 * 
 * STRUCTURE:
 * - Questions organized by category for easy management
 * - Each question has unique ID to prevent duplicates
 * - Categories: academic_background, interests, skills, personality, work_style, career_inclination
 * 
 * TYPES:
 * - single_select: Choose one option
 * - multi_select: Choose multiple options
 * - scale: Likert scale (1-5)
 * 
 * TO ADD NEW QUESTIONS:
 * 1. Add to appropriate category section below
 * 2. Ensure unique ID
 * 3. System will automatically validate and integrate
 * 
 * TO REMOVE QUESTIONS:
 * 1. Simply delete or comment out the question object
 * 2. System will handle references automatically
 */

// ========================================================================
// SECTION 1: ACADEMIC BACKGROUND
// ========================================================================
const academicBackgroundQuestions = [
  {
    id: 'qualification_type',
    category: 'academic_background',
    question: 'Which qualification have you completed or are currently completing?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Matric + Intermediate (FSc/FA/ICS/ICom)', value: 'local_board' },
      { id: 'opt_2', label: 'O-Levels + A-Levels', value: 'alevels' },
      { id: 'opt_3', label: 'Other Equivalent Qualification', value: 'other' }
    ]
  },
  {
    id: 'study_stream',
    category: 'academic_background',
    question: 'What was your major study stream in Intermediate / A-Levels?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Pre-Engineering (Physics, Chemistry, Math)', value: 'pre_engineering' },
      { id: 'opt_2', label: 'Pre-Medical (Biology, Physics, Chemistry)', value: 'pre_medical' },
      { id: 'opt_3', label: 'ICS (Computer Science)', value: 'ics' },
      { id: 'opt_4', label: 'ICom (Commerce)', value: 'icom' },
      { id: 'opt_5', label: 'FA (Arts/Humanities)', value: 'fa' },
      { id: 'opt_6', label: 'A-Levels (Sciences)', value: 'alevel_science' },
      { id: 'opt_7', label: 'A-Levels (Business/Commerce)', value: 'alevel_business' },
      { id: 'opt_8', label: 'Other', value: 'other' }
    ]
  },
  {
    id: 'academic_performance',
    category: 'academic_background',
    question: 'What is your overall academic performance in your latest qualification?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Excellent (85%+ / A & A*)', value: 'excellent' },
      { id: 'opt_2', label: 'Good (70–84% / B)', value: 'good' },
      { id: 'opt_3', label: 'Average (55–69% / C)', value: 'average' },
      { id: 'opt_4', label: 'Below Average (<55% / D or below)', value: 'below_average' }
    ]
  },
  {
    id: 'favorite_subjects',
    category: 'academic_background',
    question: 'Which subjects did you enjoy most in your studies? (Select up to 3)',
    type: 'multi_select',
    required: true,
    maxSelections: 3,
    options: [
      { id: 'opt_1', label: 'Mathematics', value: 'mathematics' },
      { id: 'opt_2', label: 'Physics', value: 'physics' },
      { id: 'opt_3', label: 'Computer Science / IT', value: 'computer_science' },
      { id: 'opt_4', label: 'Biology', value: 'biology' },
      { id: 'opt_5', label: 'Chemistry', value: 'chemistry' },
      { id: 'opt_6', label: 'Business Studies', value: 'business_studies' },
      { id: 'opt_7', label: 'Economics', value: 'economics' },
      { id: 'opt_8', label: 'Accounting', value: 'accounting' },
      { id: 'opt_9', label: 'English', value: 'english' },
      { id: 'opt_10', label: 'Arts / Design', value: 'arts_design' }
    ]
  },
  {
    id: 'challenging_subjects',
    category: 'academic_background',
    question: 'Which subjects did you find challenging? (Optional)',
    type: 'multi_select',
    required: false,
    maxSelections: 3,
    options: [
      { id: 'opt_1', label: 'Mathematics', value: 'mathematics' },
      { id: 'opt_2', label: 'Physics', value: 'physics' },
      { id: 'opt_3', label: 'Chemistry', value: 'chemistry' },
      { id: 'opt_4', label: 'Biology', value: 'biology' },
      { id: 'opt_5', label: 'Computer Science', value: 'computer_science' },
      { id: 'opt_6', label: 'English', value: 'english' },
      { id: 'opt_7', label: 'Accounting / Economics', value: 'commerce_subjects' },
      { id: 'opt_8', label: 'None', value: 'none' }
    ]
  }
];

// ========================================================================
// SECTION 2: INTEREST ASSESSMENT
// ========================================================================
const interestQuestions = [
  {
    id: 'enjoy_solving_logical_problems',
    category: 'interests',
    question: 'I enjoy solving logical or mathematical problems.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'like_working_with_computers',
    category: 'interests',
    question: 'I like working with computers and technology.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'enjoy_creative_tasks',
    category: 'interests',
    question: 'I enjoy creative tasks such as designing, writing, or ideation.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'like_analyzing_data',
    category: 'interests',
    question: 'I like analyzing data to find patterns or insights.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'enjoy_understanding_systems',
    category: 'interests',
    question: 'I enjoy understanding how machines or systems work internally.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'prefer_planning_over_execution',
    category: 'interests',
    question: 'I prefer planning and managing tasks rather than executing technical work.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'enjoy_helping_people',
    category: 'interests',
    question: 'I enjoy helping or guiding people in making decisions.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'curious_about_business',
    category: 'interests',
    question: 'I am curious about how businesses grow and make profits.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'enjoy_research',
    category: 'interests',
    question: 'I enjoy research and exploring new concepts deeply.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'like_learning_new_tools',
    category: 'interests',
    question: 'I like learning new tools, software, or technologies on my own.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'hobbies',
    category: 'interests',
    question: 'What are your hobbies and leisure activities?',
    type: 'multi_select',
    required: false,
    maxSelections: 5,
    options: [
      { id: 'opt_1', label: 'Coding & Programming', value: 'coding' },
      { id: 'opt_2', label: 'Reading & Writing', value: 'reading_writing' },
      { id: 'opt_3', label: 'Gaming', value: 'gaming' },
      { id: 'opt_4', label: 'Sports', value: 'sports' },
      { id: 'opt_5', label: 'Music & Singing', value: 'music' },
      { id: 'opt_6', label: 'Drawing & Painting', value: 'art' },
      { id: 'opt_7', label: 'Photography & Videography', value: 'photography' },
      { id: 'opt_8', label: 'Volunteering & Social Work', value: 'volunteering' },
      { id: 'opt_9', label: 'Debating & Public Speaking', value: 'debating' },
      { id: 'opt_10', label: 'DIY Projects & Building', value: 'diy' }
    ]
  }
];

// ========================================================================
// SECTION 3: SKILLS & STRENGTHS ASSESSMENT
// ========================================================================
const skillsQuestions = [
  {
    id: 'mathematical_skills',
    category: 'skills',
    question: 'My mathematical skills are strong.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'learn_programming_quickly',
    category: 'skills',
    question: 'I can learn programming or technical tools quickly.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'communicate_ideas_clearly',
    category: 'skills',
    question: 'I communicate my ideas clearly in speech or writing.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'problem_solving_under_pressure',
    category: 'skills',
    question: 'I am good at problem-solving under pressure.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'comfortable_with_data',
    category: 'skills',
    question: 'I am comfortable working with data, numbers, or statistics.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'lead_team_effectively',
    category: 'skills',
    question: 'I can lead a team or coordinate group work effectively.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'logical_reasoning',
    category: 'skills',
    question: 'I am good at logical reasoning and structured thinking.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'adapt_to_challenges',
    category: 'skills',
    question: 'I adapt quickly to new environments or challenges.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'attention_to_detail',
    category: 'skills',
    question: 'I pay attention to detail when working on tasks.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'creative_problem_solving',
    category: 'skills',
    question: 'I can think creatively to solve problems.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    }
  },
  {
    id: 'learning_preference',
    category: 'skills',
    question: 'What is your preferred learning style?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Hands-on / Practical Learning', value: 'hands_on' },
      { id: 'opt_2', label: 'Theoretical / Conceptual Learning', value: 'theoretical' },
      { id: 'opt_3', label: 'Visual Learning (Diagrams, Videos)', value: 'visual' },
      { id: 'opt_4', label: 'Mixed Approach', value: 'mixed' }
    ]
  }
];

// ========================================================================
// SECTION 4: PERSONALITY TRAITS
// ========================================================================
const personalityQuestions = [
  {
    id: 'prefer_working_independently',
    category: 'personality',
    question: 'I prefer working independently rather than in groups.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'enjoy_taking_responsibility',
    category: 'personality',
    question: 'I enjoy taking responsibility and ownership of tasks.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'remain_calm_under_pressure',
    category: 'personality',
    question: 'I remain calm when facing complex or difficult problems.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'like_structured_environments',
    category: 'personality',
    question: 'I like structured environments with clear rules and procedures.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'comfortable_taking_risks',
    category: 'personality',
    question: 'I am comfortable taking risks and trying new approaches.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'prefer_routine',
    category: 'personality',
    question: 'I prefer routine over frequent change.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'enjoy_interacting_with_people',
    category: 'personality',
    question: 'I enjoy interacting with people on a daily basis.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'motivated_by_long_term_goals',
    category: 'personality',
    question: 'I am motivated by long-term goals rather than short-term rewards.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'like_abstract_problems',
    category: 'personality',
    question: 'I like working on abstract or theoretical problems.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  },
  {
    id: 'enjoy_practical_work',
    category: 'personality',
    question: 'I enjoy practical, hands-on work.',
    type: 'scale',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    }
  }
];

// ========================================================================
// SECTION 5: WORK STYLE & CAREER PREFERENCES
// ========================================================================
const workStyleQuestions = [
  {
    id: 'preferred_work_environment',
    category: 'work_style',
    question: 'Which environment do you prefer most?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Office-based professional environment', value: 'office' },
      { id: 'opt_2', label: 'Lab or technical workspace', value: 'lab' },
      { id: 'opt_3', label: 'Flexible / remote work', value: 'remote' },
      { id: 'opt_4', label: 'Field or hands-on environment', value: 'field' }
    ]
  },
  {
    id: 'problem_solving_approach',
    category: 'work_style',
    question: 'How do you prefer to solve problems?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Using logic and data', value: 'logic_data' },
      { id: 'opt_2', label: 'Using creativity and innovation', value: 'creativity' },
      { id: 'opt_3', label: 'Through communication and discussion', value: 'communication' },
      { id: 'opt_4', label: 'By following proven methods', value: 'proven_methods' }
    ]
  },
  {
    id: 'career_motivation',
    category: 'work_style',
    question: 'What motivates you most?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'High salary', value: 'high_salary' },
      { id: 'opt_2', label: 'Job stability', value: 'job_stability' },
      { id: 'opt_3', label: 'Learning and growth', value: 'learning_growth' },
      { id: 'opt_4', label: 'Leadership and influence', value: 'leadership' }
    ]
  },
  {
    id: 'exciting_work_type',
    category: 'work_style',
    question: 'What kind of work excites you most?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Designing systems or software', value: 'designing_systems' },
      { id: 'opt_2', label: 'Analyzing data or research', value: 'analyzing_data' },
      { id: 'opt_3', label: 'Managing people or projects', value: 'managing' },
      { id: 'opt_4', label: 'Creating or innovating products', value: 'creating_products' }
    ]
  },
  {
    id: 'continuous_learning_attitude',
    category: 'work_style',
    question: 'How do you feel about continuous learning?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'I enjoy it and actively pursue it', value: 'enjoy_pursue' },
      { id: 'opt_2', label: 'I accept it if required', value: 'accept_if_required' },
      { id: 'opt_3', label: 'I prefer stable skill requirements', value: 'prefer_stable' }
    ]
  },
  {
    id: 'preferred_location',
    category: 'work_style',
    question: 'Where do you prefer to work?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Within my city/local area', value: 'local' },
      { id: 'opt_2', label: 'Anywhere in Pakistan', value: 'national' },
      { id: 'opt_3', label: 'International opportunities', value: 'international' },
      { id: 'opt_4', label: 'No preference', value: 'no_preference' }
    ]
  }
];

// ========================================================================
// SECTION 6: CAREER INCLINATION (DIRECT SIGNALS)
// ========================================================================
const careerInclinationQuestions = [
  {
    id: 'appealing_role',
    category: 'career_inclination',
    question: 'Which role sounds most appealing to you?',
    type: 'single_select',
    required: true,
    options: [
      { id: 'opt_1', label: 'Software Engineer', value: 'software_engineer' },
      { id: 'opt_2', label: 'Data Analyst', value: 'data_analyst' },
      { id: 'opt_3', label: 'AI Engineer', value: 'ai_engineer' },
      { id: 'opt_4', label: 'Electrical Engineer', value: 'electrical_engineer' },
      { id: 'opt_5', label: 'Business Manager', value: 'business_manager' },
      { id: 'opt_6', label: 'Entrepreneur', value: 'entrepreneur' },
      { id: 'opt_7', label: 'Researcher', value: 'researcher' }
    ]
  }
];

// ========================================================================
// DYNAMIC QUESTION SYSTEM
// ========================================================================

/**
 * Combine all question arrays into a single master list
 * This is the single source of truth for all questions
 */
const assessmentQuestions = [
  ...academicBackgroundQuestions,
  ...interestQuestions,
  ...skillsQuestions,
  ...personalityQuestions,
  ...workStyleQuestions,
  ...careerInclinationQuestions
];


/**
 * Validate uniqueness of question IDs
 * Automatically checks for duplicate IDs on module load
 */
function validateQuestionUniqueness() {
  const ids = assessmentQuestions.map(q => q.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  
  if (duplicates.length > 0) {
    throw new Error(`Duplicate question IDs found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  return true;
}

// Run validation on module load
validateQuestionUniqueness();

/**
 * Get all assessment questions
 */
function getAllQuestions() {
  return assessmentQuestions;
}

/**
 * Get questions by category
 */
function getQuestionsByCategory(category) {
  return assessmentQuestions.filter(q => q.category === category);
}

/**
 * Get question by ID
 */
function getQuestionById(questionId) {
  return assessmentQuestions.find(q => q.id === questionId);
}

/**
 * Get all categories with metadata
 */
function getCategories() {
  const categoryMap = {
    'academic_background': { 
      name: 'Academic Background', 
      description: 'Educational history and performance',
      order: 1
    },
    'interests': { 
      name: 'Interest Assessment', 
      description: 'What you enjoy doing',
      order: 2
    },
    'skills': { 
      name: 'Skills & Strengths', 
      description: 'Your abilities and competencies',
      order: 3
    },
    'personality': { 
      name: 'Personality Traits', 
      description: 'Your work personality and preferences',
      order: 4
    },
    'work_style': { 
      name: 'Work Style & Preferences', 
      description: 'How you like to work',
      order: 5
    },
    'career_inclination': { 
      name: 'Career Inclination', 
      description: 'Direct career preferences',
      order: 6
    }
  };
  
  const uniqueCategories = [...new Set(assessmentQuestions.map(q => q.category))];
  
  return uniqueCategories
    .map(cat => ({
      id: cat,
      ...categoryMap[cat],
      questionCount: assessmentQuestions.filter(q => q.category === cat).length
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Get question statistics
 */
function getQuestionStats() {
  return {
    total: assessmentQuestions.length,
    byCategory: getCategories().map(cat => ({
      category: cat.name,
      count: cat.questionCount
    })),
    byType: {
      scale: assessmentQuestions.filter(q => q.type === 'scale').length,
      single_select: assessmentQuestions.filter(q => q.type === 'single_select').length,
      multi_select: assessmentQuestions.filter(q => q.type === 'multi_select').length
    },
    required: assessmentQuestions.filter(q => q.required).length,
    optional: assessmentQuestions.filter(q => !q.required).length
  };
}

/**
 * Validate answer structure
 */
function validateAnswer(questionId, answer) {
  const question = getQuestionById(questionId);
  
  if (!question) {
    return { valid: false, error: 'Invalid question ID' };
  }
  
  if (question.required && (answer === null || answer === undefined || answer === '')) {
    return { valid: false, error: 'This question is required' };
  }
  
  if (question.type === 'single_select') {
    const validValues = question.options.map(opt => opt.value);
    if (!validValues.includes(answer)) {
      return { valid: false, error: 'Invalid option selected' };
    }
  }
  
  if (question.type === 'multi_select') {
    if (!Array.isArray(answer)) {
      return { valid: false, error: 'Answer must be an array' };
    }
    if (question.maxSelections && answer.length > question.maxSelections) {
      return { valid: false, error: `Maximum ${question.maxSelections} selections allowed` };
    }
    const validValues = question.options.map(opt => opt.value);
    const allValid = answer.every(val => validValues.includes(val));
    if (!allValid) {
      return { valid: false, error: 'Invalid option(s) selected' };
    }
  }
  
  if (question.type === 'scale') {
    if (typeof answer !== 'number') {
      return { valid: false, error: 'Answer must be a number' };
    }
    if (answer < question.scaleMin || answer > question.scaleMax) {
      return { valid: false, error: `Value must be between ${question.scaleMin} and ${question.scaleMax}` };
    }
  }
  
  return { valid: true };
}

export {
  getAllQuestions,
  getQuestionsByCategory,
  getQuestionById,
  getCategories,
  getQuestionStats,
  validateAnswer,
  validateQuestionUniqueness,
  assessmentQuestions
};
