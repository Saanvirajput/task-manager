# 🛰️ TaskFlow: Data-Driven Task Management System

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-43853D?style=for-the-badge&logo=node.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A premium, full-stack task management platform designed for efficiency and data-driven insights. Built with a modern tech stack and integrated with **Neon Cloud PostgreSQL**, featuring AI-powered PDF extraction fueled by Google's Gemini LLM and an automated Node-Cron notification system.

![Dashboard Preview](./docs/assets/dashboard.png)


## 🔄 System Architecture & AI Workflow

```mermaid
graph TD
    classDef user fill:#6366f1,stroke:#4f46e5,color:#fff,stroke-width:2px,rx:8px,ry:8px;
    classDef frontend fill:#14b8a6,stroke:#0d9488,color:#fff,stroke-width:2px,rx:8px,ry:8px;
    classDef backend fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px,rx:8px,ry:8px;
    classDef db fill:#ec4899,stroke:#db2777,color:#fff,stroke-width:2px,rx:8px,ry:8px;
    classDef ai fill:#a855f7,stroke:#9333ea,color:#fff,stroke-width:2px,rx:8px,ry:8px;

    subgraph User["👤 User Flow"]
        Upload[📤 Upload PDF Document]:::user
        Review[👀 Review Auto-Generated Tasks]:::user
        Dashboard[📊 Track Progress on Dashboard]:::user
    end

    subgraph Frontend["💻 Next.js Frontend App"]
        UI[Upload Component]:::frontend
        State[Task State Manager]:::frontend
    end

    subgraph Backend["⚙️ Express Backend"]
        API[POST /api/tasks/extract-pdf]:::backend
        Multer[Multer Temp Storage]:::backend
        Parser[AI PDF Parser]:::backend
        Delete[fs.unlinkSync Cleanup]:::backend
    end

    subgraph Storage["🌐 Integrations"]
        Gemini[🧠 LLM Extractor Engine]:::ai
        Neon[🗄️ Neon PostgreSQL]:::db
    end

    Upload -->|1. Select File| UI
    UI -->|2. FormData POST| API
    
    API -->|3. Save to disk| Multer
    Multer -->|4. Read PDF Buffer| Parser
    Parser -->|5. Send buffer data| Gemini
    Gemini -->|6. Return JSON Data| Parser
    
    Parser -->|7. Delete temp file| Delete
    Delete -->|8. Send API Response| UI
    
    UI -->|9. Populate Form| Review
    Review -->|10. Confirm & Create| State
    
    State -->|11. POST /api/tasks| Neon
    State -->|12. Real-time Updates| Dashboard
```

## ✨ Features

- **🤖 Smart AI PDF Extraction**: Upload any syllabus, codebase requirement, or project PDF, and our integrated Google Gemini AI engine will instantly read, parse, and suggest a structured, pre-scheduled list of actionable tasks directly into your workflow.
- **🔔 Background Notifications**: A powerful `node-cron` background job continuously monitors task deadlines and automatically pushes visual Toast alerts and bell-badge increments for upcoming and overdue tasks.
- **🚀 Performance Dashboard**: Real-time analytics on task completion rates and creation trends.
- **🛡️ Secure Authentication**: JWT-based auth with Access & Refresh token rotation.
- **📊 Real-time Analytics**: Interactive charts powered by Recharts showing productivity trends.
- **⚡ Fast Search & Filter**: Instant search with status and priority filtering for high-volume task lists.
- **☁️ Cloud Integrated**: Pre-configured for serverless Neon PostgreSQL.
- **🎭 Modern UI**: Clean, ClickUp-inspired interface with responsive design and subtle micro-animations.

## 🎯 Use Cases

- **Personal Task Tracking**: Stay on top of daily to-dos with a clean, distraction-free interface.
- **Productivity Analysis**: Use the built-in charts to visualize your work patterns and improve efficiency.
- **Priority Management**: Focus on what matters most using High/Medium/Low priority tagging.
- **Goal Visualization**: Monitor your completion rates to maintain momentum on long-term projects.

## 🛠️ Tech Stack & Structure

- **Frontend**: Next.js 14, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, Prisma ORM, TypeScript, `node-cron`.
- **Database**: Neon Cloud PostgreSQL.
- **AI & Processing**: Google Gemini 1.5 Flash (for PDF extraction), Multer.
- **Auth**: JWT (Access & Refresh token rotation), Bcrypt.

### 📂 Directory Structure

