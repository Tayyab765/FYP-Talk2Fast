# Ollama Integration Guide

## Overview

The Career Counselling Service has been migrated from **OpenAI GPT models** to **Ollama local inference** using the `qwen2.5:7b` model. This change eliminates external API costs and dependencies while maintaining all functionality.

---

## Architecture Changes

### Previous Architecture
```
Frontend → Backend → Career Service → OpenAI API → GPT Model
```

### New Architecture
```
Frontend → Backend → Career Service → Ollama API (Local) → qwen2.5:7b Model
```

---

## What Changed

### 1. **New Service Layer**
- **File**: `src/services/ollama.service.js`
- Replaces: `src/services/openai.service.js`
- Handles all communication with Ollama REST API

### 2. **Updated Career Service**
- **File**: `src/services/career.service.js`
- Now uses `getOllamaService()` instead of `getOpenAIService()`
- Removed token cost calculations (Ollama is free)

### 3. **Updated CareerSession Model**
- **File**: `src/models/CareerSession.js`
- Added `messageCount` field for tracking
- Token cost tracking now returns `0` for Ollama
- Enhanced chat history management

### 4. **Package Dependencies**
- **Removed**: `openai` npm package
- **Using**: `axios` for HTTP requests to Ollama

### 5. **Environment Configuration**
- **Removed**: `OPENAI_API_KEY`, `OPENAI_MODEL`
- **Added**: `OLLAMA_API_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT`

---

## Setup Instructions

### Prerequisites

1. **Install Ollama**
   - Download from: https://ollama.ai/download
   - Windows: Run the installer
   - Verify installation: `ollama --version`

2. **Pull the Model**
   ```powershell
   ollama pull qwen2.5:7b
   ```

3. **Verify Ollama is Running**
   ```powershell
   ollama list
   ```
   You should see `qwen2.5:7b` in the list.

### Start Ollama Service

Ollama runs automatically on installation, but you can manually start it:

```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama (it usually auto-starts)
ollama serve
```

### Environment Configuration

Update your `.env` file:

```env
# Ollama Configuration (Local AI)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_TIMEOUT=120000
```

### Install Dependencies

```powershell
cd services/career-counselling
npm install
```

---

## API Endpoints

All existing endpoints remain the same:

### 1. Get Questions
```http
GET /api/career/questions
```

### 2. Submit Profile
```http
POST /api/career/profile
Authorization: Bearer <token>

{
  "answers": { ... }
}
```

### 3. Generate Recommendations
```http
POST /api/career/recommend
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "recommendations": {
      "top_3_degrees": [...],
      "overall_assessment": "...",
      "next_steps": [...]
    }
  }
}
```

### 4. Chat with AI
```http
POST /api/career/chat/:sessionId
Authorization: Bearer <token>

{
  "message": "Can you tell me more about Computer Science?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "...",
    "messageCount": 5
  }
}
```

### 5. Get Session
```http
GET /api/career/session/:sessionId
Authorization: Bearer <token>
```

---

## How It Works

### 1. Recommendation Generation

**Flow:**
1. User completes assessment questionnaire
2. Profile is transformed to AI-friendly format
3. Comprehensive prompt is built with profile data
4. Prompt sent to Ollama API
5. Ollama returns structured JSON with 3 degree recommendations
6. Session created with recommendations and memory summary
7. Response returned to frontend

**Prompt Structure:**
```
System Instructions
↓
Student Profile (JSON)
↓
Output Format Requirements
↓
Constraints & Guidelines
```

### 2. Chat Conversation

**Context Management:**
- Memory summary (2-3 sentences about student)
- Top recommendations (degree names & match %)
- Recent chat history (last 6-10 messages)
- Current user message

**Flow:**
1. User sends message
2. Session retrieved from MongoDB
3. Context built from session data
4. Full prompt sent to Ollama
5. Response generated
6. Message added to chat history
7. Session saved
8. Response returned to frontend

---

## Ollama Service API

### Main Methods

#### `generateResponse(prompt, options)`
Low-level method for direct Ollama communication.

**Parameters:**
- `prompt` (string): The text prompt
- `options` (object): Generation options
  - `temperature`: 0.0-1.0 (default: 0.7)
  - `max_tokens`: Max response length (default: 2000)
  - `top_p`: Nucleus sampling (default: 0.9)

**Returns:** `Promise<string>`

#### `generateRecommendation(profileData)`
Generate degree recommendations from student profile.

**Returns:** `Promise<Object>` - Structured JSON with recommendations

#### `generateMemorySummary(profileData, recommendations)`
Create concise summary for session context.

**Returns:** `Promise<string>` - 2-3 sentence summary

#### `continueCareerChat(sessionData, userMessage)`
Handle follow-up chat with full context.

**Returns:** `Promise<string>` - AI response

---

## Error Handling

### Common Errors

#### 1. Ollama Not Running
```
Error: Ollama is not running. Please start Ollama service at http://localhost:11434
```

**Solution:**
```powershell
ollama serve
```

#### 2. Model Not Found
```
Error: Model qwen2.5:7b not found in Ollama
```

**Solution:**
```powershell
ollama pull qwen2.5:7b
```

#### 3. Request Timeout
```
Error: Ollama request timed out
```

**Possible Causes:**
- Model is loading (first request after startup)
- Prompt is too complex
- System resources are low

