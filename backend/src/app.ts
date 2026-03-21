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
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to the Task Management System API',
        status: 'Online',
        version: '1.0.0',
        documentation: 'https://github.com/Saanvirajput/task-manager'
    });
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

// 404 Handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error Middleware
app.use(errorHandler);

export default app;
