# API Endpoint Mapping - Monolith vs Microservices

## 🔄 Endpoint Compatibility Matrix

This document shows the exact mapping between monolithic endpoints and microservices endpoints.

---

## ✅ Authentication Endpoints

### Monolith → Microservices Mapping

| # | Feature | Monolith Endpoint | Microservices Endpoint | Method | Service | Status |
|---|---------|------------------|----------------------|--------|---------|--------|
| 1 | Signup | `http://localhost:5000/api/auth/signup` | `http://localhost:5000/api/auth/signup` | POST | Auth Service | ✅ |
| 2 | Login | `http://localhost:5000/api/auth/login` | `http://localhost:5000/api/auth/login` | POST | Auth Service | ✅ |
| 3 | Logout | `http://localhost:5000/api/auth/logout` | `http://localhost:5000/api/auth/logout` | POST | Auth Service | ✅ |
| 4 | Profile | `http://localhost:5000/api/auth/profile` | `http://localhost:5000/api/auth/profile` | GET | Auth Service | ✅ |
| 5 | Forgot Password | `http://localhost:5000/api/auth/forgot-password` | `http://localhost:5000/api/auth/forgot-password` | POST | Auth Service | ✅ |
| 6 | Guest Session | `http://localhost:5000/api/auth/guest-session` | `http://localhost:5000/api/auth/guest-session` | POST | Auth Service | ✅ |

### Request/Response Format
**IDENTICAL** - No changes to request bodies or response formats!

### Examples:

#### Signup
```http
# MONOLITH & MICROSERVICES - SAME REQUEST
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

#### Login
```http
# MONOLITH & MICROSERVICES - SAME REQUEST
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## ✅ Chatbot Endpoints

### Monolith → Microservices Mapping

| # | Feature | Monolith Endpoint | Microservices Endpoint | Method | Service | Status |
|---|---------|------------------|----------------------|--------|---------|--------|
| 7 | Send Message | `http://localhost:5000/api/chatbot/message` | `http://localhost:5000/api/chatbot/message` | POST | Chatbot Service | ✅ |
| 8 | Get History | `http://localhost:5000/api/chatbot/history/:id` | `http://localhost:5000/api/chatbot/history/:id` | GET | Chatbot Service | ✅ |
| 9 | Clear History | `http://localhost:5000/api/chatbot/history/:id` | `http://localhost:5000/api/chatbot/history/:id` | DELETE | Chatbot Service | ✅ |

### Request/Response Format
**IDENTICAL** - No changes to request bodies or response formats!

### Examples:

#### Send Message (Authenticated)
```http
# MONOLITH & MICROSERVICES - SAME REQUEST
POST http://localhost:5000/api/chatbot/message
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "recipient_id": "ai-assistant",
  "message": "Hello, how are you?"
}
```

#### Send Message (Guest)
```http
# MONOLITH & MICROSERVICES - SAME REQUEST
POST http://localhost:5000/api/chatbot/message
Content-Type: application/json
x-guest-id: guest_123abc

{
  "recipient_id": "ai-assistant",
  "message": "Hello, how are you?"
}
```

#### Get History
```http
# MONOLITH & MICROSERVICES - SAME REQUEST
GET http://localhost:5000/api/chatbot/history/USER_ID
Authorization: Bearer YOUR_TOKEN
```

---

## ⚠️ Transcription Endpoints (Not Migrated)

### Still in Monolith Only

| # | Feature | Endpoint | Method | Status |
|---|---------|----------|--------|--------|
| 10 | Transcribe Audio | `http://localhost:5000/api/transcribe` | POST | ⚠️ Monolith Only |

---

## ⚠️ Mock Test Endpoints (Not Migrated)

### Still in Monolith Only

| # | Feature | Endpoint | Method | Status |
|---|---------|----------|--------|--------|
| 11 | Extract Text | `http://localhost:5000/api/mock/extract-text` | POST | ⚠️ Monolith Only |
| 12 | Generate MCQs | `http://localhost:5000/api/mock/generate-mcqs` | POST | ⚠️ Monolith Only |
| 13 | Get Uploads | `http://localhost:5000/api/mock/uploads` | GET | ⚠️ Monolith Only |
| 14 | Get Upload | `http://localhost:5000/api/mock/uploads/:id` | GET | ⚠️ Monolith Only |

---

## 🎯 Key Takeaways

### ✅ Zero Changes Required for Clients

**For Auth & Chatbot:**
- Same endpoints
- Same HTTP methods
- Same request bodies
- Same response formats
- Same authentication headers
- Same error responses

### 📍 Port Configuration

**Development:**
```
Gateway:   http://localhost:5000 (client connects here)
Auth:      http://localhost:5001 (internal service)
Chatbot:   http://localhost:5002 (internal service)
```

**Production:**
```
Gateway:   https://api.yourdomain.com (client connects here)
Auth:      Internal network/service mesh
Chatbot:   Internal network/service mesh
```

### 🔀 Request Flow

#### Monolithic Architecture:
```
Client → Server (Port 5000) → Direct Handler
```

#### Microservices Architecture:
```
Client → Gateway (Port 5000) → Auth Service (Port 5001) → Database
                              → Chatbot Service (Port 5002) → Database
```

**From client perspective: NO DIFFERENCE!**

---

## 📋 Migration Checklist for Clients

### If You're Using the API:

- [ ] Update base URL from monolith to gateway (if different)
- [ ] ~~Update endpoints~~ ❌ NOT NEEDED - Same endpoints!
- [ ] ~~Update request format~~ ❌ NOT NEEDED - Same format!
- [ ] ~~Update response handling~~ ❌ NOT NEEDED - Same responses!
- [ ] ~~Update authentication~~ ❌ NOT NEEDED - Same auth!

### Actual Changes Required:
✅ **ZERO CHANGES** for auth and chatbot endpoints!

---

## 🔍 How to Verify Compatibility

### Test 1: Auth Signup
```bash
# Test with Monolith
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test"}'

# Test with Microservices (should be identical)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test"}'
```

### Test 2: Chatbot Message
```bash
# Test with Monolith
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"recipient_id":"ai","message":"Hello"}'

# Test with Microservices (should be identical)
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"recipient_id":"ai","message":"Hello"}'
```

---

## 📊 Summary

| Aspect | Monolith | Microservices | Compatible? |
|--------|----------|---------------|-------------|
| Endpoints | `/api/auth/*`, `/api/chatbot/*` | `/api/auth/*`, `/api/chatbot/*` | ✅ 100% |
| HTTP Methods | POST, GET, DELETE | POST, GET, DELETE | ✅ 100% |
| Request Format | JSON | JSON | ✅ 100% |
| Response Format | JSON | JSON | ✅ 100% |
| Status Codes | 200, 400, 401, 500 | 200, 400, 401, 500 | ✅ 100% |
| Authentication | Bearer Token, x-guest-id | Bearer Token, x-guest-id | ✅ 100% |
| Error Messages | Same format | Same format | ✅ 100% |

**Result: 100% Backward Compatible!** 🎉