```text
task-manager/
├── frontend/                # Next.js 14 Application
│   ├── src/app/             # App Router pages (Dashboard, Login)
│   ├── src/components/      # Reusable UI (Modals, NotificationBell)
│   ├── src/lib/             # Axios API interceptors & Auth Context
│   └── src/styles/          # Tailwind configuration & global CSS
├── backend/                 # Node.js Express Application
│   ├── prisma/              # Schema definitions & migrations
│   ├── src/controllers/     # Route logic (Auth, Tasks, Notifications)
│   ├── src/jobs/            # Background cron jobs
│   ├── src/middleware/      # JWT verification & Error handlers
│   └── src/utils/           # AI PDF parsing utility
└── LICENSE
```

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Saanvirajput/task-manager.git
cd task-manager
npm run install:all
```

### 2. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="your_neon_postgresql_url"
JWT_ACCESS_SECRET="your_secret"
JWT_REFRESH_SECRET="your_secret"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3. Database Sync & Seed
```bash
cd backend
npx prisma db push
npm run seed
```

### 4. Run Development
In the root directory:
```bash
npm run dev
```

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as 💻 Next.js Frontend
    participant BE as ⚙️ Express Backend
    participant DB as 🗄️ Neon PostgreSQL

    User->>FE: Enter email & password
    FE->>BE: POST /api/auth/login
    BE->>DB: Query user by email
    DB-->>BE: Return hashed password
    BE->>BE: bcrypt.compare()

    alt Invalid Credentials
        BE-->>FE: 401 Unauthorized
        FE-->>User: ❌ Show error message
    else Valid Credentials
        BE->>BE: Sign Access Token (15m) + Refresh Token (7d)
        BE-->>FE: 200 OK + Set HTTP-only cookie
        FE-->>User: ✅ Redirect to Dashboard
    end

    Note over FE,BE: On every protected API call...
    FE->>BE: Request + Authorization: Bearer <token>
    BE->>BE: Verify JWT signature
    alt Token Expired
        BE-->>FE: 401 Token Expired
        FE->>BE: POST /api/auth/refresh
        BE->>BE: Verify Refresh Token → Issue new Access Token
        BE-->>FE: New Access Token
        FE->>BE: Retry original request
    else Token Valid
        BE-->>FE: 200 OK + Response Data
    end
```

## 📋 Task Lifecycle Flow

```mermaid
flowchart LR
    classDef action fill:#6366f1,stroke:#4f46e5,color:#fff,rx:6px
    classDef api fill:#f59e0b,stroke:#d97706,color:#fff,rx:6px
    classDef db fill:#ec4899,stroke:#db2777,color:#fff,rx:6px
    classDef state fill:#14b8a6,stroke:#0d9488,color:#fff,rx:6px

    A([👤 User Action]):::action -->|Create| B[POST /api/tasks]:::api
    A -->|Read| C[GET /api/tasks]:::api
    A -->|Update| D[PUT /api/tasks/:id]:::api
    A -->|Delete| E[DELETE /api/tasks/:id]:::api

    B --> F{Auth Middleware\nVerify JWT}:::state
    C --> F
    D --> F
    E --> F

    F -->|✅ Valid| G[Prisma ORM]:::db
    F -->|❌ Invalid| H([401 Unauthorized]):::action

    G -->|INSERT| I[(Neon PostgreSQL)]:::db
    G -->|SELECT + Filter + Paginate| I
    G -->|UPDATE| I
    G -->|DELETE| I

    I -->|Result| J[JSON Response]:::state
    J --> K([🖥️ UI Re-renders]):::action
```

## 🔔 Notification & Reminder Flow

```mermaid
sequenceDiagram
    participant Cron as ⏳ node-cron Job (Every 1m)
    participant DB as 🗄️ Neon PostgreSQL
    participant BE as ⚙️ Express Backend
    participant FE as 💻 NotificationBell UI

    Cron->>DB: Query tasks (dueDate/reminderTime <= now & flag=false)
    DB-->>Cron: Return overdue/upcoming tasks
    
    loop For each task
        Cron->>DB: Create Notification (type: REMINDER/OVERDUE)
        Cron->>DB: Update Task (isNotified=true / isOverdueNotified=true)
    end
    
    Note over FE,BE: Client-side Polling (Every 30s)
    FE->>BE: GET /api/notifications
    BE->>DB: Fetch user's notifications
    DB-->>BE: Return active unread alerts
    BE-->>FE: 200 OK (Unread Count + Messages)
    FE-->>FE: Trigger Toast Alerts & Update Bell Badge
```


## 🔑 Test Account
- **Email**: `test@example.com`
- **Password**: `password123`

---
Built with ✨ by Saanvi Rajput
