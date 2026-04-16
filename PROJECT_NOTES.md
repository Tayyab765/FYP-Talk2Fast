# Project Development Notes

## Mock Test Module

### Database Architecture
- **Database**: `hamza_mocktest` (isolated MongoDB instance)
- **Collections**: mocktests, questions, testattempts, analytics
- **Port**: 5005
- **Service**: backend/services/mock-test-service

### MCQ Generation Summary

#### Basic Math MCQs
- **Topics Covered**: Algebra, Geometry, Trigonometry, Calculus, Statistics, Probability, Matrices, Sequences
- **Total Questions**: 120+ questions across all basic math topics
- **Files**: `basic_math_mcqs_combined.json`, `basic_math_mcqs/` folder

#### IQ & Logical Reasoning MCQs
- **Topics**: Pattern Recognition, Logical Sequences, Spatial Reasoning, Analogies
- **File**: `iq_logical_reasoning_mcqs.json`

#### Complete MCQ Collection
- **Total Questions**: 500+ questions
- **Categories**: Advance Math, Basic Math, IQ, English, General Knowledge
- **Files**: 
  - `complete_fast_mcqs_collection.json` (current)
  - `extended_fast_mcqs_comprehensive.json` (expanded version)
  - `fast_mcqs.json` (original)

### Database Seeding
All MCQ collections have been seeded into the `hamza_mocktest` database using the seeding scripts in the mock-test-service.

### Mock Test Module Plan
- **Frontend**: React components in `Frontend/src/pages/MockTests/`
- **Backend**: Microservice on port 5005
- **Features**: 
  - 4-section test format (Advance Math, Basic Math, IQ, English)
  - 120 questions, 120 minutes total
  - Sequential navigation (no going back)
  - Auto-save answers
  - Real-time timer
  - Performance analytics
  - Question palette with status indicators

## Port Allocation

| Service | Port |
|---------|------|
| Gateway | 5000 |
| Auth | 5001 |
| Chatbot | 5002 |
| Career Counselling | 5003 |
| Career Stats | 5004 |
| Mock Test | 5005 |
| RAG Service | 8000 |
| MongoDB | 27017 |

## Development Status

### Completed
- ✅ Mock Test Service backend (15 API endpoints)
- ✅ MCQ generation for all topics
- ✅ Database seeding
- ✅ Frontend components (TestTaking, TestResults, TestAnalytics)
- ✅ Authentication & authorization
- ✅ Rate limiting & security
- ✅ Performance optimization

### Integration Notes
- Mock test service integrated with API Gateway
- Uses shared authentication service
- Isolated database to prevent conflicts with other modules
- Docker configuration added to docker-compose.yml

## Files Generated
- Python scripts: `create_iq_mcqs.py`, `create_remaining_basic_math_topics.py`
- JSON data files: Multiple MCQ collections
- Documentation: Consolidated into `backend/services/mock-test-service/DOCS.md`
