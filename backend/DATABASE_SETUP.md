# Database Configuration

## Overview

Your application uses a **hybrid database setup**:
- **MongoDB Atlas** (Cloud) - For mock test service
- **MongoDB Local** - For other services (auth, chatbot, career)
- **Supabase** - For authentication

---

## Database Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATABASES                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SUPABASE (Cloud)                                       │
│  └─ Authentication (JWT, OAuth, passwords)              │
│                                                          │
│  MONGODB ATLAS (Cloud)                                  │
│  └─ hamza_mocktest                                      │
│      ├─ mocktests (3 documents)                         │
│      ├─ questions (360 documents)                       │
│      └─ testattempts (39 documents)                     │
│                                                          │
│  MONGODB LOCAL (localhost:27017)                        │
│  └─ talk2fast                                           │
│      ├─ users (user profiles)                           │
│      ├─ guestsessions (guest users)                     │
│      ├─ conversations (chat history)                    │
│      └─ careerprofiles (career data)                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Service Configuration

| Service | Database | Location | Connection |
|---------|----------|----------|------------|
| **mock-test-service** | hamza_mocktest | ☁️ Atlas | `MOCKTEST_MONGODB_URI` |
| **auth-service** | talk2fast | 💻 Local | `MONGODB_URI` |
| **chatbot-service** | talk2fast | 💻 Local | `MONGODB_URI` |
| **career-counselling** | talk2fast | 💻 Local | `MONGODB_URI` |

---

## Connection Strings

### Mock Test Service (Atlas)
```env
MOCKTEST_MONGODB_URI=mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/hamza_mocktest?retryWrites=true&w=majority
```

### Other Services (Local)
```env
MONGODB_URI=mongodb://localhost:27017/talk2fast
```

---

## Why This Setup?

### Mock Test Service → Atlas ☁️
**Reason:** Shared data across team
- ✅ All 3 team members see same tests
- ✅ All 3 team members see same questions
- ✅ All 3 team members see same test attempts
- ✅ Consistent testing experience
- ✅ No data conflicts

### Other Services → Local 💻
**Reason:** Independent development
- ✅ Each developer has own users
- ✅ Each developer has own chat history
- ✅ Each developer has own career profiles
- ✅ No interference between team members
- ✅ Privacy during development

---

## Team Workflow

### Mock Tests (Shared on Atlas)
```
Developer A creates test → Developer B & C see it immediately
Developer B adds questions → Developer A & C see them immediately
Developer C takes test → Developer A & B see the attempt
```

### Users/Chat/Career (Local per Developer)
```
Developer A's users → Only visible to Developer A
Developer B's chat history → Only visible to Developer B
Developer C's career profiles → Only visible to Developer C
```

---

## Data Flow

### When Mock Test Service Runs:
```
Your Code → Atlas (hamza_mocktest)
           ↓
    Saves to Cloud
           ↓
    Visible to all team members
```

### When Auth/Chat/Career Services Run:
```
Your Code → Local MongoDB (talk2fast)
           ↓
    Saves to localhost:27017
           ↓
    Only visible to you
```

---

## Requirements

### For Mock Test Service:
- ✅ Internet connection (to reach Atlas)
- ✅ Atlas credentials configured
- ✅ IP whitelisted (0.0.0.0/0)

### For Other Services:
- ✅ Local MongoDB running
  ```bash
  # Start MongoDB (macOS)
  brew services start mongodb-community
  
  # Check if running
  mongosh
  ```

---

## Verification

### Check Mock Test Service (Atlas):
```bash
cd backend/services/mock-test-service
npm start

# Should see:
# ✅ Connected to MongoDB (hamza_mocktest database)
```

### Check Auth Service (Local):
```bash
cd backend/services/auth-service
npm start

# Should see:
# ✅ Connected to MongoDB (Mongoose)
```

### Check Chatbot Service (Local):
```bash
cd backend/services/chatbot-service
npm start

# Should see:
# ✅ Connected to MongoDB (Mongoose)
```

---

## Atlas Dashboard

View your mock test data:
- URL: https://cloud.mongodb.com/
- Database: hamza_mocktest
- Collections: mocktests, questions, testattempts

---

## Local MongoDB

View your local data:
```bash
# Connect to local MongoDB
mongosh

# Switch to talk2fast database
use talk2fast

# View collections
show collections

# Count documents
db.users.countDocuments()
db.conversations.countDocuments()
```

---

## Migration Status

✅ **Completed:**
- Mock test service → Atlas (April 17, 2026)
- 3 tests, 360 questions, 39 attempts migrated

❌ **Not Migrated (Intentional):**
- Auth service → Stays local
- Chatbot service → Stays local
- Career service → Stays local

---

## Future: Move Everything to Atlas?

If you want ALL services to share data:

**Pros:**
- ✅ All team members see same users
- ✅ All team members see same chat history
- ✅ All team members see same career profiles
- ✅ No local MongoDB needed

**Cons:**
- ⚠️ Less privacy during development
- ⚠️ Potential data conflicts
- ⚠️ Need to coordinate test data

**Decision:** Keep current setup for now, migrate later if needed.

---

## Troubleshooting

### Mock Test Service Can't Connect:
1. Check internet connection
2. Verify Atlas IP whitelist (0.0.0.0/0)
3. Check connection string in .env

### Other Services Can't Connect:
1. Check MongoDB is running locally
   ```bash
   brew services list | grep mongodb
   ```
2. Start MongoDB if stopped
   ```bash
   brew services start mongodb-community
   ```
3. Verify connection string: `mongodb://localhost:27017/talk2fast`

---

## Summary

✅ **Mock tests** → Atlas (shared across team)  
✅ **Users/Chat/Career** → Local (separate per developer)  
✅ **Best of both worlds!**
