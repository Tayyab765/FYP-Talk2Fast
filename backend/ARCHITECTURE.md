# System Architecture & Flow

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend)                        │
│                   React/Next.js Application                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    MIDDLEWARE LAYER                        │  │
│  │  • CORS & Helmet (Security)                               │  │
│  │  • Request Logging (Morgan + Winston)                     │  │
│  │  • Rate Limiting (Express Rate Limit)                     │  │
│  │  • Request Validation (Joi)                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLER LAYER                        │  │
│  │  • career.controller.js                                    │  │
│  │  • Handles HTTP Requests/Responses                         │  │
│  │  • Input Validation                                        │  │
│  │  • Response Formatting                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    SERVICE LAYER                           │  │
│  │  • career.service.js                                       │  │
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
│  │              │                    │              │           │
│  │ • Recommend  │                    │ • Profile    │           │
│  │ • Chat       │                    │ • Session    │           │
│  │ • Memory     │                    │              │           │
│  └──────────────┘                    └──────────────┘           │
│         │                                     │                  │
└─────────┼─────────────────────────────────────┼──────────────────┘
          │                                     │
          ▼                                     ▼
   ┌─────────────┐                      ┌─────────────┐
   │   OpenAI    │                      │   MongoDB   │
   │   GPT-4     │                      │  Database   │
   └─────────────┘                      └─────────────┘
```

---

## 🔄 Complete Pipeline Flow

### PHASE 1: Assessment Question Retrieval

```
┌─────────┐     GET /career/questions     ┌──────────────┐
│         │ ──────────────────────────────▶│              │
│ Client  │                                 │   Backend   │
│         │◀────────────────────────────── │              │
└─────────┘   Return questions.js config   └──────────────┘
```

**Data Flow:**
1. Client requests questions
2. Backend returns predefined MCQ structure from `questions.js`
3. Client renders form

---

### PHASE 2: Profile Submission

```
┌─────────┐    POST /career/profile      ┌──────────────┐
│         │    { userId, answers }       │              │
│ Client  │ ──────────────────────────▶  │  Controller  │
│         │                               │              │
└─────────┘                               └──────┬───────┘
                                                 │
                    ┌────────────────────────────┘
                    ▼
           ┌─────────────────┐
           │  Joi Validator  │  Validate request
           └────────┬────────┘
                    │ ✓ Valid
                    ▼
           ┌─────────────────┐
           │  Transformers   │  Normalize answers
           │  • Raw answers  │  to internal format
           │    ▼            │
           │  Normalized     │
           │  Profile JSON   │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  CareerProfile  │  Save to MongoDB
           │     Model       │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Response       │  Return profileId
           └─────────────────┘
