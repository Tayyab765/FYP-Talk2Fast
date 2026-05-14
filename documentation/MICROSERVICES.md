# Microservices Architecture

This application has been converted from a monolithic architecture to microservices. The system is now divided into independent services that communicate via HTTP.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway (Port 5000)                │
│                    Routes all client requests                │
└───────────────────┬────────────────────┬────────────────────┘
                    │                    │
        ┌───────────▼──────────┐  ┌──────▼─────────────┐
        │  Auth Service        │  │  Chatbot Service   │
        │  (Port 5001)         │  │  (Port 5002)       │
        │                      │  │                    │
        │ - User signup/login  │  │ - Chat messages    │
        │ - Authentication     │  │ - Conversation     │
        │ - Guest sessions     │  │ - AI responses     │
        │ - User profiles      │  │                    │
        └──────────┬───────────┘  └──────┬─────────────┘
                   │                     │
                   └──────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  MongoDB Database  │
                    │  (Shared Storage)  │
                    └────────────────────┘
```

## Services

### 1. API Gateway (`gateway-service/`)
- **Port**: 5000
- **Purpose**: Single entry point for all client requests
- **Responsibilities**:
  - Route requests to appropriate microservices
  - Handle service discovery
  - Provide unified API endpoint
  - Serve static files

### 2. Authentication Service (`services/auth-service/`)
- **Port**: 5001
- **Purpose**: Handle all authentication and user management
- **Endpoints**:
  - `POST /api/auth/signup` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - User logout
  - `GET /api/auth/profile` - Get user profile
  - `POST /api/auth/forgot-password` - Password reset
  - `POST /api/auth/guest-session` - Create guest session
- **Technologies**:
  - Supabase for authentication
  - MongoDB for user data persistence
  - JWT token verification

### 3. Chatbot Service (`services/chatbot-service/`)
- **Port**: 5002
- **Purpose**: Handle chatbot conversations and AI responses
- **Endpoints**:
  - `POST /api/chatbot/message` - Send message and get AI response
  - `GET /api/chatbot/history/:id` - Get conversation history
  - `DELETE /api/chatbot/history/:id` - Delete conversation
- **Technologies**:
  - MongoDB for conversation storage
  - External RAG API for AI responses
  - Supports both authenticated and guest users

## Running the Services

### Development Mode

Run all services in development mode:
```bash
npm run dev
```

Run individual services:
```bash
npm run dev:gateway    # API Gateway
npm run dev:auth       # Auth Service
npm run dev:chatbot    # Chatbot Service
```

### Production Mode

Run all services:
```bash
npm start
```

Run individual services:
```bash
npm run start:gateway
npm run start:auth
npm run start:chatbot
```

### Monolithic Mode (Legacy)

To run the original monolithic version:
```bash
npm run start:monolith
```

## Environment Configuration

Each service requires its own `.env` file:

### Gateway Service (`.env`)
```
PORT=5000
AUTH_SERVICE_URL=http://localhost:5001
CHATBOT_SERVICE_URL=http://localhost:5002
```

### Auth Service (`services/auth-service/.env`)
```
PORT=5001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
MONGODB_URI=your_mongo_uri
FRONTEND_URL=http://localhost:3000
```

### Chatbot Service (`services/chatbot-service/.env`)
```
PORT=5002
MONGODB_URI=your_mongo_uri
RAG_API_URL=http://localhost:8000
AUTH_SERVICE_URL=http://localhost:5001
```

## Installation

1. Install dependencies for all services:
```bash
npm install
```

This will install dependencies for:
- Root workspace
- Gateway service
- Auth service
- Chatbot service

2. Copy `.env.example` to `.env` in each service directory and configure:
```bash
cp gateway-service/.env.example gateway-service/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/chatbot-service/.env.example services/chatbot-service/.env
```

3. Configure each `.env` file with your credentials

## Service Communication

- Services communicate via HTTP REST APIs
- Authentication service provides token verification
- Chatbot service validates tokens by calling auth service
- All services share the same MongoDB database
- API Gateway routes client requests to appropriate services

## Key Features Preserved

All main logic from the monolithic application has been preserved:

✅ User authentication (Supabase)
✅ Guest sessions
✅ Chat conversations
✅ AI response generation
✅ Message history
✅ MongoDB persistence
✅ Logging functionality

## Migration Benefits

1. **Scalability**: Each service can be scaled independently
2. **Maintainability**: Clearer separation of concerns
3. **Deployment**: Services can be deployed independently
4. **Development**: Teams can work on different services simultaneously
5. **Resilience**: Failure of one service doesn't bring down the entire system

## Next Steps

Services that can be migrated in the future:
- Transcription service (currently in monolith)
- Mock test service (currently in monolith)
- Any other features in the `src/` directory

## Troubleshooting

- Ensure all services are running on their designated ports
- Check that MongoDB is accessible from all services
- Verify environment variables are correctly set
- Check service logs in `logs/` directory
- Use `/health` endpoint on each service to verify status
