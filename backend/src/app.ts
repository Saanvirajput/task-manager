import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routes and middleware
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';
import { startReminderJob } from './jobs/reminder.job';

// Initialize env vars before the app starts
dotenv.config();

const app = express();

// Base Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
    // If a frontend URL is configured, redirect to it
    if (process.env.FRONTEND_URL) {
        return res.redirect(process.env.FRONTEND_URL);
    }

    // Fallback: Professional API Landing Page
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TaskFlow API | Production</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; background: #f4f7f6; }
                .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e4e8; }
                h1 { color: #6366f1; margin-top: 0; }
                .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; background: #d1fae5; color: #065f46; }
                code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
                .links { margin-top: 1.5rem; display: flex; gap: 1rem; }
                .links a { color: #6366f1; text-decoration: none; font-weight: 500; }
                .links a:hover { text-decoration: underline; }
                .endpoint-list { margin-top: 1rem; padding-left: 1.5rem; }
                .endpoint-list li { margin-bottom: 0.5rem; }
            </style>
        </head>
        <body>
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h1>🛰️ TaskFlow API</h1>
                    <span class="status">● System Online</span>
                </div>
                <p>Welcome to the high-performance backend powering the TaskFlow management system. This API handles AI-driven task extraction, real-time notifications, and secure data persistence.</p>
                
                <h3>📍 Core Endpoints</h3>
                <ul class="endpoint-list">
                    <li><code>/api/auth</code> - User authentication & JWT management</li>
                    <li><code>/api/tasks</code> - CRUD operations & AI PDF extraction</li>
                    <li><code>/api/analytics</code> - Productivity trends & charts</li>
                    <li><code>/api/notifications</code> - Real-time alerts & reminders</li>
                    <li><code>/health</code> - Service health check</li>
                </ul>

                <div class="links">
                    <a href="${process.env.FRONTEND_URL || '#'}" target="_blank">💻 Launch Frontend App</a>
                    <a href="https://github.com/Saanvirajput/task-manager" target="_blank">🐙 GitHub Repo</a>
                </div>
            </div>
            <p style="text-align: center; color: #666; font-size: 0.875rem; margin-top: 2rem;">Built with ✨ by Saanvi Rajput</p>
        </body>
        </html>
    `);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Start background jobs
startReminderJob();

app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Task Management System API',
        endpoints: ['/api/auth', '/api/tasks', '/api/analytics', '/api/notifications', '/health']
    });
});

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK' });
});

app.get('/health/debug', (req: Request, res: Response) => {
    res.json({
        frontend_url: process.env.FRONTEND_URL || 'NOT_SET',
        node_env: process.env.NODE_ENV || 'development',
        cors_origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        request_origin: req.get('origin') || 'no-origin-header'
    });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error Middleware
app.use(errorHandler);

export default app;
