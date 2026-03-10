# Career Counseling Backend - Directory Structure

```
backend/
│
├── src/                                    # Source code directory
│   │
│   ├── config/                            # Configuration files
│   │   ├── database.js                    # MongoDB connection setup
│   │   └── questions.js                   # 22 structured assessment questions
│   │
│   ├── controllers/                       # HTTP request handlers (thin layer)
│   │   └── career.controller.js          # Career counseling endpoints
│   │
│   ├── models/                            # MongoDB/Mongoose schemas
│   │   ├── CareerProfile.js              # Student assessment profile
│   │   ├── CareerSession.js              # Recommendations & chat history
│   │   └── index.js                      # Models export
│   │
│   ├── services/                          # Business logic layer
│   │   ├── career.service.js             # Core career counseling logic
│   │   └── openai.service.js             # OpenAI API integration
│   │
│   ├── utils/                             # Helper utilities
│   │   ├── logger.js                     # Winston logging configuration
│   │   └── transformers.js               # Data transformation functions
│   │
│   ├── validators/                        # Request validation
│   │   └── careerValidator.js            # Joi validation schemas
│   │
│   ├── middleware/                        # Express middleware
│   │   ├── errorHandler.js               # Centralized error handling
│   │   ├── rateLimiter.js                # Rate limiting (3-tier)
│   │   ├── requestLogger.js              # HTTP request logging
│   │   └── index.js                      # Middleware export
│   │
│   ├── routes/                            # API route definitions
│   │   ├── career.routes.js              # Career module routes
│   │   └── index.js                      # Routes aggregator
│   │
│   └── server.js                          # Main application entry point
│
├── logs/                                   # Auto-generated log files
│   ├── combined.log                       # All logs
│   ├── error.log                          # Error logs only
│   ├── exceptions.log                     # Unhandled exceptions
│   └── rejections.log                     # Unhandled promise rejections
│
├── examples/                               # Usage examples and test utilities
│   └── usage-examples.js                  # Complete flow demonstrations
│
├── .env                                    # Environment variables (create from .env.example)
├── .env.example                            # Environment template
├── .gitignore                              # Git ignore rules
├── package.json                            # Dependencies and scripts
├── package-lock.json                       # Locked dependency versions
│
├── README.md                               # Project overview and quick start
├── QUICK_START.md                          # 5-minute setup guide
├── SETUP_GUIDE.md                          # Detailed installation guide
├── API_DOCUMENTATION.md                    # Complete API reference
├── ARCHITECTURE.md                         # System architecture and flows
├── PROJECT_OVERVIEW.md                     # Comprehensive project details
├── DIRECTORY_STRUCTURE.md                  # This file
│
└── postman_collection.json                 # Postman API testing collection
```

---

## 📦 File Count Summary

```
Total Files: 30+
Source Files: 18
Documentation: 7
Configuration: 3
Examples: 2
```

---

## 🗂 Directory Purposes

### `/src/config/`
**Purpose:** Static configuration and settings  
**Files:** Database connection, assessment questions  
**When to modify:** Adding new questions, changing DB settings

### `/src/controllers/`
**Purpose:** HTTP request/response handling  
**Files:** API endpoint handlers  
**Responsibility:** Parse requests, call services, format responses  
**No business logic here!**

### `/src/models/`
**Purpose:** Database schema definitions  
**Files:** Mongoose models  
**Responsibility:** Data structure, validation, instance methods

### `/src/services/`
**Purpose:** Core business logic  
**Files:** Career service, OpenAI service  
**Responsibility:** Orchestrate operations, call models, transform data  
**This is where the magic happens!**

### `/src/utils/`
**Purpose:** Reusable helper functions  
**Files:** Logger, transformers  
**Responsibility:** Common utilities, data transformations

### `/src/validators/`
**Purpose:** Input validation  
**Files:** Joi schemas  
**Responsibility:** Validate and sanitize incoming data

### `/src/middleware/`
**Purpose:** Express middleware  
**Files:** Error handler, rate limiter, logger  
**Responsibility:** Request processing, security, logging

### `/src/routes/`
**Purpose:** API route definitions  
**Files:** Route mappings  
**Responsibility:** Map URLs to controllers, apply middleware

### `/logs/`
**Purpose:** Application logs (auto-generated)  
**Files:** Winston log files  
**Note:** Not committed to git (in .gitignore)

### `/examples/`
**Purpose:** Usage demonstrations  
**Files:** Test scripts, example flows  
**Use for:** Testing, learning, demonstration

---

## 🎯 Key Files Explained

### Core Application Files

#### `server.js` (Entry Point)
- Express app initialization
- Middleware setup
- Route mounting
- Database connection
- Error handling
- Server startup

