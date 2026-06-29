# AI Interview Protection System — Backend API

This is the production-ready Node.js + Express + MongoDB backend API for the AI Interview Protection System. It is responsible for all sensitive processing: saving applicant details, persisting CV documents, calculating scores, tracking anti-cheating violations, and executing AI validations.

## Features

- **Sensitive Operations Isolation**: No scores, numeric grades, or evaluations are sent to the frontend client. They are securely computed and stored in MongoDB.
- **AI Proxy Integration**: Proxies all requests to HuggingFace AI endpoints securely.
- **Anti-Cheat Monitoring**: Tracks tab switching, loss of window focus, F12 developer tool attempts, context menus, and fullscreen status. Auto-disqualifies sessions exceeding the limit.
- **Admin Dashboard Ready**: Includes JWT authentication routes and admin controllers to search and view complete candidate details (for the future dashboard implementation).
- **Security & Best Practices**:
  - Request rate limiting to prevent spam and DDoS.
  - Safe MongoDB Object ID validations to prevent database cast error crashes.
  - Custom timestamped logger for production diagnostics.
  - Centralized global error handling middleware.

## Project Structure

```text
backend/
├── src/
│   ├── config/          # Database connection & general settings config
│   ├── controllers/     # Handlers for requests (interview, violations, admin)
│   ├── middleware/      # Validate active sessions, authentication, errors
│   ├── models/          # MongoDB/Mongoose Applicant models
│   ├── routes/          # API endpoint routes declarations
│   ├── services/        # AI API proxies & score deduction calculation logic
│   ├── utils/           # Shared utility tools (custom Logger, Validators)
│   ├── uploads/         # Storage folder for applicant uploaded CVs
│   ├── app.js           # Express app configuring middlewares & routes
│   └── server.js        # Server bootstrapping (DB connection & server.listen)
├── .env                 # Environment variables config configuration
├── package.json         # Project manifests and scripts
└── README.md            # Project documentation guide
```

## Getting Started

### Prerequisites

1. **Node.js**: Ensure Node.js (v18+) is installed.
2. **MongoDB**: Ensure MongoDB is running locally (`mongodb://localhost:27017/interview_db`) or use a remote Atlas cluster.

### Setup Configuration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (copied from `.env.example`):
   ```ini
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/interview_db
   AI_API_BASE=https://anwer-1-ineterviwe-ai.hf.space
   CORS_ORIGIN=http://localhost:4200
   JWT_SECRET=super_secret_admin_dashboard_token_key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

### Running the Server

- Run in development mode (runs with watcher):
  ```bash
  npm run dev
  ```

- Run in production mode:
  ```bash
  npm start
  ```

## REST API Documentation

### Interview Endpoints (Applicant Client)

- **Upload CV File**: `POST /api/interview/upload-cv`
  - Body: Multipart Form-Data (file field)
  - Returns: Extracted CV text and `interviewId`

- **Start Interview**: `POST /api/interview/start`
  - Body: `{ "interviewId": "string", "agreedToTerms": true }`
  - Returns: Active questions list

- **Submit Answer**: `POST /api/interview/:id/answer`
  - Body: `{ "questionIndex": number, "answerText": "string" }`
  - Returns: Success notice only (no scores)

- **Record Violation**: `POST /api/violation/:id/record`
  - Body: `{ "type": "string", "description": "string" }`
  - Returns: Violations count status and if disqualified

- **Complete Interview**: `POST /api/interview/:id/finish`
  - Returns: Success message only (no scores)

### Admin Endpoints (Dashboard Client)

- **Admin Login**: `POST /api/admin/login`
  - Body: `{ "username": "admin", "password": "password" }`
  - Returns: JWT Bearer auth token

- **Get All Applicants**: `GET /api/admin/applicants`
  - Headers: `Authorization: Bearer <token>`
  - Returns: List of all applicant summaries (including status, scores, violation counts)

- **Get Applicant Detail**: `GET /api/admin/applicants/:id`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Detailed session audit (all questions, answers, evaluations, scoring logs, violations timestamps)
