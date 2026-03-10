# 🤖 Claude Development Prompt: AI-Powered Career Counseling System

## 📌 Project Context

You are tasked with developing a **production-grade AI-powered career counseling system** for a Final Year Project (FYP). This system helps students in Pakistan discover ideal degree programs through comprehensive assessment and intelligent recommendations using OpenAI's GPT-4.

---

## 🎯 Project Objectives

### Primary Goal
Build a MERN stack application that:
1. Collects comprehensive student data through a structured questionnaire
2. Analyzes the data using AI to recommend 3 personalized degree programs
3. Provides follow-up chat support with contextual awareness
4. Maintains session history for future reference

### Success Criteria
- ✅ Clean, maintainable, production-ready code
- ✅ Comprehensive error handling and validation
- ✅ AI generates accurate, contextual recommendations
- ✅ System is scalable and extensible
- ✅ Well-documented with clear architecture
- ✅ Ready for frontend integration

---

## 🏗 Technical Architecture

### Tech Stack Requirements

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- OpenAI API (GPT-4 or GPT-4o-mini)
- Joi for validation
- Winston for logging
- Morgan for request logging
- Helmet for security
- CORS for frontend integration
- Express Rate Limit for API protection

**Frontend (Future Integration):**
- React.js or Next.js
- Axios for API calls
- Form management library (React Hook Form/Formik)
- UI component library (Material-UI/Chakra UI)

### Architecture Pattern
Implement **Clean Architecture** with clear separation:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend)                        │
│                   React/Next.js Application                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                        │  │
│  │  • CORS & Helmet (Security)                               │  │
│  │  • Request Logging (Morgan + Winston)                     │  │
│  │  • Rate Limiting (100 req/15min)                          │  │
│  │  • Request Validation (Joi)                               │  │
│  │  • Error Handling                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLER LAYER                        │  │
│  │  • Handle HTTP Requests/Responses                          │  │
│  │  • Input Validation                                        │  │
│  │  • Response Formatting                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    SERVICE LAYER                           │  │
│  │  • Business Logic Orchestration                            │  │
│  │  • Data Transformation                                     │  │
│  │  • Session Management                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                     │
│         ┌──────────────────┴──────────────────┐                  │
│         ▼                                     ▼                  │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │   OpenAI     │                    │   Database   │           │
│  │   Service    │                    │   Models     │           │
│  └──────────────┘                    └──────────────┘           │
└─────────┼─────────────────────────────────────┼──────────────────┘
          │                                     │
          ▼                                     ▼
   ┌─────────────┐                      ┌─────────────┐
   │   OpenAI    │                      │   MongoDB   │
   │   GPT-4     │                      │  Database   │
   └─────────────┘                      └─────────────┘
