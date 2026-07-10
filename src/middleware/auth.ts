import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getUserActiveSession } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // ── Firebase token verification ─────────────────────────────────────────────
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // ── Single-session enforcement ──────────────────────────────────────────
    const incomingSession = req.headers['x-user-session'] as string | undefined;
    const storedSession = await getUserActiveSession(uid);

    // Only enforce if the user already has an active session in the DB
    if (storedSession && incomingSession !== storedSession) {
      return res.status(401).json({
        error: 'Your account has been logged in on another device. Please log in again.'
      });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
