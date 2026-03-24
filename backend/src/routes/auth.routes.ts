import { Router } from 'express';
import { register, login, refresh, loginMfa, setupMfa, verifyMfa, me, updateCalendarSync } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import passport from 'passport';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/login/mfa', loginMfa);
router.post('/refresh', refresh);

// Protected MFA setup routes
router.post('/mfa/setup', authMiddleware, setupMfa);
router.post('/mfa/verify', authMiddleware, verifyMfa);
router.put('/calendar-sync', authMiddleware, updateCalendarSync);

// Google SSO routes (guarded — only active if OAuth env vars are configured)
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google', (req, res, next) => {
    const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    if (!isConfigured) {
        return res.status(503).json({
            error: 'Google Authentication is not configured.',
            details: 'Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your environment variables. Refer to deployment_keys.md for setup instructions.'
        });
    }

    // Ensure passport has the strategy before authenticating
    try {
        passport.authenticate('google', {
            scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
            accessType: 'offline',
            prompt: 'consent'
        })(req, res, next);
    } catch (err) {
        console.error('Passport Google Auth Error:', err);
        res.status(500).json({ error: 'Failed to initialize Google authentication.' });
    }
});

router.get('/google/callback', (req, res, next) => {
    if (!isGoogleConfigured) {
        return res.status(503).json({ error: 'Google SSO is not configured.' });
    }
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=sso-failed' })(req, res, () => {
        const accessToken = generateAccessToken((req as any).user.id);
        const refreshToken = generateRefreshToken((req as any).user.id);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    });
});

export default router;