```

---

## 📋 Feature Requirements

### FEATURE 1: Dynamic Question System

**Requirements:**
1. Create a comprehensive 44-question assessment covering:
   - **Academic Background** (4 questions): Education level, field of study, favorite subjects, GPA
   - **Interests** (10 questions): Various interest areas rated on Likert scale + hobbies
   - **Skills** (10 questions): Technical and soft skills rated on Likert scale + learning preference
   - **Personality Traits** (10 questions): Key personality characteristics on Likert scale
   - **Work Style** (6 questions): Environment, collaboration, schedule, creativity, routine, travel preferences
   - **Career Inclination** (4 questions): Role preference, motivation, problem-solving, decision-making

2. **Question Types:**
   - Likert Scale (1-5): For rating interests, skills, personality traits
   - Single-select: For choices like education level, field of study
   - Multi-select: For favorite subjects and hobbies

3. **Dynamic System Design:**
   - Store questions in modular configuration file (`src/config/questions.js`)
   - Organize by category for easy management
   - Include automatic duplicate detection on system startup
   - Each question must have unique ID
   - Easy to add/remove questions without changing database schema or business logic

4. **Question Structure:**
```javascript
{
  id: 'unique_question_id',
  category: 'skills',
  question: 'Rate your programming ability',
  type: 'scale', // 'scale', 'single_select', 'multi_select'
  required: true,
  options: [...] // for select types
}
```

**Implementation Details:**
- Export helper functions:
  - `getAllQuestions()` - Returns all 44 questions
  - `getQuestionsByCategory(category)` - Filter by category
  - `getQuestionById(id)` - Get specific question
  - `getCategories()` - List all categories
  - `getQuestionStats()` - Return statistics
  - `validateQuestionUniqueness()` - Check for duplicate IDs

---

### FEATURE 2: Profile Management System

**Requirements:**
1. Create MongoDB schema (`CareerProfile`) to store student assessment data
2. Use **flat structure** (not nested) for better performance and flexibility
3. Store normalized data with proper types and validation
4. Auto-generate timestamps (createdAt, updatedAt)
5. Index on userId for fast queries

**Schema Fields:**
```javascript
{
  userId: String (required, indexed),
  
  // Academic Background
  academic_level: String,
  field_of_study: String,
  favorite_subjects: [String],
  gpa_range: String,
  
  // Interests (10 Likert scale fields + hobbies array)
  interest_technology: Number (1-5),
  interest_business: Number (1-5),
  interest_healthcare: Number (1-5),
  interest_education: Number (1-5),
  interest_arts_design: Number (1-5),
  interest_science_research: Number (1-5),
  interest_sports_fitness: Number (1-5),
  interest_social_work: Number (1-5),
  interest_law_governance: Number (1-5),
  interest_engineering: Number (1-5),
  hobbies: [String] (optional),
  
  // Skills (10 skill fields + learning preference)
  skill_communication: Number (1-5),
  skill_leadership: Number (1-5),
  skill_problem_solving: Number (1-5),
  skill_teamwork: Number (1-5),
  skill_time_management: Number (1-5),
  skill_critical_thinking: Number (1-5),
  skill_creativity: Number (1-5),
  skill_technical: Number (1-5),
  skill_analytical: Number (1-5),
  skill_adaptability: Number (1-5),
  learning_preference: String,
  
  // Personality Traits (10 fields)
  personality_extroverted: Number (1-5),
  personality_detail_oriented: Number (1-5),
  personality_innovative: Number (1-5),
  personality_empathetic: Number (1-5),
  personality_competitive: Number (1-5),
  personality_independent: Number (1-5),
  personality_organized: Number (1-5),
  personality_risk_taker: Number (1-5),
  personality_patient: Number (1-5),
  personality_curious: Number (1-5),
  
  // Work Style (6 fields)
  work_environment: String,
  work_collaboration: String,
  work_schedule: String,
  work_creativity: String,
  work_routine: String,
  work_travel: String,
  
  // Career Inclination (1 field - others already covered)
  career_role_preference: String,
  
  timestamps: true
}
```

**Implementation Details:**
- Use Mongoose schema with validation at database level
- Create model in `src/models/CareerProfile.js`
- Export model for use in services

---

### FEATURE 3: Data Transformation Pipeline

**Requirements:**
Create utility functions to transform data between three formats:

1. **Raw Form Answers → Database Profile**
   - Input: `{ question_id: answer_value, ... }`
   - Output: Normalized profile object matching schema
   - Function: `transformAnswersToProfile(userId, answers)`

2. **Database Profile → AI-Readable Format**
   - Input: MongoDB profile document
   - Output: Human-readable text descriptions for GPT-4
   - Function: `transformProfileToAIFormat(profile)`
   - Example output:
   ```
   Academic Background:
   - Education Level: Intermediate/A-Levels
   - Field: Computer Science
   - Favorite Subjects: Mathematics, Computer Science, Physics
   - GPA: 3.5-4.0
   
   Strong Interests (rated 4-5):
   - Technology and Software
   - Engineering
   
   Strong Skills (rated 4-5):
   - Problem Solving (5/5)
   - Critical Thinking (5/5)
   - Technical Skills (4/5)
   
   Personality Traits:
   - Very curious and innovative
   - Independent worker
   - Detail-oriented
   
   Work Preferences:
   - Environment: Remote/Home
   - Schedule: Flexible hours
   - Creativity: High creativity work
   
   Career Goals:
   - Prefers: Software Engineer / Developer role
   ```

3. **Profile Summary Generator**
   - Function: `generateProfileSummary(profile)`
   - Extract and highlight only strong traits (ratings 4-5)
   - Create concise summary for AI context

**Implementation Details:**
- Create all functions in `src/utils/transformers.js`
- Include helper functions:
  - `getStrongInterests(profile)` - Returns interests rated 4-5
  - `getStrongSkills(profile)` - Returns skills rated 4-5
  - `getKeyPersonalityTraits(profile)` - Returns personality traits rated 4-5
- Ensure all transformations are efficient and maintainable

---

### FEATURE 4: Input Validation System

**Requirements:**
1. Use Joi to create validation schemas for all API requests
2. Validate profile submission with all 44 question answers
3. Create reusable validation middleware
4. Provide clear error messages for validation failures

**Validation Schema Requirements:**
```javascript
// Profile Submission Schema
{
  userId: Joi.string().required(),
  
  // Academic Background (4 fields)
  academic_level: Joi.string().valid('matric', 'intermediate', ...).required(),
  field_of_study: Joi.string().valid('science', 'commerce', ...).required(),
  favorite_subjects: Joi.array().items(Joi.string()).min(1).max(3).required(),
  gpa_range: Joi.string().valid('below_2.0', '2.0-2.5', ...).required(),
  
  // Interests (10 required Likert + 1 optional array)
  interest_technology: Joi.number().min(1).max(5).required(),
  // ... (9 more interest fields)
  hobbies: Joi.array().items(Joi.string()).optional(),
  
  // Skills (10 required Likert + 1 required select)
  skill_communication: Joi.number().min(1).max(5).required(),
  // ... (9 more skill fields)
  learning_preference: Joi.string().valid('visual', 'auditory', ...).required(),
  
  // Personality (10 required Likert)
  personality_extroverted: Joi.number().min(1).max(5).required(),
  // ... (9 more personality fields)
  
  // Work Style (6 required select)
  work_environment: Joi.string().valid('office', 'remote', ...).required(),
  // ... (5 more work style fields)
  
  // Career Inclination (1 required select)
  career_role_preference: Joi.string().valid('software_engineer', ...).required()
}
```

**Summary:** 40 required fields, 4 optional fields (favorite_subjects can be 1-3, hobbies optional)

**Implementation Details:**
- Create validator in `src/validators/careerValidator.js`
- Export `profileSubmissionSchema`
- Use in route middleware: `validate(careerValidator.profileSubmissionSchema)`
- Create generic validation middleware in `src/middleware/index.js`

---

### FEATURE 5: AI Recommendation Engine

**Requirements:**
1. Integrate OpenAI GPT-4 API for intelligent recommendations
2. Create service layer to handle all AI interactions
3. Implement retry logic (3 attempts with exponential backoff)
4. Track token usage for cost management
5. Generate structured JSON output with 3 degree recommendations

**OpenAI Service Structure:**
```javascript
class OpenAIService {
  // Generate recommendations
  async generateRecommendation(profileData) {
    // Returns:
    {
      recommendations: [
        {
          degree: "Bachelor of Science in Computer Science",
          match_score: 92,
          reasons: [
            "Strong interest in technology (5/5) and programming skills",
            "Excellent logical thinking and problem-solving abilities",
            "Preference for remote/flexible work aligns with tech industry",
            "High curiosity and innovative thinking suits research aspects"
          ],
          required_skills: [
            "Mathematics fundamentals",
            "Logical reasoning",
            "Programming basics",
            "English proficiency"
          ],
          career_paths: [
            "Software Developer/Engineer",
            "Data Scientist",
            "Machine Learning Engineer",
            "Full-Stack Developer"
          ],
          universities_in_pakistan: [
            "NUST - National University of Sciences and Technology",
            "FAST - National University of Computer and Emerging Sciences",
            "LUMS - Lahore University of Management Sciences"
          ],
          average_salary_pkr: "60,000 - 150,000 (starting)"
        },
        // ... 2 more recommendations
      ],
      token_usage: {
        prompt_tokens: 1200,
        completion_tokens: 800,
        total_tokens: 2000
      }
    }
  }
  
