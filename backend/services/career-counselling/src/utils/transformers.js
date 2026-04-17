/**
 * Data Transformers
 * Transform data between different formats:
 * - User answers → Normalized internal format
 * - Normalized format → AI-friendly descriptive format
 */

/**
 * Transform user answers to normalized profile structure
 * Maps raw form answers to structured database schema
 * 
 * @param {String} userId - User identifier
 * @param {Object} answers - Raw answers from questionnaire (key-value pairs)
 * @returns {Object} Normalized profile data
 */
export function transformAnswersToProfile(userId, answers) {
  return {
    userId,
    
    // Academic Background
    academic_background: {
      qualification_type: answers.qualification_type,
      study_stream: answers.study_stream,
      academic_performance: answers.academic_performance,
      favorite_subjects: answers.favorite_subjects || [],
      challenging_subjects: answers.challenging_subjects || []
    },
    
    // Interests (Likert scale + hobbies)
    interests: {
      enjoy_solving_logical_problems: answers.enjoy_solving_logical_problems,
      like_working_with_computers: answers.like_working_with_computers,
      enjoy_creative_tasks: answers.enjoy_creative_tasks,
      like_analyzing_data: answers.like_analyzing_data,
      enjoy_understanding_systems: answers.enjoy_understanding_systems,
      prefer_planning_over_execution: answers.prefer_planning_over_execution,
      enjoy_helping_people: answers.enjoy_helping_people,
      curious_about_business: answers.curious_about_business,
      enjoy_research: answers.enjoy_research,
      like_learning_new_tools: answers.like_learning_new_tools,
      hobbies: answers.hobbies || []
    },
    
    // Skills Assessment (all Likert scale)
    skills: {
      mathematical_skills: answers.mathematical_skills,
      learn_programming_quickly: answers.learn_programming_quickly,
      communicate_ideas_clearly: answers.communicate_ideas_clearly,
      problem_solving_under_pressure: answers.problem_solving_under_pressure,
      comfortable_with_data: answers.comfortable_with_data,
      lead_team_effectively: answers.lead_team_effectively,
      logical_reasoning: answers.logical_reasoning,
      adapt_to_challenges: answers.adapt_to_challenges,
      attention_to_detail: answers.attention_to_detail,
      creative_problem_solving: answers.creative_problem_solving,
      learning_preference: answers.learning_preference
    },
    
    // Personality Traits (Likert scale)
    personality: {
      prefer_working_independently: answers.prefer_working_independently,
      enjoy_taking_responsibility: answers.enjoy_taking_responsibility,
      remain_calm_under_pressure: answers.remain_calm_under_pressure,
      like_structured_environments: answers.like_structured_environments,
      comfortable_taking_risks: answers.comfortable_taking_risks,
      prefer_routine: answers.prefer_routine,
      enjoy_interacting_with_people: answers.enjoy_interacting_with_people,
      motivated_by_long_term_goals: answers.motivated_by_long_term_goals,
      like_abstract_problems: answers.like_abstract_problems,
      enjoy_practical_work: answers.enjoy_practical_work
    },
    
    // Work Style & Preferences
    work_style: {
      preferred_work_environment: answers.preferred_work_environment,
      problem_solving_approach: answers.problem_solving_approach,
      career_motivation: answers.career_motivation,
      exciting_work_type: answers.exciting_work_type,
      continuous_learning_attitude: answers.continuous_learning_attitude,
      preferred_location: answers.preferred_location || 'no_preference'
    },
    
    // Career Inclination
    career_inclination: {
      appealing_role: answers.appealing_role,
      ideal_work_environment_desc: answers.ideal_work_environment_desc,
      passionate_project_desc: answers.passionate_project_desc,
      problem_solving_desc: answers.problem_solving_desc,
      career_dream_desc: answers.career_dream_desc,
      disliked_tasks_desc: answers.disliked_tasks_desc,
      impact_desc: answers.impact_desc
    },
    
    status: 'completed'
  };
}

