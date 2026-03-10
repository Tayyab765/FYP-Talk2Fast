/**
 * Test Validator with New Questions
 */

const { schemas } = require('./src/validators/careerValidator');

console.log('='.repeat(80));
console.log('VALIDATOR TEST - 44 Questions');
console.log('='.repeat(80));

// Sample valid data
const validData = {
  userId: "test_user_123",
  answers: {
    // Academic Background (5)
    academic_level: "intermediate",
    field_of_study: "computer_science",
    academic_performance: "good",
    favorite_subjects: ["mathematics", "computer_science", "physics"],
    challenging_subjects: ["biology"],
    
    // Interest Assessment (11)
    enjoy_solving_logical_problems: 5,
    like_working_with_computers: 5,
    enjoy_creative_tasks: 4,
    like_analyzing_data: 4,
    enjoy_understanding_systems: 5,
    prefer_planning_over_execution: 3,
    enjoy_helping_people: 4,
    curious_about_business: 3,
    enjoy_research: 4,
    like_learning_new_tools: 5,
    hobbies: ["coding", "gaming"],
    
    // Skills (11)
    mathematical_skills: 4,
    learn_programming_quickly: 5,
    communicate_ideas_clearly: 4,
    problem_solving_under_pressure: 4,
    comfortable_with_data: 4,
    lead_team_effectively: 3,
    logical_reasoning: 5,
    adapt_to_challenges: 4,
    attention_to_detail: 4,
    creative_problem_solving: 4,
    learning_preference: "hands_on",
    
    // Personality (10)
    prefer_working_independently: 4,
    enjoy_taking_responsibility: 5,
    remain_calm_under_pressure: 4,
    like_structured_environments: 3,
    comfortable_taking_risks: 4,
    prefer_routine: 2,
    enjoy_interacting_with_people: 3,
    motivated_by_long_term_goals: 5,
    like_abstract_problems: 4,
    enjoy_practical_work: 5,
    
    // Work Style (6)
    preferred_work_environment: "remote",
    problem_solving_approach: "logic_data",
    career_motivation: "learning_growth",
    exciting_work_type: "designing_systems",
    continuous_learning_attitude: "enjoy_pursue",
    preferred_location: "international",
    
    // Career Inclination (1)
    appealing_role: "software_engineer"
  }
};

console.log('\n📋 Test 1: Valid Data (All 44 Questions)');
console.log('-'.repeat(80));

const { error: validError, value: validValue } = schemas.profileSubmissionSchema.validate(validData);

if (validError) {
  console.log('✗ FAILED - Validation errors:');
  validError.details.forEach(detail => {
    console.log(`  - ${detail.path.join('.')}: ${detail.message}`);
  });
} else {
  console.log('✓ PASSED - All questions validated successfully');
  console.log(`  User ID: ${validValue.userId}`);
  console.log(`  Total answer fields: ${Object.keys(validValue.answers).length}`);
}

// Test with missing required fields
console.log('\n\n📋 Test 2: Missing Required Fields');
console.log('-'.repeat(80));

const incompleteData = {
  userId: "test_user_456",
  answers: {
    academic_level: "intermediate",
    field_of_study: "computer_science"
    // Missing all other required fields
  }
};

const { error: incompleteError } = schemas.profileSubmissionSchema.validate(incompleteData, {
  abortEarly: false
});

if (incompleteError) {
  console.log(`✓ PASSED - Correctly rejected incomplete data`);
  console.log(`  Missing fields detected: ${incompleteError.details.length}`);
  console.log('\n  Sample missing fields:');
  incompleteError.details.slice(0, 5).forEach(detail => {
    console.log(`    - ${detail.path.join('.')}`);
  });
  if (incompleteError.details.length > 5) {
    console.log(`    ... and ${incompleteError.details.length - 5} more`);
  }
} else {
  console.log('✗ FAILED - Should have rejected incomplete data');
}

// Test with invalid values
console.log('\n\n📋 Test 3: Invalid Values');
console.log('-'.repeat(80));

const invalidData = {
  userId: "test_user_789",
  answers: {
    ...validData.answers,
    mathematical_skills: 10, // Invalid: should be 1-5
    preferred_work_environment: "invalid_option", // Invalid enum value
    academic_level: "phd" // Invalid enum value
  }
};

const { error: invalidError } = schemas.profileSubmissionSchema.validate(invalidData, {
  abortEarly: false
});

if (invalidError) {
  console.log(`✓ PASSED - Correctly rejected invalid values`);
  console.log(`  Invalid fields detected: ${invalidError.details.length}`);
  invalidError.details.forEach(detail => {
    console.log(`    - ${detail.path.join('.')}: ${detail.message}`);
  });
} else {
  console.log('✗ FAILED - Should have rejected invalid values');
}

// Count required vs optional fields
console.log('\n\n📊 VALIDATOR SUMMARY');
console.log('-'.repeat(80));

const schema = schemas.profileSubmissionSchema.describe();
const answersSchema = schema.keys.answers.keys;
const fieldCount = Object.keys(answersSchema).length;
const requiredCount = Object.entries(answersSchema).filter(([key, value]) => {
  return value.flags?.presence === 'required';
}).length;

console.log(`  Total answer fields: ${fieldCount}`);
console.log(`  Required fields: ${requiredCount}`);
console.log(`  Optional fields: ${fieldCount - requiredCount}`);

console.log('\n' + '='.repeat(80));
console.log('✓ VALIDATOR TESTS COMPLETED');
console.log('='.repeat(80));
