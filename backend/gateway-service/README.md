# Gateway Service

The gateway service is the single entry point for backend traffic. It forwards requests to the individual microservices and keeps the frontend pointed at one base URL.

## Purpose

- Proxy `/api/auth` to the auth service
- Proxy `/api/chatbot` to the chatbot service
- Proxy `/api/career` to the career counselling service
- Proxy `/api/careers` to the career stats service
- Proxy `/api/mock-tests` to the mock test service
- Provide a simple `/` response and `/health` endpoint

## Scripts

```powershell
npm run dev
npm start
```

## Default port

- `5000`

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Gateway listen port |
| `AUTH_SERVICE_URL` | `http://localhost:5001` | Auth service target |
| `CHATBOT_SERVICE_URL` | `http://localhost:5002` | Chatbot service target |
| `CAREER_SERVICE_URL` | `http://localhost:5003` | Career counselling target |
| `CAREER_STATS_URL` | `http://localhost:5004` | Career stats target |
| `MOCK_TEST_SERVICE_URL` | `http://localhost:5005` | Mock test service target |
| `LOG_LEVEL` | `info` | Gateway log verbosity |

## Local development

From `backend/gateway-service`:

```powershell
npm install
npm run dev
```

If you start the gateway through `backend/package.json`, make sure the downstream services are running as well.

## Routes

### Health and info

- `GET /` — gateway status and route list
- `GET /health` — gateway health and service targets

### Proxied APIs

- `/api/auth/*`
- `/api/chatbot/*`
- `/api/career/*`
- `/api/careers/*`
- `/api/mock-tests/*`

## Notes

- Static assets from `public/` are served directly by the gateway.
- The gateway logs every request and proxy response for easier debugging.
- In development, the frontend can use the gateway as its base API URL.
