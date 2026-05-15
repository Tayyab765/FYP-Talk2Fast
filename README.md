# Talk2Fast / FYP

Talk2Fast is a full-stack student support platform with a React frontend and a Node.js backend built as a microservices workspace.

## What’s in this repo

- `backend/` — API gateway, authentication, chatbot, career, career-stats, and mock-test services
- `frontend/` — Vite + React client for login, dashboard, career counselling, chat, and mock tests
- `documentation/` — architecture, migration, verification, and setup notes
- `backend/tests/` — HTTP request collections for local API testing

## Architecture

The backend is split into these services:

| Service | Port | Purpose |
| --- | ---: | --- |
| `gateway-service` | `5000` | Single entry point that proxies requests to the backend services |
| `auth-service` | `5001` | Supabase + MongoDB authentication and guest sessions |
| `chatbot-service` | `5002` | Chat conversations, history, and assistant flows |
| `career-counselling` | `5003` | AI-powered career assessment and recommendations |
| `career-stats-service` | `5004` | Read-only salary and payscale dataset APIs |
| `mock-test-service` | `5005` | FAST-style test practice, attempts, and analytics |

## Quick start

### Backend

```powershell
cd backend
npm install
npm run dev
```

This starts the gateway and all backend services defined in `backend/package.json`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Environment setup

Create the required `.env` files in the relevant service folders before starting the app.

### Common backend settings

- `PORT`
- `MONGODB_URI`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`
- `AUTH_SERVICE_URL`
- `CHATBOT_SERVICE_URL`
- `CAREER_SERVICE_URL`
- `CAREER_STATS_URL`
- `MOCK_TEST_SERVICE_URL`
- `LOG_LEVEL`

### Career counselling settings

- `OLLAMA_API_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT`
- `SESSION_EXPIRY_DAYS`
- `CORS_ORIGIN`

### Mock test settings

- `MOCKTEST_MONGODB_URI`

### Frontend settings

- `VITE_API_BASE_URL`
- `VITE_GROQ_API_KEY`

## API entry points

Use the gateway in local development whenever possible:

- `http://localhost:5000/api/auth`
- `http://localhost:5000/api/chatbot`
- `http://localhost:5000/api/career`
- `http://localhost:5000/api/careers`
- `http://localhost:5000/api/mock-tests`

## Documentation

- `backend/README.md` — backend workspace overview
- `backend/services/career-counselling/README.md`
- `backend/services/career-stats-service/README.md`
- `backend/services/mock-test-service/README.md`
- `backend/services/auth-service/README.md`
- `backend/services/chatbot-service/README.md`
- `backend/gateway-service/README.md`
- `frontend/README.md`

## Notes

- `.env` files are ignored by Git at the repo and backend levels.
- The frontend uses the gateway as its API base in development.
- Existing migration and verification docs live under `documentation/`.
