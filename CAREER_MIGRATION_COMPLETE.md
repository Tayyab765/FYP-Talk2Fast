# Career Counselling Microservice Migration Summary

## Migration Date
March 10, 2026

## Overview
Successfully migrated the career counselling module from the monolithic backend (`backend/`) to a standalone microservice (`services/career-counselling/`) with enhanced user management capabilities.

## What Was Migrated

### 1. Models
- ✅ `CareerProfile.js` - Student assessment profiles
- ✅ `CareerSession.js` - AI recommendation sessions with chat history

### 2. Services
- ✅ `career.service.js` - Business logic for profile and recommendation management
- ✅ `openai.service.js` - OpenAI API integration for recommendations and chat

### 3. Controllers
- ✅ `careerController.js` - HTTP request handlers with enhanced user management

### 4. Routes
- ✅ `careerRoutes.js` - API endpoint definitions with auth middleware

### 5. Validators
- ✅ `careerValidator.js` - Joi validation schemas for requests

### 6. Utilities
- ✅ `transformers.js` - Data transformation logic
- ✅ `logger.js` - Winston logging configuration

### 7. Configuration
- ✅ `questions.js` - Comprehensive assessment questions (930+ lines)
- ✅ `mongoClient.js` - Database connection configuration

## Enhancements Added

### User Management Integration

#### 1. Authentication Middleware (`authMiddleware.js`)
- **authenticate()**: Requires valid Bearer token from Auth Service
- **authenticateOrGuest()**: Accepts both authenticated users and guest sessions
- **optionalAuth()**: Adds user context if available, doesn't block if missing

#### 2. Token Verification
- Validates JWT tokens with Auth Service via HTTP calls
- Supports guest session validation
- Provides user context in `req.user` object

#### 3. User Context Structure
```javascript
// Authenticated User
req.user = {
  id: "user_id",
  userId: "user_id",
  email: "user@example.com",
  type: "authenticated",
  raw: {...}
}

// Guest User
req.user = {
  id: "guest_id",
  userId: "guest_id",
  guestId: "guest_id",
  type: "guest",
  guestSession: {...}
}
```

### API Changes

#### Removed Parameters
- **Before**: `POST /api/career/profile` required `userId` in body
- **After**: `userId` extracted from `req.user` (auth context)

- **Before**: `POST /api/career/recommend` required `userId` in body
- **After**: `userId` extracted from `req.user` (auth context)

- **Before**: `GET /api/career/profile/:userId` with userId param
- **After**: `GET /api/career/profile` (current user)

#### Added Authorization Checks
- Session ownership verification
- Profile access control
- Analytics access restriction

### Infrastructure Changes

#### 1. Docker Configuration (`docker-compose.yml`)
```yaml
career-counselling:
  build: ./services/career-counselling
  ports: ["3003:3003"]
  environment:
    - PORT=3003
    - MONGODB_URI=mongodb://mongodb:27017/talk2fast
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - AUTH_SERVICE_URL=http://auth-service:5001
  depends_on:
    - mongodb
    - auth-service
```

#### 2. Gateway Configuration (`gateway-service/src/app.js`)
```javascript
app.use('/api/career', createProxyMiddleware({
  target: CAREER_SERVICE_URL,
  pathRewrite: { '^/': '/api/career/' }
}));
```

## Architecture

### Before (Monolithic)
```
Backend Service (port varies)
  ├── Career Routes
  ├── Other Routes
  └── MongoDB
```

### After (Microservice)
```
API Gateway (port 5000)
  ├── /api/auth → Auth Service (5001)
  ├── /api/chatbot → Chatbot Service (5002)
  └── /api/career → Career Counselling (3003)
                      ├── Auth Verification
                      ├── MongoDB (profiles/sessions)
                      └── OpenAI API
```

## Service Endpoints

### Gateway Access
All endpoints accessible via API Gateway at: `http://gateway:5000/api/career/*`

### Direct Access (Development)
Direct service access at: `http://localhost:3003/api/career/*`

### Available Endpoints
- `GET /api/career/questions` - Assessment questions (public)
- `POST /api/career/profile` - Submit profile (auth required)
- `POST /api/career/recommend` - Generate recommendations (auth required)
- `POST /api/career/chat/:sessionId` - Chat message (auth required)
- `GET /api/career/session/:sessionId` - Session details (auth required)
- `GET /api/career/profile` - User profile (auth required)
- `GET /api/career/session/active` - Active session (auth required)
- `GET /api/career/analytics/:sessionId` - Analytics (auth required)
- `GET /api/career/health` - Health check (public)

## Authentication Methods

### 1. Logged-in Users
```bash
curl -H "Authorization: Bearer <jwt_token>" \
     http://gateway:5000/api/career/profile
```