```

**Data Transformation:**

**Input (Raw Answers):**
```json
{
  "academic_level": "intermediate",
  "programming_skill": 4,
  "primary_interests": ["technology", "business"]
}
```

**Output (Normalized Profile):**
```json
{
  "academic_background": {
    "current_education_level": "intermediate"
  },
  "skills": {
    "technical_skills": {
      "programming": 4
    }
  },
  "interests": {
    "primary_interests": ["technology", "business"]
  }
}
```

---

### PHASE 3: AI Recommendation Generation

```
┌─────────┐    POST /career/recommend    ┌──────────────┐
│         │    { userId }                │              │
│ Client  │ ─────────────────────────▶   │  Controller  │
│         │                               │              │
└─────────┘                               └──────┬───────┘
                                                 │
                    ┌────────────────────────────┘
                    ▼
           ┌─────────────────┐
           │ Career Service  │
           │                 │
           │ 1. Fetch Profile│────▶ MongoDB
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Transformers   │  Transform to
           │  • Normalized   │  AI-friendly
           │    Profile      │  descriptive
           │    ▼            │  format
           │  AI Profile     │
           │  (Descriptive)  │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────────────────────────┐
           │       OpenAI Service                │
           │                                     │
           │  Build Prompt:                      │
           │  ┌──────────────────────────────┐   │
           │  │ System: Expert Counselor     │   │
           │  │ Instructions + JSON Schema   │   │
           │  └──────────────────────────────┘   │
           │  ┌──────────────────────────────┐   │
           │  │ User: Descriptive Profile    │   │
           │  └──────────────────────────────┘   │
           │                                     │
           │            ▼                        │
           │  ┌──────────────────────────────┐   │
           │  │  Call OpenAI GPT-4           │   │
           │  │  with JSON mode              │   │
           │  └──────────────────────────────┘   │
           │            ▼                        │
           │  ┌──────────────────────────────┐   │
           │  │  Parse & Validate JSON       │   │
           │  │  Response                    │   │
           │  └──────────────────────────────┘   │
           └────────────┬────────────────────────┘
                        │
                        ▼
           ┌─────────────────────────────┐
           │  Generate Memory Summary    │
           │  (Compressed for future     │
           │   token optimization)       │
           └────────────┬────────────────┘
                        │
                        ▼
           ┌─────────────────────────────┐
           │  Create CareerSession       │
           │  • Profile Snapshot         │
           │  • Recommendations JSON     │
           │  • Memory Summary           │
           │  • Token Usage              │
           │  • Empty Chat History       │
           └────────────┬────────────────┘
                        │
                        ▼
           ┌─────────────────────────────┐
           │  Save to MongoDB            │
           │  Return Session ID          │
           └─────────────────────────────┘
```

**AI Prompt Structure:**

```
SYSTEM: You are expert career counselor...
Return STRICTLY VALID JSON:
{
  "top_3_degrees": [...],
  "overall_assessment": "...",
  "next_steps": [...]
}

USER: Profile data:
{
  "student_background": {
    "education_level": "Intermediate/A-Levels",
    "academic_performance": "Excellent (85%+ grades)"
  },
  "skills_assessment": {
    "technical_skills": {
      "programming": { "level": 4, "description": "Good" }
    }
  }
}
```

**AI Response:**
```json
{
  "top_3_degrees": [
    {
      "degree_name": "BS Computer Science",
      "match_percentage": 92,
      "reasoning": "...",
      "career_paths": [...],
      "career_outlook": {...},
      "recommended_universities": [...],
      "skill_gap_analysis": {...}
    }
  ]
}
```

---

### PHASE 4: Memory Summary Generation

```
┌──────────────────────┐
│  Profile + Top Rec   │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────────┐
│  OpenAI Call (Short)        │
│  "Create 2-3 sentence       │
│   summary for memory"       │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Memory Summary             │
│  "Student with strong       │
│   programming skills.       │
│   Top: BS CS (92%)"         │
└─────────────────────────────┘
```

**Purpose:**
- Reduce token usage in chat
- Maintain context without full profile
- Quick reference for AI

---

### PHASE 5: Follow-Up Chat Flow

```
┌─────────┐   POST /career/chat/:sessionId  ┌──────────────┐
│         │   { message: "..." }            │              │
│ Client  │ ──────────────────────────────▶ │  Controller  │
└─────────┘                                  └──────┬───────┘
                                                    │
                       ┌────────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Career Service  │
              │                 │
              │ 1. Get Session  │────▶ MongoDB
              │ 2. Add user msg │
              └────────┬────────┘
                       │
                       ▼
              ┌────────────────────────────┐
              │  Build Context Messages    │
              │                            │
              │  [                         │
              │    {                       │
              │      role: "system",       │
              │      content: "You are..." │
              │    },                      │
              │    {                       │
              │      role: "system",       │
              │      content: "MEMORY:..." │
              │    },                      │
              │    {                       │
              │      role: "system",       │
              │      content: "TOP REC:..."│
              │    },                      │
              │    ...last 10 messages,    │
              │    {                       │
              │      role: "user",         │
              │      content: "new msg"    │
              │    }                       │
              │  ]                         │
              └────────┬───────────────────┘
                       │
                       ▼
              ┌────────────────────────────┐
              │   OpenAI Chat Completion   │
              │   • Contextual response    │
              │   • Natural conversation   │
              └────────┬───────────────────┘
                       │
                       ▼
              ┌────────────────────────────┐
              │  Update Session            │
              │  • Add assistant message   │
              │  • Update token usage      │
              │  • Calculate cost          │
              │  • Update lastActivityAt   │
              └────────┬───────────────────┘
                       │
                       ▼
              ┌────────────────────────────┐
              │  Save & Return Response    │
              └────────────────────────────┘
