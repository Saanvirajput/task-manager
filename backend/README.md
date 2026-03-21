# Task Management System - Backend

A robust Node.js/TypeScript backend for the Data-Driven Task Management System.

## Tech Stack
- Node.js & TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod (Input Validation)

## Setup
1. `cd backend`
2. `npm install`
3. Configure `.env` (use `.env.example` as template)
4. `npx prisma generate`
5. `npx prisma db push` (to sync schema with database)
6. `npm run dev` (run with ts-node-dev)

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/tasks` - List tasks (paginated, filtered, searchable)
- `POST /api/tasks` - Create task
- `GET /api/analytics/overview` - Analytics summary
