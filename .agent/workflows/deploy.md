---
description: Production deployment guide for Railway.
---

# 🚀 Cloud Deployment Guide

TaskFlow is optimized for deployment on **Railway.app**. Follow these steps for an elite production rollout.

### 1. Infrastructure Setup
- **Database**: Provision a PostgreSQL instance on Railway.
- **Backend**: Connect your GitHub repository and point to the `backend/` directory.
- **Frontend**: Connect to the `frontend/` directory.

### 2. Environment Variables
#### Backend (Production)
- `NODE_ENV`: `production`
- `DATABASE_URL`: Connection string from Railway Postgres.
- `FRONTEND_URL`: URL of your deployed frontend.
- `GEMINI_API_KEY`: Your production API key.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
- `GOOGLE_CALLBACK_URL`: `https://your-backend.up.railway.app/api/auth/google/callback`

#### Frontend (Production)
- `NEXT_PUBLIC_API_URL`: URL of your deployed backend.

### 3. Deployment Flow
// turbo
1. Push all changes to the `main` branch: `git push origin main`
2. Railway will automatically trigger builds:
   - **Backend**: Runs `npm run build` (Prisma Generate -> DB Push -> TSC).
   - **Frontend**: Runs `npm run build` (Next.js Build).

### 4. Verification
Once deployed, verify the API status at `https://your-backend.up.railway.app/health`.