### 2. Guest Users
```bash
curl -H "x-guest-id: <guest_session_id>" \
     http://gateway:5000/api/career/profile
```

## Database Collections

### Existing Collections (Unchanged)
- `career_profiles` - Student assessment data
- `career_sessions` - AI recommendations and chat history

### Data Compatibility
- All existing data remains accessible
- No schema changes required
- Profile format unchanged
- Session structure preserved

## Original Logic Preservation

### ✅ Fully Preserved Components
1. **Question System**: All 50+ questions preserved
2. **Profile Transformation**: Exact same normalization logic
3. **AI Prompts**: OpenAI system/user prompts unchanged
4. **Recommendation Structure**: JSON format identical
5. **Chat Context**: Memory summary and history logic preserved
6. **Token Tracking**: Cost calculation unchanged
7. **Session Management**: Expiry and archival logic maintained

### ✅ Business Logic
- Profile submission workflow identical
- Recommendation generation process unchanged
- Chat continuation logic preserved
- Session retrieval methods maintained
- Analytics calculation unchanged

## Dependencies

### New Dependencies
- `axios` - For Auth Service HTTP calls
- All existing dependencies preserved

### Package.json
```json
{
  "name": "career-counselling-service",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "openai": "^4.20.0",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "axios": "^1.6.0",
    ...
  }
}
```

## Testing Checklist

### ✅ Functionality Tests
- [ ] Questions endpoint returns all questions
- [ ] Profile submission with authenticated user
- [ ] Profile submission with guest user
- [ ] Recommendation generation
- [ ] Chat message processing
- [ ] Session retrieval with ownership check
- [ ] Profile retrieval for current user
- [ ] Active session retrieval
- [ ] Analytics with authorization

### ✅ Authentication Tests
- [ ] Valid Bearer token accepted
- [ ] Invalid token rejected
- [ ] Guest session accepted
- [ ] Invalid guest ID rejected
- [ ] Unauthorized access blocked
- [ ] Session ownership enforced

### ✅ Integration Tests
- [ ] Gateway routing works
- [ ] Auth Service verification
- [ ] MongoDB connection
- [ ] OpenAI API calls
- [ ] Error handling
- [ ] Logging functionality

## Deployment Instructions

### 1. Environment Setup
```bash
# Copy environment template
cp services/career-counselling/.env.example services/career-counselling/.env

# Configure required variables
OPENAI_API_KEY=your_key_here
MONGODB_URI=mongodb://mongodb:27017/talk2fast
AUTH_SERVICE_URL=http://auth-service:3001
```

### 2. Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f career-counselling
```

### 3. Local Development
```bash
cd services/career-counselling
npm install
npm run dev
```

## Migration Benefits

### 1. Scalability
- Independent scaling of career counselling service
- No impact on other services during high load

### 2. Maintainability
- Isolated codebase for career features
- Clear service boundaries
- Independent deployment cycle

### 3. Security
- Centralized authentication via Auth Service
- Token-based access control
- Session ownership validation

### 4. User Experience
- Supports both logged-in and guest users
- Seamless profile management
- Consistent API interface

### 5. Monitoring
- Service-specific logs
- Independent health checks
- Token usage tracking

## Backward Compatibility

### ✅ Data Compatibility
- Existing MongoDB documents work without changes
- Profile schema unchanged
- Session structure preserved

### ⚠️ API Changes
- Client applications need to update API calls:
  - Remove `userId` from request bodies
  - Add authentication headers
  - Update endpoint URLs to use gateway

### Migration Path
1. Deploy new microservice alongside backend
2. Update client to use new endpoints
3. Monitor both systems during transition
4. Decommission old backend endpoints

## Files Created

### Source Files (19 files)
```
services/career-counselling/
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── mongoClient.js
│   │   └── questions.js (930 lines)
│   ├── controllers/
│   │   └── careerController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── CareerProfile.js
│   │   ├── CareerSession.js
│   │   └── index.js
│   ├── routes/
│   │   └── careerRoutes.js
│   ├── services/
│   │   ├── career.service.js
│   │   └── openai.service.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── transformers.js (348 lines)
│   └── validators/
│       └── careerValidator.js
├── server.js
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

### Configuration Files
- `docker-compose.yml` (updated)
- `gateway-service/src/app.js` (updated)

## Status: ✅ COMPLETE

All career counselling functionality has been successfully migrated to a standalone microservice with enhanced user management capabilities. The service is ready for testing and deployment.

## Next Steps

1. **Testing**: Comprehensive testing of all endpoints
2. **Documentation**: Update API documentation
3. **Client Updates**: Update frontend to use new endpoints
4. **Monitoring**: Set up service monitoring and alerts
5. **Performance**: Load testing and optimization
6. **Decommission**: Remove old backend career routes after successful migration