/**
 * Transform stored normalized profile structure back to flat answers shape
 * Used by profile retrieval endpoints so frontend can reuse questionnaire keys
 *
 * @param {Object} profile - Stored profile document/object
 * @returns {Object} Flat answers object
 */
export function transformProfileToAnswers(profile) {
  if (!profile) return {};

  const academic = profile.academic_background || {};
  const interests = profile.interests || {};
  const skills = profile.skills || {};
  const personality = profile.personality || {};
  const workStyle = profile.work_style || {};
  const inclination = profile.career_inclination || {};

  return {
    qualification_type: academic.qualification_type,
    study_stream: academic.study_stream,
    academic_performance: academic.academic_performance,
    favorite_subjects: academic.favorite_subjects || [],
    challenging_subjects: academic.challenging_subjects || [],

    enjoy_solving_logical_problems: interests.enjoy_solving_logical_problems,
    like_working_with_computers: interests.like_working_with_computers,
    enjoy_creative_tasks: interests.enjoy_creative_tasks,
    like_analyzing_data: interests.like_analyzing_data,
    enjoy_understanding_systems: interests.enjoy_understanding_systems,
    prefer_planning_over_execution: interests.prefer_planning_over_execution,
    enjoy_helping_people: interests.enjoy_helping_people,
    curious_about_business: interests.curious_about_business,
    enjoy_research: interests.enjoy_research,
    like_learning_new_tools: interests.like_learning_new_tools,
    hobbies: interests.hobbies || [],

    mathematical_skills: skills.mathematical_skills,
    learn_programming_quickly: skills.learn_programming_quickly,
    communicate_ideas_clearly: skills.communicate_ideas_clearly,
    problem_solving_under_pressure: skills.problem_solving_under_pressure,
    comfortable_with_data: skills.comfortable_with_data,
    lead_team_effectively: skills.lead_team_effectively,
    logical_reasoning: skills.logical_reasoning,
    adapt_to_challenges: skills.adapt_to_challenges,
    attention_to_detail: skills.attention_to_detail,
    creative_problem_solving: skills.creative_problem_solving,
    learning_preference: skills.learning_preference,

    prefer_working_independently: personality.prefer_working_independently,
    enjoy_taking_responsibility: personality.enjoy_taking_responsibility,
    remain_calm_under_pressure: personality.remain_calm_under_pressure,
    like_structured_environments: personality.like_structured_environments,
    comfortable_taking_risks: personality.comfortable_taking_risks,
    prefer_routine: personality.prefer_routine,
    enjoy_interacting_with_people: personality.enjoy_interacting_with_people,
    motivated_by_long_term_goals: personality.motivated_by_long_term_goals,
    like_abstract_problems: personality.like_abstract_problems,
    enjoy_practical_work: personality.enjoy_practical_work,

    preferred_work_environment: workStyle.preferred_work_environment,
    problem_solving_approach: workStyle.problem_solving_approach,
    career_motivation: workStyle.career_motivation,
    exciting_work_type: workStyle.exciting_work_type,
    continuous_learning_attitude: workStyle.continuous_learning_attitude,
    preferred_location: workStyle.preferred_location || 'no_preference',

    appealing_role: inclination.appealing_role,
    ideal_work_environment_desc: inclination.ideal_work_environment_desc,
    passionate_project_desc: inclination.passionate_project_desc,
    problem_solving_desc: inclination.problem_solving_desc,
    career_dream_desc: inclination.career_dream_desc,
    disliked_tasks_desc: inclination.disliked_tasks_desc,
    impact_desc: inclination.impact_desc
  };
}

/**
 * Transform normalized profile to AI-friendly descriptive format
 * Converts codes and numbers into human-readable descriptions
 */
