# Dynamic Questions System - Documentation

## Overview
The Career Counseling system now uses a **dynamic, modular question architecture** that makes it easy to add, remove, or modify questions without breaking existing functionality.

## 🎯 Key Features

### ✅ Automatic Duplicate Prevention
- System validates all question IDs on startup
- Throws error if duplicate IDs detected
- Ensures data integrity

### 📊 Organized by Category
Questions are organized into 6 main sections:
1. **Academic Background** - Education history (5 questions)
2. **Interest Assessment** - What students enjoy (11 questions)
3. **Skills & Strengths** - Abilities assessment (11 questions)
4. **Personality Traits** - Work personality (10 questions)
5. **Work Style & Preferences** - How they work (6 questions)
6. **Career Inclination** - Direct career signals (1 question)

**Total: 44 questions** (42 required, 2 optional)

### 🔢 Question Types
- **Scale (Likert)**: 1-5 rating questions (30 questions)
- **Single Select**: Choose one option (11 questions)
- **Multi Select**: Choose multiple options (3 questions)

## 📝 How to Add New Questions

### Step 1: Choose the Right Section
Add your question to the appropriate array:
- `academicBackgroundQuestions`
- `interestQuestions`
- `skillsQuestions`
- `personalityQuestions`
- `workStyleQuestions`
- `careerInclinationQuestions`

### Step 2: Create Question Object

**Example - Adding a Scale Question:**
```javascript
{
  id: 'enjoy_team_sports',  // Must be unique!
  category: 'personality',
  question: 'I enjoy playing team sports.',
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
```

**Example - Adding a Single Select Question:**
```javascript
{
  id: 'preferred_company_size',
  category: 'work_style',
  question: 'What size of company do you prefer?',
  type: 'single_select',
  required: true,
  options: [
    { id: 'opt_1', label: 'Startup (1-50 employees)', value: 'startup' },
    { id: 'opt_2', label: 'Small (50-200)', value: 'small' },
    { id: 'opt_3', label: 'Medium (200-1000)', value: 'medium' },
    { id: 'opt_4', label: 'Large (1000+)', value: 'large' }
  ]
}
```

**Example - Adding a Multi Select Question:**
```javascript
{
  id: 'preferred_technologies',
  category: 'interests',
  question: 'Which technologies interest you? (Select up to 3)',
  type: 'multi_select',
  required: false,
  maxSelections: 3,
  options: [
    { id: 'opt_1', label: 'Web Development', value: 'web' },
    { id: 'opt_2', label: 'Mobile Apps', value: 'mobile' },
    { id: 'opt_3', label: 'AI/Machine Learning', value: 'ai_ml' },
    { id: 'opt_4', label: 'Cloud Computing', value: 'cloud' },
    { id: 'opt_5', label: 'Cybersecurity', value: 'security' }
  ]
}
```

### Step 3: Add to Array
Simply add your question object to the appropriate section array:

```javascript
const personalityQuestions = [
  // ... existing questions ...
  {
    id: 'enjoy_team_sports',  // Your new question
    category: 'personality',
    question: 'I enjoy playing team sports.',
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
```

### Step 4: Test
Run the test script to verify:
```bash
node test-questions.js
```

System will automatically:
- ✅ Check for duplicate IDs
- ✅ Validate structure
- ✅ Integrate into all APIs

## 🗑️ How to Remove Questions

### Option 1: Delete
Simply delete the question object from its array.

### Option 2: Comment Out (Safer)
Comment out the question if you might need it later:

```javascript
// Temporarily disabled - may re-enable later
// {
//   id: 'old_question',
//   category: 'skills',
//   question: '...',
//   type: 'scale',
//   required: false,
//   scaleMin: 1,
//   scaleMax: 5
// },
```

**Important:** No need to update any other files! The system handles everything automatically.

## 🔧 How to Modify Questions

### Change Question Text
Just edit the `question` field:
```javascript
question: 'I enjoy working with data and statistics.'  // Updated text
```

### Change from Required to Optional
```javascript
required: false  // Changed from true
```

### Change Scale Range
```javascript
scaleMin: 1,
scaleMax: 10,  // Changed from 5
scaleLabels: {
  1: 'Not at all',
  5: 'Somewhat',
  10: 'Extremely'
}
```

### Add/Remove Options (for select questions)
```javascript
options: [
  { id: 'opt_1', label: 'Option A', value: 'a' },
  { id: 'opt_2', label: 'Option B', value: 'b' },
  { id: 'opt_3', label: 'New Option C', value: 'c' }  // Added
  // Removed old Option D
]
```

## 📚 Available Functions

