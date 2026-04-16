# Mock Test Service

A microservice for the FAST University Entry Test Preparation System that provides realistic practice tests simulating the actual FAST NUCES entrance exam experience.

## Features

- **Exact FAST Test Format**: 4 sections, 120 questions, 120 minutes
- **Sequential Navigation**: No backward movement between sections
- **Real-time Timer**: Auto-submit on timeout with server synchronization
- **Auto-save**: Automatic answer persistence with retry logic
- **Question Palette**: Visual status indicators for all questions
- **Comprehensive Analytics**: Performance tracking and recommendations
- **Multi-user Support**: Both authenticated and guest users
- **Isolated Database**: Separate MongoDB database (hamza_mocktest)

## Architecture

The service follows a microservices architecture:
- **Port**: 5005
- **API Gateway**: Routes `/api/mock-tests/*` requests from port 5000
- **Database**: MongoDB (hamza_mocktest) - isolated from main database
- **Authentication**: Supabase via Auth Service

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or connection URI
- API Gateway service running on port 5000

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and other settings

# Seed sample data
npm run seed

# Start the service
npm run dev
```

### Environment Variables

```env
PORT=5005
MOCKTEST_MONGODB_URI=mongodb://localhost:27017/hamza_mocktest
AUTH_SERVICE_URL=http://localhost:5001
NODE_ENV=development
```

## Database Setup

The service uses a separate MongoDB database (`hamza_mocktest`) with the following collections:

- **mocktests**: Test templates
- **questions**: Question bank
- **testattempts**: User test attempts
- **analytics**: Performance analytics

### Indexes

All required indexes are automatically created on first run. Verify with:

```bash
npm run verify-indexes
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints

- `GET /api/mock-tests` - List available tests
- `POST /api/mock-tests/:testId/start` - Start a test
- `PUT /api/mock-tests/attempts/:attemptId/answer` - Save answer
- `POST /api/mock-tests/attempts/:attemptId/submit` - Submit test
- `GET /api/mock-tests/attempts/:attemptId/results` - View results
- `GET /api/mock-tests/analytics/performance` - Performance analytics

## Development

### Scripts

```bash
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start production server
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run seed             # Seed sample data
npm run cleanup          # Clear attempts and analytics
npm run cleanup:all      # Clear all data
npm run verify-indexes   # Verify database indexes
npm run test:performance # Run performance tests
```

### Project Structure

```
mock-test-service/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middlewares/      # Auth, validation, rate limiting
│   ├── config/           # Database connection
│   └── utils/            # Helpers and utilities
├── logs/                 # Winston logs
├── server.js             # Entry point
└── package.json
```

## Security

### Input Sanitization
All inputs are sanitized to prevent:
- XSS attacks
- MongoDB injection
- SQL injection
- Prototype pollution
- Null byte injection

See [SECURITY_SANITIZATION.md](./SECURITY_SANITIZATION.md) for details.

### Authorization
- All protected endpoints verify user ownership
- Cross-user access is prevented
- Comprehensive authorization tests

See [AUTHORIZATION_VERIFICATION.md](./AUTHORIZATION_VERIFICATION.md) for details.

### Rate Limiting
- Test starts: 5 per hour per user
- Answer submissions: 200 per minute per user
- General endpoints: 100 per 15 minutes per user

See [RATE_LIMITING.md](./RATE_LIMITING.md) for details.

## Performance

### Optimization Features
- Database indexes on all query fields
- In-memory caching for test templates (10-minute TTL)
- Connection pooling (50 max, 10 min)
- Lazy loading of section questions

### Performance Targets
- Section load: < 500ms
- Answer save: < 500ms
- Question navigation: < 200ms
- Score calculation: < 2 seconds
- Concurrent users: 50+

See [TASK_25_COMPLETION_REPORT.md](./TASK_25_COMPLETION_REPORT.md) for performance test results.

## Testing

### Unit Tests
```bash
npm test
```

Tests cover:
- Input validation and sanitization
- Authorization enforcement
- Rate limiting
- Business logic

### Performance Tests
```bash
npm run test:performance
```

Tests verify:
- Response times meet requirements
- Database indexes are used efficiently
- Caching works correctly

## Deployment

### Docker

```bash
# Build image
docker build -t mock-test-service .

# Run container
docker run -p 5005:5005 \
  -e MOCKTEST_MONGODB_URI=mongodb://mongo:27017/hamza_mocktest \
  mock-test-service
```

### Docker Compose

The service is included in the main `docker-compose.yml`:

```bash
cd ../../
docker-compose up mock-test-service
```

## Monitoring

### Logs

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only

Log levels:
- `error`: Critical errors
- `warn`: Warnings (e.g., rate limit violations)
- `info`: General information
- `debug`: Detailed debugging (development only)

### Health Check

```bash
curl http://localhost:5005/health
```

## Troubleshooting

### Service won't start
- Check MongoDB connection URI
- Verify port 5005 is available
- Check logs in `logs/error.log`

### Tests failing
- Ensure MongoDB is running
- Run `npm run cleanup` to clear test data
- Check environment variables

### Performance issues
- Verify indexes: `npm run verify-indexes`
- Check cache hit rate in logs
- Monitor MongoDB connection pool

## Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Run tests before committing

## License

Proprietary - FAST University Entry Test Preparation System