export function transformProfileToAIFormat(profile) {
  // Helper function to format qualification type
  const formatQualificationType = (type) => {
    const mapping = {
      'local_board': 'Matric + Intermediate (FSc/FA/ICS/ICom)',
      'alevels': 'O-Levels + A-Levels',
      'other': 'Other'
    };
    return mapping[type] || type;
  };
  
  // Helper function to format study stream
  const formatStudyStream = (stream) => {
    const mapping = {
      'pre_engineering': 'Pre-Engineering (Physics, Chemistry, Math)',
      'pre_medical': 'Pre-Medical (Biology, Physics, Chemistry)',
      'ics': 'ICS (Computer Science)',
      'icom': 'ICom (Commerce)',
      'fa': 'FA (Arts/Humanities)',
      'alevel_science': 'A-Levels (Sciences)',
      'alevel_business': 'A-Levels (Business/Commerce)',
      'other': 'Other'
    };
    return mapping[stream] || stream;
  };
  
  // Helper function to format performance
  const formatPerformance = (performance) => {
    const mapping = {
      'excellent': 'Excellent (85%+ grades)',
      'good': 'Good (70-84% grades)',
      'average': 'Average (55-69% grades)',
      'below_average': 'Below Average (<55% grades)'
    };
    return mapping[performance] || performance;
  };
  
  // Helper function to format Likert scale (1-5)
  const formatLikertScale = (level) => {
    const mapping = {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral',
      4: 'Agree',
      5: 'Strongly Agree'
    };
    return mapping[level] || 'Not specified';
  };
  
  // Helper function to format skill strength (1-5)
  const formatSkillStrength = (level) => {
    const mapping = {
      1: 'Very Weak',
      2: 'Weak',
      3: 'Average',
      4: 'Strong',
      5: 'Very Strong'
    };
    return mapping[level] || 'Not specified';
  };
  
  // Build descriptive profile
  const qualificationType = profile.academic_background.qualification_type
    || profile.academic_background.current_education_level;
  const studyStream = profile.academic_background.study_stream
    || profile.academic_background.field_of_study;

  const descriptiveProfile = {
    // Academic Background
    student_background: {
      qualification_type: formatQualificationType(qualificationType),
      study_stream: formatStudyStream(studyStream),
      academic_performance: formatPerformance(profile.academic_background.academic_performance),
      favorite_subjects: profile.academic_background.favorite_subjects.join(', '),
      challenging_subjects: profile.academic_background.challenging_subjects.join(', ') || 'None specified'
    },
    
    // Interest Assessment
    interest_assessment: {
      enjoy_solving_logical_problems: formatLikertScale(profile.interests.enjoy_solving_logical_problems),
      like_working_with_computers: formatLikertScale(profile.interests.like_working_with_computers),
      enjoy_creative_tasks: formatLikertScale(profile.interests.enjoy_creative_tasks),
      like_analyzing_data: formatLikertScale(profile.interests.like_analyzing_data),
      enjoy_understanding_systems: formatLikertScale(profile.interests.enjoy_understanding_systems),
      prefer_planning_over_execution: formatLikertScale(profile.interests.prefer_planning_over_execution),
      enjoy_helping_people: formatLikertScale(profile.interests.enjoy_helping_people),
      curious_about_business: formatLikertScale(profile.interests.curious_about_business),
      enjoy_research: formatLikertScale(profile.interests.enjoy_research),
      like_learning_new_tools: formatLikertScale(profile.interests.like_learning_new_tools),
      hobbies: profile.interests.hobbies.join(', ') || 'Not specified'
    },
    
    // Skills & Strengths Assessment
    skills_assessment: {
      mathematical_skills: formatSkillStrength(profile.skills.mathematical_skills),
      learn_programming_quickly: formatSkillStrength(profile.skills.learn_programming_quickly),
      communicate_ideas_clearly: formatSkillStrength(profile.skills.communicate_ideas_clearly),
      problem_solving_under_pressure: formatSkillStrength(profile.skills.problem_solving_under_pressure),
      comfortable_with_data: formatSkillStrength(profile.skills.comfortable_with_data),
      lead_team_effectively: formatSkillStrength(profile.skills.lead_team_effectively),
      logical_reasoning: formatSkillStrength(profile.skills.logical_reasoning),
      adapt_to_challenges: formatSkillStrength(profile.skills.adapt_to_challenges),
      attention_to_detail: formatSkillStrength(profile.skills.attention_to_detail),
      creative_problem_solving: formatSkillStrength(profile.skills.creative_problem_solving),
      learning_preference: profile.skills.learning_preference.replace(/_/g, ' ')
    },
    
    // Personality Traits
    personality_traits: {
      prefer_working_independently: formatLikertScale(profile.personality.prefer_working_independently),
      enjoy_taking_responsibility: formatLikertScale(profile.personality.enjoy_taking_responsibility),
      remain_calm_under_pressure: formatLikertScale(profile.personality.remain_calm_under_pressure),
      like_structured_environments: formatLikertScale(profile.personality.like_structured_environments),
      comfortable_taking_risks: formatLikertScale(profile.personality.comfortable_taking_risks),
      prefer_routine: formatLikertScale(profile.personality.prefer_routine),
      enjoy_interacting_with_people: formatLikertScale(profile.personality.enjoy_interacting_with_people),
      motivated_by_long_term_goals: formatLikertScale(profile.personality.motivated_by_long_term_goals),
      like_abstract_problems: formatLikertScale(profile.personality.like_abstract_problems),
      enjoy_practical_work: formatLikertScale(profile.personality.enjoy_practical_work)
    },
    
    // Work Style & Career Preferences
    work_style_preferences: {
      preferred_work_environment: profile.work_style.preferred_work_environment,
      problem_solving_approach: profile.work_style.problem_solving_approach.replace(/_/g, ' '),
      career_motivation: profile.work_style.career_motivation.replace(/_/g, ' '),
      exciting_work_type: profile.work_style.exciting_work_type.replace(/_/g, ' '),
      continuous_learning_attitude: profile.work_style.continuous_learning_attitude.replace(/_/g, ' '),
      preferred_location: profile.work_style.preferred_location.replace(/_/g, ' ')
    },
    
    // Career Inclination
    career_inclination: {
      most_appealing_role: profile.career_inclination.appealing_role?.replace(/_/g, ' ') || 'Not specified',
      ideal_work_environment: profile.career_inclination.ideal_work_environment_desc || 'Not specified',
      passionate_project: profile.career_inclination.passionate_project_desc || 'Not specified',
      problem_solving_interest: profile.career_inclination.problem_solving_desc || 'Not specified',
      career_dream: profile.career_inclination.career_dream_desc || 'Not specified',
      disliked_tasks: profile.career_inclination.disliked_tasks_desc || 'Not specified',
      desired_impact: profile.career_inclination.impact_desc || 'Not specified'
    }
  };
  
  return descriptiveProfile;
}

