# Development Environment Documentation

## Overview

The Talk2Fast Admission Assistant is a full-stack application designed to provide AI-powered assistance, mock testing, and career counseling to students. This document outlines the complete development environment setup, architecture, and key components.

---

## 1. Development Environment Setup

### Frontend

**Technology Stack:**
- **Runtime**: Node.js 18+
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.1.0
- **Routing**: React Router 6.22.0
- **UI/Charts**: Recharts 3.8.1
- **CSS**: Native CSS with variables

**Key Dependencies:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "recharts": "^3.8.1",
  "vite": "^5.1.0"
}
```

**Package Manager**: npm

### Backend

**Technology Stack:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Server Architecture**: Microservices with API Gateway
- **Package Manager**: npm with workspaces

**Core Backend Dependencies:**
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.20.0",
  "mongodb": "^6.21.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "express-validator": "^7.2.1",
  "joi": "^18.0.2",
  "uuid": "^13.0.0"
}
```

**AI & External Services:**
- OpenAI SDK: `^6.7.0`
- Tesseract.js: `^6.0.1` (OCR for PDF processing)
- Supabase JS: `^2.8.0` (Authentication)
- Sharp: `^0.34.5` (Image processing)

### Database

**MongoDB**
- **Local Instance**: `mongodb://localhost:27017/talk2fast`
  - Used by: Auth Service, Chatbot Service, Career Counseling Service
  - Data: Users, conversations, profiles, sessions

- **MongoDB Atlas (Cloud)**: Cloud cluster for Mock Test Service
  - Database: `hamza_mocktest`
  - Reason: Shared test data across team members

**Supabase**
- **Purpose**: User authentication and session management
- **Features**: JWT tokens, OAuth support, password management
- **URL**: Configured via `SUPABASE_URL` environment variable

### AI Models & Services

**Ollama Integration**
- **Model**: Qwen2.5:3b (default)
- **Purpose**: Local LLM for RAG (Retrieval-Augmented Generation)
- **Port**: 8000
- **Configuration**: Adjustable temperature (`RAG_LLM_TEMP`)

**OpenAI Integration**
- **Purpose**: Alternative AI responses for chatbot
- **SDK**: Official OpenAI library

**Tesseract.js**
- **Purpose**: OCR for document/PDF text extraction
- **Use Case**: Processing uploaded documents

### Version Control

- **System**: Git
- **Repository**: GitHub (Tayyab765/FYP)
- **Current Branch**: master
- **Default Deployment Branch**: master

### Testing Tools

**Testing Framework**: Jest
- **Execution**: Node with experimental VM modules support
- **Scripts Available**:
  ```bash
  npm run test              # Run all tests with open handles detection
  npm run test:watch       # Watch mode for continuous testing
  npm run test:coverage    # Generate coverage report
  ```

**API Testing**
- **Tool**: REST Client / HTTP Test Files
- **Test Files**:
  - `backend/tests/microservices.http` - Complete microservices API tests
  - `backend/tests/career-stats.http` - Career stats service tests
  - `backend/tests/career-counselling-test.http` - Career counseling tests

### API Testing

**REST Client Tools**
- VSCode REST Client extension compatible
- HTTP test files for manual API verification
- Mock test endpoints available in test suite

**Postman Compatible**
- API endpoints documented in `ENDPOINT_MAPPING.md`
- Environment variables can be configured

### Package Managers

**Frontend**
- **Manager**: npm
- **Node Modules**: `frontend/node_modules`
- **Install Command**: `npm install`

**Backend**
- **Manager**: npm with workspaces
- **Structure**: Monorepo with gateway and services
- **Install Command**: `npm install:all` or individual service installs
- **Services**:
  - Gateway Service
  - Auth Service
  - Chatbot Service
  - Career Counseling Service
  - Career Stats Service
  - Mock Test Service

### Deployment (Development)

**Docker Containerization**
- **Compose File**: `docker-compose.yml`
- **Services Containerized**:
  - MongoDB database
  - API Gateway
  - Auth Service
  - Chatbot Service (RAG)
  - Career Counseling Service
  - Career Stats Service
  - Mock Test Service