```

**Chat Context Window:**

```
Total Tokens: ~3000-4000

System (Instructions): ~500 tokens
System (Memory): ~100 tokens
System (Top Rec Summary): ~200 tokens
Recent Chat History (10 msgs): ~1500 tokens
New User Message: ~100 tokens
AI Response: ~800 tokens
─────────────────────────────────
Total: ~3200 tokens ≈ $0.04
```

---

## 📊 Data Models

### CareerProfile Schema

```javascript
{
  userId: ObjectId,
  academic_background: {
    current_education_level: String,
    field_of_study: String,
    academic_performance: String,
    favorite_subjects: [String],
    challenging_subjects: [String]
  },
  interests: {
    primary_interests: [String],
    hobbies: [String]
  },
  skills: {
    technical_skills: {
      programming: Number (1-5),
      mathematics: Number (1-5),
      analytical_thinking: Number (1-5),
      problem_solving: Number (1-5)
    },
    soft_skills: {
      communication: Number (1-5),
      leadership: Number (1-5),
      teamwork: Number (1-5),
      creativity: Number (1-5)
    },
    learning_preference: String
  },
  preferences: {
    work_environment: String,
    career_priority: String,
    preferred_location: String,
    risk_tolerance: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### CareerSession Schema

```javascript
{
  userId: ObjectId,
  profileId: ObjectId,
  profileSnapshot: Object,
  recommendationJSON: {
    top_3_degrees: [{
      degree_name: String,
      degree_level: String,
      match_percentage: Number,
      reasoning: String,
      career_paths: [String],
      career_outlook: Object,
      recommended_universities: [Object],
      skill_gap_analysis: Object
    }],
    overall_assessment: String,
    next_steps: [String]
  },
  memorySummary: String,
  chatHistory: [{
    role: String,
    content: String,
    timestamp: Date,
    tokenCount: Number
  }],
  tokenUsage: {
    total_tokens: Number,
    prompt_tokens: Number,
    completion_tokens: Number,
    estimated_cost: Number
  },
  status: String,
  expiresAt: Date,
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Security Considerations

1. **Helmet**: Sets secure HTTP headers
2. **CORS**: Configurable origin restrictions
3. **Rate Limiting**: Prevents abuse
4. **Input Validation**: Joi schema validation
5. **Error Sanitization**: No stack traces in production
6. **Logging**: All requests and errors logged

---

## 🚀 Performance Optimizations

1. **Token Optimization**:
   - Memory summaries reduce context size
   - Only last 10 messages in chat context
   - Compressed profile snapshots

2. **Database Indexing**:
   - userId indexed for fast profile lookup
   - Session status indexed for queries
   - TTL index for automatic session expiry

3. **Caching** (Future):
   - Cache frequently accessed profiles
   - Cache question configuration

---

## 📈 Scalability

**Current Architecture Supports:**
- Horizontal scaling (stateless services)
- MongoDB replica sets
- Load balancing ready
- Microservices migration path

**Future Enhancements:**
- Redis for session caching
- Message queue for AI processing
- Vector database for RAG
- Adaptive questioning engine

---

## 🧪 Testing Strategy

1. **Unit Tests**: Service logic, transformers
2. **Integration Tests**: API endpoints
3. **AI Tests**: Prompt validation, response parsing
4. **Load Tests**: Rate limiting, concurrent users

---

This architecture follows SOLID principles, clean code practices, and is production-ready for FYP demonstration and real-world deployment.
