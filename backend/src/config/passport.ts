import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../utils/prisma';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists with this Google ID
                let user = await (prisma.user as any).findUnique({
                    where: { googleId: profile.id },
                });

                if (user) {
                    // Update tokens for existing user
                    user = await (prisma.user as any).update({
                        where: { id: user.id },
                        data: {
                            googleAccessToken: accessToken,
                            ...(refreshToken && { googleRefreshToken: refreshToken }),
                        },
                    });
                    return done(null, user);
                }

                // Check if user exists with the same email
                const email = profile.emails?.[0].value;
                if (!email) {
                    return done(new Error('No email found from Google profile'), undefined);
                }

                user = await (prisma.user as any).findUnique({
                    where: { email },
                });

                if (user) {
                    // Link Google ID to existing account
                    user = await (prisma.user as any).update({
                        where: { id: user.id },
                        data: {
                            googleId: profile.id,
                            googleAccessToken: accessToken,
                            ...(refreshToken && { googleRefreshToken: refreshToken }),
                        },
                    });
                    return done(null, user);
                }

                // Create a new user if neither Google ID nor Email matches
                user = await (prisma.user as any).create({
                    data: {
                        googleId: profile.id,
                        email,
                        name: profile.displayName,
                        password: null, // No password for SSO users
                        googleAccessToken: accessToken,
                        googleRefreshToken: refreshToken,
                    },
                });

                return done(null, user);
            } catch (error) {
                return done(error as any, undefined);
            }
        }
    )
);

export default passport;