### `getAllQuestions()`
Returns all questions in order.

```javascript
const questions = getAllQuestions();
console.log(questions.length); // 44
```

### `getQuestionsByCategory(category)`
Get all questions from a specific category.

```javascript
const skillQuestions = getQuestionsByCategory('skills');
console.log(skillQuestions.length); // 11
```

**Valid categories:**
- `academic_background`
- `interests`
- `skills`
- `personality`
- `work_style`
- `career_inclination`

### `getQuestionById(questionId)`
Get a specific question by its ID.

```javascript
const question = getQuestionById('mathematical_skills');
console.log(question.question); // "My mathematical skills are strong."
```

### `getCategories()`
Get all categories with metadata.

```javascript
const categories = getCategories();
// Returns array with: id, name, description, order, questionCount
```

### `getQuestionStats()`
Get statistics about the question set.

```javascript
const stats = getQuestionStats();
console.log(stats.total); // 44
console.log(stats.byType.scale); // 30
console.log(stats.required); // 42
```

### `validateAnswer(questionId, answer)`
Validate a user's answer.

```javascript
const result = validateAnswer('mathematical_skills', 3);
console.log(result.valid); // true

const invalid = validateAnswer('mathematical_skills', 10);
console.log(invalid.error); // "Value must be between 1 and 5"
```

## 🚀 API Integration

The question system automatically works with your API endpoints:

### GET /api/career/questions
Returns all questions grouped by category.

### GET /api/career/questions/:category
Returns questions from specific category.

### POST /api/career/profile
Validates answers against question definitions.

## ✅ Best Practices

### 1. Use Descriptive IDs
✅ Good: `enjoy_solving_logical_problems`  
❌ Bad: `q1`, `question_001`

### 2. Keep Question Text Clear
✅ Good: "I enjoy working with data and statistics."  
❌ Bad: "Do you like data?"

### 3. Use Consistent Scale Labels
For Likert scales, use:
- 1-5: Strongly Disagree → Strongly Agree
- 1-5: Very Weak → Very Strong

### 4. Group Related Questions
Keep similar questions in the same category.

### 5. Test After Changes
Always run `node test-questions.js` after modifications.

### 6. Don't Reuse IDs
Even after deleting a question, don't reuse its ID for a different question.

## 🔍 Question ID Reference

### Academic Background (5)
- `academic_level`
- `field_of_study`
- `academic_performance`
- `favorite_subjects`
- `challenging_subjects`

### Interest Assessment (11)
- `enjoy_solving_logical_problems`
- `like_working_with_computers`
- `enjoy_creative_tasks`
- `like_analyzing_data`
- `enjoy_understanding_systems`
- `prefer_planning_over_execution`
- `enjoy_helping_people`
- `curious_about_business`
- `enjoy_research`
- `like_learning_new_tools`
- `hobbies`

### Skills & Strengths (11)
- `mathematical_skills`
- `learn_programming_quickly`
- `communicate_ideas_clearly`
- `problem_solving_under_pressure`
- `comfortable_with_data`
- `lead_team_effectively`
- `logical_reasoning`
- `adapt_to_challenges`
- `attention_to_detail`
- `creative_problem_solving`
- `learning_preference`

### Personality Traits (10)
- `prefer_working_independently`
- `enjoy_taking_responsibility`
- `remain_calm_under_pressure`
- `like_structured_environments`
- `comfortable_taking_risks`
- `prefer_routine`
- `enjoy_interacting_with_people`
- `motivated_by_long_term_goals`
- `like_abstract_problems`
- `enjoy_practical_work`

### Work Style & Preferences (6)
- `preferred_work_environment`
- `problem_solving_approach`
- `career_motivation`
- `exciting_work_type`
- `continuous_learning_attitude`
- `preferred_location`

### Career Inclination (1)
- `appealing_role`

## 🛠️ Troubleshooting

### Error: "Duplicate question IDs found"
**Solution:** Check for duplicate IDs in your questions. Each ID must be unique across all categories.

### Error: "Invalid question ID"
**Solution:** Ensure the question ID exists in the configuration.

### Questions not showing in API
**Solution:** Restart your server after adding new questions.

### Validation failing for answers
**Solution:** Check that answer format matches question type:
- Scale: number (1-5)
- Single Select: string matching option value
- Multi Select: array of strings matching option values

## 📞 Support

If you encounter issues:
1. Run `node test-questions.js` to diagnose
2. Check the console for validation errors
3. Verify question structure matches examples above
4. Ensure unique IDs for all questions

---

**Last Updated:** March 5, 2026  
**Total Questions:** 44  
**Version:** 2.0 - Dynamic System