**Environment Configuration**
- `.env` file required at project root
- `.env.example` available as template
- Key variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MONGODB_URI`
  - `MOCKTEST_MONGODB_URI`
  - `RAG_API_URL`
  - `FRONTEND_URL`

**Local Development**
- Node.js direct execution
- Hot-reload with Nodemon
- Port mapping: Gateway (5000), Auth (5001), Chatbot (5002), etc.

---

## 2. Backend Architecture Implementation

### Microservices Architecture

The backend has been migrated from monolithic to microservices architecture for better scalability and independent development.

```
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (Port 5000)                     │
│              Routes all client requests                       │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┘
       │          │          │          │          │
    ┌──▼──┐  ┌───▼──┐  ┌────▼───┐  ┌──▼──┐  ┌────▼──┐
    │Auth │  │Chat  │  │Career  │  │Mock │  │Career │
    │5001 │  │5002  │  │5003    │  │5005 │  │Stats  │
    └──┬──┘  └───┬──┘  └────┬───┘  └──┬──┘  │5004   │
       │         │          │         │     └───┬───┘
       └────────┬┴──────────┬┴────────┘         │
                │           │                  │
         ┌──────▼─────────────▼─────────┐      │
         │  MongoDB Local (27017)       │      │
         │  Database: talk2fast         │      │
         └──────────────────────────────┘      │
                                               │
         ┌─────────────────────────────────────▼─┐
         │  MongoDB Atlas (Cloud)                │
         │  Database: hamza_mocktest             │
         └───────────────────────────────────────┘
