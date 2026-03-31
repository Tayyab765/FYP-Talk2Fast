# Career Counselling Microservice

AI-powered career counselling service with comprehensive student assessment and personalized degree recommendations.

## 🚀 Now Using Ollama Local AI

This service has been migrated from OpenAI to **Ollama** for local AI inference. See [OLLAMA_INTEGRATION.md](./OLLAMA_INTEGRATION.md) for complete details.

**Benefits:**
- ✅ Zero API costs
- ✅ Complete data privacy
- ✅ Offline capability
- ✅ Faster response times (after initial load)
- ✅ No rate limits

## Features

### Core Functionality
- **Student Assessment**: Comprehensive questionnaire covering academic background, interests, skills, personality traits, and career preferences
- **AI-Powered Recommendations**: Ollama local LLM (qwen2.5:7b) for intelligent degree program suggestions
- **Follow-up Chat**: Context-aware conversational AI for career guidance
- **Session Management**: Persistent session storage with chat history tracking

### User Management
- **Authenticated Users**: JWT-based authentication via Auth Service
- **Guest Access**: Temporary guest sessions for anonymous users
- **Profile Storage**: MongoDB-based profile and session persistence
- **Multi-User Support**: User-specific profiles and sessions

### Integration
- **Auth Service Integration**: Token verification and user validation
- **Gateway Integration**: Routed through API Gateway at `/api/career`
- **Microservice Architecture**: Independent deployment and scaling

## API Endpoints

### Public Endpoints
- `GET /api/career/questions` - Get assessment questions (optional auth)
- `GET /api/career/health` - Health check

### Authenticated Endpoints
All require either Bearer token or x-guest-id header:

- `POST /api/career/profile` - Submit career profile
- `POST /api/career/recommend` - Generate AI recommendations
- `POST /api/career/chat/:sessionId` - Send chat message
- `GET /api/career/session/:sessionId` - Get session details
- `GET /api/career/profile` - Get user profile
- `GET /api/career/session/active` - Get active session
- `GET /api/career/analytics/:sessionId` - Get session analytics

## Environment Variables

```env
PORT=5003
NODE_ENV=development
MONGODB_URI=mongodb://mongodb:27017/talk2fast
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_TIMEOUT=120000
SESSION_EXPIRY_DAYS=30
AUTH_SERVICE_URL=http://auth-service:3001
CORS_ORIGIN=*
```

## Prerequisites

### 1. Install Ollama
- Download from: https://ollama.ai/download
- Install for your operating system

### 2. Pull the Model
```bash
ollama pull qwen2.5:7b
```

### 3. Verify Setup
```bash
npm run verify-ollama
```

## Authentication

### For Logged-in Users
```
Authorization: Bearer <jwt_token>
```

### For Guest Users
```
x-guest-id: <guest_session_id>
```

## Data Models

### CareerProfile
- User ID
- Academic background (education level, field, performance)
- Interests (Likert scale assessments)
- Skills assessment
- Personality traits
- Work style preferences
- Career inclination

### CareerSession
- Profile snapshot
- AI recommendations (structured JSON)
- Chat history
- Token usage tracking
- Session status and expiry

## Development

### Local Setup
```bash
# 1. Install Ollama and pull model
ollama pull qwen2.5:7b

# 2. Setup service
cd services/career-counselling
npm install
cp .env.example .env

# 3. Verify Ollama is ready
npm run verify-ollama

# 4. Start development server
npm run dev
```

### Docker Setup
```bash
docker-compose up career-counselling
```

## Migration from Backend

This service was migrated from the monolithic backend with the following enhancements:

1. **User Management**: Integrated with Auth Service for authentication
2. **Guest Support**: Added guest session handling
3. **Microservice Architecture**: Independent deployment and scaling
4. **Enhanced Security**: Auth middleware with token verification
5. **Better Logging**: Structured logging with Winston
6. **API Gateway Integration**: Routed through centralized gateway

## Architecture

```
Gateway (port 5000)
  ↓
/api/career/* → Career Counselling Service (port 5003)
                  ↓
                MongoDB (career_profiles, career_sessions)
                  ↓
                Ollama API (http://localhost:11434)
                  ↓
                qwen2.5:7b Model (Local Inference)
```

## Session Tracking

The service tracks session details:
- Message count per session
- Chat history (last 6-10 messages for context)
- Memory summaries for token efficiency
- Session status and expiry

## Session Management

- Sessions expire after 30 days (configurable)
- One active session per user
- Automatic archival of old sessions
- Chat history preserved in sessions

## Original Logic Preservation

The core career counselling logic has been preserved completely:
- Question configuration system
- Profile transformation logic
- AI prompt engineering
- Recommendation structure
- Chat context management

All business logic remains unchanged from the original backend implementation.
