# Talk2Fast / Talk2FAST Project Documentation

## 1. System Overview

Talk2Fast is a student-focused admissions and guidance platform built as a React frontend with a Node.js backend ecosystem. The system combines authentication, AI chat support, career counselling, salary/payscale browsing, and mock test practice in one product.

The project is organized around a microservices-first backend architecture with a gateway service in front of specialized services. The frontend consumes the gateway APIs and presents the experience through public pages and authenticated dashboard modules.

### Core Goals
- Help students create accounts and sign in securely.
- Provide AI-assisted chat for general support and admissions guidance.
- Deliver career counselling through questionnaires, AI recommendations, and follow-up chat.
- Offer mock tests with section-based timed attempts, answer review, and analytics.
- Show salary/payscale information for career exploration.

### High-Level Stack
- **Frontend:** React 18, Vite, React Router, Recharts.
- **Backend:** Node.js, Express, MongoDB, Supabase, HTTP microservices.
- **AI / External Services:** Ollama for career recommendations, external RAG API for chatbot responses.
- **Testing:** Jest, Vitest, Supertest, `.http` API collections, utility scripts.

## 2. Architecture

### 2.1 Current Architecture
The current backend is split into the following services:

- **API Gateway** on `5000`
- **Auth Service** on `5001`
- **Chatbot Service** on `5002`
- **Career Counselling Service** on `5003`
- **Career Stats Service** on `5004`
- **Mock Test Service** on `5005`

The frontend runs on Vite and proxies `/api` requests to the gateway during development.

### 2.2 Request Flow
1. The browser sends requests to the React app.
2. The frontend calls the gateway at `/api/...`.
3. The gateway forwards requests to the appropriate service.
4. Each service handles validation, business logic, and persistence.
5. MongoDB stores user, session, recommendation, and test data.
6. Supabase supports authentication workflows where required.

### 2.3 Service Responsibilities
#### API Gateway
- Single entry point for client traffic.
- Proxies auth, chatbot, career, career stats, and mock test routes.
- Centralizes routing and service availability handling.

#### Auth Service
- Signup, login, logout, profile fetch, password reset.
- Guest session creation and verification.
- Supabase-backed identity handling with MongoDB persistence.

#### Chatbot Service
- Accepts user or guest chat messages.
- Retrieves conversation history.
- Clears conversation history.
- Calls an external RAG API to generate AI responses.

#### Career Counselling Service
- Serves career assessment questions.
- Stores normalized career profiles.
- Generates AI recommendations using local Ollama.
- Supports counselling follow-up chat and active session retrieval.

#### Career Stats Service
- Loads salary data from the shared payscale dataset.
- Returns career listings, search results, and salary statistics.

#### Mock Test Service
- Manages test templates, attempts, results, analytics, and review flows.
- Supports both authenticated users and guests.
- Enforces validation, ownership checks, and rate limits.

## 3. Design Models

### 3.1 System Design Model
The project uses a service-oriented design model:
- **Presentation layer:** React UI pages, layouts, and reusable components.
- **API layer:** Gateway routes and service-specific HTTP endpoints.
- **Domain layer:** service controllers, validators, and business rules.
- **Persistence layer:** MongoDB collections and shared salary JSON dataset.

### 3.2 UI Design Model
The frontend uses two primary layout shells:
- **Public layout** for landing, login, and signup pages.
- **Dashboard layout** for authenticated modules.

The UI also uses:
- Context-driven state for auth and mock test flows.
- Component-based rendering for chat, navigation, timer, answer review, and dashboards.
- Error boundaries for safer dashboard rendering.

### 3.3 Backend Design Model
The backend follows a layered Express pattern:
- **Routes** define HTTP endpoints.
- **Controllers** orchestrate request handling.
- **Services** contain business logic and AI/data integration.
- **Models** define MongoDB schema structure.
- **Middlewares** enforce auth, rate limiting, validation, and ownership.

### 3.4 Interaction Design Model
- Guest and authenticated sessions are both supported in chat and mock tests.
- The mock test experience is sectional and timed.
- Career counselling is iterative: questionnaire → profile → recommendation → follow-up chat.
- Salary exploration is read-only and dataset-backed.

## 4. Data Design

### 4.1 Main Data Stores
- **MongoDB:** primary operational store for users, sessions, profiles, recommendations, conversations, tests, attempts, and analytics.
- **Shared JSON dataset:** career salary data in `backend/shared/data/payscale/pakistan_job_salaries.json`.
- **Supabase:** authentication and identity operations.

