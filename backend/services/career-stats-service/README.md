# Career Service

The `career-service` is a lightweight read-only microservice that serves career and salary information from a shared JSON dataset.

It provides:
- complete career salary listings,
- keyword-based search by job title,
- aggregate salary statistics.

---

## What this service does

`career-service` loads salary data once at startup from:

`backend/shared/data/payscale/pakistan_job_salaries.json`

After loading, it exposes HTTP endpoints for clients (typically the frontend or gateway) to:

1. fetch all careers,
2. search careers by job title,
3. fetch computed salary stats (min, max, average, median).

This service does **not** write to any database and does **not** call external APIs.

---

## Tech stack

- Node.js
- Express
- CORS middleware
- ES Modules (`"type": "module"`)

---

## Project structure

```text
career-service/
├─ src/
│  ├─ index.js                         # Express app bootstrap + routes
│  ├─ controllers/
│  │  └─ careerController.js           # Request handlers
│  └─ services/
│     └─ careerService.js              # Data loading + business logic
├─ package.json
└─ Dockerfile
```

---

## Runtime behavior

### 1) Startup data load

When the process starts, `src/services/careerService.js`:

- resolves the shared JSON file path relative to service code,
- reads the file synchronously with `fs.readFileSync(..., 'utf8')`,
- parses JSON into in-memory `salaryData`.

If loading fails, it logs an error and keeps `salaryData` as an empty array.

### 2) Request handling flow

`src/index.js` wires routes to controller functions from `src/controllers/careerController.js`, which delegate to `src/services/careerService.js` functions.

Flow:

`HTTP Request -> Controller -> Service -> JSON Response`

---

## API endpoints

Base URL (local default): `http://localhost:5004`

### Health check

`GET /health`

Response:

```json
{
  "status": "ok"
}
```

---

### Get all careers

`GET /api/careers`

Behavior:
- returns the entire loaded dataset.

Success response shape:

```json
{
  "success": true,
  "count": 123,
  "careers": [
    {
      "job_title": "Software Engineer",
      "average_salary": "PKR 150,000"
    }
  ]
}
```

Error response shape:

```json
{
  "success": false,
  "message": "Failed to fetch careers",
  "error": "<error-message>"
}
```

---

### Search careers by query

`GET /api/careers/search?q=<keyword>`

Behavior:
- case-insensitive substring match against `job_title`,
- if `q` is missing/empty, returns all careers.

Example:

`GET /api/careers/search?q=engineer`

Success response shape:

```json
{
  "success": true,
  "count": 42,
  "careers": [
    {
      "job_title": "Mechanical Engineer",
      "average_salary": "PKR 120,000"
    }
  ]
}
```

Error response shape:

```json
{
  "success": false,
  "message": "Failed to search careers",
  "error": "<error-message>"
}
```

---

### Get salary statistics

`GET /api/careers/stats`

Behavior:
- strips all non-digit characters from each `average_salary`,
- parses numeric salaries,
- computes:
  - `total_jobs`
  - `min_salary`
  - `max_salary`
  - `avg_salary` (rounded)
  - `median_salary`

If no salary data is available, stats can be `null`.

Success response shape:

```json
{
  "success": true,
  "stats": {
    "total_jobs": 123,
    "min_salary": 30000,
    "max_salary": 450000,
    "avg_salary": 135000,
    "median_salary": 120000
  }
}
```

Error response shape:

```json
{
  "success": false,
  "message": "Failed to fetch stats",
  "error": "<error-message>"
}
```

---

## Internal functions (service layer)

Defined in `src/services/careerService.js`:

- `listCareers()`
  - returns full in-memory `salaryData`.

- `searchCareers(query)`
  - returns filtered careers by `job_title` match,
  - returns full data when query is absent.

- `getSalaryStats()`
  - computes aggregate salary metrics from `average_salary` strings,
  - returns `null` if dataset is empty.

- `getCareerByTitle(title)`
  - returns first matching job by title,
  - currently not exposed as an HTTP endpoint.

---

## Configuration

### Environment variables

- `PORT` (optional): service port (default: `5004`)

No database variables are required for this service.

---

## Run locally

From `talk2fast-backend/services/career-stats-service`:

```powershell
npm install
npm run dev
```

Production-style run:

```powershell
npm start
```

---

## Quick verification

```powershell
Invoke-RestMethod http://localhost:5004/health
Invoke-RestMethod http://localhost:5004/api/careers
Invoke-RestMethod "http://localhost:5004/api/careers/search?q=engineer"
Invoke-RestMethod http://localhost:5004/api/careers/stats
```

---

## Design characteristics

- **Read-only service:** no create/update/delete endpoints.
- **In-memory dataset:** fast reads after startup.
- **Simple failure mode:** if data file cannot load, API still starts but returns empty/`null` results.
- **No authentication in this service:** expected to be enforced upstream (e.g., gateway).

---

## Known limitations

- Data is loaded only once at startup (no hot reload of JSON changes).
- Salary parsing assumes `average_salary` contains digits that can be extracted.
- Search only covers `job_title` substring matching (no ranking, stemming, or fuzzy matching).
- `getCareerByTitle()` exists in code but is not exposed through an API route.

---

## Suggested future improvements

- Add pagination and limit/offset query parameters for `/api/careers`.
- Add sort/filter options (salary range, category/industry if available).
- Add endpoint for single career lookup by exact/slug title.
- Add schema validation for source JSON at startup.
- Add unit tests for salary parsing, search behavior, and stats calculation.
