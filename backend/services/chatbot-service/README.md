# Chatbot Service

The chatbot service powers the conversation experience used in the dashboard and AI assistant screens.

## Responsibilities

- Send and receive chat messages for authenticated users and guests
- Persist conversation history in MongoDB
- Manage multiple conversations per user
- Enforce request validation and authentication/guest checks

## Default port

- `5002`

## Scripts

```powershell
npm run dev
npm start
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Service port |
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SERVICE_URL` | Auth service URL used for token verification |
| `RAG_API_URL` | Optional RAG/assistant backend URL |
| `RAG_USE_LLM` | Enables or disables LLM usage in RAG flows |
| `LOG_LEVEL` | Logger level |

## Run locally

From `backend/services/chatbot-service`:

```powershell
npm install
npm run dev
```

## API endpoints

Base path: `/api/chatbot`

- `POST /message` — send a message
- `GET /history/:id` — fetch conversation history
- `DELETE /history/:id` — clear a conversation history
- `GET /conversations` — list all conversations
- `POST /conversations/new` — create a new conversation

## Health check

- `GET /health`

## Data layer

- MongoDB stores conversation and message records
- Auth checks can validate bearer tokens or guest sessions

## Notes

- This service is mounted behind the gateway at `http://localhost:5000/api/chatbot`.
- When testing directly, use port `5002`.