```

### Key Backend Features

#### RESTful API Architecture
- **Endpoints**: Organized by service and feature
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- **Request Validation**: Express-validator + Joi schemas
- **Error Handling**: Standardized error responses

#### Authentication & Authorization
- **Supabase Integration**:
  - User signup/login with email verification
  - OAuth support (Google, GitHub, etc.)
  - JWT token management
  - Session management
  
- **Token System**:
  - Access tokens for API requests
  - Refresh tokens for session extension
  - Token verification middleware
  - Guest session support

#### Modular Architecture
- **Controllers**: Request handling and response formatting
- **Services**: Business logic and database operations
- **Models**: Database schema definitions using Mongoose
- **Middleware**: Cross-cutting concerns (auth, logging, validation)
- **Utils**: Helper functions and constants

#### Middleware Pipeline
- **CORS Middleware**: Cross-origin request handling
- **Body Parser**: JSON/URL-encoded request parsing
- **Authentication Middleware**: JWT verification and session validation
- **Validation Middleware**: Request schema validation
- **Error Handler**: Centralized error handling
- **Logging Middleware**: Request/response logging

#### MongoDB Schema Modeling
- **Mongoose ODM**: Object-document mapping
- **Schema Definition**: Strong typing for collections
- **Validation Rules**: Field-level validation
- **Indexes**: Performance optimization
- **Hooks**: Pre/post save operations

### Service Descriptions

#### 1. API Gateway Service (Port 5000)
- **Purpose**: Single entry point for all client requests
- **Responsibilities**:
  - Route requests to appropriate microservices
  - Serve static frontend files
  - Load balancing and service discovery
  - CORS and security headers handling

#### 2. Auth Service (Port 5001)
- **Purpose**: User authentication and profile management
- **Key Endpoints**:
  - `POST /api/auth/signup` - User registration
  - `POST /api/auth/login` - User login
  - `GET /api/auth/profile` - Retrieve user profile
  - `POST /api/auth/guest-session` - Create guest sessions
  - `POST /api/auth/logout` - User logout
  - `POST /api/auth/refresh-token` - Token refresh
  - `POST /api/auth/forgot-password` - Password reset

#### 3. Chatbot Service (Port 5002)
- **Purpose**: Conversational AI powered by RAG
- **Key Endpoints**:
  - `POST /api/chatbot/message` - Send message and get AI response
  - `GET /api/chatbot/history/:id` - Retrieve conversation history
  - `DELETE /api/chatbot/history/:id` - Delete conversation
  - `POST /api/chatbot/context/upload` - Upload documents for context
- **RAG Service Integration** (Port 8000):
  - Ollama LLM backend
  - Document retrieval and embedding
  - Context-aware responses

#### 4. Career Counseling Service (Port 5003)
- **Purpose**: Career guidance and recommendations
- **Key Endpoints**:
  - `GET /api/career/profile` - Get user career profile
  - `POST /api/career/update` - Update career preferences
  - `GET /api/career/recommendations` - Get career suggestions
  - `POST /api/career/upload-resume` - Process resume with OCR

#### 5. Career Stats Service (Port 5004)
- **Purpose**: Analytics and statistics tracking
- **Key Endpoints**:
  - `GET /api/stats/overview` - Dashboard overview
  - `GET /api/stats/performance` - Performance metrics
  - `GET /api/stats/progress` - Progress tracking

#### 6. Mock Test Service (Port 5005)
- **Purpose**: Mock test management and scoring
- **Key Endpoints**:
  - `GET /api/mocktest/tests` - List available tests
  - `POST /api/mocktest/attempt` - Create test attempt
  - `POST /api/mocktest/submit` - Submit test and calculate score
  - `GET /api/mocktest/results` - Retrieve past results
  - `GET /api/mocktest/questions/:testId` - Get test questions

### Backend Folder Structure

```
backend/
├── server.js                      # Monolithic server (legacy)
├── package.json                   # Root dependencies & workspaces
├── docker-compose.yml             # Docker services configuration
├── .env.example                   # Environment template
├── gateway-service/               # API Gateway
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── src/
│       ├── app.js                # Express app setup
│       └── utils/                # Gateway utilities
├── services/
│   ├── auth-service/             # Authentication Service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── server.js
│   │   └── src/
│   │       ├── app.js
│   │       ├── controllers/      # Auth controllers
│   │       ├── models/           # User schemas
│   │       ├── middleware/       # Auth middleware
│   │       ├── routes/           # Auth routes
│   │       └── services/         # Auth logic
│   │
│   ├── chatbot-service/          # Chatbot Service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── server.js
│   │   ├── FYP/                  # RAG service
│   │   │   ├── Dockerfile
│   │   │   ├── app.py
│   │   │   └── requirements.txt
│   │   └── src/
│   │       ├── app.js
│   │       ├── controllers/
│   │       ├── models/
│   │       ├── middleware/
│   │       └── services/
│   │
│   ├── career-counselling/       # Career Counseling Service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── server.js
│   │   └── src/
│   │       ├── app.js
│   │       ├── controllers/
│   │       ├── models/
│   │       └── routes/
│   │
│   ├── career-stats-service/     # Career Stats Service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── server.js
│   │   └── src/
│   │
│   └── mock-test-service/        # Mock Test Service
│       ├── Dockerfile
│       ├── package.json
│       ├── server.js
│       └── src/
│           ├── controllers/
│           ├── models/
│           └── routes/
│
├── shared/
│   └── data/
│       └── payscale/             # Shared data resources
│
├── tests/
│   ├── microservices.http        # API test suite
│   ├── career-stats.http
│   └── career-counselling-test.http
│
└── Documentation/
    ├── README.md
    ├── QUICKSTART.md
    ├── MICROSERVICES.md
    ├── DATABASE_SETUP.md
    ├── ENDPOINT_MAPPING.md
    └── FEATURE_VERIFICATION.md
