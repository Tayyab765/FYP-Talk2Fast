# Talk2FAST Frontend

React + Vite client for the Talk2FAST platform. It provides the public landing pages, authentication screens, dashboard, career counselling flows, chatbot UI, and mock test experience.

## Setup

```powershell
npm install
```

## Run locally

```powershell
npm run dev
```

Then open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Build

```powershell
npm run build
```

## Preview a production build

```powershell
npm run preview
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Gateway base URL used by API helpers; defaults to same-origin `/api` in dev |
| `VITE_GROQ_API_KEY` | Optional Groq API key used for question explanations |

If `VITE_API_BASE_URL` is unset during development, the app uses `/api` and expects the Vite proxy to forward traffic to the backend gateway.

## Pages and routes

### Public routes

- `/` — landing page
- `/login` — sign in form
- `/signup` — account creation form

### Dashboard routes

- `/dashboard` — overview dashboard
- `/dashboard/chat` — chatbot assistant
- `/dashboard/mock-tests` — mock test list
- `/dashboard/mock-tests/take` — test-taking flow
- `/dashboard/mock-tests/results/:attemptId` — attempt results
- `/dashboard/mock-tests/analytics` — mock test analytics
- `/dashboard/settings` — dashboard settings entry point

### Career counselling routes

- `/dashboard/career` — career counselling dashboard
- `/dashboard/career/questionnaire` — assessment form
- `/dashboard/career/profile` — career profile view
- `/dashboard/career/recommendations` — AI recommendations
- `/dashboard/career/chat` — follow-up career chat
- `/dashboard/career/payscale` — salary and payscale view

## Key UI building blocks

- `src/layouts/PublicLayout.jsx` — layout for public pages
- `src/layouts/DashboardLayout.jsx` — authenticated dashboard shell
- `src/context/AuthContext.jsx` — auth state and session helpers
- `src/context/NotificationContext.jsx` — toast-style notifications
- `src/context/TestContext.jsx` — mock test session state
- `src/components/ErrorBoundary.jsx` — catches render-time errors in protected areas

## Main API hooks

- `src/config/api.js` — resolves the backend gateway base URL
- `src/api/auth.js` — auth requests
- `src/api/chat.js` — chatbot requests
- `src/api/career.js` — career counselling requests
- `src/api/mockTestApi.js` — mock test requests
- `src/api/groq.js` — Groq-powered question explanations

## Project structure

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   └── utils/
├── public/
├── index.html
├── vite.config.js
└── package.json
```

## Development notes

- Start the backend gateway first so the frontend can call the API routes.
- In development, the frontend is designed to work with the gateway at `http://localhost:5000`.
- Keep `VITE_GROQ_API_KEY` out of Git by storing it in a local `.env` file.

## Tech stack

- React 18
- Vite
- React Router 6
- Recharts
- CSS modules and plain CSS