/**
 * Generate a concise summary of student profile for memory
 * Used to reduce token usage in follow-up conversations
 */
export function generateProfileSummary(profile) {
  // Identify strong interests (rating 4-5)
  const strongInterests = [];
  if (profile.interests.like_working_with_computers >= 4) strongInterests.push('technology');
  if (profile.interests.enjoy_creative_tasks >= 4) strongInterests.push('creativity');
  if (profile.interests.like_analyzing_data >= 4) strongInterests.push('data analysis');
  if (profile.interests.curious_about_business >= 4) strongInterests.push('business');
  if (profile.interests.enjoy_research >= 4) strongInterests.push('research');
  
  const interestsStr = strongInterests.length > 0 
    ? strongInterests.slice(0, 3).join(', ') 
    : 'various fields';
  
  // Identify strong skills (rating 4-5)
  const topSkills = [];
  if (profile.skills.mathematical_skills >= 4) topSkills.push('mathematics');
  if (profile.skills.learn_programming_quickly >= 4) topSkills.push('programming');
  if (profile.skills.communicate_ideas_clearly >= 4) topSkills.push('communication');
  if (profile.skills.logical_reasoning >= 4) topSkills.push('logical reasoning');
  if (profile.skills.creative_problem_solving >= 4) topSkills.push('creative problem solving');
  if (profile.skills.lead_team_effectively >= 4) topSkills.push('leadership');
  
  const skillsStr = topSkills.length > 0 
    ? topSkills.slice(0, 3).join(', ') 
    : 'developing various skills';
  
  // Identify personality traits (rating 4-5)
  const traits = [];
  if (profile.personality.prefer_working_independently >= 4) traits.push('independent worker');
  if (profile.personality.enjoy_interacting_with_people >= 4) traits.push('people-oriented');
  if (profile.personality.comfortable_taking_risks >= 4) traits.push('risk-taker');
  if (profile.personality.prefer_routine >= 4) traits.push('routine-oriented');
  
  const traitsStr = traits.length > 0 ? `, ${traits.slice(0, 2).join(' and ')}` : '';
  
  const studyStream = profile.academic_background.study_stream || profile.academic_background.field_of_study;
  const summary = `Student in ${studyStream} with ${profile.academic_background.academic_performance} performance. Interested in: ${interestsStr}. Strong skills: ${skillsStr}${traitsStr}. Prefers ${profile.work_style.preferred_work_environment} environment, motivated by ${profile.work_style.career_motivation}.`;
  
  return summary;
}

