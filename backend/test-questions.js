/**
 * Test script for dynamic questions system
 * Validates question structure and demonstrates usage
 */

const {
  getAllQuestions,
  getQuestionsByCategory,
  getQuestionById,
  getCategories,
  getQuestionStats,
  validateQuestionUniqueness
} = require('./src/config/questions');

console.log('='.repeat(80));
console.log('DYNAMIC QUESTIONS SYSTEM TEST');
console.log('='.repeat(80));

// Test 1: Get all categories
console.log('\n📂 CATEGORIES:');
const categories = getCategories();
categories.forEach(cat => {
  console.log(`\n  ${cat.order}. ${cat.name} (${cat.id})`);
  console.log(`     ${cat.description}`);
  console.log(`     Questions: ${cat.questionCount}`);
});

// Test 2: Get question statistics
console.log('\n\n📊 QUESTION STATISTICS:');
const stats = getQuestionStats();
console.log(`  Total Questions: ${stats.total}`);
console.log(`  Required: ${stats.required}`);
console.log(`  Optional: ${stats.optional}`);
console.log('\n  By Type:');
console.log(`    - Scale (Likert): ${stats.byType.scale}`);
console.log(`    - Single Select: ${stats.byType.single_select}`);
console.log(`    - Multi Select: ${stats.byType.multi_select}`);

// Test 3: Show sample questions from each category
console.log('\n\n📝 SAMPLE QUESTIONS BY CATEGORY:');
categories.forEach(cat => {
  const questions = getQuestionsByCategory(cat.id);
  console.log(`\n  ${cat.name}:`);
  console.log(`    Sample: "${questions[0].question}"`);
  console.log(`    Type: ${questions[0].type}`);
});

// Test 4: Test specific question retrieval
console.log('\n\n🔍 SPECIFIC QUESTION LOOKUP:');
const sampleQuestion = getQuestionById('mathematical_skills');
if (sampleQuestion) {
  console.log(`  ID: ${sampleQuestion.id}`);
  console.log(`  Category: ${sampleQuestion.category}`);
  console.log(`  Question: ${sampleQuestion.question}`);
  console.log(`  Type: ${sampleQuestion.type}`);
  console.log(`  Required: ${sampleQuestion.required}`);
}

// Test 5: Validate uniqueness
console.log('\n\n✓ VALIDATION:');
try {
  validateQuestionUniqueness();
  console.log('  ✓ All question IDs are unique');
  console.log('  ✓ No duplicate questions found');
} catch (error) {
  console.log('  ✗ Error:', error.message);
}

// Test 6: Show all question IDs for reference
console.log('\n\n📋 ALL QUESTION IDs (for reference):');
const allQuestions = getAllQuestions();
const questionsByCategory = {};
allQuestions.forEach(q => {
  if (!questionsByCategory[q.category]) {
    questionsByCategory[q.category] = [];
  }
  questionsByCategory[q.category].push(q.id);
});

Object.keys(questionsByCategory).forEach(cat => {
  const catInfo = categories.find(c => c.id === cat);
  console.log(`\n  ${catInfo.name}:`);
  questionsByCategory[cat].forEach(id => {
    console.log(`    - ${id}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log('✓ TEST COMPLETED SUCCESSFULLY');
console.log('='.repeat(80));
