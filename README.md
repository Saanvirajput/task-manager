# 🛰️ TaskFlow: Notion-Inspired AI Productivity Ecosystem

<div align="center">
  <a href="https://task-manager-production-1e76.up.railway.app">
    <img src="https://img.shields.io/badge/Live%20Demo%20-Launch%20Workspace-black?style=for-the-badge&logo=rocket" alt="Live Demo" />
  </a>
</div>

---

**TaskFlow** is a premium, minimalist task management platform inspired by Notion's workspace-oriented design. Engineered for high-performance teams, it integrates a **Gemini-powered AI Coach**, Google Calendar synchronization, and real-time workload analytics into a cohesive, data-driven ecosystem.

---

## 💎 The TaskFlow Advantage

TaskFlow is designed for the modern professional who demands more than just a checkbox. Our ecosystem bridges the gap between raw requirements (PDFs) and actionable results.

### 🌌 Core Technology Pillars
| Pillar | Technology | Value Proposition |
| :--- | :--- | :--- |
| **🧠 Intelligence** | Google Gemini 1.5 Flash | Instant task extraction from complex PDF documentation. |
| **🔄 Sync** | Bi-directional Webhooks | Real-time mapping to Google Calendar & Slack workspaces. |
| **🎨 Aesthetic** | Notion Minimalist UI | Focus-driven, workspace-oriented interface with slate/gray tokens. |
| **🛡️ Security** | MFA & JWT Rotation | Enterprise-grade protection with audit-trail logging. |

---

## ✨ Enterprise Features

- **🤖 AI-Powered PDF Ingestion**: Transform syllabi, PRDs, or security audits into structured milestones instantly.
- **📅 Google Calendar Bi-Sync**: Tasks appear as events automatically; updates in TaskFlow reflect in your calendar.
- **📊 Notion-Style Workspace**: Minimalist sidebar, breadcrumb navigation, and clean database-style task views.
- **📊 Team Workload Balancing**: Real-time "Health Scores" based on task priority, bandwidth, and upcoming deadlines.
- **🔐 Multi-Factor Security (MFA)**: Secure your workspace with TOTP-based authentication.
- **🔗 Advanced Dependencies**: Visualize bottlenecks with built-in task blockers and Gantt-style logic.

---

## 🛠️ Architecture & Setup

### 📂 Directory Map
- **`frontend/`**: Next.js 14 App Router (Notion UI System).
- **`backend/`**: Node.js 20, Express, Prisma ORM (Neon PostgreSQL).
- **`railway.json`**: Unified orchestration for multi-service deployment.

### 🚀 Rapid Deployment (Railway)
1. **Push to GitHub**: Push this repository to your account.
2. **Connect Railway**: Railway will auto-detect the `railway.json` and boot the **Frontend** and **Backend** as separate stable services.
3. **Configure Envs**:
   - **Backend**: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `GEMINI_API_KEY`.
   - **Frontend**: `NEXT_PUBLIC_API_URL` (Point to your backend URL).

---
Built with ✨ by **Saanvi Rajput**
