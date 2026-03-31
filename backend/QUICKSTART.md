# Talk2Fast Backend - Microservices Quick Start

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- MongoDB running
- Supabase account (for authentication)

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all services via npm workspaces.

### 2. Configure Environment Variables

Create `.env` files for each service:

**Gateway Service** (`gateway-service/.env`):
```bash
cp gateway-service/.env.example gateway-service/.env
```

**Auth Service** (`services/auth-service/.env`):
```bash
cp services/auth-service/.env.example services/auth-service/.env
```

**Chatbot Service** (`services/chatbot-service/.env`):
```bash
cp services/chatbot-service/.env.example services/chatbot-service/.env
```

Edit each `.env` file with your actual credentials.

### 3. Run the Microservices

**Development Mode** (with hot reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

**Run Individual Services**:
```bash
npm run dev:gateway    # API Gateway on port 5000
npm run dev:auth       # Auth Service on port 5001
npm run dev:chatbot    # Chatbot Service on port 5002
```

### 4. Test the Services

**Check Gateway Health**:
```bash
curl http://localhost:5000/health
```

**Check Auth Service**:
```bash
curl http://localhost:5001/health
```

**Check Chatbot Service**:
```bash
curl http://localhost:5002/health
```

**Test Authentication**:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

**Test Chatbot** (after getting token from login):
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipient_id": "ai",
    "message": "Hello, how are you?"
  }'
```

## 🏗️ Architecture

- **API Gateway** (5000): Routes all requests to appropriate services
- **Auth Service** (5001): Handles authentication and user management
- **Chatbot Service** (5002): Manages conversations and AI responses

## 📝 API Endpoints

### Authentication (via Gateway)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/guest-session` - Create guest session

### Chatbot (via Gateway)
- `POST /api/chatbot/message` - Send message
- `GET /api/chatbot/history/:id` - Get conversation history
- `DELETE /api/chatbot/history/:id` - Delete conversation

## 🔄 Running Legacy Monolith

If you need to run the original monolithic version:

```bash
npm run start:monolith
```

or in development mode:

```bash
npm run dev:monolith
```

## 📚 More Information

See [MICROSERVICES.md](./MICROSERVICES.md) for detailed architecture documentation.
