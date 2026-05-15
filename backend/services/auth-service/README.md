# Auth Service

The auth service handles user authentication, profile lookup, password recovery, and guest session support.

## Responsibilities

- Sign up and login with Supabase-backed auth flows
- Return the authenticated user profile
- Handle logout and forgot-password flows
- Create and verify guest sessions for anonymous users
- Provide token verification for other backend services

## Default port

- `5001`

## Scripts

```powershell
npm run dev
npm start
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Service port |
| `MONGODB_URI` | MongoDB connection string for user and session data |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for privileged operations |
| `FRONTEND_URL` | Frontend redirect target for auth flows |
| `LOG_LEVEL` | Logger level |

## Run locally

From `backend/services/auth-service`:

```powershell
npm install
npm run dev
```

## API endpoints

Base path: `/api/auth`

### Public or semi-public

- `POST /signup` — create a new account
- `POST /login` — sign in with email/password
- `POST /forgot-password` — send password reset instructions
- `POST /guest-session` — create a guest session
- `GET /verify` — verify a bearer token for other services
- `GET /guest/:guestId` — verify a guest session for other services

### Authenticated

- `POST /logout` — sign out the current user
- `GET /profile` — fetch the current user profile

## Data dependencies

- MongoDB stores user records and guest sessions
- Supabase handles identity and token validation

## Health check

- `GET /health`

## Notes

- This service is mounted behind the gateway at `http://localhost:5000/api/auth`.
- When testing directly, use port `5001`.