**Solution:**
- Wait for model to load (30-60 seconds)
- Increase `OLLAMA_TIMEOUT` in .env
- Check system resources

#### 4. Invalid JSON Response
```
Error: No valid JSON found in Ollama response
```

**Cause:** Model returned text instead of JSON structure

**Solution:** 
- The service automatically attempts to extract JSON
- If it persists, check model version or prompt structure

---

## Performance Considerations

### Response Times
- **First request**: 30-60 seconds (model loading)
- **Subsequent requests**: 5-15 seconds
- **Chat messages**: 3-8 seconds

### Memory Usage
- **Model size**: ~4.7 GB (qwen2.5:7b)
- **RAM requirement**: 8 GB minimum, 16 GB recommended

### Optimization Tips

1. **Keep Chat History Short**
   - Default: Last 8 messages
   - Adjust in `ollama.service.js` if needed

2. **Use Memory Summaries**
   - Compress long conversations
   - Reduces context size

3. **Model Selection**
   - `qwen2.5:7b` - Balanced (recommended)
   - `qwen2.5:3b` - Faster, less accurate
   - `qwen2.5:14b` - More accurate, slower

---

## Changing Models

To use a different model:

1. **Pull the model**
   ```powershell
   ollama pull llama3.2:7b
   ```

2. **Update .env**
   ```env
   OLLAMA_MODEL=llama3.2:7b
   ```

3. **Restart service**
   ```powershell
   npm start
   ```

### Recommended Models
- `qwen2.5:7b` - Best for general use ✅
- `llama3.2:7b` - Good alternative
- `mistral:7b` - Fast and efficient
- `gemma2:9b` - High quality responses

---

## Testing

### Test Ollama Connection

```powershell
# Test from command line
curl http://localhost:11434/api/tags

# Test with a simple prompt
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### Test Career Service

Use the provided `.http` file:

```http
### Test Career Recommendations
POST http://localhost:5003/api/career/recommend
Authorization: Bearer <your-token>
```

---

## Monitoring & Logging

### Service Logs

The service logs all Ollama interactions:

```
[INFO] Sending request to Ollama { model: 'qwen2.5:7b', promptLength: 1234 }
[INFO] Ollama response received { responseLength: 567, evalCount: 234 }
[INFO] Successfully generated career recommendations { degreeCount: 3 }
```

### Check Ollama Logs

```powershell
# Windows: Check Ollama service logs
Get-EventLog -LogName Application -Source Ollama

# Or check Ollama console output if running manually
ollama serve
```

---

## Migration Benefits

### ✅ Cost Savings
- No API costs (was ~$0.01-0.05 per recommendation)
- Unlimited usage

### ✅ Privacy
- All data stays local
- No external API calls

### ✅ Reliability
- No rate limits
- No network dependency
- Works offline

### ✅ Speed
- After initial load, responses are fast
- No network latency

### ✅ Flexibility
- Easy model switching
- Full control over generation parameters

---

## Troubleshooting

### Service Won't Start

1. Check Ollama is running
   ```powershell
   curl http://localhost:11434/api/tags
   ```

2. Verify model is installed
   ```powershell
   ollama list
   ```

3. Check logs
   ```powershell
   cd services/career-counselling
   npm start
   ```

### Slow Responses

1. **First Request**: Normal (model loading)
2. **All Requests Slow**: 
   - Check system RAM usage
   - Close other applications
   - Consider smaller model

### Poor Quality Responses

1. **Adjust temperature**: Lower for more focused responses
2. **Try different model**: `llama3.2:7b` or `mistral:7b`
3. **Improve prompts**: Check prompt structure in `ollama.service.js`

---

## Production Deployment

### Docker Considerations

If deploying with Docker, you have two options:

#### Option 1: Ollama on Host Machine
```yaml
# docker-compose.yml
career-counselling:
  environment:
    - OLLAMA_API_URL=http://host.docker.internal:11434
```

#### Option 2: Ollama in Docker
```yaml
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
      
  career-counselling:
    environment:
      - OLLAMA_API_URL=http://ollama:11434
```

### Scaling Considerations

- Ollama is single-instance (cannot load-balance easily)
- For high traffic, consider:
  - Multiple Ollama instances on different ports
  - Load balancer with sticky sessions
  - Redis caching for common queries

---

## Support & Resources

### Documentation
- Ollama: https://github.com/ollama/ollama
- Qwen2.5: https://ollama.com/library/qwen2.5
- Service Code: `src/services/ollama.service.js`

### Common Commands
```powershell
# List installed models
ollama list

# Pull a new model
ollama pull <model-name>

# Remove a model
ollama rm <model-name>

# Check Ollama version
ollama --version

# Run Ollama interactively
ollama run qwen2.5:7b
```

---

## Rollback Instructions

If you need to revert to OpenAI:

1. Restore `openai.service.js` from git history
2. Update `career.service.js` imports
3. Reinstall OpenAI package: `npm install openai`
4. Update `.env` with OpenAI API key
5. Restart service

---

## Summary

The migration to Ollama is complete. All functionality remains the same for end users, but the system now runs entirely locally with no external dependencies or costs. The service maintains conversation context, generates high-quality recommendations, and provides an interactive career counseling experience—all powered by local AI inference.
