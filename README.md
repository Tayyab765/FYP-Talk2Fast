# Talk2Fast Backend

This project is a backend application for the Talk2Fast platform, which provides chat and authentication functionalities using Supabase for authentication and MongoDB for application data storage.

## 🏗️ Architecture

**Now Available in Two Architectures:**

### 🆕 Microservices Architecture (Recommended)
- **API Gateway** (Port 5000): Single entry point routing to all services
- **Auth Service** (Port 5001): User authentication, guest sessions
- **Chatbot Service** (Port 5002): Conversations, AI responses
- **Supabase**: User authentication backend
- **MongoDB**: Application data storage

### 📦 Monolithic Architecture (Legacy)
- **Single Server** (Port 5000): All features in one application
- **Supabase**: Handles user authentication (signup, login, OAuth, session management)
- **MongoDB**: Stores all application data (user profiles, conversations, messages)

> **See [MICROSERVICES.md](./MICROSERVICES.md) for detailed architecture documentation.**

## Table of Contents

- [Architecture](#-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Microservices Documentation](#-microservices-documentation)
- [Environment Variables](#environment-variables)
- [Google OAuth Setup](#google-oauth-setup)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)
- [License](#license)

## 📚 Microservices Documentation

**Complete migration from monolith to microservices!**

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[MICROSERVICES.md](./MICROSERVICES.md)** - Detailed architecture guide
- **[FEATURE_VERIFICATION.md](./FEATURE_VERIFICATION.md)** - Feature parity verification
- **[ENDPOINT_MAPPING.md](./ENDPOINT_MAPPING.md)** - API compatibility matrix
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Command & endpoint reference
- **[microservices.http](./microservices.http)** - API test suite

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/talk2fast-backend.git
   cd talk2fast-backend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and fill in the required environment variables.

4. Make sure MongoDB is running locally or update `MONGODB_URI` to point to your MongoDB instance.

## Usage

### 🚀 Microservices (Recommended)

Start all microservices:
```bash
npm run dev
```

Or start services individually:
```bash
npm run dev:gateway    # API Gateway
npm run dev:auth       # Auth Service
npm run dev:chatbot    # Chatbot Service
```

### 📦 Monolith (Legacy)

Start the original monolithic server:
```bash
npm run start:monolith
```
or
```bash
node server.js
```

> **Quick Start Guide:** See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

## Environment Variables

The following environment variables are required:

- `PORT`: Server port (default: 5000)
- `SUPABASE_URL`: The URL of your Supabase instance
- `SUPABASE_KEY`: The anonymous key for your Supabase instance
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `MONGODB_URI`: MongoDB connection string
- `GOOGLE_CALLBACK_URL`: OAuth callback URL (must match Supabase configuration)
- `FRONTEND_URL`: Frontend application URL for OAuth redirects
- `OPENAI_KEY`: OpenAI API key (for AI chat features)
- `PYTHON_PATH`: (Optional) Path to Python executable for local Whisper transcription
- `NODE_ENV`: Environment (development/production)

See `.env.example` for a complete list.

## Google OAuth Setup

### 1. Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Set the **Redirect URL** to: `http://localhost:5000/api/auth/google/callback` (or your production URL)

### 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Go to **APIs & Services** → **Credentials**
5. Create **OAuth 2.0 Client ID**
6. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:5000/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your Supabase Dashboard

### 3. Update Environment Variables

Add to your `.env` file:
```env
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### 4. OAuth Flow

1. **Frontend**: User clicks "Login with Google"
2. **Frontend** calls `GET /api/auth/google`
3. **Backend** returns Google OAuth URL
4. **Frontend** redirects user to OAuth URL
5. **User** authenticates with Google
6. **Google** redirects to `/api/auth/google/callback`
7. **Backend** exchanges code for session, creates/updates user in MongoDB
8. **Backend** redirects to frontend with tokens
9. **Frontend** stores tokens and makes authenticated requests

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Email/password signup
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `POST /api/auth/forgot-password` - Request password reset

### Chat

- `POST /api/chatbot/message` - Send a message (requires auth)
- `GET /api/chatbot/history/:id` - Get conversation history by ID or user ID (requires auth)
- `DELETE /api/chatbot/history/:id` - Clear conversation history (requires auth)

### Speech-to-Text (NEW)

- `POST /api/transcribe` - Upload audio file and get transcription (FREE & LOCAL!)
  - **100% Free** - No API costs, runs locally on your server
  - **Private** - Audio never leaves your server
  - **Bilingual** - Supports English & Urdu
  - Accepts multipart/form-data with `audio` field
  - Supports MP3, WAV, M4A, WebM, OGG, FLAC formats
  - Max file size: 25MB
  - Returns JSON: `{ transcript: "transcribed text", method: "local-whisper" }`
  - See [TRANSCRIPTION_API.md](./TRANSCRIPTION_API.md) for detailed documentation
  - See [QUICKSTART.md](./QUICKSTART.md) for 5-minute setup guide

## Folder Structure

```
talk2fast-backend/
├── .env.example
├── package.json
├── README.md
├── TRANSCRIPTION_API.md
├── server.js
├── test-transcription-setup.js
├── transcription.http
├── logs/
│   ├── combined.log
│   └── error.log
├── uploads/
│   └── audio/
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── mongoClient.js
│   │   └── supabaseClient.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   └── transcriptionController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   └── transcriptionRoutes.js
│   ├── services/
│   │   ├── supabaseService.js
│   │   ├── userService.js
│   │   ├── aiService.js
│   │   └── transcriptionService.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── validators/
│   │   ├── authValidators.js
│   │   └── chatValidators.js
│   └── utils/
│       └── logger.js
└── sql/
    └── create_tables.sql
```

## Important Notes

- Supabase handles all authentication (JWT verification, OAuth flows)
- MongoDB stores user profiles with `supabaseId` as the foreign key
- All authenticated requests verify Supabase JWT tokens
- User data is automatically synced to MongoDB on login/signup
- Role-based authorization uses MongoDB user documents

## License

This project is licensed under the MIT License. See the LICENSE file for details.