  // Follow-up chat
  async chat(sessionId, userMessage, conversationHistory, memoryContext) {
    // Returns contextual response about recommendations
  }
}
```

**Prompt Engineering Requirements:**

1. **System Prompt for Recommendations:**
```
You are an expert career counselor in Pakistan with deep knowledge of:
- Pakistani universities and their degree programs
- Local job market and salary ranges
- Degree requirements and prerequisites
- Career paths for different degrees

Your task is to analyze student profiles and recommend 3 most suitable degree programs.

CRITICAL RULES:
1. Always return valid JSON matching the exact schema
2. Provide 3 distinct recommendations (different fields)
3. Match scores should be realistic (60-95% range)
4. Include 4-5 specific reasons per recommendation
5. List actual Pakistani universities offering the program
6. Provide salary ranges in PKR
7. Consider Pakistan-specific context (market demand, cultural factors)

Return ONLY valid JSON, no markdown, no additional text.
```

2. **User Prompt for Recommendations:**
   - Include full profile description from `transformProfileToAIFormat()`
   - Request structured JSON output
   - Specify exact JSON schema

3. **System Prompt for Follow-up Chat:**
```
You are continuing a career counseling session. The student has received 3 degree recommendations and now has follow-up questions.

CONTEXT:
{previous_recommendations}