```

---

## 3. Frontend Implementation

### Frontend Technology Stack

**Core Framework**
- React 18.2.0 - UI library
- React Router 6.22.0 - Client-side routing
- Vite 5.1.0 - Build tool and dev server
- JavaScript/JSX - Component development

**UI Components & Data Visualization**
- Recharts 3.8.1 - Charts and analytics visualization
- CSS Variables - Theming and styling

**Development Tools**
- Vite React Plugin - Fast HMR
- ES modules - Modern JavaScript bundling

### Frontend Highlights

#### Component-Based Architecture
- **Reusable Components**: Header, Footer, Sidebar, Navigation
- **Layout Components**: PublicLayout, DashboardLayout
- **Feature Components**: ChatAssistant, MockTest, Dashboard
- **Shared Components**: ErrorBoundary, Notification

#### Authentication Context
- **Global Auth State**: AuthContext.jsx manages user sessions
- **Token Management**: Access and refresh token handling
- **Guest Sessions**: Support for unauthenticated users
- **Protected Routes**: Route guards for authenticated pages

#### API Integration
- **Centralized HTTP Client**: `api/http.js`
- **Service Modules**:
  - `auth.js` - Authentication API calls
  - `career.js` - Career counseling endpoints
  - `chat.js` - Chatbot service endpoints
  - `mockTestApi.js` - Mock test endpoints
  - `groq.js` - Alternative AI service (if applicable)

#### State Management
- **Context API**: AuthContext, NotificationContext, TestContext
- **Local Component State**: React hooks (useState, useEffect)
- **API State**: Loading, error, and data states

#### Pages & Routes
- **Landing Page** (`/`) - Public home page
- **Login** (`/login`) - User login form
- **Signup** (`/signup`) - User registration
- **Dashboard** (`/dashboard`) - Main dashboard
- **Chat Assistant** - AI-powered chat interface
- **Mock Tests** - Test taking interface
- **Career Recommendations** - Career counseling

#### Styling Approach
- **CSS Variables**: Theme colors and spacing
- **Modular CSS**: Component-specific stylesheets
- **No UI Library**: Native CSS for full control
- **Responsive Design**: Mobile and desktop support

#### Error Handling
- **Error Boundary**: Catches React errors
- **Notification System**: User feedback for actions
- **HTTP Error Handling**: Graceful error display

### Frontend Folder Structure

```
frontend/
├── index.html                     # HTML entry point
├── vite.config.js                # Vite configuration
├── package.json
├── README.md
│
├── public/                        # Static assets
│   ├── images/
│   └── icons/
│
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root component
    ├── index.css                 # Global styles
    │
    ├── api/                      # API integration layer
    │   ├── http.js              # Axios/fetch client
    │   ├── auth.js              # Auth endpoints
    │   ├── career.js            # Career endpoints
    │   ├── chat.js              # Chat endpoints
    │   ├── mockTestApi.js       # Mock test endpoints
    │   └── groq.js              # AI service endpoints
    │
    ├── components/               # Reusable UI components
    │   ├── Header.jsx
    │   ├── Header.css
    │   ├── Footer.jsx
    │   ├── Footer.css
    │   ├── Sidebar.jsx
    │   ├── Sidebar.css
    │   ├── Notification.jsx
    │   ├── Notification.css
    │   ├── DashboardHeader.jsx
    │   ├── DashboardHeader.css
    │   ├── ErrorBoundary.jsx
    │   └── MockTest/
    │       └── [mock test components]
    │
    ├── config/                   # Configuration
    │   └── api.js               # API base URLs
    │
    ├── context/                  # Context API providers
    │   ├── AuthContext.jsx      # Authentication state
    │   ├── NotificationContext.jsx # Notifications
    │   └── TestContext.jsx      # Test state
    │
    ├── layouts/                  # Page layouts
    │   ├── PublicLayout.jsx     # For public pages
    │   ├── PublicLayout.css
    │   ├── DashboardLayout.jsx  # For authenticated pages
    │   └── DashboardLayout.css
    │
    ├── pages/                    # Route pages
    │   ├── Landing.jsx
    │   ├── Landing.css
    │   ├── Login.jsx
    │   ├── Login.css
    │   ├── Signup.jsx
    │   ├── Signup.css
    │   ├── Dashboard.jsx
    │   ├── Dashboard.css
    │   ├── ChatAssistant.jsx
    │   ├── ChatAssistant.css
    │   └── [other pages]
    │
    └── utils/                    # Utility functions
        ├── validators.js        # Form validation
        ├── helpers.js           # Helper functions
        └── constants.js         # Constants
