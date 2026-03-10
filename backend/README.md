# Career Counseling Module - Backend

Production-grade AI-powered career counseling system built with MERN stack.

## Features

- 📝 Structured assessment questionnaire engine
- 🤖 AI-powered degree recommendations using OpenAI GPT-4
- 💬 Contextual follow-up chat with memory
- 🎯 Session-based conversation management
- 🔒 Production-ready security and error handling
- 📊 Token usage tracking and cost management

## Architecture

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # HTTP request handlers
│   ├── models/          # Database schemas
│   ├── services/        # Business logic
│   ├── utils/           # Helpers and utilities
│   ├── validators/      # Request validation schemas
│   ├── middleware/      # Express middleware
│   └── routes/          # API routes
```

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Configure environment variables:
   - `MONGODB_URI`: MongoDB connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: Server port (default: 5000)

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Get Assessment Questions
```
GET /api/career/questions
```

### Submit Career Profile
```
POST /api/career/profile
Body: { userId, answers: {...} }
```

### Generate AI Recommendations
```
POST /api/career/recommend
Body: { userId }
```

### Follow-up Chat
```
POST /api/career/chat/:sessionId
Body: { message }
```

### Get Session Details
```
GET /api/career/session/:sessionId
```

## Database Models

### CareerProfile
Stores normalized student assessment data.

### CareerSession
Stores AI recommendations, chat history, and memory summaries.

## Clean Architecture

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic
- **Models**: Define data schemas
- **Utils**: Reusable helper functions
- **Validators**: Input validation and sanitization

## Error Handling

Centralized error handling with appropriate HTTP status codes and user-friendly messages.

## License

MIT