MEMORY (Important points from conversation):
{memory_summary}

RULES:
1. Stay focused on the recommended degrees
2. Provide specific, actionable advice
3. Reference Pakistani universities and programs
4. Be encouraging and supportive
5. If asked about alternatives, suggest related fields
6. Keep responses concise but informative (3-5 paragraphs max)
```

**Implementation Details:**
- Create service in `src/services/openai.service.js`
- Implement retry logic with exponential backoff
- Use `response_format: { type: "json_object" }` for structured output
- Handle API errors gracefully
- Log all API calls for debugging
- Calculate and store token costs

---

### FEATURE 6: Session Management System

**Requirements:**
1. Create MongoDB schema (`CareerSession`) to store recommendation sessions
2. Each session contains:
   - Unique session ID
   - User ID
   - Original recommendations from AI
   - Complete chat history
   - Memory summaries for efficient context
   - Token usage statistics
   - Timestamps

**Session Schema:**
```javascript
{
  sessionId: String (unique, indexed),
  userId: String (indexed),
  recommendations: {
    degrees: [
      {
        degree: String,
        match_score: Number,
        reasons: [String],
        required_skills: [String],
        career_paths: [String],
        universities_in_pakistan: [String],
        average_salary_pkr: String
      }
    ],
    generated_at: Date
  },
  chat_history: [
    {
      role: String ('user' or 'assistant'),
      content: String,
      timestamp: Date
    }
  ],
  memory_summary: String, // Condensed important points
  token_usage: {
    recommendation_tokens: Number,
    chat_tokens: Number,
    total_tokens: Number
  },
  timestamps: true
}
```

**Memory Management:**
- After every 5 messages, generate memory summary
- Memory summary includes:
  - Key questions asked
  - Important information provided
  - Student's main concerns
  - Topics discussed
- Use memory summary + last 3 messages for chat context (token optimization)

**Implementation Details:**
- Create model in `src/models/CareerSession.js`
- Implement memory generation using GPT-4
- Limit chat history to reasonable size (e.g., 50 messages)
- Allow multiple sessions per user

---

### FEATURE 7: RESTful API Endpoints

**Requirements:**
Implement 9 API endpoints with proper HTTP methods, status codes, and error handling.

#### 1. **GET /api/career/questions**
- **Purpose:** Retrieve all assessment questions
- **Response:**
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "total": 44,
    "categories": ["academic_background", "interests", ...]
  }
}
```

#### 2. **POST /api/career/profile**
- **Purpose:** Submit student profile
- **Request Body:** All 44 question answers
- **Response:**
```json
{
  "success": true,
  "data": {
    "profileId": "...",
    "message": "Profile saved successfully"
  }
}
```
- **Validation:** Use Joi schema
- **Processing:** Transform answers → Save to DB

