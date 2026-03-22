import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAuditAction } from '../services/audit.service';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name }
        });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.status(201).json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
        console.error('Registration Error Details:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Registration failed: ' + (error.message || 'Unknown error') });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user: any = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Intercept login if MFA is enabled
        if (user.mfaEnabled) {
            return res.json({ requiresMfa: true, email: user.email });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
        console.error('Login Error Details:', error);
        res.status(500).json({ error: 'Login failed: ' + (error.message || 'Unknown error') });
    }
};

export const refresh = async (req: Request, res: Response) => {

    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const payload = verifyRefreshToken(refreshToken);
        const accessToken = generateAccessToken(payload.userId);
        const newRefreshToken = generateRefreshToken(payload.userId);

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

export const loginMfa = async (req: Request, res: Response) => {
    try {
        const { email, password, token } = req.body;
        if (!email || !password || !token) {
            return res.status(400).json({ error: 'Email, password, and MFA token are required' });
        }

        const user: any = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.mfaEnabled || !user.mfaSecret) {
            return res.status(400).json({ error: 'MFA is not enabled for this account' });
        }

        const isValid = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token
        });
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid MFA code' });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        await logAuditAction({
            action: 'MFA_LOGIN',
            resourceType: 'USER',
            resourceId: user.id,
            userId: user.id,
            details: { email: user.email }
        });

        res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
        console.error('MFA Login Error:', error);
        res.status(500).json({ error: 'MFA Login failed' });
    }
};

export const setupMfa = async (req: AuthRequest, res: Response) => {
    try {
        const user: any = await (prisma as any).user.findUnique({ where: { id: req.userId! } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.mfaEnabled) {
            return res.status(400).json({ error: 'MFA is already enabled' });
        }

        const secretInfo = speakeasy.generateSecret({
            name: `TaskFlow Enterprise (${user.email})`
        });

        const secret = secretInfo.base32;
        const otpauthUrl = secretInfo.otpauth_url;

        if (!otpauthUrl) {
            return res.status(500).json({ error: 'Failed to generate OTP auth URL' });
        }

        await (prisma as any).user.update({
            where: { id: user.id },
            data: { mfaSecret: secret } // temporarily store the secret before verifying
        });

        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        res.json({ qrCodeUrl: qrCodeDataUrl, secret });
    } catch (error) {
        console.error('MFA Setup Error:', error);
        res.status(500).json({ error: 'Failed to generate MFA setup' });
    }
};

export const verifyMfa = async (req: AuthRequest, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'MFA token is required' });

        const user: any = await (prisma as any).user.findUnique({ where: { id: req.userId! } });
        if (!user || !user.mfaSecret) {
            return res.status(400).json({ error: 'MFA setup not initialized' });
        }

        const isValid = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token
        });

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid MFA code' });
        }

        await (prisma as any).user.update({
            where: { id: user.id },
            data: { mfaEnabled: true }
        });

        await logAuditAction({
            action: 'MFA_ENABLED',
            resourceType: 'USER',
            resourceId: user.id,
            userId: user.id,
            details: { email: user.email }
        });

        res.json({ message: 'MFA successfully enabled' });
    } catch (error) {
        console.error('MFA Verify Error:', error);
        res.status(500).json({ error: 'Failed to verify MFA' });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        const user: any = await (prisma.user as any).findUnique({
            where: { id: req.userId! },
            select: { id: true, email: true, name: true, mfaEnabled: true, calendarSyncEnabled: true, googleId: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

export const updateCalendarSync = async (req: AuthRequest, res: Response) => {
    try {
        const { enabled } = req.body;
        const user: any = await (prisma.user as any).update({
            where: { id: req.userId! },
            data: { calendarSyncEnabled: !!enabled }
        });

        res.json({ message: 'Calendar sync updated', enabled: user.calendarSyncEnabled });
    } catch (error) {
        console.error('Update Calendar Sync Error:', error);
        res.status(500).json({ error: 'Failed to update calendar sync settings' });
    }
};