#### `config/questions.js` (Assessment Engine)
- 22 structured MCQ questions
- 4 categories (academic, interests, skills, preferences)
- Validation helper functions
- Question metadata

#### `services/career.service.js` (Business Logic)
- submitProfile()
- generateRecommendations()
- processChatMessage()
- getSession()
- All core operations

#### `services/openai.service.js` (AI Integration)
- generateRecommendation()
- generateMemorySummary()
- continueCareerChat()
- Retry logic, error handling

#### `models/CareerProfile.js` (Data Schema)
- Student assessment structure
- Validation rules
- Instance methods
- Indexes

#### `models/CareerSession.js` (Session Schema)
- Recommendations storage
- Chat history
- Token tracking
- Session methods

#### `utils/transformers.js` (Data Transformation)
- Answers → Profile
- Profile → AI format
- Profile → Memory summary

#### `validators/careerValidator.js` (Validation)
- Profile submission schema
- Chat message schema
- Request validation middleware

### Documentation Files

#### `README.md`
Quick overview, features, basic setup

#### `QUICK_START.md`
5-minute setup guide for rapid deployment

#### `SETUP_GUIDE.md`
Comprehensive installation, configuration, troubleshooting

#### `API_DOCUMENTATION.md`
Complete API reference with examples

#### `ARCHITECTURE.md`
System design, data flows, architecture diagrams

#### `PROJECT_OVERVIEW.md`
Executive summary, statistics, FYP guide

---

## 🔍 Finding What You Need

### "I want to..."

**...add a new API endpoint**
1. Create handler in `controllers/career.controller.js`
2. Add route in `routes/career.routes.js`
3. Add business logic in `services/career.service.js`

**...modify assessment questions**
- Edit `config/questions.js`

**...change AI prompts**
- Edit `services/openai.service.js`

**...add validation rules**
- Edit `validators/careerValidator.js`

**...change data structure**
- Edit `models/CareerProfile.js` or `models/CareerSession.js`

**...add middleware**
- Create file in `middleware/`
- Export from `middleware/index.js`
- Apply in `server.js`

**...view logs**
- Check `logs/combined.log` or `logs/error.log`

**...test the API**
- Use `postman_collection.json`
- Or run examples in `examples/usage-examples.js`

---

## 📊 Code Organization Metrics

```
Lines of Code Distribution:
- Services:      ~800 lines (23%)
- Controllers:   ~200 lines (6%)
- Models:        ~400 lines (11%)
- Config:        ~600 lines (17%)
- Utils:         ~400 lines (11%)
- Middleware:    ~300 lines (9%)
- Validators:    ~200 lines (6%)
- Routes:        ~100 lines (3%)
- Documentation: ~500 lines (14%)

Total: ~3,500+ lines
```

---

## 🏗 Architecture Pattern

```
Request Flow:
HTTP Request
    ↓
Middleware (logging, validation, rate limiting)
    ↓
Route (URL mapping)
    ↓
Controller (request handling)
    ↓
Service (business logic)
    ↓
Model (database operations) | OpenAI (AI calls)
    ↓
Response
```

---

## 🎨 Design Principles Applied

✅ **Separation of Concerns:** Each layer has single responsibility  
✅ **Dependency Injection:** Services passed to controllers  
✅ **Single Responsibility:** Each file has one clear purpose  
✅ **Open/Closed:** Easy to extend without modifying core  
✅ **DRY:** Common logic in utils, no duplication  

---

## 🚀 Quick Navigation

**Starting the server?** → `src/server.js`  
**Adding API endpoint?** → `src/controllers/` + `src/routes/`  
**Business logic?** → `src/services/`  
**Database schema?** → `src/models/`  
**Configuration?** → `src/config/`  
**Testing?** → `examples/` or Postman  
**Documentation?** → Root directory `.md` files  

---

## 📝 File Naming Conventions

- **Services:** `*.service.js`
- **Controllers:** `*.controller.js`
- **Models:** `PascalCase.js` (e.g., `CareerProfile.js`)
- **Config:** `lowercase.js`
- **Utils:** `lowercase.js`
- **Middleware:** `camelCase.js`
- **Routes:** `*.routes.js`

---

## 🔐 Files NOT to Commit

Listed in `.gitignore`:
- `.env` (sensitive credentials)
- `node_modules/` (dependencies)
- `logs/` (application logs)
- `*.log` (log files)

---

This structure follows industry best practices and makes the codebase:
- ✅ Easy to navigate
- ✅ Scalable for growth
- ✅ Maintainable long-term
- ✅ Perfect for team collaboration
- ✅ FYP demonstration ready

---

**Pro Tip:** Use VS Code's file explorer to visually browse this structure!
