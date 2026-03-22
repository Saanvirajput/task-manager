---
description: Local development setup guide for TaskFlow.
---

# 🛠️ TaskFlow Developer Setup

Follow these steps to initialize the environment and launch the full-stack development suite.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher
- **Git**: Latest version

### 2. Backend Initialization
// turbo
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env`
   - *Update `DATABASE_URL` and `GEMINI_API_KEY` in the new `.env`.*
4. Synchronize Database Schema: `npx prisma db push`
5. Generate Prisma Client: `npx prisma generate`
6. Start Dev Server: `npm run dev`

### 3. Frontend Initialization
// turbo
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env.local`
4. Start Next.js Development Server: `npm run dev`

---
**Status Check**: Backend runs on `http://localhost:5000`, Frontend on `http://localhost:3000`.
