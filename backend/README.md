# ⚙️ TaskFlow Backend: Logic & Persistence Layer

The powerhouse of the TaskFlow system, built with Node.js and TypeScript. This backend manages secure authentication, AI-powered data extraction, and real-time task analytics.

## 🏗️ Backend Architecture

```mermaid
graph TD
    classDef route fill:#f59e0b,stroke:#d97706,color:#fff
    classDef controller fill:#6366f1,stroke:#4f46e5,color:#fff
    classDef service fill:#14b8a6,stroke:#0d9488,color:#fff
    classDef db fill:#ec4899,stroke:#db2777,color:#fff

    Req([🚀 Incoming Request]) --> Router[🛣️ Express Router]:::route
    
    subgraph Logic["🎮 Logic Layer"]
        Router --> Auth[🔒 Auth Middleware]:::route
        Auth --> Ctrl[🎮 Controllers]:::controller
    end

    subgraph Data["📂 Data Layer"]
        Ctrl --> Prisma[💎 Prisma Client]:::service
        Prisma --> Neon[(🗄️ Neon PostgreSQL)]:::db
    end

    subgraph Jobs["⏳ Background Jobs"]
        Cron[⏰ node-cron]:::service
        Cron --> Reminders[🔔 Reminder Job]:::service
        Reminders --> Neon
    end
```

## 🚀 Key Features
- **🔐 Secure Auth**: JWT-based authentication with access/refresh token rotation (Bcrypt hashing).
- **🧠 AI Extraction**: Integrated with Google Gemini 1.5 Flash for intelligent PDF-to-Task parsing.
- **⏰ Automations**: Background cron jobs for automated task reminders and overdue alerts.
- **📊 Analytics Engine**: Custom aggregation logic for real-time productivity tracking.
- **🛡️ Validation**: Strict schema validation using Zod for all incoming payload data.

## 🛠️ Tech Stack
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **ORM**: Prisma (PostgreSQL)
- **Database**: Neon Cloud PostgreSQL
- **AI**: Google Generative AI (Gemini Flash)
- **Jobs**: Node-Cron

## 🚥 Quick Setup

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file based on `.env.example`:
```env
DATABASE_URL="postgresql://..."
JWT_ACCESS_SECRET="your_secret"
JWT_REFRESH_SECRET="your_secret"
GEMINI_API_KEY="your_google_ai_key"
```

### 3. Sync Database
```bash
npx prisma db push
npm run seed
```

### 4. Run Development
```bash
npm run dev
```

## 🛰️ API Reference (Core)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue tokens |
| `POST` | `/api/tasks/extract-pdf` | AI extraction from PDF upload |
| `GET` | `/api/tasks` | Fetch user tasks (with pagination/filters) |
| `GET` | `/api/analytics/overview` | Productivity metrics & trends |
| `GET` | `/health` | Service health status |

---
Built with ✨ by Saanvi Rajput
