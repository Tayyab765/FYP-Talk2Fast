# Mock Test Service - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [API Reference](#api-reference)
3. [Security & Performance](#security--performance)

---

## Overview

A microservice for the FAST University Entry Test Preparation System providing realistic practice tests.

### Features
- **Exact FAST Test Format**: 4 sections, 120 questions, 120 minutes
- **Sequential Navigation**: No backward movement between sections
- **Real-time Timer**: Auto-submit on timeout
- **Auto-save**: Automatic answer persistence
- **Comprehensive Analytics**: Performance tracking and recommendations
- **Multi-user Support**: Authenticated and guest users
- **Isolated Database**: Separate MongoDB (hamza_mocktest)

### Architecture
- **Port**: 5005
- **API Gateway**: Routes `/api/mock-tests/*` from port 5000
- **Database**: MongoDB (hamza_mocktest)
- **Authentication**: Supabase via Auth Service

---

## API Reference

### Base URL
```
http://localhost:5000/api/mock-tests
```

### Authentication
Most endpoints require Bearer token:
```
Authorization: Bearer <token>
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /:testId/start | 5 requests | 1 hour |
| PUT /attempts/:attemptId/answer | 200 requests | 1 minute |
| All other endpoints | 100 requests | 15 minutes |

### Key Endpoints

#### 1. List Tests
```
GET /api/mock-tests
```
**Response:**
```json
{
  "tests": [{
    "id": "...",
    "title": "FAST Entry Test Practice #1",
    "difficulty": "easy",
    "totalQuestions": 120,
    "totalDuration": 120
  }]
}
```

#### 2. Start Test
```
POST /api/mock-tests/:testId/start
```
**Response:**
```json
{
  "attemptId": "...",
  "currentSection": 0,
  "questions": [...],
  "serverTime": "2026-04-07T10:00:00Z"
}
```

#### 3. Save Answer
```
PUT /api/mock-tests/attempts/:attemptId/answer
```
**Body:**
```json
{
  "questionId": "...",
  "answer": "B"
}
```

#### 4. Submit Test
```
POST /api/mock-tests/attempts/:attemptId/submit
```
**Response:**
```json
{
  "attemptId": "...",
  "status": "completed",
  "score": {
    "total": 85,
    "percentage": 70.83
  }
}
```

#### 5. Get Results
```
GET /api/mock-tests/attempts/:attemptId/results
```

#### 6. Get Performance Analytics
```
GET /api/mock-tests/analytics/performance
```
**Response:**
```json
{
  "overallStats": {
    "totalAttempts": 5,
    "averageScore": 78.5
  },
  "topicStats": [...],
  "recommendations": [...]
}
```

---

## Security & Performance

### Security Features

#### Input Sanitization
All inputs sanitized to prevent:
- XSS attacks (HTML tag removal)
- MongoDB injection ($where, $ne operators)
- SQL injection (quotes, semicolons)
- Prototype pollution (__proto__, constructor)
- Null byte injection

#### Authorization
- User authentication verification
- Resource ownership checks
- Cross-user access prevention

### Performance Optimizations

#### Database
- Indexes on all query fields
- Connection pooling (50 max, 10 min)
- Lazy loading of section questions

#### Caching
- In-memory test template cache (10-min TTL)
- Reduces database queries by 80%

#### Performance Targets
- Section load: < 500ms
- Answer save: < 500ms
- Question navigation: < 200ms
- Score calculation: < 2 seconds
- Concurrent users: 50+

### Monitoring

**Logs:**
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only

**Health Check:**
```bash
curl http://localhost:5005/health
```

---

## Quick Start

### Installation
```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

### Environment Variables
```env
PORT=5005
MOCKTEST_MONGODB_URI=mongodb://localhost:27017/hamza_mocktest
AUTH_SERVICE_URL=http://localhost:5001
```

### Docker
```bash
docker build -t mock-test-service .
docker run -p 5005:5005 mock-test-service
```

### Scripts
```bash
npm run dev              # Development with auto-reload
npm start                # Production server
npm test                 # Run tests
npm run seed             # Seed sample data
npm run cleanup          # Clear attempts
npm run verify-indexes   # Verify DB indexes
```

---

## Database Schema

### Collections
- **mocktests**: Test templates
- **questions**: Question bank
- **testattempts**: User attempts
- **analytics**: Performance data

### Indexes
Auto-created on first run. Verify with:
```bash
npm run verify-indexes
```

---

## Error Handling

All errors follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": []
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400): Invalid input
- `MISSING_TOKEN` (401): Auth required
- `UNAUTHORIZED_ACCESS` (403): Not authorized
- `ATTEMPT_NOT_FOUND` (404): Not found
- `DATABASE_ERROR` (500): Server error

---

## Troubleshooting

**Service won't start:**
- Check MongoDB connection
- Verify port 5005 is available
- Check `logs/error.log`

**Performance issues:**
- Run `npm run verify-indexes`
- Check cache hit rate in logs
- Monitor MongoDB connection pool

---

## License
Proprietary - FAST University Entry Test Preparation System