#### 3. **GET /api/career/profile/:userId**
- **Purpose:** Retrieve saved profile
- **Response:** Full profile object

#### 4. **POST /api/career/recommend**
- **Purpose:** Generate AI recommendations
- **Request Body:** `{ userId }`
- **Processing:**
  1. Fetch profile from DB
  2. Transform to AI format
  3. Call OpenAI API
  4. Create new session
  5. Save recommendations
- **Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "recommendations": [...],
    "token_usage": {...}
  }
}
```

#### 5. **POST /api/career/chat/:sessionId**
- **Purpose:** Follow-up chat
- **Request Body:** `{ message }`
- **Processing:**
  1. Fetch session
  2. Get memory summary + recent messages
  3. Call OpenAI chat API
  4. Update chat history
  5. Update memory if needed
- **Response:**
```json
{
  "success": true,
  "data": {
    "response": "...",
    "timestamp": "..."
  }
}
```

#### 6. **GET /api/career/session/:sessionId**
- **Purpose:** Get full session details
- **Response:** Complete session object

#### 7. **GET /api/career/sessions/:userId**
- **Purpose:** List all sessions for user
- **Response:** Array of session summaries

#### 8. **GET /api/career/questions/categories**
- **Purpose:** Get list of question categories
- **Response:** Array of category names

#### 9. **GET /api/career/questions/stats**
- **Purpose:** Get question statistics
- **Response:**
```json
{
  "total_questions": 44,
  "by_category": {
    "academic_background": 4,
    "interests": 10,
    ...
  },
  "by_type": {
    "scale": 30,
    "single_select": 12,
    "multi_select": 2
  }
}
```

**Implementation Requirements:**
- Create routes in `src/routes/career.routes.js`
- Create controllers in `src/controllers/career.controller.js`
- Use async/await with try-catch
- Return consistent response format
- Handle all errors appropriately

---

### FEATURE 8: Middleware & Security

**Requirements:**

1. **Error Handler Middleware**
```javascript
// src/middleware/errorHandler.js
- Centralized error handling
- Format error responses consistently
- Log errors with Winston
- Different handling for different error types:
  - Validation errors (400)
  - Not found errors (404)
  - Server errors (500)
  - OpenAI API errors (503)
```

2. **Request Logger Middleware**
```javascript
// src/middleware/requestLogger.js
- Log all incoming requests
- Log response times
- Log response status codes
- Use Morgan for HTTP logging
- Use Winston for file logging
```

3. **Rate Limiter Middleware**
```javascript
// src/middleware/rateLimiter.js
- Limit: 100 requests per 15 minutes
- Apply to all API routes
- Return 429 status when exceeded
- Include retry-after header
```

4. **Security Middleware**
```javascript
// src/server.js
- Helmet.js for security headers
- CORS configuration
- JSON body parser (limit: 10MB)
- URL-encoded parser
```

**Implementation Details:**
- Create all middleware in `src/middleware/` directory
- Export from `src/middleware/index.js`
- Apply in correct order in `src/server.js`

---

### FEATURE 9: Logging System

**Requirements:**
1. Use Winston for structured logging
2. Multiple log levels: error, warn, info, debug
3. Multiple transports:
   - Console (development)
   - File: `logs/error.log` (errors only)
   - File: `logs/combined.log` (all logs)
4. JSON format for machine parsing
5. Include timestamps and log levels

**Logger Configuration:**
```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

**Usage Examples:**
```javascript
logger.info('Profile saved successfully', { userId, profileId });
logger.error('OpenAI API error', { error: error.message, userId });
logger.warn('Rate limit exceeded', { ip: req.ip });
logger.debug('Transformer input', { answers });
```

---

### FEATURE 10: Testing Infrastructure

**Requirements:**
Create test files to validate the system:

1. **test-questions.js**
   - Validate 44 questions exist
   - Check for duplicates
   - Verify all categories present
   - Test helper functions

2. **test-profile-transformation.js**
   - Test answers → profile transformation
   - Test profile → AI format transformation
   - Test profile summary generation
   - Verify all fields mapped correctly