/**
 * Extract key profile features for AI context
 */
export function extractKeyFeatures(profile) {
  const qualificationType = profile.academic_background.qualification_type || profile.academic_background.current_education_level;
  const studyStream = profile.academic_background.study_stream || profile.academic_background.field_of_study;

  return {
    qualificationType,
    studyStream,
    performance: profile.academic_background.academic_performance,
    strongInterests: getStrongInterests(profile.interests),
    strongSkills: getStrongSkills(profile.skills),
    personalityTraits: getKeyPersonalityTraits(profile.personality),
    careerMotivation: profile.work_style.career_motivation,
    workPreference: profile.work_style.preferred_work_environment,
    appealingRole: profile.career_inclination.appealing_role
  };
}

/**
 * Helper: Get interests rated 4 or above
 */
function getStrongInterests(interests) {
  const strong = [];
  if (interests.like_working_with_computers >= 4) strong.push('technology');
  if (interests.enjoy_creative_tasks >= 4) strong.push('creativity');
  if (interests.like_analyzing_data >= 4) strong.push('data_analysis');
  if (interests.curious_about_business >= 4) strong.push('business');
  if (interests.enjoy_research >= 4) strong.push('research');
  if (interests.enjoy_helping_people >= 4) strong.push('helping_people');
  return strong;
}

/**
 * Helper: Get skills rated 4 or above
 */
function getStrongSkills(skills) {
  const strongSkills = [];
  
  if (skills.mathematical_skills >= 4) strongSkills.push('mathematics');
  if (skills.learn_programming_quickly >= 4) strongSkills.push('programming');
  if (skills.communicate_ideas_clearly >= 4) strongSkills.push('communication');
  if (skills.problem_solving_under_pressure >= 4) strongSkills.push('problem_solving');
  if (skills.comfortable_with_data >= 4) strongSkills.push('data_analysis');
  if (skills.lead_team_effectively >= 4) strongSkills.push('leadership');
  if (skills.logical_reasoning >= 4) strongSkills.push('logical_reasoning');
  if (skills.creative_problem_solving >= 4) strongSkills.push('creative_thinking');
  
  return strongSkills;
}

/**
 * Helper: Get dominant personality traits (4 or above)
 */
function getKeyPersonalityTraits(personality) {
  const traits = [];
  
  if (personality.prefer_working_independently >= 4) traits.push('independent');
  if (personality.enjoy_interacting_with_people >= 4) traits.push('social');
  if (personality.comfortable_taking_risks >= 4) traits.push('risk_taker');
  if (personality.prefer_routine >= 4) traits.push('routine_oriented');
  if (personality.motivated_by_long_term_goals >= 4) traits.push('long_term_focused');
  if (personality.enjoy_practical_work >= 4) traits.push('hands_on');
  if (personality.like_abstract_problems >= 4) traits.push('theoretical');
  
  return traits;
}
