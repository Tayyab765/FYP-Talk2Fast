# Migrate talk2fast Database to Atlas

## Current Situation

You have TWO MongoDB databases:

1. **`hamza_mocktest`** - ✅ Already on Atlas (mock tests)
2. **`talk2fast`** - ❌ Still local (users, chat, career data)

## Why Migrate talk2fast to Atlas?

### Current Problem (Local MongoDB):
- ❌ Each team member has separate data
- ❌ Can't share test users
- ❌ Inconsistent testing experience
- ❌ Need MongoDB installed locally

### After Migration (Atlas):
- ✅ All 3 team members share same data
- ✅ Consistent test users for everyone
- ✅ No local MongoDB needed
- ✅ Better collaboration

---

## Quick Migration Steps

### 1. Export Local Data

```bash
# Export users
mongoexport --db=talk2fast --collection=users --out=users.json --jsonArray

# Export guest sessions
mongoexport --db=talk2fast --collection=guestsessions --out=guestsessions.json --jsonArray

# Export chat history (if exists)
mongoexport --db=talk2fast --collection=conversations --out=conversations.json --jsonArray

# Export career profiles (if exists)
mongoexport --db=talk2fast --collection=careerprofiles --out=careerprofiles.json --jsonArray
```

### 2. Import to Atlas

Use the SAME cluster you already have:

```bash
# Import users
mongoimport --uri="mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/talk2fast" --collection=users --file=users.json --jsonArray

# Import guest sessions
mongoimport --uri="mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/talk2fast" --collection=guestsessions --file=guestsessions.json --jsonArray

# Import chat history
mongoimport --uri="mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/talk2fast" --collection=conversations --file=conversations.json --jsonArray

# Import career profiles
mongoimport --uri="mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/talk2fast" --collection=careerprofiles --file=careerprofiles.json --jsonArray
```

### 3. Update .env Files

**Auth Service (.env):**
```env
MONGODB_URI=mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/talk2fast?retryWrites=true&w=majority
```

**Chatbot Service (.env):**
```env
MONGODB_URI=mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/talk2fast?retryWrites=true&w=majority
```

**Career Counselling Service (.env):**
```env
MONGODB_URI=mongodb+srv://hamza7756ai_db_user:AxgIU4xMrbCGMxkr@cluster0.y91gpkc.mongodb.net/talk2fast?retryWrites=true&w=majority
```

### 4. Share with Team

All 3 team members update their .env files with the same Atlas connection string.

---

## Result

### Your Atlas Cluster Will Have:

```
cluster0.y91gpkc.mongodb.net
├── hamza_mocktest (database)
│   ├── mocktests
│   ├── questions
│   └── testattempts
│
└── talk2fast (database)
    ├── users
    ├── guestsessions
    ├── conversations
    └── careerprofiles
```

### All Services Connected to Atlas:

| Service | Database | Purpose |
|---------|----------|---------|
| auth-service | talk2fast | User profiles, guest sessions |
| chatbot-service | talk2fast | Chat conversations |
| career-counselling | talk2fast | Career profiles, assessments |
| mock-test-service | hamza_mocktest | Tests, questions, attempts |

---

## Team Collaboration

After migration:

1. **Person A** creates a test user → **Person B & C** can see it
2. **Person B** takes a mock test → **Person A & C** can see results
3. **Person C** uses chatbot → **Person A & B** can see chat history

Everyone works with the SAME data! 🎉

---

## Alternative: Keep Local for Development

If you prefer separate data during development:

**Option 1: Each person uses local MongoDB**
- Keep current setup
- Each developer has own data
- Merge to Atlas for staging/production

**Option 2: Use Atlas for shared data**
- Migrate now
- Everyone shares data
- Better for team collaboration

---

## Recommendation

**Migrate to Atlas NOW** because:
- ✅ You already have Atlas cluster
- ✅ Free tier has plenty of space (512 MB)
- ✅ Better team collaboration
- ✅ Consistent testing
- ✅ No local MongoDB needed

---

## Need Help?

Run these commands and I'll help you migrate:

```bash
# Check what data you have locally
mongosh talk2fast --eval "db.getCollectionNames()"
mongosh talk2fast --eval "db.users.countDocuments()"
```