3. **test-validator.js**
   - Test valid profile submission
   - Test missing required fields
   - Test invalid values (out of range)
   - Test enum validations

4. **test-profiles-recommendations.http**
   - 3 complete profile examples:
     - **Profile 1:** Software Engineering path
       - High tech interest (5/5)
       - Strong programming, math, logical thinking
       - CS background
       - Remote work preference
     - **Profile 2:** BBA/Business path
       - High business interest (5/5)
       - Strong leadership, communication
       - Commerce background
       - Office environment preference
     - **Profile 3:** Medical/Research path
       - High healthcare interest (5/5)
       - Compassionate, detail-oriented
       - Biology/Chemistry background
       - Lab environment preference
   - Include POST requests for profile + recommendations

5. **test-api.http**
   - Test all 9 API endpoints
   - Include example requests/responses
   - Use REST Client extension format

**Implementation Details:**
- Create all test files in backend root directory
- Use actual backend API structure
- Provide clear comments
- Make tests runnable with `node test-*.js`

---

## 🎨 Code Quality Requirements

### 1. Clean Code Principles
- **Single Responsibility:** Each function does one thing
- **DRY:** Don't repeat code, create reusable functions
- **Meaningful Names:** Variables and functions clearly named
- **Small Functions:** Keep functions under 50 lines
- **Comments:** Explain WHY, not WHAT (code should be self-documenting)

### 2. Error Handling
- Never use bare try-catch without handling
- Always log errors with context
- Return appropriate HTTP status codes
- Provide helpful error messages
- Never expose internal errors to client

### 3. Async/Await Best Practices
```javascript
// Good
try {
  const profile = await CareerProfile.findOne({ userId });
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }
  return profile;
} catch (error) {
  logger.error('Error fetching profile', { userId, error: error.message });
  throw error;
}
```

