# Career Counselling Service - Quick Start

## Prerequisites
- Node.js 18+
- MongoDB running
- OpenAI API key
- Auth Service running (for authentication)

## Installation

### 1. Navigate to Service Directory
```bash
cd services/career-counselling
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=3003
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/talk2fast
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini
SESSION_EXPIRY_DAYS=30
AUTH_SERVICE_URL=http://localhost:5001
CORS_ORIGIN=*
```

### 4. Start the Service

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## Using Docker

### Start All Services
```bash
# From project root
docker-compose up -d
```

### Start Only Career Counselling
```bash
docker-compose up -d mongodb auth-service career-counselling
```

### View Logs
```bash
docker-compose logs -f career-counselling
```

## Testing the API

### 1. Health Check
```bash
curl http://localhost:3003/health
```

### 2. Get Questions (No Auth Required)
```bash
curl http://localhost:3003/api/career/questions
```

### 3. Submit Profile (Auth Required)

**With Bearer Token:**
```bash
curl -X POST http://localhost:3003/api/career/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "academic_level": "intermediate",
      "field_of_study": "science",
      "academic_performance": "good",
      "favorite_subjects": ["Mathematics", "Physics"],
      "enjoy_solving_logical_problems": 5,
      "like_working_with_computers": 4,
      "enjoy_creative_tasks": 3,
      "like_analyzing_data": 5,
      "enjoy_understanding_systems": 4,
      "prefer_planning_over_execution": 3,
      "enjoy_helping_people": 4,
      "curious_about_business": 3,
      "enjoy_research": 4,
      "like_learning_new_tools": 5,
      "mathematical_skills": 4,
      "learn_programming_quickly": 5,
      "communicate_ideas_clearly": 4,
      "problem_solving_under_pressure": 4,
      "comfortable_with_data": 5,
      "lead_team_effectively": 3,
      "logical_reasoning": 5,
      "adapt_to_challenges": 4,
      "attention_to_detail": 4,
      "creative_problem_solving": 4,
      "learning_preference": "hands_on",
      "prefer_working_independently": 4,
      "enjoy_taking_responsibility": 4,
      "remain_calm_under_pressure": 3,
      "like_structured_environments": 4,
      "comfortable_taking_risks": 3,
      "prefer_routine": 2,
      "enjoy_interacting_with_people": 4,
      "motivated_by_long_term_goals": 5,
      "like_abstract_problems": 4,
      "enjoy_practical_work": 4,
      "preferred_work_environment": "remote",
      "problem_solving_approach": "logic_data",
      "career_motivation": "learning_growth",
      "exciting_work_type": "designing_systems",
      "continuous_learning_attitude": "enjoy_pursue",
      "appealing_role": "software_engineer"
    }
  }'
```

**With Guest Session:**
```bash
curl -X POST http://localhost:3003/api/career/profile \
  -H "x-guest-id: guest_123456789" \
  -H "Content-Type: application/json" \
  -d '{ ... same answers as above ... }'
```

### 4. Generate Recommendations
```bash
curl -X POST http://localhost:3003/api/career/recommend \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Active Session
```bash
curl http://localhost:3003/api/career/session/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Send Chat Message
```bash
curl -X POST http://localhost:3003/api/career/chat/SESSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you tell me more about the job market for this degree?"
  }'
```

## Via API Gateway

All endpoints are also accessible through the API Gateway at port 5000:

```bash
# Health check via gateway
curl http://localhost:5000/api/career/health

# Get questions via gateway
curl http://localhost:5000/api/career/questions

# Submit profile via gateway
curl -X POST http://localhost:5000/api/career/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running: `docker-compose up -d mongodb`
- Check connection string in `.env`

### Auth Service Unavailable
- Start auth service: `docker-compose up -d auth-service`
- Verify AUTH_SERVICE_URL in `.env`

### OpenAI API Error
- Verify OPENAI_API_KEY is valid
- Check API quota and billing

### Port Already in Use
- Change PORT in `.env` to an available port
- Update gateway configuration accordingly

## Service URLs

- **Development**: http://localhost:3003
- **Via Gateway**: http://localhost:5000/api/career
- **Health Check**: http://localhost:3003/health

## Logs Location

- **Development**: Console output
- **Production**: `logs/` directory
  - `combined.log` - All logs
  - `error.log` - Error logs only
  - `exceptions.log` - Uncaught exceptions
  - `rejections.log` - Unhandled rejections

## Monitoring

### Check Service Status
```bash
# Docker
docker-compose ps career-counselling

# Logs
docker-compose logs -f career-counselling

# Resource usage
docker stats talk2fast-career
```

### Database
```bash
# Connect to MongoDB
docker exec -it talk2fast-mongodb mongosh talk2fast

# View profiles
db.career_profiles.find().pretty()

# View sessions
db.career_sessions.find().pretty()
```

## Development Tips

### Hot Reload
Uses nodemon for auto-restart on file changes in dev mode.

### Debug Mode
Set LOG_LEVEL=debug in `.env` for verbose logging.

### Testing
```bash
# Run tests (if configured)
npm test

# Coverage
npm run test:coverage
```

## Production Deployment

### Docker Compose
```bash
docker-compose -f docker-compose.yml up -d
```

### Environment Variables
Ensure all production values are set:
- OPENAI_API_KEY (valid key)
- MONGODB_URI (production database)
- AUTH_SERVICE_URL (production auth service)
- NODE_ENV=production

### Health Monitoring
Set up monitoring for:
- `/health` endpoint (should return 200)
- MongoDB connection status
- OpenAI API availability
- Response times
- Error rates

## Support

For issues or questions:
1. Check logs: `docker-compose logs career-counselling`
2. Verify environment configuration
3. Test dependencies (MongoDB, Auth Service, OpenAI)
4. Review CAREER_MIGRATION_COMPLETE.md for architecture details
