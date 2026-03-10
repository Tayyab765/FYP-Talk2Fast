# Setup Guide - Career Counseling Backend

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **OpenAI API Key**
- **Git**

---

## 🚀 Quick Start

### 1. Clone & Navigate

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/career_counseling

# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Session Configuration
SESSION_EXPIRY_DAYS=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*
```

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
mongod --dbpath /path/to/data
```

**Option B: MongoDB Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option C: MongoDB Atlas (Cloud)**
Update `MONGODB_URI` with Atlas connection string.

### 5. Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:5000`

---

## 🔧 Development Setup

### Project Structure Verification

```bash
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── questions.js
│   ├── controllers/
│   │   └── career.controller.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── requestLogger.js
│   ├── models/
│   │   ├── CareerProfile.js
│   │   └── CareerSession.js
│   ├── routes/
│   │   ├── career.routes.js
│   │   └── index.js
│   ├── services/
│   │   ├── career.service.js
│   │   └── openai.service.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── transformers.js
│   ├── validators/
│   │   └── careerValidator.js
│   └── server.js
├── logs/
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## ✅ Verify Installation

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Career Counseling API is running",
  "timestamp": "2024-02-25T10:30:00.000Z"
}
```

### 2. Get Questions

```bash
curl http://localhost:5000/api/career/questions
```

Should return 22 assessment questions.

### 3. Check MongoDB Connection

Look for this in server logs:
```
MongoDB Connected: localhost
```

---

## 🧪 Testing the Complete Flow

### Step 1: Get Questions

```bash
curl http://localhost:5000/api/career/questions
```

### Step 2: Submit Profile

```bash
curl -X POST http://localhost:5000/api/career/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "answers": {
      "academic_level": "intermediate",
      "field_of_study": "computer_science",
      "academic_performance": "excellent",
      "favorite_subjects": ["mathematics", "computer_science", "physics"],
      "challenging_subjects": [],
      "primary_interests": ["technology", "business"],
      "hobbies": ["coding", "gaming"],
      "programming_skill": 4,
      "mathematics_skill": 5,
      "analytical_thinking": 4,
      "problem_solving": 5,
      "communication_skill": 3,
      "leadership_skill": 3,
      "teamwork_skill": 4,
      "creativity_skill": 4,
      "learning_preference": "hands_on",
      "work_environment": "flexible",
      "career_priority": "growth_opportunities",
      "preferred_location": "no_preference",
      "risk_tolerance": "medium"
    }
  }'
```

### Step 3: Generate Recommendations

```bash
curl -X POST http://localhost:5000/api/career/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011"
  }'
```

**Note:** Save the `sessionId` from response!

### Step 4: Send Chat Message

```bash
curl -X POST http://localhost:5000/api/career/chat/YOUR_SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What programming languages should I focus on?"
  }'
```

### Step 5: Get Session Details

```bash
curl http://localhost:5000/api/career/session/YOUR_SESSION_ID
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error

**Error:** `MongoNetworkError: failed to connect to server`

**Solution:**
1. Ensure MongoDB is running
2. Check `MONGODB_URI` in `.env`
3. Try: `mongod --dbpath ./data`

### OpenAI API Error

**Error:** `OpenAI API key not configured`

**Solution:**
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Restart server

### Rate Limit Error

**Error:** `Too many requests`

**Solution:**
- Wait 15 minutes, or
- Increase limits in `.env`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

Or change `PORT` in `.env`.

---

## 📦 Production Deployment

### 1. Environment Variables

Set all production values:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/career_counseling
OPENAI_API_KEY=sk-production-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Build & Start

```bash
npm start
```

### 3. Process Manager (Recommended)

**Using PM2:**

```bash
npm install -g pm2
pm2 start src/server.js --name career-api
pm2 save
pm2 startup
```

**Using Docker:**

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

```bash
docker build -t career-api .
docker run -d -p 5000:5000 --env-file .env career-api
```

---

## 🔐 Security Checklist

- [ ] Change `OPENAI_API_KEY` to production key
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` with specific domain
- [ ] Use strong MongoDB credentials
- [ ] Enable MongoDB authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Regular dependency updates: `npm audit`

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log
```

### Database Monitoring

```bash
mongo
use career_counseling
db.career_profiles.countDocuments()
db.career_sessions.countDocuments()
```

---

## 🎓 FYP Demonstration Tips

1. **Show Project Structure**: Explain clean architecture
2. **Live Demo**: Complete flow from questions → chat
3. **Code Walkthrough**: Highlight service layer separation
4. **AI Integration**: Explain prompt engineering
5. **Error Handling**: Show validation and error responses
6. **Scalability**: Discuss future enhancements

---

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🆘 Support

For issues:
1. Check logs in `logs/` directory
2. Review API documentation
3. Verify environment variables
4. Test with curl/Postman
5. Check MongoDB connection

---

**Ready to build! 🚀**