### 4.2 Core MongoDB Collections / Models
#### Auth / Identity
- **GuestSession**
  - `guestId`, `createdAt`, `lastActive`, `expireAt`
  - TTL expiry supports temporary guest usage.

#### Career Counselling
- **CareerProfile**
  - `userId`
  - Academic background, interests, skills, personality, work style, and career inclination.
  - Stores normalized questionnaire output for AI recommendation generation.
- **CareerSession**
  - `userId`, `profileId`, `profileSnapshot`
  - `recommendationJSON`, `memorySummary`, `chatHistory`, `tokenUsage`
  - Tracks active counselling sessions and long-term recommendation history.

#### Mock Tests
- **MockTest**
  - `title`, `description`, `difficulty`, `sections`, `totalQuestions`, `totalDuration`, `isActive`
- **Question**
  - `testId`, `section`, `questionText`, `options`, `correctAnswer`, `topic`, `difficulty`, `order`
- **TestAttempt**
  - `userId`, `userType`, `testId`, `testDifficulty`, `currentSection`, `status`
  - `answers`, `markedForReview`, `questionOrder`, `sectionTimestamps`, `score`
- **Analytics**
  - `userId`, `userType`, `totalAttempts`, `averageScore`, `highestScore`, `lowestScore`
  - `sectionStats`, `topicStats`, `scoreTrend`

#### Chat / Conversation
- Chat history is stored in MongoDB through the chatbot service.
- Guest and authenticated flows are separated through bearer token or `x-guest-id`.

### 4.3 Data Characteristics
- MongoDB schemas use indexes for lookup speed and query efficiency.
- Some collections use TTL expiry for automatic cleanup.
- Mock test entities enforce strong schema validation for section structure and scoring.
- Career data uses nested objects to preserve questionnaire semantics.

## 5. Domain Model

### 5.1 Main Actors
- **Student / User:** signs in, chats, takes tests, fills career profile, views recommendations.
- **Guest User:** accesses limited chat and mock test flows without a full account.
- **Admin / Content Manager:** can create or update tests and maintain content.
- **AI Services:** Ollama and external RAG endpoints generate responses and recommendations.

### 5.2 Core Domain Concepts
- **Account:** identity, profile, session state.
- **Conversation:** chat messages and history.
- **Career Profile:** structured self-assessment.
- **Recommendation Session:** AI-generated degree guidance with memory summary.
- **Mock Test Attempt:** active or completed timed exam session.
- **Analytics Profile:** aggregate performance statistics.
- **Salary Record:** career/pay-scale entry sourced from shared dataset.

### 5.3 Domain Relationships
- A user can own many chat conversations and test attempts.
- A user can have one or more career profiles over time, with active sessions linked to the latest profile.
- A mock test contains four ordered sections and many questions.
- A test attempt references a test and stores section-by-section progress.
- Analytics aggregate completed attempts into personal performance insights.

## 6. Use Cases

### Student / User Use Cases
- Create an account and sign in.
- Continue as a guest when needed.
- Ask questions through the chatbot.
- Build a career profile using the questionnaire.
- Receive AI-based degree or career recommendations.
- Review pay-scale information for career research.
- Take mock tests, save answers, submit sections, and review results.
- Check test history and performance analytics.

### Guest Use Cases
- Start a temporary session.
- Use chatbot support with limited persistence.
- Take mock tests in guest mode.

### Admin / Content Use Cases
- Create and maintain mock test templates.
- Manage question banks and section definitions.
- Review analytics for content effectiveness.

## 7. Functions of the Project

### Authentication and Identity
- Signup, login, logout, and forgot-password.
- Profile retrieval and token verification.
- Guest session creation and lookup.

### Chat Support
- Send a message to the AI assistant.
- Fetch conversation history.
- Delete conversation history.

### Career Counselling
- Fetch assessment questions.
- Submit or update career profile data.
- Generate recommendations from the profile.
- Retrieve the active recommendation session.
- Continue counselling through session chat.

### Career Statistics
- List careers from the salary dataset.
- Search careers by query.
- Compute salary statistics.

### Mock Tests
- List tests and fetch test details.
- Start a new attempt.
- Save answers automatically.
- Mark questions for review.
- Submit sections and final tests.
- Fetch results and answer review.
- View history and performance analytics.

## 8. External APIs and SDKs

### 8.1 Supabase SDK
- **Package:** `@supabase/supabase-js`
- **Used in:** auth service and some mock test/auth flows.
- **Purpose:** authentication backend, identity management, token/session handling.