### 4. Code Organization
```
backend/
├── src/
│   ├── server.js              # Entry point
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   └── questions.js       # Questions configuration
│   ├── controllers/
│   │   └── career.controller.js
│   ├── models/
│   │   ├── CareerProfile.js
│   │   ├── CareerSession.js
│   │   └── index.js           # Export all models
│   ├── services/
│   │   ├── career.service.js
│   │   └── openai.service.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── transformers.js
│   ├── validators/
│   │   └── careerValidator.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── requestLogger.js
│   │   └── index.js
│   └── routes/
│       ├── career.routes.js
│       └── index.js
├── logs/                      # Generated at runtime
├── examples/
│   └── usage-examples.js
├── test-questions.js
├── test-profile-transformation.js
├── test-validator.js
├── test-profiles-recommendations.http
├── test-api.http
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 📝 Documentation Requirements

Create comprehensive documentation:

### 1. README.md
- Project overview
- Features list
- Installation instructions
- API endpoints
- Environment variables
- Running instructions
- Architecture overview

### 2. ARCHITECTURE.md
- System architecture diagram
- Complete data flow
- Component interactions
- Technology choices explained
- Detailed pipeline explanation

### 3. SETUP_GUIDE.md
- Step-by-step setup
- Prerequisites
- MongoDB setup
- Environment configuration
- Testing instructions
- Troubleshooting guide
- Production deployment tips

### 4. API_DOCUMENTATION.md
- All 9 endpoints documented
- Request/response examples
- Error responses
- Rate limiting
- Token usage
- Authentication (future)

### 5. QUESTIONS_GUIDE.md
- How to add new questions
- How to remove questions
- Question structure explained
- Category organization
- Validation system

### 6. Code Comments
- JSDoc comments for all functions
- Explain complex logic
- Document assumptions
- Note TODOs for future improvements

---

## 🚀 Implementation Steps

### Phase 1: Project Setup (Day 1)
1. Initialize Node.js project
2. Install all dependencies
3. Create folder structure
4. Setup .env and configuration
5. Setup MongoDB connection
6. Setup Winston logger
7. Create basic Express server

### Phase 2: Question System (Day 1-2)
1. Create questions.js with all 44 questions
2. Implement helper functions
3. Add duplicate detection
4. Test question system
5. Create questions API endpoint

### Phase 3: Database Models (Day 2)
1. Create CareerProfile schema
2. Create CareerSession schema
3. Add validations
4. Test models with dummy data

### Phase 4: Data Transformation (Day 2-3)
1. Implement transformAnswersToProfile
2. Implement transformProfileToAIFormat
3. Implement generateProfileSummary
4. Create helper functions
5. Test transformations thoroughly

### Phase 5: Validation System (Day 3)
1. Create Joi validation schemas
2. Implement validation middleware
3. Test with valid/invalid data
4. Add error formatting

### Phase 6: OpenAI Integration (Day 4-5)
1. Create OpenAI service class
2. Implement recommendation generation
3. Create prompt templates
4. Add retry logic
5. Test with real profiles
6. Implement chat functionality
7. Add memory management

### Phase 7: Controllers & Services (Day 5-6)
1. Create career.service.js
2. Create career.controller.js
3. Implement all business logic
4. Add error handling
5. Test each function

### Phase 8: API Routes (Day 6)
1. Create all 9 API endpoints
2. Apply middleware
3. Test with Postman/REST Client
4. Verify error handling

### Phase 9: Middleware & Security (Day 7)
1. Implement error handler
2. Implement request logger
3. Implement rate limiter
4. Add security headers
5. Configure CORS

### Phase 10: Testing (Day 7-8)
1. Create all test files
2. Test each component
3. Test complete flow
4. Create profile examples
5. Verify AI recommendations

### Phase 11: Documentation (Day 8-9)
1. Write README
2. Write ARCHITECTURE
3. Write SETUP_GUIDE
4. Write API_DOCUMENTATION
5. Add code comments

### Phase 12: Polish & Deploy (Day 9-10)
1. Code cleanup
2. Final testing
3. Performance optimization
4. Prepare for frontend integration
5. Create demo data

---

## 🔍 Testing Scenarios

### Scenario 1: Software Engineering Profile
**Profile Characteristics:**
- Academic: Intermediate, Computer Science, Math+CS+Physics, 3.5-4.0 GPA
- Interests: Technology (5), Engineering (5), Science (4)
- Skills: Programming (5), Problem Solving (5), Logical Thinking (5), Analytical (5)
- Personality: Curious (5), Innovative (5), Independent (5)
- Work: Remote, Flexible, High creativity, Low routine
- Career: Software Engineer role

**Expected Recommendations:**
1. BS Computer Science
2. BS Software Engineering
3. BS Artificial Intelligence

### Scenario 2: Business Administration Profile
**Profile Characteristics:**
- Academic: Intermediate, Commerce, Business+English+Math, 3.0-3.5 GPA
- Interests: Business (5), Social Work (4), Law (4)
- Skills: Leadership (5), Communication (5), Teamwork (5)
- Personality: Extroverted (5), Competitive (4), Empathetic (4)
- Work: Office, Collaborative, Regular hours, Moderate creativity
- Career: Business Manager role

**Expected Recommendations:**
1. BBA (Business Administration)
2. BS Marketing
3. BS Human Resource Management

### Scenario 3: Medical/Healthcare Profile
**Profile Characteristics:**
- Academic: Intermediate, Pre-Medical, Biology+Chemistry+Physics, 3.5-4.0 GPA
- Interests: Healthcare (5), Science (5), Social Work (4)
- Skills: Critical Thinking (5), Problem Solving (5), Empathy (5)
- Personality: Patient (5), Detail-oriented (5), Empathetic (5)
- Work: Hospital/Lab, Collaborative, Fixed schedule, Low creativity
- Career: Researcher role

**Expected Recommendations:**
1. MBBS (Doctor of Medicine)
2. BS Biotechnology
3. BS Pharmacy

---

## 🎯 Quality Checklist

Before considering the system complete, verify:

### Functionality
- [ ] All 44 questions load correctly
- [ ] Profile submission validates all fields
- [ ] Profile saves to database correctly
- [ ] AI generates 3 relevant recommendations
- [ ] Recommendations include all required fields
- [ ] Follow-up chat maintains context
- [ ] Session history persists correctly
- [ ] All 9 API endpoints work
- [ ] Error handling works for all scenarios

### Code Quality
- [ ] No console.log statements (use logger)
- [ ] All functions have proper error handling
- [ ] Code follows clean architecture
- [ ] No code duplication
- [ ] Functions are small and focused
- [ ] Meaningful variable names
- [ ] Proper async/await usage

### Security
- [ ] Input validation on all endpoints
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Helmet security headers
- [ ] No exposed API keys
- [ ] Error messages don't leak sensitive info

### Performance
- [ ] Database queries use indexes
- [ ] Chat uses memory summaries (not full history)
- [ ] Transformer functions are efficient
- [ ] No unnecessary API calls
- [ ] Proper connection pooling

### Documentation
- [ ] All files have header comments
- [ ] Functions have JSDoc comments
- [ ] README is comprehensive
- [ ] API documentation complete
- [ ] Setup guide is clear
- [ ] Architecture is documented

### Testing
- [ ] Question system tests pass
- [ ] Transformation tests pass
- [ ] Validation tests pass
- [ ] All 3 profile examples work
- [ ] API tests work

---

## 🌟 Bonus Features (If Time Permits)

### 1. Admin Dashboard API
- Get statistics (total users, sessions, popular degrees)
- View all profiles (anonymized)
- Question management endpoints

### 2. Email Notifications
- Send recommendations via email
- Session summary emails

### 3. PDF Report Generation
- Generate PDF of recommendations
- Include charts and visualizations

### 4. Advanced Analytics
- Track recommendation accuracy
- Popular career paths
- Token usage analytics
- User engagement metrics

### 5. Multi-language Support
- Urdu language option
- Translate questions and responses

---

## 🎓 Learning Resources

### OpenAI API
- [OpenAI Documentation](https://platform.openai.com/docs)
- [GPT-4 Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)

### Node.js & Express
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Design Patterns](https://nodejs.dev/learn/nodejs-design-patterns)

### MongoDB & Mongoose
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [MongoDB Schema Design](https://www.mongodb.com/docs/manual/data-modeling/)

### Clean Architecture
- [Clean Architecture in Node.js](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://khalilstemmler.com/articles/solid-principles/solid-typescript/)

---

## 💬 Communication Style

When implementing this system:

1. **Start with Architecture:** Understand the complete flow before coding
2. **Build Incrementally:** One feature at a time, test as you go
3. **Ask Questions:** If requirements unclear, ask before implementing
4. **Document As You Code:** Write documentation while building
5. **Test Thoroughly:** Don't move to next feature until current one works
6. **Think About Edge Cases:** What if API fails? What if data is invalid?
7. **Keep It Simple:** Don't over-engineer, start with basics
8. **Follow Patterns:** Maintain consistency across codebase

---

## 🎉 Success Definition

The project is successful when:

1. ✅ A student can complete the 44-question assessment
2. ✅ System generates 3 relevant, contextual degree recommendations
3. ✅ Student can ask follow-up questions and get helpful answers
4. ✅ All data persists correctly in database
5. ✅ System handles errors gracefully
6. ✅ Code is clean, documented, and maintainable
7. ✅ Ready for frontend integration
8. ✅ Impressive for FYP demonstration

---

## 📌 Final Notes

**This is a production-grade system.** Treat it as real-world software that will be used by actual students. Pay attention to:

- **User Experience:** Error messages should be helpful, not technical
- **Performance:** System should respond quickly (< 5 seconds for AI)
- **Reliability:** Handle failures gracefully, implement retries
- **Scalability:** Design for growth (more users, more questions)
- **Maintainability:** Future developers should understand your code
- **Security:** Protect user data, prevent abuse

**Remember:** The goal is not just to make it work, but to make it work **well**. Take pride in your code. Write it as if you're building a startup product.

Good luck! 🚀

---

**Version:** 1.0  
**Last Updated:** March 10, 2026  
**Target Completion:** 10 days  
**Complexity:** Intermediate to Advanced  
**Prerequisites:** Node.js, MongoDB, Express.js, OpenAI API knowledge
