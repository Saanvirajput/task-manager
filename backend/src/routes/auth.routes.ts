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

// Google SSO routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
    accessType: 'offline',
    prompt: 'consent'
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=sso-failed' }),
    (req: any, res) => {
        const accessToken = generateAccessToken(req.user.id);
        const refreshToken = generateRefreshToken(req.user.id);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    }
);

export default router;