### 8.2 MongoDB / Mongoose
- **Packages:** `mongodb`, `mongoose`
- **Purpose:** persistence, schema modeling, indexes, and query operations.

### 8.3 Ollama Local API
- **Used in:** career counselling service.
- **Endpoint style:** `http://localhost:11434/api/...`
- **Purpose:** local LLM inference for career recommendations and session memory compression.

### 8.4 External RAG API
- **Used in:** chatbot service.
- **Pattern:** POST to `RAG_API_URL/ask`
- **Purpose:** generate AI chat responses from an external retrieval-augmented backend.

### 8.5 React / Frontend Libraries
- **React / React DOM:** UI rendering.
- **React Router DOM:** routing and nested layouts.
- **Recharts:** dashboard visualizations and charts.
- **Vite:** development server, bundling, and proxy configuration.

### 8.6 Additional Legacy / Monolith Dependencies
The root backend workspace also includes packages such as:
- `openai`
- `tesseract.js`
- `sharp`
- `pdf-parse`
- `multer`
- `form-data`

These support legacy or auxiliary capabilities in the monolithic layer, including document processing and transcription-related workflows.

## 9. Frontend Structure

### Public Pages
- `Landing`
- `Login`
- `Signup`

### Dashboard Pages
- `Dashboard`
- `ChatAssistant`
- `MockTestList`
- `TestTaking`
- `TestResults`
- `TestAnalytics`
- `CareerDashboard`
- `Questionnaire`
- `CareerProfile`
- `Recommendations`
- `CareerChat`
- `Payscale`

### Shared Components
- Header, sidebar, footer, notification, error boundary.
- Mock test widgets: timer, question display, question palette, navigation buttons, answer review, section header.

### Client Data Flow
- `frontend/src/api/http.js` centralizes request handling and attaches the bearer token automatically.
- `frontend/src/api/chat.js` handles guest session setup and chatbot requests.
- `frontend/src/api/career.js` handles career questionnaire, recommendations, and salary data.
- `frontend/src/api/mockTestApi.js` drives the mock test lifecycle.
- `frontend/src/context/TestContext.jsx` manages attempt state, saving, navigation, and timer sync.

## 10. Testing Details

### 10.1 Backend Tests
#### Mock Test Service
- **Vitest** tests for middleware and request behavior.
- **Supertest** is used for Express route assertions.
- Example coverage includes:
  - ownership checks
  - validation middleware
  - rate limiting

#### Utility / Script-Based Tests
- Integration test script for end-to-end mock test journeys.
- Performance test script for indexes, cache behavior, and MongoDB connection pool usage.
- Seed and cleanup utilities for controlled test data.

### 10.2 API Collection Testing
The backend includes `.http` files for manual API testing:
- `backend/tests/microservices.http`
- `backend/tests/career-counselling-test.http`
- `backend/tests/career-stats.http`

These are useful for verifying endpoints from VS Code or REST clients.

### 10.3 Frontend Verification
- Vite proxy routes `/api` to the gateway in development.
- The UI state flows can be exercised through the dashboard, chatbot, career module, and mock tests.
- Error boundary behavior protects dashboard rendering from crashes.

### 10.4 Service Health Checks
Each service exposes a health endpoint or startup log:
- Gateway: `/health`
- Auth: `/health`
- Chatbot: `/health`
- Career Counselling: `/health`
- Career Stats: `/health`
- Mock Test: `/health`

### 10.5 Recommended Validation Flow
1. Start MongoDB and required external services.
2. Run the gateway and backend services.
3. Open the frontend through Vite.
4. Test auth and chatbot flows first.
5. Validate career questionnaire and recommendation generation.
6. Run a mock test start-to-finish path.
7. Check history, analytics, and review pages.

## 11. Deployment and Runtime Notes

- Development frontend runs on `http://localhost:5173`.
- Gateway defaults to `http://localhost:5000`.
- Microservices use separate ports so they can be scaled independently.
- Environment variables control service URLs, database connections, and AI endpoints.
- Guest support relies on persistent guest IDs in headers and temporary MongoDB session records.

## 12. Project Summary

Talk2Fast is a modular student guidance platform that combines:
- secure authentication,
- AI-powered chat,
- career counselling and recommendation generation,
- salary exploration,
- and a full mock-test practice workflow.

The codebase is designed so the frontend remains stable while backend capabilities are split into independently deployable services.
