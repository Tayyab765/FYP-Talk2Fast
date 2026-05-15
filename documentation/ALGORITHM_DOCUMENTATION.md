# Algorithm Documentation: Service Pipelines & Pseudocode

**FYP Backend Microservices Architecture**

---

## Table of Contents

1. [Gateway Service](#gateway-service)
2. [Authentication Service](#authentication-service)
3. [Chatbot Service](#chatbot-service)
4. [Career Counselling Service](#career-counselling-service)
5. [Mock Test Service](#mock-test-service)
6. [Career Stats Service](#career-stats-service)

---

## Gateway Service

### Purpose
API Gateway using Express.js that routes and proxies requests to all backend microservices. Acts as a single entry point for the frontend.

### Architecture
- Service Discovery via environment variables
- HTTP Proxy Middleware for request forwarding
- Path rewriting for service isolation
- Error handling and logging

### Algorithm: Request Routing Pipeline

```
FUNCTION routeRequest(httpRequest):
  
  1. LOG_REQUEST(httpRequest.method, httpRequest.url)
  
  2. DETERMINE_SERVICE_PATH:
     IF path.startsWith("/api/auth"):
       targetService = AUTH_SERVICE_URL
       
     ELSE IF path.startsWith("/api/chatbot"):
       targetService = CHATBOT_SERVICE_URL
       
     ELSE IF path.startsWith("/api/careers"):  // Must be BEFORE /api/career
       targetService = CAREER_STATS_URL
       
     ELSE IF path.startsWith("/api/career"):
       targetService = CAREER_SERVICE_URL
       
     ELSE IF path.startsWith("/api/mock-tests"):
       targetService = MOCK_TEST_SERVICE_URL
       
     ELSE:
       RETURN 404 Not Found
  
  3. CREATE_PROXY_CONFIG:
     proxyConfig = {
       target: targetService,
       changeOrigin: true,
       pathRewrite: rewrite_service_path(prefix),
       timeout: DEFAULT_TIMEOUT
     }
  
  4. EXECUTE_PROXY:
     TRY:
       response = PROXY_MIDDLEWARE(httpRequest, proxyConfig)
       RETURN response
     
     CATCH error:
       LOG_ERROR(error.message)
       RETURN 503 Service Unavailable
  
  5. LOG_RESPONSE(response.statusCode, httpRequest.url)

END FUNCTION
```

### Service URL Configuration
```
AUTH_SERVICE_URL       = http://localhost:5001
CHATBOT_SERVICE_URL    = http://localhost:5002
CAREER_SERVICE_URL     = http://localhost:5003
CAREER_STATS_URL       = http://localhost:5004
MOCK_TEST_SERVICE_URL  = http://localhost:5005
```

---

## Authentication Service

### Purpose
Manages user authentication, guest sessions, and profile management using Supabase as the primary auth provider.

### Components
- **User Database**: Supabase Auth (PostgreSQL) + MongoDB (user metadata)
- **Guest Sessions**: MongoDB with TTL-based expiry (8 hours)
- **Methods**: Email/Password, Guest Access

### Algorithm 1: User Signup Pipeline

```
FUNCTION signup(email, password, full_name):
  
  1. VALIDATE_INPUT:
     IF email is empty OR password is empty:
       RETURN 400 Bad Request
  
  2. SUPABASE_SIGNUP:
     TRY:
       response = SUPABASE.auth.signUp({
         email: email,
         password: password,
         data: { full_name: full_name }
       })
       
       IF response.error:
         LOG_ERROR("Signup failed: " + response.error.message)
         RETURN 400 Bad Request
     
     CATCH error:
       LOG_ERROR("Supabase error: " + error.message)
       RETURN 500 Server Error
  
  3. MONGODB_PERSISTENCE:
     TRY:
       mongoUser = ENSURE_USER_FROM_SUPABASE(response.user)
       LOG_INFO("User persisted to MongoDB: " + email)
     
     CATCH error:
       LOG_WARNING("MongoDB persistence failed: " + error.message)
       // Non-blocking: Supabase auth succeeded
  
  4. RETURN_RESPONSE:
     RETURN 200 OK {
       user: response.user,
       session: response.session,
       mongoUser: mongoUser
     }

END FUNCTION
```

### Algorithm 2: User Login Pipeline

```
FUNCTION login(email, password):
  
  1. VALIDATE_INPUT:
     IF email is empty OR password is empty:
       RETURN 400 Bad Request
  
  2. SUPABASE_LOGIN:
     TRY:
       response = SUPABASE.auth.signInWithPassword({
         email: email,
         password: password
       })
       
       IF response.error:
         LOG_ERROR("Login failed: " + response.error.message)
         RETURN 400 Unauthorized
     
     CATCH error:
       RETURN 500 Server Error
  
  3. SYNC_TO_MONGODB:
     TRY:
       mongoUser = ENSURE_USER_FROM_SUPABASE(
         response.user,
         { touchLogin: true }
       )
       LOG_INFO("User synced to MongoDB: " + email)
     
     CATCH error:
       LOG_WARNING("MongoDB sync failed: " + error.message)
  
  4. RETURN_RESPONSE:
     RETURN 200 OK {
       session: response.session,
       user: response.user,
       mongoUser: mongoUser
     }

END FUNCTION
```

### Algorithm 3: Guest Session Management Pipeline

```
FUNCTION createOrRefreshGuestSession(guestId):
  
  1. INPUT_VALIDATION:
     IF guestId exists:
       RETURN touchGuestSession(guestId)
     ELSE:
       RETURN createNewGuestSession()
  
  FUNCTION touchGuestSession(guestId):
    COMPUTE_EXPIRY:
      expiryDate = NOW() + 8_HOURS
    
    UPDATE_SESSION:
      session = MONGODB.GuestSession.findOneAndUpdate(
        { guestId: guestId },
        { 
          lastActive: NOW(),
          expireAt: expiryDate
        },
        { new: true }
      )
    
    IF session exists:
      RETURN { guestId, expiresAt: session.expireAt, isNew: false }
    ELSE:
      RETURN createNewGuestSession()
  END FUNCTION
  
  FUNCTION createNewGuestSession():
    GENERATE_ID:
      guestId = "guest_" + UUID()
    
    CALCULATE_EXPIRY:
      expiryDate = NOW() + 8_HOURS
    
    CREATE_RECORD:
      session = MONGODB.GuestSession.create({
        guestId: guestId,
        createdAt: NOW(),
        lastActive: NOW(),
        expireAt: expiryDate
      })
    
    RETURN {
      guestId: session.guestId,
      expiresAt: session.expireAt,
      isNew: true
    }
  END FUNCTION

END FUNCTION
```

### Algorithm 4: Retrieve User Profile

```
FUNCTION getProfile(request):
  
  1. EXTRACT_USER_CONTEXT:
     IF request.user exists (authenticated):
       RETURN {
         type: "registered",
         user: request.user
       }
  
  2. HANDLE_GUEST:
     ELSE:
       guestContext = createOrRefreshGuestSession(
         request.headers["x-guest-id"]
       )
       
       RETURN {
         type: "guest",
         guestId: guestContext.guestId,
         expiresAt: guestContext.expiresAt
       }
  
  3. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Profile retrieval failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

---

## Chatbot Service

### Purpose
Provides real-time conversational AI using a FastAPI RAG (Retrieval-Augmented Generation) server. Handles message routing, conversation persistence, and AI response generation.

### Components
- **Message Storage**: MongoDB (conversations collection)
- **AI Backend**: FastAPI RAG Server (external)
- **Context Management**: Message history with metadata

### Algorithm: Chatbot Message Pipeline

```
FUNCTION sendMessage(userId, recipientId, message):
  
  1. AUTHENTICATION_CHECK:
     IF NOT user.authenticated:
       RETURN 401 Unauthorized
  
  2. CONVERSATION_LOOKUP:
     participants = SORT([userId, recipientId])
     
     conversation = MONGODB.conversations.findOne({
       participants: participants
     })
  
  3. CREATE_IF_NOT_EXISTS:
     IF conversation is NULL:
       conversation = MONGODB.conversations.insertOne({
         participants: participants,
         messages: [],
         createdAt: NOW(),
         participantTypes: {
           [userId]: user.type,     // "authenticated" or "guest"
           [recipientId]: "ai"
         }
       })
       LOG_INFO("New conversation created for participants: " + participants)
  
  4. SAVE_USER_MESSAGE:
     userMessage = {
       type: "user",
       sender: userId,
       senderType: user.type,
       text: message,
       createdAt: NOW()
     }
  
  5. GENERATE_AI_RESPONSE:
     aiResponse = generateAIResponse({
       userId: userId,
       message: message,
       context: conversation.messages
     })
     
     aiMessage = {
       type: "ai",
       sender: "ai",
       text: aiResponse,
       createdAt: NOW()
     }
  
  6. PERSIST_BOTH_MESSAGES:
     MONGODB.conversations.updateOne(
       { _id: conversation._id },
       { $push: { messages: { $each: [userMessage, aiMessage] } } }
     )
  
  7. RETURN_RESPONSE:
     RETURN 200 OK {
       userMessage: userMessage,
       aiMessage: aiMessage,
       conversationId: conversation._id
     }
  
  8. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Message error: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 2: AI Response Generation (RAG Pipeline)

**Actual Implementation - generateAIResponse()**

```
FUNCTION generateAIResponse({ userId, message, context = [] }):
  
  1. LOAD_CONFIGURATION:
     baseUrl = ENV.RAG_API_URL
     timeout = 120_000  // milliseconds
  
  2. FALLBACK_CHECK:
     IF baseUrl is empty OR NULL:
       LOG_WARNING("RAG API URL not configured")
       RETURN "(local fallback) " + message
  
  3. PREPARE_REQUEST:
     url = baseUrl + "/ask"
     
     contextSummary = AGGREGATE_CONTEXT(context)
     // Example: "user:How are you? | assistant:I am fine"
     
     requestBody = {
       query: message,
       use_llm: ENV.RAG_USE_LLM != "false"
     }
  
  4. CREATE_TIMEOUT_HANDLER:
     controller = new AbortController()
     timeout = setTimeout(() => controller.abort(), 120_000)
  
  5. EXECUTE_HTTP_POST:
     TRY:
       response = HTTP.POST(url, {
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(requestBody),
         signal: controller.signal
       })
       
       clearTimeout(timeout)
  
  6. VALIDATE_RESPONSE:
       IF NOT response.ok:
         text = response.text()
         THROW Error("RAG API HTTP " + response.status)
  
  7. EXTRACT_ANSWER:
       data = response.json()
       answer = data.answer
       
       IF answer is empty:
         THROW Error("RAG API: missing answer")
  
  8. RETURN_SUCCESS:
       RETURN String(answer)
  
  9. GRACEFUL_FALLBACK:
     CATCH error:
       LOG_ERROR("AI response error: " + error.message)
       RETURN "(fallback) Sorry I didn't find a response for your query."
     
     FINALLY:
       clearTimeout(timeout)

END FUNCTION
```

### Algorithm 3: Retrieve Conversation History

```
FUNCTION getHistory(userId, paramId):
  
  1. AUTHENTICATION_CHECK:
     IF NOT user.authenticated:
       RETURN 401 Unauthorized
  
  2. LOOKUP_CONVERSATION:
     TRY:
       IF paramId is valid ObjectId:
         conversation = MONGODB.conversations.findOne(
           { _id: ObjectId(paramId) },
           { projection: { participants: 1, messages: 1 } }
         )
       
       IF conversation is NULL:
         conversations = MONGODB.conversations.find({
           participants: paramId
         }).toArray()
         
         IF conversations is empty:
           RETURN 404 Not Found
         
         // Pick latest conversation by last message timestamp
         conversations.sort((a, b) => {
           aLast = a.messages[-1]?.createdAt || a.createdAt
           bLast = b.messages[-1]?.createdAt || b.createdAt
           RETURN bLast - aLast
         })
         
         conversation = conversations[0]
  
  3. AUTHORIZATION_CHECK:
     IF userId NOT IN conversation.participants:
       RETURN 403 Forbidden
  
  4. NORMALIZE_MESSAGES:
     messages = conversation.messages.map(m => ({
       type: m.type,
       text: m.text,
       senderType: m.senderType,
       createdAt: m.createdAt
     }))
     
     messages.sort((a, b) => a.createdAt - b.createdAt)
  
  5. RETURN_RESPONSE:
     RETURN 200 OK {
       conversation: {
         id: conversation._id,
         messages: messages
       }
     }
  
  6. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("History error: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

---

## Career Counselling Service

### Purpose
Provides AI-powered career recommendations through assessment profiles and maintains multi-turn counseling sessions using Ollama for local inference.

### Components
- **Profiles**: CareerProfile model (assessment answers)
- **Sessions**: CareerSession model (recommendations + chat history)
- **AI Backend**: Ollama local inference engine
- **Knowledge Base**: Question set with categories and scoring

### Algorithm 1: Career Profile Submission

```
FUNCTION submitProfile(userId, answers):
  
  1. VALIDATE_INPUT:
     IF answers is empty:
       RETURN 400 Bad Request
  
  2. TRANSFORM_ANSWERS:
     profileData = transformAnswersToProfile(userId, answers)
     // Normalizes and categorizes answers
  
  3. CREATE_PROFILE:
     profile = CareerProfile({
       userId: userId,
       answers: profileData,
       createdAt: NOW(),
       category: calculateCategory(profileData),
       strengths: extractStrengths(profileData),
       weaknesses: extractWeaknesses(profileData)
     })
  
  4. PERSIST_TO_DATABASE:
     profile.save()
     
     LOG_INFO("Career profile saved", {
       userId: userId,
       profileId: profile._id
     })
  
  5. RETURN_RESPONSE:
     RETURN 201 Created {
       profileId: profile._id,
       userId: profile.userId,
       createdAt: profile.createdAt
     }
  
  6. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Profile submission failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 2: Generate Career Recommendations

```
FUNCTION generateRecommendations(userId):
  
  1. FETCH_LATEST_PROFILE:
     profile = CareerProfile.getLatestByUserId(userId)
     
     IF profile is NULL:
       RETURN 404 Not Found {
         error: "No profile found. Complete assessment first."
       }
  
  2. PREPARE_AI_CONTEXT:
     profileForAI = {
       userId: userId,
       category: profile.category,
       strengths: profile.strengths,
       weaknesses: profile.weaknesses,
       scores: profile.scores,
       interests: profile.interests
     }
  
  3. CALL_OLLAMA_API:
     TRY:
       recommendations = OLLAMA_SERVICE.generateRecommendation(
         profileForAI
       )
       // Returns: { degrees: [...], skills: [...], careers: [...] }
       
       memorySummary = OLLAMA_SERVICE.generateMemorySummary(
         profileForAI,
         recommendations
       )
     
     CATCH error:
       LOG_ERROR("Ollama error: " + error.message)
       RETURN 500 Service Unavailable
  
  4. COMPUTE_SESSION_EXPIRY:
     expiryDays = ENV.SESSION_EXPIRY_DAYS || 30
     expiresAt = NOW() + (expiryDays * 24 * 60 * 60 * 1000)
  
  5. CREATE_SESSION:
     session = CareerSession({
       userId: userId,
       profileId: profile._id,
       profileSnapshot: profile.toObject(),
       recommendationJSON: recommendations,
       memorySummary: memorySummary,
       chatHistory: [],
       tokenUsage: {
         total_tokens: 0,
         prompt_tokens: 0,
         completion_tokens: 0,
         estimated_cost: 0  // Ollama is free
       },
       messageCount: 0,
       status: "active",
       expiresAt: expiresAt
     })
  
  6. PERSIST_SESSION:
     session.save()
     
     LOG_INFO("Recommendation session saved", {
       userId: userId,
       sessionId: session._id
     })
  
  7. RETURN_RESPONSE:
     RETURN 200 OK {
       sessionId: session._id,
       recommendations: recommendations,
       tokenUsage: {
         total_tokens: 0,
         prompt_tokens: 0,
         completion_tokens: 0
       }
     }
  
  8. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Recommendation generation failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 3: Process Career Chat Message

```
FUNCTION processChatMessage(sessionId, userMessage):
  
  1. VALIDATE_SESSION:
     session = MONGODB.CareerSession.findById(sessionId)
     
     IF session is NULL:
       RETURN 404 Not Found
     
     IF session.status != "active":
       RETURN 400 Bad Request {
         error: "Session is no longer active"
       }
  
  2. ADD_USER_MESSAGE:
     session.addMessage("user", userMessage)
  
  3. BUILD_CONTEXT:
     sessionContext = {
       sessionId: session._id,
       memorySummary: session.memorySummary,
       recommendationJSON: session.recommendationJSON,
       chatHistory: session.getRecentMessages(10)  // Last 10 messages
     }
  
  4. CALL_OLLAMA_FOR_RESPONSE:
     TRY:
       ollamaResult = OLLAMA_SERVICE.continueCareerChat(
         sessionContext,
         userMessage
       )
       
       response = ollamaResult.response || ""
       usage = ollamaResult.usage || {
         eval_count: 0,
         eval_duration: 0,
         prompt_eval_count: 0,
         prompt_eval_duration: 0
       }
     
     CATCH error:
       LOG_ERROR("Ollama chat error: " + error.message)
       RETURN 500 Service Unavailable
  
  5. ADD_ASSISTANT_RESPONSE:
     session.addMessage("assistant", response, 0)
  
  6. PERSIST_SESSION:
     session.save()
     
     LOG_INFO("Chat message processed", {
       sessionId: sessionId,
       messageCount: session.messageCount
     })
  
  7. RETURN_RESPONSE:
     RETURN 200 OK {
       response: response,
       tokenUsage: usage,
       messageCount: session.messageCount,
       totalSessionCost: 0  // Ollama is free
     }
  
  8. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Chat processing failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 4: Get Session Details

```
FUNCTION getSession(sessionId, userId):
  
  1. FETCH_SESSION:
     session = MONGODB.CareerSession.findById(sessionId)
       .populate("profileId", "-__v")
       .lean()
     
     IF session is NULL:
       RETURN 404 Not Found
  
  2. AUTHORIZATION_CHECK:
     IF session.userId != userId:
       RETURN 403 Forbidden
  
  3. RETURN_RESPONSE:
     RETURN 200 OK {
       sessionId: session._id,
       userId: session.userId,
       recommendations: session.recommendationJSON,
       chatHistory: session.chatHistory,
       status: session.status,
       expiresAt: session.expiresAt,
       messageCount: session.messageCount
     }
  
  4. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Session retrieval failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

---

## Mock Test Service

### Purpose
Delivers timed, multi-section mock exams with automatic scoring, progress tracking, and detailed analytics.

### Components
- **Test Templates**: MockTest model (sections, questions, metadata)
- **Test Attempts**: TestAttempt model (user responses, timing, progress)
- **Questions**: Question bank (categorized by section and difficulty)
- **Analytics**: Scoring and performance metrics

### Algorithm 1: Start Test

**Difficulty Ratios for Question Selection**

```
DIFFICULTY_RATIOS = {
  easy: {
    'Advance Math': { easy: 30, medium: 15, hard: 5 },
    'Basic Math': { easy: 12, medium: 6, hard: 2 },
    'IQ & Logical': { easy: 12, medium: 6, hard: 2 },
    'English': { easy: 16, medium: 13, hard: 1 }
  },
  medium: {
    'Advance Math': { easy: 12, medium: 25, hard: 13 },
    'Basic Math': { easy: 5, medium: 10, hard: 5 },
    'IQ & Logical': { easy: 5, medium: 10, hard: 5 },
    'English': { easy: 8, medium: 21, hard: 1 }
  },
  hard: {
    'Advance Math': { easy: 5, medium: 15, hard: 30 },
    'Basic Math': { easy: 2, medium: 6, hard: 12 },
    'IQ & Logical': { easy: 2, medium: 6, hard: 12 },
    'English': { easy: 1, medium: 28, hard: 1 }
  }
}
```

```
FUNCTION startTest(testDifficulty, userId, userType):
  
  1. VALIDATE_DIFFICULTY:
     IF testDifficulty NOT IN ["easy", "medium", "hard"]:
       RETURN 400 Bad Request {
         error: "Invalid difficulty",
         code: "INVALID_DIFFICULTY"
       }
  
  2. DEFINE_TEST_STRUCTURE:
     sections = [
       { name: "Advance Math", duration: 50, order: 0 },
       { name: "Basic Math", duration: 20, order: 1 },
       { name: "IQ & Logical", duration: 20, order: 2 },
       { name: "English", duration: 30, order: 3 }
     ]
     
     totalDuration = 120 minutes
  
  3. CREATE_ATTEMPT_RECORD:
     attempt = TestAttempt({
       userId: userId,
       userType: userType,
       testId: NULL,  // Dynamically generated
       testDifficulty: testDifficulty,
       currentSection: 0,
       status: "in_progress",
       answers: new Map(),
       markedForReview: [],
       questionOrder: new Map(),
       sectionTimestamps: [
         {
           sectionIndex: 0,
           sectionName: sections[0].name,
           startedAt: NOW(),
           submittedAt: NULL,
           timeSpent: 0
         }
       ],
       startedAt: NOW()
     })
  
  4. SELECT_QUESTIONS_FOR_ALL_SECTIONS:
     FOR EACH section IN sections:
       ratios = DIFFICULTY_RATIOS[testDifficulty][section.name]
       
       selectedQuestions = []
       FOR EACH difficulty IN ["easy", "medium", "hard"]:
         count = ratios[difficulty]
         
         // Fetch questions from question bank
         availableQuestions = MONGODB.Question.find({
           section: section.name,
           difficulty: difficulty,
           testId: NULL  // Unassigned questions
         })
         
         IF availableQuestions.length < count:
           LOG_WARNING("Insufficient questions: " + section.name)
         
         // Shuffle using Fisher-Yates
         shuffled = SHUFFLE_ARRAY(availableQuestions)
         selected = shuffled.slice(0, count)
         
         selectedQuestions.push(...selected.map(q => q._id))
       
       // Store question order in attempt
       attempt.questionOrder.set(section.name, selectedQuestions)
       
       LOG_INFO("Selected " + selectedQuestions.length + " questions for " + section.name)
  
  5. PERSIST_ATTEMPT:
     attempt.save()
     
     LOG_INFO("Test started", {
       attemptId: attempt._id,
       difficulty: testDifficulty,
       userId: userId
     })
  
  6. FETCH_FIRST_SECTION_QUESTIONS:
     firstSection = sections[0]
     questions = getQuestionsForSection(firstSection.name, attempt)
     // Excludes correctAnswer (not sent to client)
  
  7. RETURN_RESPONSE:
     RETURN 201 Created {
       attemptId: attempt._id,
       testDifficulty: testDifficulty,
       currentSection: 0,
       sectionName: firstSection.name,
       sectionDuration: 50,
       questions: questions,
       serverTime: NOW()
     }
  
  8. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Test start failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 2: Save Answer

```
FUNCTION saveAnswer(attemptId, questionId, answer):
  
  1. FETCH_ATTEMPT:
     attempt = MONGODB.TestAttempt.findById(attemptId)
     
     IF attempt is NULL:
       RETURN 404 Not Found
  
  2. AUTHORIZATION_CHECK:
     IF attempt.userId != userId:
       RETURN 403 Forbidden
  
  3. VALIDATE_QUESTION:
     question = MONGODB.Question.findById(questionId)
     
     IF question is NULL:
       RETURN 400 Bad Request {
         error: "Question not found"
       }
  
  4. VALIDATE_ANSWER:
     IF answer NOT IN question.options:
       RETURN 400 Bad Request {
         error: "Invalid answer option"
       }
  
  5. STORE_ANSWER:
     answers = attempt.answers instanceof Map ? 
       attempt.answers : new Map(Object.entries(attempt.answers || {}))
     
     answers.set(questionId, answer)
     attempt.answers = answers
  
  6. PERSIST_ATTEMPT:
     attempt.save()
     
     LOG_INFO("Answer saved", {
       attemptId: attemptId,
       questionId: questionId,
       answer: answer
     })
  
  7. RETURN_RESPONSE:
     RETURN 200 OK {
       success: true,
       attemptId: attemptId,
       questionId: questionId,
       savedAnswer: answer
     }
  
  8. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Save answer failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 3: Mark Question for Review

```
FUNCTION markForReview(attemptId, questionId, marked):
  
  1. FETCH_ATTEMPT:
     attempt = MONGODB.TestAttempt.findById(attemptId)
     
     IF attempt is NULL:
       RETURN 404 Not Found
  
  2. UPDATE_REVIEW_LIST:
     IF marked == true:
       IF questionId NOT IN attempt.markedForReview:
         attempt.markedForReview.push(questionId)
     ELSE:
       attempt.markedForReview = attempt.markedForReview.filter(
         id => id != questionId
       )
  
  3. PERSIST_ATTEMPT:
     attempt.save()
  
  4. RETURN_RESPONSE:
     RETURN 200 OK {
       success: true,
       attemptId: attemptId,
       questionId: questionId,
       marked: marked,
       totalMarked: attempt.markedForReview.length
     }

END FUNCTION
```

### Algorithm 4: Submit Section and Advance

```
FUNCTION submitSection(attemptId, sectionIndex):
  
  1. FETCH_ATTEMPT:
     attempt = MONGODB.TestAttempt.findById(attemptId)
     
     IF attempt is NULL:
       RETURN 404 Not Found
  
  2. VALIDATE_SECTION_INDEX:
     IF sectionIndex < 0 OR sectionIndex > 3:
       RETURN 400 Bad Request {
         error: "Invalid section index"
       }
  
  3. RECORD_SECTION_END_TIME:
     currentTimestamp = attempt.sectionTimestamps[sectionIndex]
     currentTimestamp.submittedAt = NOW()
     currentTimestamp.timeSpent = NOW() - currentTimestamp.startedAt
  
  4. CHECK_IF_LAST_SECTION:
     isLastSection = (sectionIndex == 3)
     
     IF NOT isLastSection:
       // Initialize next section timestamp
       nextSectionIndex = sectionIndex + 1
       attempt.sectionTimestamps.push({
         sectionIndex: nextSectionIndex,
         sectionName: sections[nextSectionIndex].name,
         startedAt: NOW(),
         submittedAt: NULL,
         timeSpent: 0
       })
       
       attempt.currentSection = nextSectionIndex
  
  5. PERSIST_ATTEMPT:
     attempt.save()
  
  6. DETERMINE_RESPONSE:
     IF isLastSection:
       RETURN {
         isLastSection: true,
         attempt: attempt,
         message: "Test completed"
       }
     ELSE:
       nextSection = sections[nextSectionIndex]
       nextQuestions = getQuestionsForSection(
         nextSection.name,
         attempt
       )
       
       RETURN {
         isLastSection: false,
         nextSection: nextSectionIndex,
         sectionName: nextSection.name,
         sectionDuration: nextSection.duration,
         questions: nextQuestions
       }
  
  7. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Section submit failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 5: Complete Test (Scoring Pipeline)

```
FUNCTION completeTest(attempt, calculateScoreFn):
  
  1. FETCH_ATTEMPT:
     attempt = MONGODB.TestAttempt.findById(attempt._id)
     
     IF attempt is NULL:
       RETURN 404 Not Found
  
  2. CHECK_ALREADY_COMPLETED:
     IF attempt.status == "completed":
       LOG_INFO("Test already completed: " + attempt._id)
       RETURN attempt  // Idempotent
  
  3. CALCULATE_SCORES:
     score = calculateScoreFn(attempt)
     // Returns: { total, bySection: {...}, percentage: ... }
     
     LOG_INFO("Scores calculated", {
       attemptId: attempt._id,
       totalScore: score.total,
       percentage: score.percentage
     })
  
  4. UPDATE_ATTEMPT_STATUS:
     attempt.status = "completed"
     attempt.completedAt = NOW()
     attempt.score = score
  
  5. CALCULATE_TOTAL_TIME:
     totalTime = calculateRemainingTime(attempt, -1)  // Full duration
     attempt.totalTimeSpent = totalTime
  
  6. PERSIST_COMPLETED_ATTEMPT:
     attempt.save()
  
  7. GENERATE_ANALYTICS:
     analyticsData = {
       attemptId: attempt._id,
       userId: attempt.userId,
       difficulty: attempt.testDifficulty,
       score: attempt.score,
       completedAt: attempt.completedAt,
       totalTimeSpent: attempt.totalTimeSpent
     }
     
     // Store for analytics dashboard
     MONGODB.Analytics.insertOne(analyticsData)
  
  8. RETURN_RESPONSE:
     RETURN {
       attemptId: attempt._id,
       status: "completed",
       score: attempt.score,
       completedAt: attempt.completedAt,
       totalTimeSpent: attempt.totalTimeSpent
     }
  
  9. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Test completion failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 6: Calculate Remaining Time

```
FUNCTION calculateRemainingTime(attempt, sectionIndex):
  
  1. DEFINE_SECTION_DURATIONS:
     sectionDurations = {
       0: 50,  // Advance Math (minutes)
       1: 20,  // Basic Math
       2: 20,  // IQ & Logical
       3: 30   // English
     }
  
  2. EXTRACT_TIMESTAMPS:
     IF sectionIndex == -1:  // Full test duration
       totalDuration = sum(sectionDurations.values())
       startTime = attempt.startedAt
     ELSE:
       totalDuration = sectionDurations[sectionIndex]
       sectionTimestamp = attempt.sectionTimestamps[sectionIndex]
       startTime = sectionTimestamp.startedAt
  
  3. CALCULATE_ELAPSED:
     elapsedMs = NOW() - startTime
     elapsedSeconds = elapsedMs / 1000
     elapsedMinutes = elapsedSeconds / 60
  
  4. COMPUTE_REMAINING:
     remainingMinutes = totalDuration - elapsedMinutes
     
     IF remainingMinutes < 0:
       remainingMinutes = 0  // Time expired
  
  5. RETURN:
     RETURN remainingMinutes

END FUNCTION
```

---

## Career Stats Service

### Purpose
Provides career statistics and analytics data including salary information, career search, and aggregated statistics.

### Components
- **Career Data**: Preprocessed career profiles with salary data
- **Search Index**: Indexed database for fast career lookup
- **Statistics**: Aggregated metrics and analytics

### Algorithm: Search and Retrieve Career Stats

```
FUNCTION searchCareersByQuery(query):
  
  1. VALIDATE_QUERY:
     IF query is empty or length < 2:
       RETURN 400 Bad Request {
         error: "Query must be at least 2 characters"
       }
  
  2. BUILD_SEARCH_INDEX:
     searchRegex = RegExp(query, "i")  // Case-insensitive
  
  3. EXECUTE_SEARCH:
     results = MONGODB.Career.find({
       $or: [
         { title: { $regex: searchRegex } },
         { description: { $regex: searchRegex } },
         { keywords: { $in: [query.toLowerCase()] } }
       ]
     })
     .select("-__v")
     .limit(50)
     .lean()
  
  4. ENRICH_RESULTS:
     enrichedResults = results.map(career => ({
       _id: career._id,
       title: career.title,
       description: career.description,
       salary: {
         min: career.salary.min,
         max: career.salary.max,
         avg: (career.salary.min + career.salary.max) / 2
       },
       growthRate: career.growthRate,
       demandLevel: career.demandLevel,
       relatedDegrees: career.relatedDegrees,
       skills: career.skills
     }))
  
  5. RETURN_RESPONSE:
     RETURN 200 OK {
       success: true,
       query: query,
       resultCount: enrichedResults.length,
       results: enrichedResults
     }
  
  6. ERROR_HANDLING:
     TRY:
       [above logic]
     CATCH error:
       LOG_ERROR("Career search failed: " + error.message)
       RETURN 500 Server Error

END FUNCTION
```

### Algorithm 2: Retrieve Career Statistics

```
FUNCTION getCareerStats():
  
  1. FETCH_ALL_CAREERS:
     allCareers = MONGODB.Career.find({})
       .select("salary demandLevel growthRate")
       .lean()
  
  2. COMPUTE_STATISTICS:
     stats = {
       totalCareers: allCareers.length,
       salaryStats: {
         minimum: MIN(allCareers.map(c => c.salary.min)),
         maximum: MAX(allCareers.map(c => c.salary.max)),
         average: MEAN(allCareers.map(c => 
           (c.salary.min + c.salary.max) / 2
         )),
         median: MEDIAN(allCareers.map(c => 
           (c.salary.min + c.salary.max) / 2
         ))
       },
       demandDistribution: {
         high: COUNT(allCareers.filter(c => c.demandLevel == "high")),
         medium: COUNT(allCareers.filter(c => c.demandLevel == "medium")),
         low: COUNT(allCareers.filter(c => c.demandLevel == "low"))
       },
       growthTrend: {
         fastGrowing: COUNT(allCareers.filter(c => c.growthRate > 0.10)),
         moderate: COUNT(allCareers.filter(c => c.growthRate <= 0.10 && c.growthRate >= 0)),
         declining: COUNT(allCareers.filter(c => c.growthRate < 0))
       }
     }
  
  3. CALCULATE_PERCENTILES:
     salaries = allCareers.map(c => (c.salary.min + c.salary.max) / 2).sort()
     
     stats.salaryPercentiles = {
       p25: PERCENTILE(salaries, 25),
       p50: PERCENTILE(salaries, 50),
       p75: PERCENTILE(salaries, 75),
       p90: PERCENTILE(salaries, 90)
     }
  
  4. CACHE_RESULTS:
     CACHE.set("career-stats", stats, TTL=3600)  // 1 hour
  
  5. RETURN_RESPONSE:
     RETURN 200 OK {
       success: true,
       stats: stats,
       timestamp: NOW(),
       cacheExpiry: NOW() + 3600
     }

END FUNCTION
```

---

## System Integration & Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
└────────┬──────────────────────────────────────────┬──────────┘
         │                                          │
         │ HTTP REST Requests                       │
         ▼                                          ▼
    ┌─────────────────────────────────────────────────────┐
    │          API Gateway (Express)                       │
    │  - Request routing                                   │
    │  - Service proxying                                  │
    │  - Error handling                                    │
    └──────┬──────────┬──────────┬──────────┬──────────────┘
           │          │          │          │
    ┌──────▼──┐ ┌────▼─────┐ ┌──▼──────┐ ┌▼──────────┐
    │  Auth   │ │ Chatbot  │ │ Career  │ │Mock Test  │
    │Service  │ │ Service  │ │ Service │ │Service    │
    │(5001)   │ │ (5002)   │ │ (5003)  │ │(5005)     │
    └───┬─────┘ └────┬─────┘ └────┬────┘ └──┬────────┘
        │            │            │         │
    ┌───▼─────────────▼────────────▼─────────▼────────┐
    │                                                  │
    │        MongoDB (Shared Database)                │
    │  - Users (auth)                                 │
    │  - Conversations (chat)                         │
    │  - Career Profiles & Sessions                   │
    │  - Test Attempts & Questions                    │
    │                                                  │
    └──────────────────────────────────────────────────┘
         │                    │
    ┌────▼─────────┐    ┌────▼──────────┐
    │ FastAPI RAG  │    │ Ollama LLM    │
    │ Server       │    │ (Local)       │
    └──────────────┘    └───────────────┘
```

---

## Authentication Flow Diagram

```
    Request
      │
      ▼
┌─────────────────────────┐
│ Identify User Type      │
├─────────────────────────┤
│ - Check JWT token       │
│ - Check guest ID header │
└──────┬──────────┬───────┘
       │          │
   REGISTERED    GUEST
       │          │
    ┌──▼──┐  ┌────▼────────────┐
    │Auth │  │Create/Refresh   │
    │from │  │Guest Session    │
    │JWT  │  │(8hr TTL)        │
    └──┬──┘  └─────┬───────────┘
       │           │
       └─────┬─────┘
             │
             ▼
      ┌─────────────────┐
      │ Attach to req   │
      │ req.user        │
      │ req.user.type   │
      └────────┬────────┘
               │
               ▼
        Proceed with request
```

---

## Error Handling Standards

All services follow these error response patterns:

```javascript
// 400 Bad Request
{
  error: "Descriptive message",
  code: "SPECIFIC_ERROR_CODE"
}

// 401 Unauthorized
{
  error: "Authentication required or invalid credentials",
  code: "UNAUTHORIZED"
}

// 403 Forbidden
{
  error: "User does not have permission",
  code: "FORBIDDEN"
}

// 404 Not Found
{
  error: "Resource not found",
  code: "NOT_FOUND"
}

// 429 Rate Limited
{
  error: "Too many requests",
  code: "RATE_LIMIT_EXCEEDED"
}

// 500 Server Error
{
  error: "Internal server error message",
  code: "SERVER_ERROR"
}
```

---

## Performance Considerations

### Caching Strategy
- **Career Stats**: 1-hour TTL cache
- **Session Data**: Real-time (no cache)
- **Question Bank**: Load into memory for startTest()
- **Conversation History**: Direct MongoDB queries

### Database Indexing
```
// Authentication
- Users.email (unique)
- GuestSession.guestId (unique)
- GuestSession.expireAt (TTL index)

// Chatbot
- conversations.participants (compound)
- conversations.createdAt

// Career Counselling
- CareerProfile.userId
- CareerSession.userId, status
- CareerSession.expiresAt (TTL index)

// Mock Tests
- TestAttempt.userId, status
- TestAttempt.startedAt
- Question.section, difficulty, testId

// Career Stats
- Career.title (text index)
- Career.keywords (array index)
```

### Scalability Notes
- Services run independently (horizontal scaling)
- MongoDB Atlas for managed database
- Rate limiting (5 test starts/hour per user)
- Connection pooling configured in all services
- Graceful degradation for AI service failures

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Services Covered**: 6 microservices + Gateway  
**Total Endpoints**: 30+