```

---

## 4. Database Architecture

### MongoDB Collections

**talk2fast (Local)**
```
├── users
│   ├── _id (ObjectId)
│   ├── email (String)
│   ├── password (Hashed)
│   ├── fullName (String)
│   ├── createdAt (Date)
│   └── updatedAt (Date)
│
├── guestsessions
│   ├── _id (ObjectId)
│   ├── sessionId (String)
│   ├── createdAt (Date)
│   └── expiresAt (Date)
│
├── conversations
│   ├── _id (ObjectId)
│   ├── userId (ObjectId)
│   ├── title (String)
│   ├── messages (Array)
│   ├── createdAt (Date)
│   └── updatedAt (Date)
│
└── careerprofiles
    ├── _id (ObjectId)
    ├── userId (ObjectId)
    ├── skills (Array)
    ├── preferences (Object)
    └── updatedAt (Date)
```

**hamza_mocktest (Atlas Cloud)**
```
├── mocktests
│   ├── _id (ObjectId)
│   ├── title (String)
│   ├── duration (Number)
│   ├── totalQuestions (Number)
│   └── createdAt (Date)
│
├── questions
│   ├── _id (ObjectId)
│   ├── testId (ObjectId)
│   ├── questionText (String)
│   ├── options (Array)
│   ├── correctAnswer (String)
│   └── difficulty (String)
│
└── testattempts
    ├── _id (ObjectId)
    ├── userId (ObjectId)
    ├── testId (ObjectId)
    ├── answers (Object)
    ├── score (Number)
    └── completedAt (Date)
```

### Database Connection Strategy

| Service | Database | Location | Connection String |
|---------|----------|----------|-------------------|
| **auth-service** | talk2fast | Local | `mongodb://localhost:27017/talk2fast` |
| **chatbot-service** | talk2fast | Local | `mongodb://localhost:27017/talk2fast` |
| **career-counselling** | talk2fast | Local | `mongodb://localhost:27017/talk2fast` |
| **mock-test-service** | hamza_mocktest | Atlas (Cloud) | `mongodb+srv://[user]:[pass]@cluster.mongodb.net/hamza_mocktest` |

---

## 5. Development Workflow

### Getting Started

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access at: `http://localhost:5173`

#### Backend Setup (Microservices)
```bash
cd backend
npm install:all
npm run dev
```
Services start on ports: 5000-5005

#### Using Docker
```bash
cd backend
docker-compose up -d
```

### Common Commands

**Frontend**
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
```

**Backend**
```bash
npm run dev           # Start all microservices
npm run start         # Start in production mode
npm run test          # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

**Individual Services**
```bash
npm run dev:gateway   # Gateway service
npm run dev:auth      # Auth service
npm run dev:chatbot   # Chatbot service
npm run dev:career    # Career service
npm run dev:mocktest  # Mock test service
```

### Environment Configuration

Create `.env` file in backend root:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/talk2fast
MOCKTEST_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hamza_mocktest

# Frontend
FRONTEND_URL=http://localhost:5173

# RAG Service
RAG_API_URL=http://localhost:8000
RAG_USE_LLM=true
RAG_LLM_MODEL=qwen2.5:3b
RAG_LLM_TEMP=0.2
```

---

## 6. Testing Strategy

### Unit Testing
- Jest framework with ES modules support
- Test files: `*.test.js` or `*.spec.js`
- Coverage tracking available

### API Testing
- REST Client HTTP test files
- Manual endpoint verification
- Environment-based testing

### Integration Testing
- Microservice communication verification
- Database operation testing
- End-to-end flows

---

## 7. Development Best Practices

### Code Organization
- Service-oriented folder structure
- Clear separation of concerns
- Reusable components and utilities

### Error Handling
- Try-catch blocks in async operations
- Centralized error middleware
- User-friendly error messages

### Security
- JWT token verification
- Input validation and sanitization
- CORS configuration
- Environment variable protection

### Performance
- Database indexing
- API caching strategies
- Frontend code splitting
- Image optimization with Sharp

---

## Quick Reference Links

- **Backend Docs**: `backend/README.md`, `backend/QUICKSTART.md`
- **Microservices Guide**: `backend/MICROSERVICES.md`
- **Database Setup**: `backend/DATABASE_SETUP.md`
- **API Endpoints**: `backend/ENDPOINT_MAPPING.md`
- **Frontend Setup**: `frontend/README.md`
- **Testing APIs**: `backend/tests/microservices.http`

---

## Support & Resources

For detailed information, refer to project documentation files in the root and backend directories. Each service contains its own README with specific setup instructions.

