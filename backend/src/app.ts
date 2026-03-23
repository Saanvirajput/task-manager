import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import passport from './config/passport';

// Import routes and middleware
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import teamRoutes from './routes/team.routes';
import auditRoutes from './routes/audit.routes';
import integrationRoutes from './routes/integration.routes';
import { errorHandler } from './middleware/error.middleware';
import { startReminderJob } from './jobs/reminder.job';

// Initialize env vars before the app starts
dotenv.config();

const app = express();

// Base Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];

        // Allow if it's from an allowed origin or any Railway subdomain
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize Passport
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req: Request, res: Response) => {
    if (process.env.FRONTEND_URL) {
        return res.redirect(process.env.FRONTEND_URL);
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/integrations', integrationRoutes);

// Start background jobs
startReminderJob();

app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Task Management System API',
        endpoints: ['/api/auth', '/api/tasks', '/api/analytics', '/api/notifications', '/api/teams', '/health']
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
